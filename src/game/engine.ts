import type { GameState, GameMode, FallingLetter, Particle, FloatingText } from './types';
import { GAME_CONFIG, PRACTICE_GROUPS, DIFFICULTIES, SPEED_LEVELS, LETTER_COLORS, RAINBOW_COLORS, CHARACTERS, getWordLengthForSpeed, pickWord } from './constants';
import { loadPlayerData } from './storage';

let letterIdCounter = 0;
let particleIdCounter = 0;
let floatingTextIdCounter = 0;

// 创建初始游戏状态
export function createInitialState(mode: GameMode, level: number = 1, difficulty: string = 'medium', speed: string = 'walk', wordMode: boolean = false): GameState {
  const diff = DIFFICULTIES.find(d => d.id === difficulty) || DIFFICULTIES[1];
  const spd = SPEED_LEVELS.find(s => s.id === speed) || SPEED_LEVELS[1];

  let spawnInterval: number;
  let letterSpeed: number;
  let lives: number;

  if (mode === 'endless') {
    // 无尽挑战：按所选难度；生字版下生成完整单词（速度略慢）
    spawnInterval = diff.spawnInterval;
    letterSpeed = diff.letterSpeed * (wordMode ? 0.8 : 1);
    lives = diff.lives;
  } else {
    // 练习区 / 单词冒险：无生命压力，使用所选速度
    spawnInterval = spd.spawnInterval;
    letterSpeed = spd.letterSpeed;
    lives = 99; // 不会输
  }

  return {
    mode,
    level,
    difficulty,
    score: 0,
    combo: 0,
    maxCombo: 0,
    correctCount: 0,
    missCount: 0,
    lives,
    stars: 0,
    isPaused: false,
    isGameOver: false,
    letters: [],
    particles: [],
    floatingTexts: [],
    lastSpawnTime: 0,
    spawnInterval,
    letterSpeed,
    elapsedTime: 0,
    speed,
    wordMode,
    word: '',
  };
}

// 获取当前可用字母
export function getAvailableLetters(state: GameState): string {
  if (state.mode === 'practice') {
    const group = PRACTICE_GROUPS.find(g => g.id === state.level);
    return group ? group.letters : PRACTICE_GROUPS[0].letters;
  }
  // 无尽挑战：所有字母
  return 'abcdefghijklmnopqrstuvwxyz';
}

// 是否为「生字版」（下落完整单词而非单个字母）
function isWordState(state: GameState): boolean {
  return state.mode === 'word' || (state.mode === 'endless' && state.wordMode);
}

// 生成新的下落字母
export function spawnLetter(state: GameState, gameWidth: number): FallingLetter | null {
  if (state.letters.length >= GAME_CONFIG.MAX_LETTERS_ON_SCREEN) return null;

  // 生字版：生成一个完整单词（同一时间最多一个，避免画面混乱）
  if (isWordState(state)) {
    if (state.letters.some(l => l.word)) return null;
    let word: string;
    if (state.mode === 'word') {
      const len = getWordLengthForSpeed(state.speed);
      word = pickWord(len, len);
    } else {
      const diff = DIFFICULTIES.find(d => d.id === state.difficulty) || DIFFICULTIES[1];
      word = pickWord(diff.wordMinLen, diff.wordMaxLen);
    }
    const firstChar = word[0];
    const color = LETTER_COLORS[firstChar] || RAINBOW_COLORS[Math.floor(Math.random() * RAINBOW_COLORS.length)];
    const padding = 10; // 百分比内边距
    const x = padding + Math.random() * (100 - padding * 2);
    state.word = word;
    return {
      id: ++letterIdCounter,
      char: firstChar,
      x,
      y: -60,
      speed: state.letterSpeed * 0.85,
      color,
      size: 20,
      rotation: (Math.random() - 0.5) * 6,
      missed: false,
      word,
      wordIndex: 0,
    };
  }

  const available = getAvailableLetters(state);
  if (!available) return null;

  const char = available[Math.floor(Math.random() * available.length)].toLowerCase();
  const padding = 10; // 百分比内边距
  const x = padding + Math.random() * (100 - padding * 2);
  const color = LETTER_COLORS[char] || RAINBOW_COLORS[Math.floor(Math.random() * RAINBOW_COLORS.length)];
  const sizeVariation = 0.8 + Math.random() * 0.4; // 0.8-1.2倍

  return {
    id: ++letterIdCounter,
    char,
    x,
    y: -60,
    speed: state.letterSpeed * (0.9 + Math.random() * 0.2),
    color,
    size: Math.round(48 * sizeVariation),
    rotation: (Math.random() - 0.5) * 10,
    missed: false,
    wordIndex: 0,
  };
}

// 生成粒子效果（消除字母时）
export function createParticles(x: number, y: number, color: string, count: number = 12): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 2 + Math.random() * 4;
    particles.push({
      id: ++particleIdCounter,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      color,
      life: 1,
      size: 4 + Math.random() * 6,
    });
  }
  return particles;
}

// 生成漂浮文字
export function createFloatingText(x: number, y: number, text: string, color: string): FloatingText {
  return {
    id: ++floatingTextIdCounter,
    x,
    y,
    text,
    color,
    life: 1,
    size: 24,
  };
}

// 处理按键
export function handleKeyPress(
  state: GameState,
  key: string,
  gameWidth: number,
  gameHeight: number
): { state: GameState; hit: boolean; letter: FallingLetter | null } {
  if (state.isPaused || state.isGameOver) return { state, hit: false, letter: null };

  const lowerKey = key.toLowerCase();
  
  // 找到最接近底部的匹配字母
  let targetIndex = -1;
  let maxY = -Infinity;

  state.letters.forEach((letter, index) => {
    if (letter.char === lowerKey && !letter.missed && letter.y > maxY) {
      maxY = letter.y;
      targetIndex = index;
    }
  });

  if (targetIndex === -1) {
    // 按错键：断连击（仅无尽模式扣生命，学习/练习无生命压力）
    const losesLife = state.mode === 'endless';
    const newLives = losesLife ? Math.max(0, state.lives - 1) : state.lives;
    const missText = losesLife ? '💔 打错了 -1❤️' : '🤔 再找找那个字母吧～';
    const missFloating = [
      createFloatingText(gameWidth / 2, gameHeight * 0.12, missText, '#FF6B6B'),
    ];
    const newState: GameState = {
      ...state,
      combo: 0,
      lives: newLives,
      missCount: state.missCount + 1,
      floatingTexts: [...state.floatingTexts, ...missFloating],
      isGameOver: losesLife && newLives <= 0,
    };
    return { state: newState, hit: false, letter: null };
  }

  const hitLetter = state.letters[targetIndex];

  // 单词模式：打进单词的字母但不移除，推进到下一个字母
  if (hitLetter.word && hitLetter.wordIndex + 1 < hitLetter.word.length) {
    const newIndex = hitLetter.wordIndex + 1;
    const updatedLetter: FallingLetter = {
      ...hitLetter,
      wordIndex: newIndex,
      char: hitLetter.word[newIndex],
    };
    const letterX = (hitLetter.x / 100) * gameWidth;
    const particles = createParticles(letterX, hitLetter.y, hitLetter.color, 8);
    const newCorrectCount = state.correctCount + 1;
    const newStars = Math.floor(newCorrectCount / GAME_CONFIG.STAR_EVERY_CORRECT);
    const newState: GameState = {
      ...state,
      correctCount: newCorrectCount,
      stars: newStars,
      letters: state.letters.map((l, i) => (i === targetIndex ? updatedLetter : l)),
      particles: [...state.particles, ...particles],
    };
    return { state: newState, hit: true, letter: updatedLetter };
  }

  const newCombo = state.combo + 1;
  const comboBonus = Math.floor(GAME_CONFIG.COMBO_BONUS_MULTIPLIER * newCombo);
  const scoreGain = GAME_CONFIG.SCORE_PER_LETTER + comboBonus;
  const newCorrectCount = state.correctCount + 1;
  const newStars = Math.floor(newCorrectCount / GAME_CONFIG.STAR_EVERY_CORRECT);

  // 生成粒子和漂浮文字
  const letterX = (hitLetter.x / 100) * gameWidth;
  const letterY = hitLetter.y;
  const particles = createParticles(letterX, letterY, hitLetter.color);
  const floatingTexts = [
    createFloatingText(letterX, letterY - 20, `+${scoreGain}`, '#FFD700'),
  ];

  // 连击提示
  if (newCombo >= 5 && newCombo % 5 === 0) {
    floatingTexts.push(createFloatingText(gameWidth / 2, gameHeight / 3, `🔥 ${newCombo} 连击!`, '#FF6B6B'));
  }

  const newState: GameState = {
    ...state,
    score: state.score + scoreGain,
    combo: newCombo,
    maxCombo: Math.max(state.maxCombo, newCombo),
    correctCount: newCorrectCount,
    stars: newStars,
    letters: state.letters.filter((_, i) => i !== targetIndex),
    particles: [...state.particles, ...particles],
    floatingTexts: [...state.floatingTexts, ...floatingTexts],
  };

  // 生字版：拼完整个单词，奖励加分 + 庆祝文字
  if (hitLetter.word) {
    newState.score += hitLetter.word.length * 5;
    const bonusText = createFloatingText(letterX, letterY - 50, `🎉 ${hitLetter.word}!`, '#FF6B9D');
    newState.floatingTexts.push(bonusText);
    newState.word = '';
  }

  return { state: newState, hit: true, letter: hitLetter };
}

// 更新游戏状态（每帧调用）
export function updateGameState(
  state: GameState,
  deltaTime: number,
  gameWidth: number,
  gameHeight: number,
  currentTime: number
): GameState {
  if (state.isPaused || state.isGameOver) return state;

  let newState = { ...state };
  newState.elapsedTime += deltaTime;

  // 生成新字母
  if (currentTime - newState.lastSpawnTime > newState.spawnInterval) {
    const newLetter = spawnLetter(newState, gameWidth);
    if (newLetter) {
      newState.letters = [...newState.letters, newLetter];
    }
    newState.lastSpawnTime = currentTime;
  }

  // 更新字母位置
  const groundY = gameHeight - 80; // 地面高度
  const newLetters: FallingLetter[] = [];
  let livesLost = 0;

  for (const letter of newState.letters) {
    const newY = letter.y + letter.speed * deltaTime * 0.06;
    if (newY >= groundY && !letter.missed) {
      // 字母/单词落地
      if (newState.mode === 'endless') {
        livesLost++;
      }
      if (letter.word) newState.word = '';
      // 生成落地粒子（灰色）
      const letterX = (letter.x / 100) * gameWidth;
      const missParticles = createParticles(letterX, groundY, '#999999', 6);
      newState.particles = [...newState.particles, ...missParticles];
      newState.floatingTexts = [
        ...newState.floatingTexts,
        createFloatingText(letterX, groundY - 20, '💔', '#FF6B6B'),
      ];
      continue; // 移除此字母
    }
    if (newY < gameHeight + 50) {
      newLetters.push({ ...letter, y: newY });
    }
  }

  newState.letters = newLetters;
  if (livesLost > 0) {
    newState.lives = Math.max(0, newState.lives - livesLost);
    newState.missCount += livesLost;
    newState.combo = 0;

    if (newState.lives <= 0) {
      newState.isGameOver = true;
    }
  }

  // 更新粒子
  newState.particles = newState.particles
    .map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      vy: p.vy + 0.15, // 重力
      life: p.life - 0.02,
      size: p.size * 0.98,
    }))
    .filter(p => p.life > 0);

  // 更新漂浮文字
  newState.floatingTexts = newState.floatingTexts
    .map(t => ({
      ...t,
      y: t.y - 1.2,
      life: t.life - 0.015,
      size: t.size * 1.005,
    }))
    .filter(t => t.life > 0);

  // 无尽模式：随时间增加难度（基于所选难度基准）
  if (newState.mode === 'endless') {
    const diff = DIFFICULTIES.find(d => d.id === newState.difficulty) || DIFFICULTIES[1];
    const sec = newState.elapsedTime / 1000;
    newState.letterSpeed = Math.min(6, diff.letterSpeed + sec * 0.015);
    newState.spawnInterval = Math.max(450, diff.spawnInterval - sec * 5);
  }

  return newState;
}

// 获取玩家当前角色
export function getCurrentCharacter() {
  const data = loadPlayerData();
  return CHARACTERS.find((c: { id: string }) => c.id === data.selectedCharacter) || CHARACTERS[0];
}
