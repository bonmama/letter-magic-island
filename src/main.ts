import { GameController } from './game/GameController';
import type { ScreenType } from './game/GameController';
import type { Character } from './game/types';
import { GAME_CONFIG } from './game/constants';

let game: GameController;
let canvas: HTMLCanvasElement;
let uiContainer: HTMLDivElement;

// 音效上下文
let audioCtx: AudioContext | null = null;

// 记录上一帧生命值，用于在落地/打错时检测扣心并播放音效
let lastLives = -1;

// 学习/练习/单词模式所选速度（默认最慢的乌龟，温柔起步）
let selectedSpeed = 'snail';

// 渲染速度选择按钮
function renderSpeedSelectorHTML(activeId: string): string {
  const speeds = game.getSpeedLevels();
  return `
    <div class="speed-selector">
      ${speeds.map(sp => `
        <button class="speed-option ${sp.id === activeId ? 'active' : ''}" data-speed="${sp.id}">
          <span class="speed-emoji">${sp.emoji}</span>
          <span class="speed-name">${sp.name}</span>
          <span class="speed-desc">${sp.desc}</span>
        </button>
      `).join('')}
    </div>
  `;
}

function initAudio(): void {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

function playSound(frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3): void {
  if (!audioCtx) return;
  
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);
  
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
  
  gainNode.gain.setValueAtTime(volume, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
  
  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + duration);
}

function playHitSound(combo: number): void {
  const baseFreq = 523.25 + Math.min(combo, 20) * 20;
  playSound(baseFreq, 0.15, 'sine', 0.25);
  setTimeout(() => playSound(baseFreq * 1.5, 0.1, 'sine', 0.15), 50);
}

function playMissSound(): void {
  playSound(200, 0.3, 'sawtooth', 0.15);
}

function playLevelUpSound(): void {
  [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
    setTimeout(() => playSound(freq, 0.2, 'sine', 0.2), i * 100);
  });
}

// 扣心时让心心图标震动一下
function shakeHearts(): void {
  const livesEl = document.getElementById('hudLives');
  if (!livesEl) return;
  livesEl.style.animation = 'none';
  void livesEl.offsetHeight;
  livesEl.style.animation = 'heartShake 0.4s ease';
}

export function initApp(): void {
  const app = document.getElementById('app');
  if (!app) return;

  app.innerHTML = `
    <div class="game-wrapper">
      <canvas id="gameCanvas"></canvas>
      <div id="uiContainer" class="ui-container"></div>
    </div>
  `;

  canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  uiContainer = document.getElementById('uiContainer') as HTMLDivElement;

  game = new GameController(canvas);

  game.setOnScreenChange(() => renderUI());
  game.setOnStateChange(() => updateHUD());

  window.addEventListener('resize', () => {
    game.resize();
    if (game.getScreen() === 'menu') {
      game.renderMenuBackground();
    }
  });

  // 键盘事件
  document.addEventListener('keydown', (e) => {
    if (e.repeat) return; // 忽略按住重复
    
    initAudio();

    if (game.getScreen() === 'playing') {
      if (e.key === 'Escape') {
        game.togglePause();
        return;
      }
      if (/^[a-zA-Z]$/.test(e.key)) {
        const prevState = game.getState();
        game.handleKey(e.key);
        const newState = game.getState();
        if (prevState && newState && newState.combo > prevState.combo) {
          playHitSound(newState.combo);
        }
      }
    }
  });

  // 初始渲染
  game.renderMenuBackground();
  renderUI();

  // 没有任何玩家档案时，先进入玩家选择
  if (!game.getActiveProfile()) {
    game.navigateTo('player-select');
  }
}

// 渲染UI（根据当前屏幕）
function renderUI(): void {
  const screen = game.getScreen();
  
  switch (screen) {
    case 'menu':
      renderMenuScreen();
      break;
    case 'mode-select':
      renderModeSelectScreen();
      break;
    case 'practice-select':
      renderPracticeSelectScreen();
      break;
    case 'difficulty-select':
      renderDifficultySelectScreen();
      break;
    case 'word-setup':
      renderWordSetupScreen();
      break;
    case 'character-select':
      renderCharacterSelectScreen();
      break;
    case 'playing':
      renderGameUI();
      break;
    case 'result':
      renderResultScreen();
      break;
    case 'how-to-play':
      renderHowToPlayScreen();
      break;
    case 'player-select':
      renderPlayerSelectScreen();
      break;
    case 'leaderboard':
      renderLeaderboardScreen();
      break;
  }
}

// ========== 主菜单 ==========
function renderMenuScreen(): void {
  const playerData = game.getPlayerData();
  const selectedChar = game.getCharacters().find(c => c.id === playerData.selectedCharacter)!;
  const medal = game.getCurrentMedal();
  const profile = game.getActiveProfile();

  uiContainer.innerHTML = `
    <div class="screen menu-screen">
      <button class="player-chip" id="btnSwitchPlayer">
        <span class="player-chip-emoji">${profile?.emoji || '🐰'}</span>
        <span class="player-chip-name">${profile?.name || '玩家'}</span>
        <span class="player-chip-switch">切换</span>
      </button>

      <div class="title-container">
        <div class="title-emoji">🌈</div>
        <h1 class="game-title">字母魔法岛</h1>
        <p class="subtitle">和小伙伴一起快乐学打字！</p>
      </div>

      <div class="character-display">
        <div class="character-bubble">
          <span class="char-emoji">${selectedChar.emoji}</span>
          <span class="char-name">${selectedChar.name}</span>
        </div>
      </div>

      <div class="menu-stats">
        <div class="stat-item stat-trophy">
          <span class="stat-icon">🏆</span>
          <span class="stat-value">${playerData.highestScore}</span>
          <span class="stat-label">最高分</span>
        </div>
      </div>

      <div class="growth-card">
        <div class="growth-top">
          <div class="growth-medal">
            <span class="medal-emoji">${medal.current.emoji}</span>
            <div class="medal-text">
              <span class="medal-name">${medal.current.name}</span>
              <span class="medal-count">已答对 ${medal.total} 个字母</span>
            </div>
          </div>
          <div class="growth-stars">
            <span class="stat-icon">⭐</span>
            <span class="stat-value">${playerData.totalStars}</span>
          </div>
        </div>
        ${medal.next
          ? `
            <div class="medal-progress-bar">
              <div class="medal-progress-fill" style="width:${Math.min(100, Math.round(medal.progress * 100))}%"></div>
            </div>
            <div class="medal-next">再答对 ${medal.next.threshold - medal.total} 个，升级为 ${medal.next.emoji} ${medal.next.name}！</div>
          `
          : '<div class="medal-max">🎉 你已经是最厉害的键盘大师啦！</div>'
        }
        <div class="growth-stars-note">⭐ 星星可解锁新伙伴（选择角色查看）</div>
      </div>

      <div class="menu-buttons">
        <button class="btn btn-primary btn-large" id="btnPlay">
          🎮 开始游戏
        </button>
        <button class="btn btn-secondary" id="btnCharacter">
          👤 选择角色
        </button>
        <button class="btn btn-secondary" id="btnHowTo">
          ❓ 怎么玩
        </button>
        <button class="btn btn-secondary" id="btnLeaderboard">
          🏆 龙虎榜
        </button>
      </div>

      <div class="footer-text">
        用键盘字母键消除下落的字母
      </div>
    </div>
  `;

  document.getElementById('btnPlay')?.addEventListener('click', () => {
    initAudio();
    game.navigateTo('mode-select');
  });
  document.getElementById('btnCharacter')?.addEventListener('click', () => {
    initAudio();
    game.navigateTo('character-select');
  });
  document.getElementById('btnHowTo')?.addEventListener('click', () => {
    initAudio();
    game.navigateTo('how-to-play');
  });
  document.getElementById('btnLeaderboard')?.addEventListener('click', () => {
    initAudio();
    game.navigateTo('leaderboard');
  });
  document.getElementById('btnSwitchPlayer')?.addEventListener('click', () => {
    game.navigateTo('player-select');
  });
}

// ========== 模式选择 ==========
function renderModeSelectScreen(): void {
  uiContainer.innerHTML = `
    <div class="screen mode-screen">
      <button class="btn-back" id="btnBack">← 返回</button>
      <h2 class="screen-title">选择游戏模式</h2>

      <div class="mode-cards">
        <div class="mode-card mode-practice" data-mode="practice">
          <div class="mode-icon">✍️</div>
          <h3>练习区</h3>
          <p>自由选择想练的字母组<br/>可调速，跟着键盘提示认键！</p>
          <div class="mode-tag">无压力练习</div>
          <button class="btn btn-primary btn-mode" data-mode="practice">开始练习</button>
        </div>

        <div class="mode-card mode-word" data-mode="word">
          <div class="mode-icon">📝</div>
          <h3>单词冒险</h3>
          <p>拼出可爱的英文小单词<br/>玩得越多，生字又长又难！</p>
          <div class="mode-tag">认识生字</div>
          <button class="btn btn-primary btn-mode" data-mode="word">开始拼词</button>
        </div>

        <div class="mode-card mode-endless" data-mode="endless">
          <div class="mode-icon">🎯</div>
          <h3>无尽挑战</h3>
          <p>自选难度，速度越来越快<br/>可打字母也可打单词！</p>
          <div class="mode-tag">挑战自我</div>
          <button class="btn btn-primary btn-mode" data-mode="endless">开始挑战</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('btnBack')?.addEventListener('click', () => {
    game.navigateTo('menu');
    game.renderMenuBackground();
  });

  document.querySelectorAll('.btn-mode').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const mode = (e.target as HTMLElement).dataset.mode as any;
      initAudio();
      if (mode === 'practice') {
        game.navigateTo('practice-select');
      } else if (mode === 'endless') {
        game.navigateTo('difficulty-select');
      } else if (mode === 'word') {
        game.navigateTo('word-setup');
      }
    });
  });
}

// ========== 练习区：选择字母组 ==========
function renderPracticeSelectScreen(): void {
  const groups = game.getPracticeGroups();

  const groupsHTML = groups.map(group => {
    return `
      <div class="level-item" data-level="${group.id}">
        <div class="level-number">${group.id}</div>
        <div class="level-name">${group.name}</div>
        <div class="level-letters${group.hint.length > 12 ? ' long' : ''}">${group.hint}</div>
        <div class="level-target">随时可退出 · 无生命限制</div>
      </div>
    `;
  }).join('');

  uiContainer.innerHTML = `
    <div class="screen level-screen">
      <button class="btn-back" id="btnBack">← 返回</button>
      <h2 class="screen-title">✍️ 练习区</h2>
      <p class="screen-subtitle">选个速度，再选想练的字母，不会输</p>

      <h3 class="setup-label">🐢 先选练习速度</h3>
      ${renderSpeedSelectorHTML(selectedSpeed)}

      <h3 class="setup-label">🔤 再选要练的字母组</h3>
      <div class="levels-grid">
        ${groupsHTML}
      </div>
    </div>
  `;

  document.getElementById('btnBack')?.addEventListener('click', () => {
    game.navigateTo('mode-select');
  });

  document.querySelectorAll('.speed-option').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedSpeed = (btn as HTMLElement).dataset.speed || 'snail';
      // 高亮选中的速度（简单重绘）
      const label = (btn as HTMLElement).querySelector('.speed-name')?.textContent;
      (btn as HTMLElement).classList.add('active');
      document.querySelectorAll('.speed-option.active').forEach(other => {
        if (other !== btn) other.classList.remove('active');
      });
      document.querySelectorAll('.levels-grid').forEach(g => g.classList.add('speed-chosen'));
    });
  });

  document.querySelectorAll('.level-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const level = parseInt((e.currentTarget as HTMLElement).dataset.level || '1');
      initAudio();
      game.startGame('practice', level, 'medium', selectedSpeed);
    });
  });
}

// ========== 单词冒险：选速度 ==========
function renderWordSetupScreen(): void {
  uiContainer.innerHTML = `
    <div class="screen level-screen">
      <button class="btn-back" id="btnBack">← 返回</button>
      <h2 class="screen-title">📝 单词冒险</h2>
      <p class="screen-subtitle">把完整的小单词拼出来！速度越快，生字越长</p>

      <h3 class="setup-label">🐢 选择拼词速度</h3>
      ${renderSpeedSelectorHTML(selectedSpeed)}
      <p class="word-len-hint">最慢 → 3 个字母生字 · 中等 → 4 个字母生字 · 最快 → 5 个字母生字</p>

      <button class="btn btn-primary btn-large btn-start" id="btnStart">开始拼词</button>
    </div>
  `;

  document.getElementById('btnBack')?.addEventListener('click', () => {
    game.navigateTo('mode-select');
  });

  document.querySelectorAll('.speed-option').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedSpeed = (btn as HTMLElement).dataset.speed || 'snail';
      (btn as HTMLElement).classList.add('active');
      document.querySelectorAll('.speed-option.active').forEach(other => {
        if (other !== btn) other.classList.remove('active');
      });
    });
  });

  document.getElementById('btnStart')?.addEventListener('click', () => {
    initAudio();
    game.startGame('word', 1, 'medium', selectedSpeed);
  });
}

// 无尽挑战当前所选内容（字母 / 生字）与难度
let endlessContent: 'letter' | 'word' = 'letter';
let endlessDifficulty = 'easy';

// ========== 无尽挑战：选择内容 + 难度 ==========
function renderDifficultySelectScreen(): void {
  const difficulties = game.getDifficulties();

  const speedLabel: Record<string, string> = { easy: '最慢', medium: '中等', hard: '最快' };
  const diffHTML = difficulties.map(diff => {
    const wordInfo = endlessContent === 'word'
      ? (diff.wordMinLen === diff.wordMaxLen
        ? `<span>📝 ${diff.wordMinLen} 个字母生字</span>`
        : `<span>📝 ${diff.wordMinLen} 到 ${diff.wordMaxLen} 个字母生字</span>`)
      : '';
    return `
    <div class="difficulty-item ${diff.id === endlessDifficulty ? 'active' : ''}" data-difficulty="${diff.id}">
      <div class="mode-icon">${diff.emoji}</div>
      <h3>${diff.name}</h3>
      <div class="diff-info">
        <span>❤️ ${diff.lives} 颗心</span>
        <span>⚡ 速度 ${speedLabel[diff.id] ?? '中等'}</span>
        ${wordInfo}
      </div>
    </div>
  `;
  }).join('');

  uiContainer.innerHTML = `
    <div class="screen level-screen">
      <button class="btn-back" id="btnBack">← 返回</button>
      <h2 class="screen-title">🎯 无尽挑战</h2>
      <p class="screen-subtitle">先选要打字母还是生字，再挑一个适合的难度</p>

      <h3 class="setup-label">🎲 选择挑战内容</h3>
      <div class="content-toggle">
        <button class="content-option ${endlessContent === 'letter' ? 'active' : ''}" data-content="letter">
          <span class="content-emoji">🔤</span><span>打字母</span>
        </button>
        <button class="content-option ${endlessContent === 'word' ? 'active' : ''}" data-content="word">
          <span class="content-emoji">📝</span><span>打生字</span>
        </button>
      </div>

      <h3 class="setup-label">🌟 选择难度</h3>
      <div class="difficulty-grid">
        ${diffHTML}
      </div>

      <button class="btn btn-primary btn-large btn-start" id="btnStartEndless">开始挑战</button>
    </div>
  `;

  document.getElementById('btnBack')?.addEventListener('click', () => {
    game.navigateTo('mode-select');
  });

  document.querySelectorAll('.content-option').forEach(btn => {
    btn.addEventListener('click', () => {
      endlessContent = ((btn as HTMLElement).dataset.content as 'letter' | 'word') || 'letter';
      renderDifficultySelectScreen();
    });
  });

  document.querySelectorAll('.difficulty-item').forEach(item => {
    item.addEventListener('click', () => {
      endlessDifficulty = (item as HTMLElement).dataset.difficulty || 'easy';
      document.querySelectorAll('.difficulty-item').forEach(d => d.classList.remove('active'));
      (item as HTMLElement).classList.add('active');
    });
  });

  document.getElementById('btnStartEndless')?.addEventListener('click', () => {
    initAudio();
    game.startGame('endless', 1, endlessDifficulty, 'walk', endlessContent === 'word');
  });
}

// ========== 角色选择 ==========
function renderCharacterSelectScreen(): void {
  const playerData = game.getPlayerData();
  const characters = game.getCharacters();

  const charsHTML = characters.map(char => {
    const isUnlocked = playerData.unlockedCharacters.includes(char.id);
    const isSelected = playerData.selectedCharacter === char.id;
    return `
      <div class="char-card ${isSelected ? 'selected' : ''} ${isUnlocked ? '' : 'locked'}" 
           data-char="${char.id}"
           style="border-color: ${char.color}">
        <div class="char-emoji-big" style="background: ${char.color}20">
          ${char.emoji}
        </div>
        <h3 style="color: ${char.color}">${char.name}</h3>
        <p class="char-desc">${char.description}</p>
        ${isUnlocked 
          ? (isSelected 
              ? '<div class="char-status selected-tag">✓ 已选择</div>' 
              : '<div class="char-status select-tag">点击选择</div>')
          : `<div class="char-status locked-tag">🔒 需 ${char.unlockStars} 颗星</div>`
        }
      </div>
    `;
  }).join('');

  uiContainer.innerHTML = `
    <div class="screen char-screen">
      <button class="btn-back" id="btnBack">← 返回</button>
      <h2 class="screen-title">👤 选择小伙伴</h2>
      <p class="screen-subtitle">当前星星: ⭐ ${playerData.totalStars}</p>

      <div class="chars-grid">
        ${charsHTML}
      </div>
    </div>
  `;

  document.getElementById('btnBack')?.addEventListener('click', () => {
    game.navigateTo('menu');
    game.renderMenuBackground();
  });

  document.querySelectorAll('.char-card:not(.locked)').forEach(card => {
    card.addEventListener('click', (e) => {
      const charId = (e.currentTarget as HTMLElement).dataset.char!;
      initAudio();
      game.selectCharacter(charId);
      playLevelUpSound();
      renderCharacterSelectScreen();
    });
  });
}

// ========== 游戏UI ==========
function renderGameUI(): void {
  const state = game.getState();
  if (!state) return;

  lastLives = state.lives;
  const isEndless = state.mode === 'endless';
  // 只显示剩余的❤️，不再显示黑色空心；心少时胶囊会自动缩窄
  const lives = state.lives > 0 ? '❤️'.repeat(state.lives) : '💔';
  const modeLabel = isEndless
    ? `${game.getDifficulties().find(d => d.id === state.difficulty)?.emoji ?? ''} ${state.difficulty === 'easy' ? '简单' : state.difficulty === 'hard' ? '困难' : '中等'}${state.wordMode ? '生字' : ''}`
    : (state.mode === 'word' ? '📝 单词' : '✍️ 练习');

  uiContainer.innerHTML = `
    <div class="game-hud" id="gameHUD">
      <div class="hud-top">
        <div class="hud-left">
          <div class="hud-label mode-label">${modeLabel}</div>
          <div class="hud-item">
            <span class="hud-label">分数</span>
            <span class="hud-value" id="hudScore">${state.score}</span>
          </div>
          <div class="hud-item">
            <span class="hud-label">连击</span>
            <span class="hud-value combo-value" id="hudCombo">${state.combo}x</span>
          </div>
        </div>
        <div class="hud-center">
          <div class="hud-lives" id="hudLives">${isEndless ? lives : '❤️ ∞'}</div>
          ${isEndless ? '' : '<div class="practice-note">无生命压力，放心练习</div>'}
        </div>
        <div class="hud-right">
          <div class="hud-item">
            <span class="hud-label">⭐</span>
            <span class="hud-value" id="hudStars">${state.stars}</span>
          </div>
          <button class="btn-pause" id="btnPause">⏸️</button>
        </div>
      </div>
    </div>

    <div class="pause-overlay" id="pauseOverlay" style="display: ${state.isPaused ? 'flex' : 'none'}">
      <div class="pause-menu">
        <h2>⏸️ 暂停</h2>
        <button class="btn btn-primary" id="btnResume">继续游戏</button>
        <button class="btn btn-secondary" id="btnRestart">重新开始</button>
        ${!isEndless ? '<button class="btn btn-secondary" id="btnFinish">✅ 完成练习</button>' : ''}
        <button class="btn btn-secondary" id="btnQuit">返回菜单</button>
      </div>
    </div>
  `;

  document.getElementById('btnPause')?.addEventListener('click', () => {
    game.togglePause();
  });
  document.getElementById('btnResume')?.addEventListener('click', () => {
    game.togglePause();
  });
  document.getElementById('btnRestart')?.addEventListener('click', () => {
    initAudio();
    game.restart();
  });
  document.getElementById('btnFinish')?.addEventListener('click', () => {
    initAudio();
    game.finishRun();
  });
  document.getElementById('btnQuit')?.addEventListener('click', () => {
    game.stopGame();
    game.navigateTo('menu');
    game.renderMenuBackground();
  });
}

function updateHUD(): void {
  const state = game.getState();
  if (!state || game.getScreen() !== 'playing') return;

  // 检测生命减少（打错或字母落地）-> 失误音效 + 心心震动
  if (lastLives >= 0 && state.lives < lastLives && state.mode === 'endless') {
    playMissSound();
    shakeHearts();
  }
  lastLives = state.lives;

  const scoreEl = document.getElementById('hudScore');
  const comboEl = document.getElementById('hudCombo');
  const livesEl = document.getElementById('hudLives');
  const starsEl = document.getElementById('hudStars');
  const pauseOverlay = document.getElementById('pauseOverlay');

  if (scoreEl) scoreEl.textContent = state.score.toString();
  if (comboEl) comboEl.textContent = `${state.combo}x`;
  if (starsEl) starsEl.textContent = state.stars.toString();
  
  if (livesEl && state.mode === 'endless') {
    // 只显示剩余的❤️，不再补黑色空心；心少时胶囊随内容自动缩窄
    livesEl.textContent = state.lives > 0 ? '❤️'.repeat(state.lives) : '💔';
  }

  if (pauseOverlay) {
    pauseOverlay.style.display = state.isPaused ? 'flex' : 'none';
  }

  // 连击特效
  if (comboEl && state.combo >= 5) {
    comboEl.style.animation = 'none';
    // 触发重排
    void comboEl.offsetHeight;
    comboEl.style.animation = 'comboPulse 0.3s ease';
  }
}

// ========== 结果画面 ==========
function renderResultScreen(): void {
  const state = game.getState();
  const playerData = game.getPlayerData();
  if (!state) return;

  let titleEmoji = '😊';
  let titleText = '游戏结束';
  if (state.mode === 'endless') {
    if (state.score > 100) { titleEmoji = '🎉'; titleText = '太棒了！'; }
    else if (state.score > 50) { titleEmoji = '😊'; titleText = '不错哦！'; }
    else { titleEmoji = '💪'; titleText = '继续加油！'; }
  } else if (state.mode === 'practice') {
    titleEmoji = '✍️';
    titleText = state.score > 30 ? '练得好！继续加油！' : '很棒！多练几次就会更熟练！';
  } else if (state.mode === 'word') {
    titleEmoji = '📝';
    titleText = state.score > 40 ? '拼得真好！认识好多生字！' : '继续拼，生字越打越多！';
  }

  const isNewHighScore = state.mode === 'endless' && state.score > 0 && state.score >= playerData.highestScore;

  uiContainer.innerHTML = `
    <div class="screen result-screen">
      <div class="result-card">
        <div class="result-emoji">${titleEmoji}</div>
        <h2 class="result-title">${titleText}</h2>

        ${isNewHighScore ? '<div class="new-record">🏆 新纪录！</div>' : ''}

        <div class="result-stats">
          <div class="result-stat">
            <span class="result-stat-label">得分</span>
            <span class="result-stat-value">${state.score}</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-label">最高连击</span>
            <span class="result-stat-value">${state.maxCombo}x</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-label">正确</span>
            <span class="result-stat-value">${state.correctCount}</span>
          </div>
          <div class="result-stat">
            <span class="result-stat-label">获得星星</span>
            <span class="result-stat-value">⭐ ${state.stars}</span>
          </div>
        </div>

        <div class="result-buttons">
          <button class="btn btn-primary" id="btnAgain">🔄 再玩一次</button>
          <button class="btn btn-secondary" id="btnBackMenu">🏠 返回菜单</button>
        </div>
      </div>
    </div>
  `;

  if (state.stars > 0) {
    playLevelUpSound();
  }

  document.getElementById('btnAgain')?.addEventListener('click', () => {
    initAudio();
    game.restart();
  });
  document.getElementById('btnBackMenu')?.addEventListener('click', () => {
    game.navigateTo('menu');
    game.renderMenuBackground();
  });
}

// ========== 怎么玩 ==========
function renderHowToPlayScreen(): void {
  uiContainer.innerHTML = `
    <div class="screen howto-screen">
      <button class="btn-back" id="btnBack">← 返回</button>
      <h2 class="screen-title">❓ 游戏说明</h2>

      <div class="howto-content">
        <div class="howto-section">
          <h3>🎯 游戏目标</h3>
          <p>字母会从天上掉下来，在它们落地之前，按下键盘上对应的字母键来消除它们！</p>
        </div>

        <div class="howto-section">
          <h3>⌨️ 操作方法</h3>
          <ul>
            <li>看到字母掉下来，按键盘上对应的 <strong>字母键</strong></li>
            <li>按对了字母会爆炸，获得分数！</li>
            <li>连续答对可以累积 <strong>连击</strong>，分数更高哦！</li>
            <li>字母落地会扣一颗心（仅无尽模式），心用完游戏结束</li>
            <li>按 <strong>ESC</strong> 键可以暂停游戏</li>
          </ul>
        </div>

        <div class="howto-section">
          <h3>🎮 三种玩法</h3>
          <div class="mode-tips">
            <div class="mode-tip">
              <h4>✍️ 练习区</h4>
              <p>选好速度和想练的字母组，屏幕下方有键盘提示告诉你按哪个键。随时可退出、不会输，适合认识和巩固字母。</p>
            </div>
            <div class="mode-tip">
              <h4>📝 单词冒险</h4>
              <p>拼出完整的英文小单词，当前要打的字母会变红。选「最慢」打 3 个字母的短词，「中等」打 4 个字母，「最快」打 5 个字母的长词，边打边学生字。不会输。</p>
            </div>
            <div class="mode-tip">
              <h4>🎯 无尽挑战</h4>
              <p>可选「打字母」或「打生字」，再选简单/中等/困难。速度越来越快，字母落地会扣心，心用完就结束，挑战最高纪录！</p>
            </div>
          </div>
        </div>

        <div class="howto-section">
          <h3>⭐ 星星 & 🏅 段位升级</h3>
          <ul>
            <li>⭐ <strong>星星</strong>：每答对 <strong>5</strong> 个字母得 1 颗星，攒星星可在「选择角色」里解锁新伙伴（🐰🐱🐼🦄🐲⭐）</li>
            <li>🏅 <strong>段位</strong>：按<strong>累计答对的字母总数</strong>自动升级：🌱新芽 → 🌿幼苗 → 🌳小树 → 🌸小花 → 🏅达人 → 🏆大师</li>
            <li>多练习、多答对，星星和段位都会一起成长！</li>
          </ul>
        </div>

        <div class="howto-tip">
          💡 小提示：先选🐢最慢速度，从✍️练习区认识字母，再到📝单词冒险学生字，最后挑战🎯无尽纪录！
        </div>
      </div>
    </div>
  `;

  document.getElementById('btnBack')?.addEventListener('click', () => {
    game.navigateTo('menu');
    game.renderMenuBackground();
  });
}

// ========== 玩家选择（多账号）==========
let newPlayerEmoji = '🐰';

function renderPlayerSelectScreen(): void {
  const profiles = game.getProfiles();
  const active = game.getActiveProfile();
  const avatars = game.getAvatarEmojis();

  const profileCards = profiles.map(p => `
    <div class="player-card ${active && active.id === p.id ? 'selected' : ''}" data-pid="${p.id}">
      <div class="player-avatar">${p.emoji}</div>
      <div class="player-name">${p.name}</div>
      <div class="player-meta">🏅 最高 ${p.data.highestScore} 分 · ⭐ ${p.data.totalStars}</div>
      ${active && active.id === p.id ? '<div class="player-badge">当前玩家</div>' : ''}
      <button class="player-edit" data-edit="${p.id}" title="改名字">✏️</button>
      <button class="player-delete" data-del="${p.id}" title="删除这个玩家">✕</button>
    </div>
  `).join('');

  uiContainer.innerHTML = `
    <div class="screen player-screen">
      <h2 class="screen-title">👋 谁来玩呀？</h2>
      <p class="screen-subtitle">选一个玩家，或创建新玩家（进度分开保存）。点卡片上的 ✏️ 可以改名</p>

      <div class="player-grid">${profileCards}</div>

      <div class="new-player-card">
        <h3>✨ 创建新玩家</h3>
        <input type="text" id="newPlayerName" class="player-name-input" maxlength="10" placeholder="输入你的名字" />
        <div class="avatar-picker">
          ${avatars.map(a => `<button class="avatar-option ${a === newPlayerEmoji ? 'active' : ''}" data-avatar="${a}">${a}</button>`).join('')}
        </div>
        <button class="btn btn-primary" id="btnAddPlayer">➕ 加入游戏</button>
      </div>

      <div class="player-actions">
        ${profiles.length > 0 ? '<button class="btn btn-secondary" id="btnToLeaderboard">🏆 龙虎榜</button>' : ''}
        ${active ? '<button class="btn btn-secondary" id="btnPlayerBack">← 回主菜单</button>' : ''}
      </div>
    </div>
  `;

  // 选择玩家
  document.querySelectorAll('.player-card').forEach(card => {
    card.addEventListener('click', (e) => {
      const t = e.target as HTMLElement;
      if (t.hasAttribute('data-del') || t.hasAttribute('data-edit')) return;
      const pid = (card as HTMLElement).dataset.pid!;
      game.switchProfile(pid);
      playLevelUpSound();
      game.navigateTo('menu');
      game.renderMenuBackground();
    });
  });

  // 改名
  document.querySelectorAll<HTMLElement>('.player-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pid = btn.dataset.edit!;
      const profile = game.getProfiles().find(p => p.id === pid);
      if (!profile) return;
      const newName = prompt('帮 ' + profile.name + ' 改个新名字：', profile.name);
      if (newName && newName.trim()) {
        game.renameProfile(pid, newName.trim().slice(0, 10));
        renderPlayerSelectScreen();
      }
    });
  });

  // 删除玩家
  document.querySelectorAll<HTMLElement>('.player-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const pid = btn.dataset.del!;
      if (confirm('确定要删除这个玩家吗？TA 的星星、角色和纪录都会不见哦！')) {
        game.removeProfile(pid);
        if (game.getProfiles().length === 0) {
          newPlayerEmoji = '🐰';
        }
        renderPlayerSelectScreen();
      }
    });
  });

  // 选头像
  document.querySelectorAll<HTMLElement>('.avatar-option').forEach(btn => {
    btn.addEventListener('click', () => {
      newPlayerEmoji = btn.dataset.avatar || '🐰';
      document.querySelectorAll('.avatar-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // 创建玩家
  document.getElementById('btnAddPlayer')?.addEventListener('click', () => {
    const nameEl = document.getElementById('newPlayerName') as HTMLInputElement;
    const name = (nameEl?.value || '').trim();
    game.addProfile(name, newPlayerEmoji);
    playLevelUpSound();
    newPlayerEmoji = '🐰';
    game.navigateTo('menu');
    game.renderMenuBackground();
  });

  document.getElementById('btnPlayerBack')?.addEventListener('click', () => {
    game.navigateTo('menu');
    game.renderMenuBackground();
  });

  document.getElementById('btnToLeaderboard')?.addEventListener('click', () => {
    game.navigateTo('leaderboard');
  });
}

// ========== 龙虎榜 ==========
function renderLeaderboardScreen(): void {
  const board = game.getLeaderboard();
  const active = game.getActiveProfile();
  const medals = ['🥇', '🥈', '🥉'];

  const rows = board.map((p, i) => `
    <div class="board-row ${active && p.id === active.id ? 'me' : ''}">
      <div class="board-rank">${medals[i] || (i + 1)}</div>
      <div class="board-avatar">${p.emoji}</div>
      <div class="board-name">${p.name}${active && p.id === active.id ? ' <span class="board-me-tag">（你）</span>' : ''}</div>
      <div class="board-score">${p.score} 分</div>
      <div class="board-sub">✅ ${p.totalCorrect} 字母 · ⭐ ${p.stars}</div>
    </div>
  `).join('');

  uiContainer.innerHTML = `
    <div class="screen leaderboard-screen">
      <button class="btn-back" id="btnBack">← 返回</button>
      <h2 class="screen-title">🏆 龙虎榜</h2>
      <p class="screen-subtitle">谁的最高分最厉害？快来挑战第一名！</p>

      <div class="board-list">
        ${board.length === 0 ? '<p class="board-empty">还没有玩家记录，先去玩一局吧！</p>' : rows}
      </div>

      <button class="btn btn-primary btn-large" id="btnBoardPlay">🎮 开始挑战</button>
    </div>
  `;

  document.getElementById('btnBack')?.addEventListener('click', () => {
    game.navigateTo(active ? 'menu' : 'player-select');
  });
  document.getElementById('btnBoardPlay')?.addEventListener('click', () => {
    game.navigateTo('mode-select');
  });
}
