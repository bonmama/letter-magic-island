// 游戏状态
export type GameScreen = 'menu' | 'mode-select' | 'playing' | 'result';

// 游戏模式：练习区（自由字母）/ 单词冒险 / 无尽挑战
export type GameMode = 'practice' | 'word' | 'endless';

// 下落字母
export interface FallingLetter {
  id: number;
  char: string;
  x: number;      // 百分比 0-100
  y: number;      // 像素
  speed: number;  // 每帧下落像素
  color: string;
  size: number;   // 字号
  rotation: number;
  missed: boolean;
  word?: string;   // 单词模式：完整单词
  wordIndex: number; // 单词模式：已正确输入的位置
}

// 粒子效果
export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  size: number;
}

// 漂浮文字
export interface FloatingText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  size: number;
}

// 游戏状态数据
export interface GameState {
  mode: GameMode;
  level: number;       // 练习区：字母组编号；其他模式为 1
  difficulty: string;  // 无尽模式难度 easy/medium/hard
  score: number;
  combo: number;
  maxCombo: number;
  correctCount: number;
  missCount: number;
  lives: number;
  stars: number;
  isPaused: boolean;
  isGameOver: boolean;
  letters: FallingLetter[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  lastSpawnTime: number;
  spawnInterval: number;
  letterSpeed: number;
  elapsedTime: number;     // 无尽模式累计游戏时间（用于难度递增）
  speed: string;             // 练习/单词模式的 SpeedLevel id
  wordMode: boolean;         // 无尽模式是否为「生字版」（下落完整单词）
  word?: string;              // 当前生成的单词（单词/无尽生字版）
}

// 玩家数据（本地存储）
export interface PlayerData {
  totalStars: number;
  highestScore: number;
  unlockedCharacters: string[];
  selectedCharacter: string;
  totalCorrect: number;
}

// 学习/练习区速度档位
export interface SpeedLevel {
  id: string;
  name: string;
  emoji: string;
  spawnInterval: number;
  letterSpeed: number;
  desc: string;
}

// 成长段位
export interface Medal {
  name: string;
  emoji: string;
  threshold: number;
}

// 可爱角色
export interface Character {
  id: string;
  name: string;
  emoji: string;
  color: string;
  unlockStars: number;
  description: string;
}

// 练习区字母组
export interface PracticeGroup {
  id: number;
  name: string;
  letters: string;  // 该组出现的字母集合
  hint: string;     // 展示的字母提示
}

// 无尽模式难度
export interface DifficultyConfig {
  id: string;
  name: string;
  emoji: string;
  spawnInterval: number;
  letterSpeed: number;
  lives: number;
  // 生字版难度下抽取的单词长度范围（3-5 字母）
  wordMinLen: number;
  wordMaxLen: number;
}
