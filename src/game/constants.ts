import type { Character, PracticeGroup, DifficultyConfig, SpeedLevel, Medal } from './types';

// 彩虹色板 - 适合儿童的明亮色彩
export const RAINBOW_COLORS = [
  '#FF6B9D', // 粉红
  '#FF9A5C', // 橙色
  '#FFD93D', // 黄色
  '#6BCB77', // 绿色
  '#4D96FF', // 蓝色
  '#9B59B6', // 紫色
  '#FF6B6B', // 珊瑚红
  '#4ECDC4', // 青色
];

// 字母颜色映射（每个字母固定颜色，帮助记忆）
export const LETTER_COLORS: Record<string, string> = {
  a: '#FF6B9D', b: '#FF9A5C', c: '#FFD93D', d: '#6BCB77',
  e: '#4D96FF', f: '#9B59B6', g: '#FF6B6B', h: '#4ECDC4',
  i: '#FF6B9D', j: '#FF9A5C', k: '#FFD93D', l: '#6BCB77',
  m: '#4D96FF', n: '#9B59B6', o: '#FF6B6B', p: '#4ECDC4',
  q: '#FF6B9D', r: '#FF9A5C', s: '#FFD93D', t: '#6BCB77',
  u: '#4D96FF', v: '#9B59B6', w: '#FF6B6B', x: '#4ECDC4',
  y: '#FF6B9D', z: '#FF9A5C',
};

// 可爱角色
export const CHARACTERS: Character[] = [
  { id: 'bunny', name: '小兔子', emoji: '🐰', color: '#FFB6C1', unlockStars: 0, description: '最可爱的小兔子陪你一起学习！' },
  { id: 'cat', name: '小猫咪', emoji: '🐱', color: '#FFA07A', unlockStars: 20, description: '灵巧的小猫咪，打字飞快！' },
  { id: 'panda', name: '小熊猫', emoji: '🐼', color: '#98D8C8', unlockStars: 50, description: '慢吞吞但很聪明的小熊猫' },
  { id: 'unicorn', name: '独角兽', emoji: '🦄', color: '#DDA0DD', unlockStars: 100, description: '传说中的独角兽，超级厉害！' },
  { id: 'dragon', name: '小飞龙', emoji: '🐉', color: '#87CEEB', unlockStars: 200, description: '会飞的小龙，打字冠军！' },
  { id: 'star', name: '星星精灵', emoji: '⭐', color: '#FFD700', unlockStars: 500, description: '闪闪发光的星星精灵，终极奖励！' },
];

// 练习区字母组（自由选择，无压力练习）
export const PRACTICE_GROUPS: PracticeGroup[] = [
  { id: 1, name: '中间键', letters: 'asdfjkl', hint: 'ASDF JKL' },
  { id: 2, name: '上排字母', letters: 'qwertyuiop', hint: 'QWERTYUIOP' },
  { id: 3, name: '中间整排', letters: 'asdfghjkl', hint: 'ASDFGHJKL' },
  { id: 4, name: '下排字母', letters: 'zxcvbnm', hint: 'ZXCVBNM' },
  { id: 5, name: '全部字母', letters: 'abcdefghijklmnopqrstuvwxyz', hint: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
];

// 无尽模式难度（含生字版单词长度范围：越难单词越长）
export const DIFFICULTIES: DifficultyConfig[] = [
  { id: 'easy', name: '简单', emoji: '🌱', spawnInterval: 3400, letterSpeed: 0.5, lives: 10, wordMinLen: 3, wordMaxLen: 3 },
  { id: 'medium', name: '中等', emoji: '🌟', spawnInterval: 1600, letterSpeed: 1.5, lives: 5, wordMinLen: 3, wordMaxLen: 4 },
  { id: 'hard', name: '困难', emoji: '🔥', spawnInterval: 1000, letterSpeed: 2.2, lives: 3, wordMinLen: 4, wordMaxLen: 5 },
];

// 学习/练习区可调速度档位（wordMin/MaxLen 决定单词冒险生字长度）
export const SPEED_LEVELS: SpeedLevel[] = [
  { id: 'snail', name: '最慢', emoji: '🐢', spawnInterval: 3400, letterSpeed: 0.55, desc: '超慢，刚学也能从容应付' },
  { id: 'walk', name: '中等', emoji: '🚶', spawnInterval: 2200, letterSpeed: 1.1, desc: '悠闲的普通速度' },
  { id: 'rabbit', name: '最快', emoji: '🐰', spawnInterval: 1300, letterSpeed: 1.8, desc: '最快，生字又长又难！' },
];

// 成长段位（基于累计答对字母数，带清晰进度条）
export const MEDALS: Medal[] = [
  { name: '字母新芽', emoji: '🌱', threshold: 0 },
  { name: '字母幼苗', emoji: '🌿', threshold: 30 },
  { name: '字母小树', emoji: '🌳', threshold: 80 },
  { name: '字母小花', emoji: '🌸', threshold: 160 },
  { name: '键盘达人', emoji: '🏅', threshold: 300 },
  { name: '键盘大师', emoji: '🏆', threshold: 600 },
];

// 单词冒险词库，按长度分级（速度越快，抽到的生字越长越难）
// 每级都有充足的常用生字，避免短时间内重复出现
export const WORD_LISTS: Record<number, string[]> = {
  3: [
    'cat','dog','sun','run','red','pig','big','eye','hat','bus',
    'cup','box','fox','bed','egg','car','toy','map','pen','one',
    'two','bee','cow','ant','bat','bag','boy','can','dad','day',
    'eat','far','fun','get','got','hen','hot','jam','jet','key',
    'kid','leg','let','lip','log','mom','net','new','oil','old',
    'owl','pan','pet','pie','pot','rat','ray','rub','sad','sat',
    'sea','see','sit','six','sky','son','tea','ten','top','van',
    'war','win','yes','you','zoo','arm','art','ape','air'
  ],
  4: [
    'blue','jump','fish','bird','cake','star','moon','rain','bear','duck',
    'frog','milk','book','tree','ball','kite','hand','foot','fire','rose',
    'snow','gift','lion','baby','back','bank','barn','bath','bell','boat',
    'body','bone','bowl','bulb','bush','calm','camp','card','care','cart',
    'cash','clap','clay','club','coal','coat','cold','cook','cool','corn',
    'crab','crew','damp','dark','dawn','dear','deer','desk','dice','dish',
    'door','dove','drag','draw','drum','dull','dust','duty','earn','east',
    'easy','edge','face','fact','fair','fall','farm','fast','fear','feed',
    'feel','feet','fern','fill','film','find','fine','firm','flag','flat',
    'flea','flip','flop','flow','foam','fold','folk','food','fool','fork',
    'form','fort','four','free','from','fuel','full','fury','fuzz','gate',
    'gave','gaze','gear','girl','give','glad','glee','glow','glue','goat',
    'gold','golf','good','goose','grab','gram','gray','grew','grey','grin',
    'grip','grow','gulf','gull','guru','gush','gust','hail','hair','half',
    'hall','halo','halt'
  ],
  5: [
    'happy','lucky','apple','candy','cloud','panda','water','light','music','magic',
    'pizza','tiger','plant','river','lemon','berry','sweet','dream','horse','sheep',
    'about','above','actor','adopt','after','again','agent','agree','ahead','alarm',
    'album','alert','alien','align','alike','alive','allow','alone','along','aloud',
    'alpha','altar','amber','amuse','angel','anger','angle','angry','ankle','apart',
    'apply','apron','argue','arise','armor','array','arrow','asleep','asset','aunty',
    'avail','avert','awake','award','aware','awful','bacon','badge','baker','basic',
    'basil','basin','basis','batch','beach','beads','beams','beans','beard','beast',
    'beats','beaut','beech','beefy','beers','began','begin','being','belly','below',
    'bench','birth','black','blade','blame','bland','blank','blast','blaze','bleak',
    'blend','bless','blind','blink','bliss','block','blond','blood','bloom','blown',
    'bluff','blunt','blush','board','boast','boats','bogus','bolts','bones','bonus',
    'boost','booth','boots','bound','bowed','brace','braid','brain','brake','brand',
    'brash','brass','brave','bread','break','breed','brick','bride','brief','brisk',
    'broad','broil','broke','brook','brown','brush','buddy','build'
  ],
};

// 按速度档位获取单词长度（乌龟→3字母、走路→4字母、兔子→5字母）
export function getWordLengthForSpeed(speedId: string): number {
  if (speedId === 'snail') return 3;
  if (speedId === 'walk') return 4;
  return 5; // rabbit
}

// 按长度抽取一个随机单词
export function pickWord(minLen: number, maxLen: number): string {
  const lens: number[] = [];
  for (let l = minLen; l <= maxLen; l++) {
    if (WORD_LISTS[l] && WORD_LISTS[l].length > 0) lens.push(l);
  }
  const len = lens[Math.floor(Math.random() * lens.length)] ?? 3;
  const list = WORD_LISTS[len] ?? WORD_LISTS[3];
  return list[Math.floor(Math.random() * list.length)];
}

// 键盘布局（用于显示提示）
export const KEYBOARD_LAYOUT = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

// 指法对应的手指颜色
export const FINGER_COLORS: Record<string, string> = {
  // 左手小指
  q: '#FF6B6B', a: '#FF6B6B', z: '#FF6B6B',
  // 左手无名指
  w: '#FFA07A', s: '#FFA07A', x: '#FFA07A',
  // 左手中指
  e: '#FFD93D', d: '#FFD93D', c: '#FFD93D',
  // 左手食指
  r: '#6BCB77', f: '#6BCB77', v: '#6BCB77',
  t: '#6BCB77', g: '#6BCB77', b: '#6BCB77',
  // 右手食指
  y: '#4D96FF', h: '#4D96FF', n: '#4D96FF',
  u: '#4D96FF', j: '#4D96FF', m: '#4D96FF',
  // 右手中指
  i: '#9B59B6', k: '#9B59B6',
  // 右手无名指
  o: '#FF6B9D', l: '#FF6B9D',
  // 右手小指
  p: '#4ECDC4',
};

// 游戏常量
export const GAME_CONFIG = {
  INITIAL_LIVES: 5,
  SCORE_PER_LETTER: 10,
  COMBO_BONUS_MULTIPLIER: 0.5,
  STAR_EVERY_CORRECT: 5,  // 每答对N个获得1颗星
  BASE_SPAWN_INTERVAL: 1500,
  BASE_LETTER_SPEED: 1.5,
  MAX_LETTERS_ON_SCREEN: 8,
  ENDLESS_SPEED_INCREASE_RATE: 0.0005, // 无尽模式速度增长率
  ENDLESS_SPAWN_DECREASE_RATE: 0.1,   // 无尽模式生成间隔减少率
};
