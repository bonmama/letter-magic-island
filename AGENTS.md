# 🌈 字母魔法岛 (Letter Magic Island)

## 项目概览
专为 7 岁左右儿童设计的打字学习游戏，通过可爱的画风、丰富的游戏模式和收集奖励系统，让孩子在游戏中不知不觉熟练掌握键盘字母位置。

## 技术栈
- **框架**: Vite + TypeScript (原生 TS，无框架依赖)
- **渲染**: Canvas 2D
- **样式**: Tailwind CSS 3 + 原生 CSS
- **状态管理**: 原生 JavaScript 类 + localStorage 持久化
- **音效**: Web Audio API

## 文件结构
```
index.html                  # 入口 HTML
src/
├── main.ts                 # 主入口 + UI 渲染（所有界面 DOM 生成）
├── index.css               # 全局样式（游戏 UI、按钮、动画）
└── game/
    ├── types.ts            # 类型定义（游戏状态、角色、关卡等）
    ├── constants.ts        # 常量配置（颜色、角色、关卡、键盘布局）
    ├── storage.ts          # 本地存储管理（玩家数据持久化）
    ├── engine.ts           # 游戏引擎（状态更新、碰撞检测、粒子系统）
    ├── renderer.ts         # Canvas 渲染器（游戏画面、键盘提示）
    └── GameController.ts   # 游戏控制器（状态机、场景切换、输入处理）
```

## 核心模块说明

### types.ts
- `GameScreen`: 游戏场景枚举（menu/mode-select/playing/result 等）
- `GameMode`: 游戏模式（learn 学习 / challenge 闯关 / endless 无尽）
- `FallingLetter`: 下落字母实体
- `Particle`: 粒子效果
- `FloatingText`: 漂浮文字（得分、连击提示）
- `PlayerData`: 玩家数据（星星、最高分、解锁内容）
- `Character`: 可收集角色
- `LevelConfig`: 关卡配置

### constants.ts
- **彩虹色板**: 8 种儿童友好的明亮色彩
- **字母颜色映射**: 每个字母固定颜色，帮助记忆
- **6 个可解锁角色**: 小兔子→小猫咪→小熊猫→独角兽→小飞龙→星星精灵
- **10 个闯关关卡**: 按键盘学习顺序渐进（基础键→上排→下排→全部字母）
- **键盘布局 & 指法颜色**: 按手指分区上色
- **游戏配置**: 生命数、得分规则、生成间隔等

### storage.ts
- `loadPlayerData` / `savePlayerData`: 读写玩家数据
- `addStars`: 增加星星
- `updateHighScore`: 更新最高分
- `unlockLevel`: 解锁关卡
- `addCorrectCount`: 统计答对总数

### engine.ts
- `createInitialState`: 创建初始游戏状态
- `spawnLetter`: 生成新的下落字母（随机位置、颜色、大小）
- `handleKeyPress`: 处理按键输入，检测命中，计算连击加分
- `updateGameState`: 每帧更新（字母下落、粒子、漂浮文字、难度递增）
- `createParticles`: 消除字母时的粒子爆炸效果
- `createFloatingText`: 生成得分/连击漂浮文字
- `calculateLevelStars`: 闯关模式评星（1-3 星）

### renderer.ts
- `renderGame`: 主渲染函数（背景、云朵、地面、角色、字母、粒子、文字）
- `drawKeyboardHint`: 学习模式的键盘提示（高亮目标键，按手指颜色分区）
- 地面装饰：草地、小花、波浪边缘

### GameController.ts
游戏主控类，负责：
- Canvas 初始化和 resize
- 场景/屏幕切换（导航状态机）
- 游戏循环（requestAnimationFrame）
- 键盘事件处理
- 玩家数据管理（角色选择、解锁检测）
- 静态背景渲染

### main.ts
所有 UI 界面的 DOM 生成与事件绑定：
- `renderMenuScreen`: 主菜单（标题、角色展示、段位进度、统计、按钮）
- `renderModeSelectScreen`: 模式选择（练习区/单词/无尽三张卡片）
- `renderWordSetupScreen`: 单词冒险选速度
- `renderPracticeSelectScreen`: 练习区（选速度 + 字母组，含键盘提示）
- `renderDifficultySelectScreen`: 无尽挑战（先选打字母/打生字，再选难度）
- `renderCharacterSelectScreen`: 角色选择（6 个角色，星星解锁）
- `renderGameUI`: 游戏内 HUD（分数、连击、生命、暂停）
- `renderResultScreen`: 结算画面（得分、星星、新纪录、再玩一次）
- `renderHowToPlayScreen`: 游戏说明
- 音效系统（Web Audio API 生成的命中/失误/升级音效）

## 游戏玩法

### 三种模式
| 模式 | 特点 | 适合阶段 |
|------|------|----------|
| ✍️ 练习区 | 自由选字母组 + 调速，有键盘提示，无生命不会输、随时退出 | 认识/巩固字母位置 |
| 📝 单词冒险 | 拼出完整英文小单词，速度越快生字越长（3→5字母），无生命 | 学习常见单词 |
| 🎯 无尽挑战 | 先选打字母/打生字，再选难度（简单/中等/困难），生命扣完结束 | 熟练后冲榜 |

### 核心机制
- **字母下落**: 彩色字母从天空落下，按键消除；单词模式拼出完整单词
- **连击系统**: 连续答对累积 combo，额外加分
- **生命系统**: 仅无尽模式扣心（简单10/中等5/困难3），学习/练习/单词无生命压力
- **星星收集**: 每答对 5 个字母得 1 星，用于解锁角色
- **段位成长**: 累计答对字母数升级段位（新芽→幼苗→小树→小花→达人→大师），带进度条
- **角色解锁**: 用星星解锁 6 个可爱小伙伴
- **速度调节**: 学习/练习/单词模式可选 🐢乌龟/🚶走路/🐰兔子 三档速度

### 关卡设计逻辑
按键盘学习顺序渐进：
1. 基础键 `asdf` → 2. 加入 `jkl` → 3. 中间行全键
4. 上排前半 `qwerty` → 5. 上排全键 `qwertyuiop`
6. 下排前半 `zxcv` → 7. 下排全键 `zxcvbnm`
8. 字母上半 → 9. 字母下半 → 10. 终极挑战（全字母）

## 操作方式
- **字母键 (A-Z)**: 消除对应下落字母
- **ESC**: 暂停/继续游戏
- **鼠标点击**: 菜单导航

## 性能优化
- Canvas 离屏渲染，DOM 只用于 UI
- 粒子/漂浮文字生命周期管理，自动回收
- DPR 限制（最大 2x）
- 响应式布局（桌面/平板/手机适配）

## 构建与运行
```bash
pnpm install    # 安装依赖
pnpm run dev    # 开发模式
pnpm run build  # 生产构建
pnpm run start  # 生产运行
```

## 扩展建议
- 可加入英文单词模式（完整单词下落）
- 可加入排行榜功能（需要后端）
- 可加入更多角色和皮肤
- 可加入家长模式（学习时长统计）
