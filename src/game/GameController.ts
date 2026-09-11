import type { GameState, GameMode, PlayerData, Character } from './types';
import { CHARACTERS, PRACTICE_GROUPS, DIFFICULTIES, SPEED_LEVELS, MEDALS } from './constants';
import {
  loadPlayerData, savePlayerData, addStars, updateHighScore, addCorrectCount,
  loadProfiles, createProfile, deleteProfile, getActiveProfile, setActiveId, renameProfile,
  updateActiveProfileMeta, getAvatarEmojis,
} from './storage';
import { createInitialState, updateGameState, handleKeyPress } from './engine';
import { renderGame, drawKeyboardHint } from './renderer';

export type ScreenType = 'menu' | 'mode-select' | 'practice-select' | 'difficulty-select' | 'word-setup' | 'character-select' | 'playing' | 'result' | 'how-to-play' | 'player-select' | 'leaderboard';

export class GameController {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private state: GameState | null = null;
  private animationId: number = 0;
  private lastTime: number = 0;
  private currentScreen: ScreenType = 'menu';
  private playerData: PlayerData;
  private width: number = 0;
  private height: number = 0;
  private onStateChange: (() => void) | null = null;
  private onScreenChange: ((screen: ScreenType) => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    this.ctx = ctx;
    this.playerData = loadPlayerData();
    this.resize();
  }

  setOnStateChange(callback: () => void): void {
    this.onStateChange = callback;
  }

  setOnScreenChange(callback: (screen: ScreenType) => void): void {
    this.onScreenChange = callback;
  }

  getState(): GameState | null {
    return this.state;
  }

  getScreen(): ScreenType {
    return this.currentScreen;
  }

  getPlayerData(): PlayerData {
    return this.playerData;
  }

  // 从存储重新加载当前玩家数据（切换账号后调用）
  refreshPlayerData(): void {
    this.playerData = loadPlayerData();
  }

  // ===== 多玩家账号 =====
  getProfiles() {
    return loadProfiles();
  }

  getActiveProfile() {
    return getActiveProfile();
  }

  getAvatarEmojis() {
    return getAvatarEmojis();
  }

  switchProfile(id: string): void {
    setActiveId(id);
    this.playerData = loadPlayerData();
  }

  addProfile(name: string, emoji: string) {
    const profile = createProfile(name, emoji);
    this.playerData = loadPlayerData();
    return profile;
  }

  removeProfile(id: string) {
    const remaining = deleteProfile(id);
    this.playerData = loadPlayerData();
    return remaining;
  }

  updateProfileMeta(meta: { name?: string; emoji?: string }) {
    const profile = updateActiveProfileMeta(meta);
    if (profile) this.playerData = profile.data;
    return profile;
  }

  // 给任意玩家改名（含当前玩家），改名后刷新内存中的玩家数据
  renameProfile(id: string, name: string) {
    renameProfile(id, name);
    this.playerData = loadPlayerData();
  }

  // 龙虎榜：按最高分排序（只取有过游戏记录的玩家）
  getLeaderboard() {
    return loadProfiles()
      .map(p => ({
        id: p.id,
        name: p.name,
        emoji: p.emoji,
        score: p.data.highestScore,
        totalCorrect: p.data.totalCorrect,
        stars: p.data.totalStars,
      }))
      .sort((a, b) => b.score - a.score);
  }

  getCharacters(): Character[] {
    return CHARACTERS;
  }

  getPracticeGroups() {
    return PRACTICE_GROUPS;
  }

  getDifficulties() {
    return DIFFICULTIES;
  }

  getSpeedLevels() {
    return SPEED_LEVELS;
  }

  getMedals() {
    return MEDALS;
  }

  getCurrentMedal() {
    const total = this.playerData.totalCorrect;
    let current = MEDALS[0];
    let next: null | (typeof MEDALS)[number] = null;
    for (let i = 0; i < MEDALS.length; i++) {
      if (total >= MEDALS[i].threshold) {
        current = MEDALS[i];
        if (i + 1 < MEDALS.length) next = MEDALS[i + 1];
      } else break;
    }
    // 如果已达到最高段位，强制 next 为 null
    if (total >= MEDALS[MEDALS.length - 1].threshold) {
      next = null;
    }
    return { current, next, total, progress: next ? (total - current.threshold) / (next.threshold - current.threshold) : 1 };
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  navigateTo(screen: ScreenType): void {
    this.currentScreen = screen;
    if (screen === 'playing') {
      this.stopGame();
    } else if (screen === 'result') {
      this.handleGameEnd();
    }
    this.onScreenChange?.(screen);
  }

  startGame(mode: GameMode, level: number = 1, difficulty: string = 'medium', speed: string = 'walk', wordMode: boolean = false): void {
    this.state = createInitialState(mode, level, difficulty, speed, wordMode);
    this.currentScreen = 'playing';
    this.lastTime = performance.now();
    this.onScreenChange?.('playing');
    this.gameLoop(this.lastTime);
  }

  stopGame(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }

  togglePause(): void {
    if (!this.state) return;
    this.state.isPaused = !this.state.isPaused;
    this.onStateChange?.();
  }

  handleKey(key: string): void {
    if (!this.state || this.currentScreen !== 'playing') return;

    const result = handleKeyPress(this.state, key, this.width, this.height);
    this.state = result.state;
    this.onStateChange?.();

    if (this.state.isGameOver) {
      this.stopGame();
      this.handleGameEnd();
      this.navigateTo('result');
    }
  }

  private gameLoop = (currentTime: number): void => {
    if (!this.state) return;

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (!this.state.isPaused && !this.state.isGameOver) {
      this.state = updateGameState(this.state, deltaTime, this.width, this.height, currentTime);

      if (this.state.isGameOver) {
        this.stopGame();
        this.handleGameEnd();
        this.navigateTo('result');
        this.render();
        return;
      }
    }

    this.onStateChange?.();
    this.render();
    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  private render(): void {
    if (!this.state) return;

    const character = CHARACTERS.find(c => c.id === this.playerData.selectedCharacter) || CHARACTERS[0];
    renderGame(this.ctx, this.state, this.width, this.height, character.emoji);

    // 练习区（单字母）显示键盘提示，帮助认键
    if (this.state.mode === 'practice' && !this.state.wordMode && this.state.letters.length > 0) {
      const lowestLetter = this.state.letters.reduce((lowest, letter) =>
        letter.y > lowest.y ? letter : lowest
      );
      drawKeyboardHint(this.ctx, lowestLetter.char, this.width, this.height);
    }
  }

  private handleGameEnd(): void {
    if (!this.state) return;

    // 更新最高分
    updateHighScore(this.state.score);

    // 增加正确数
    addCorrectCount(this.state.correctCount);

    // 本次游戏获得的星星
    const starsEarned = this.state.stars;

    if (starsEarned > 0) {
      const newData = addStars(starsEarned);
      this.playerData = newData;
    } else {
      this.playerData = loadPlayerData();
    }

    // 检查是否解锁新角色
    this.checkCharacterUnlocks();
  }

  private checkCharacterUnlocks(): void {
    const newlyUnlocked: string[] = [];
    for (const char of CHARACTERS) {
      if (
        !this.playerData.unlockedCharacters.includes(char.id) &&
        this.playerData.totalStars >= char.unlockStars
      ) {
        newlyUnlocked.push(char.id);
      }
    }
    if (newlyUnlocked.length > 0) {
      this.playerData.unlockedCharacters = [
        ...this.playerData.unlockedCharacters,
        ...newlyUnlocked,
      ];
      // 保存
      savePlayerData(this.playerData);
    }
  }

  selectCharacter(characterId: string): void {
    if (this.playerData.unlockedCharacters.includes(characterId)) {
      this.playerData.selectedCharacter = characterId;
      savePlayerData(this.playerData);
      this.onStateChange?.();
    }
  }

  // 重新开始当前模式
  restart(): void {
    if (!this.state) return;
    const mode = this.state.mode;
    const level = this.state.level;
    const difficulty = this.state.difficulty;
    const speed = this.state.speed;
    const wordMode = this.state.wordMode;
    this.stopGame();
    this.startGame(mode, level, difficulty, speed, wordMode);
  }

  // 练习/学习模式：点击「完成练习」主动结束
  finishRun(): void {
    this.stopGame();
    this.navigateTo('result');
  }

  // 渲染静态画面（非游戏场景）
  renderMenuBackground(): void {
    const ctx = this.ctx;
    const width = this.width;
    const height = this.height;

    // 清空
    ctx.clearRect(0, 0, width, height);

    // 彩虹渐变背景
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#FFE5EC');
    gradient.addColorStop(0.25, '#FFF0E5');
    gradient.addColorStop(0.5, '#FFFDE5');
    gradient.addColorStop(0.75, '#E5FFF0');
    gradient.addColorStop(1, '#E5F0FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 漂浮的字母装饰
    const decorativeLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 20; i++) {
      const x = (i / 20) * width + Math.sin(i) * 30;
      const y = 50 + (i % 5) * 80 + Math.cos(i * 2) * 20;
      const letter = decorativeLetters[i % decorativeLetters.length];
      const size = 30 + (i % 4) * 15;
      ctx.fillStyle = ['#FF6B9D', '#FFD93D', '#6BCB77', '#4D96FF', '#9B59B6'][i % 5];
      ctx.font = `bold ${size}px 'Comic Sans MS', cursive, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(letter, x, y);
    }
    ctx.globalAlpha = 1;
  }
}
