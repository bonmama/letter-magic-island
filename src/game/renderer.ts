import type { GameState, FallingLetter, Particle, FloatingText } from './types';
import { KEYBOARD_LAYOUT, FINGER_COLORS } from './constants';

// 绘制游戏画面
export function renderGame(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  width: number,
  height: number,
  characterEmoji: string
): void {
  // 清空画布
  ctx.clearRect(0, 0, width, height);

  // 绘制背景渐变
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, '#E8F4FD');
  bgGradient.addColorStop(0.5, '#FFE5F0');
  bgGradient.addColorStop(1, '#FFF5E6');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // 绘制云朵装饰
  drawClouds(ctx, width, height);

  // 绘制地面
  drawGround(ctx, width, height);

  // 绘制角色（在地面上）
  drawCharacter(ctx, characterEmoji, width / 2, height - 100);

  // 绘制下落字母
  for (const letter of state.letters) {
    drawFallingLetter(ctx, letter, width);
  }

  // 绘制粒子
  for (const particle of state.particles) {
    drawParticle(ctx, particle);
  }

  // 绘制漂浮文字
  for (const text of state.floatingTexts) {
    drawFloatingText(ctx, text);
  }
}

function drawClouds(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  const cloudPositions = [
    { x: width * 0.1, y: height * 0.15, scale: 1 },
    { x: width * 0.3, y: height * 0.08, scale: 0.8 },
    { x: width * 0.7, y: height * 0.12, scale: 1.2 },
    { x: width * 0.9, y: height * 0.2, scale: 0.9 },
  ];

  for (const cloud of cloudPositions) {
    const s = cloud.scale;
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, 25 * s, 0, Math.PI * 2);
    ctx.arc(cloud.x + 30 * s, cloud.y - 10 * s, 30 * s, 0, Math.PI * 2);
    ctx.arc(cloud.x + 60 * s, cloud.y, 25 * s, 0, Math.PI * 2);
    ctx.arc(cloud.x + 30 * s, cloud.y + 10 * s, 22 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGround(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  const groundY = height - 80;
  
  // 草地
  const grassGradient = ctx.createLinearGradient(0, groundY, 0, height);
  grassGradient.addColorStop(0, '#7DD87D');
  grassGradient.addColorStop(0.3, '#5BC85B');
  grassGradient.addColorStop(1, '#4A9D4A');
  ctx.fillStyle = grassGradient;
  ctx.fillRect(0, groundY, width, 80);

  // 草地顶部波浪
  ctx.fillStyle = '#8ADE8A';
  ctx.beginPath();
  ctx.moveTo(0, groundY);
  for (let x = 0; x <= width; x += 20) {
    const y = groundY - 3 + Math.sin(x * 0.05) * 4;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, groundY);
  ctx.closePath();
  ctx.fill();

  // 小花装饰
  const flowerColors = ['#FF6B9D', '#FFD93D', '#FF9A5C', '#9B59B6', '#4ECDC4'];
  for (let i = 0; i < 12; i++) {
    const fx = (width / 12) * i + 20;
    const fy = groundY + 15 + (i % 3) * 10;
    const color = flowerColors[i % flowerColors.length];
    
    // 花瓣
    ctx.fillStyle = color;
    for (let j = 0; j < 5; j++) {
      const angle = (Math.PI * 2 * j) / 5;
      ctx.beginPath();
      ctx.arc(fx + Math.cos(angle) * 4, fy + Math.sin(angle) * 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // 花心
    ctx.fillStyle = '#FFD93D';
    ctx.beginPath();
    ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCharacter(ctx: CanvasRenderingContext2D, emoji: string, x: number, y: number): void {
  ctx.font = '60px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(emoji, x, y);
}

function drawFallingLetter(
  ctx: CanvasRenderingContext2D,
  letter: FallingLetter,
  width: number
): void {
  const x = (letter.x / 100) * width;
  const y = letter.y;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((letter.rotation * Math.PI) / 180);

  // 单词模式：绘制单词盒子
  if (letter.word) {
    const word = letter.word;
    const cellSize = 30;
    const gap = 6;
    const totalWidth = word.length * cellSize + (word.length - 1) * gap;
    ctx.shadowBlur = 0;
    let cx = -totalWidth / 2;
    for (let i = 0; i < word.length; i++) {
      const isDone = i < letter.wordIndex;
      const isCurrent = i === letter.wordIndex;
      const boxX = cx + cellSize / 2;
      // 背景
      ctx.fillStyle = isDone ? '#FFE9A8' : 'rgba(255,255,255,0.92)';
      roundRect(ctx, cx, -cellSize / 2, cellSize, cellSize, 8);
      ctx.fill();
      ctx.strokeStyle = isCurrent ? '#FF6B6B' : '#D8D8D8';
      ctx.lineWidth = isCurrent ? 3 : 2;
      ctx.stroke();
      // 字母
      ctx.fillStyle = isCurrent ? letter.color : isDone ? '#B0A060' : '#CCCCCC';
      ctx.font = `bold 20px 'Comic Sans MS', cursive, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(word[i].toUpperCase(), boxX, 1);
      cx += cellSize + gap;
    }
    ctx.restore();
    return;
  }

  // 字母阴影/光晕
  ctx.shadowColor = letter.color;
  ctx.shadowBlur = 15;

  // 字母背景圆
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(0, 0, letter.size * 0.7, 0, Math.PI * 2);
  ctx.fill();

  // 边框
  ctx.strokeStyle = letter.color;
  ctx.lineWidth = 3;
  ctx.stroke();

  // 字母文字
  ctx.shadowBlur = 0;
  ctx.fillStyle = letter.color;
  ctx.font = `bold ${letter.size}px 'Comic Sans MS', cursive, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letter.char.toUpperCase(), 0, 2);

  ctx.restore();
}

// 圆角矩形辅助
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawParticle(ctx: CanvasRenderingContext2D, particle: Particle): void {
  ctx.globalAlpha = particle.life;
  ctx.fillStyle = particle.color;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawFloatingText(ctx: CanvasRenderingContext2D, text: FloatingText): void {
  ctx.globalAlpha = text.life;
  ctx.fillStyle = text.color;
  ctx.font = `bold ${text.size}px 'Comic Sans MS', cursive, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 3;
  ctx.strokeText(text.text, text.x, text.y);
  ctx.fillText(text.text, text.x, text.y);
  ctx.globalAlpha = 1;
}

// 绘制键盘提示（学习模式）
export function drawKeyboardHint(
  ctx: CanvasRenderingContext2D,
  targetLetter: string,
  width: number,
  height: number
): void {
  const keyboardY = height - 220;
  const keyWidth = 44;
  const keyHeight = 44;
  const keyGap = 6;
  
  ctx.save();
  
  for (let row = 0; row < KEYBOARD_LAYOUT.length; row++) {
    const rowKeys = KEYBOARD_LAYOUT[row];
    const rowWidth = rowKeys.length * (keyWidth + keyGap) - keyGap;
    const startX = (width - rowWidth) / 2; // 每行水平居中
    
    for (let col = 0; col < rowKeys.length; col++) {
      const key = rowKeys[col];
      const x = startX + col * (keyWidth + keyGap);
      const y = keyboardY + row * (keyHeight + keyGap);
      
      const isTarget = key === targetLetter.toLowerCase();
      const fingerColor = FINGER_COLORS[key] || '#cccccc';
      
      // 按键背景
      ctx.fillStyle = isTarget ? '#FFD700' : 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      // 圆角矩形
      const radius = 8;
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + keyWidth - radius, y);
      ctx.quadraticCurveTo(x + keyWidth, y, x + keyWidth, y + radius);
      ctx.lineTo(x + keyWidth, y + keyHeight - radius);
      ctx.quadraticCurveTo(x + keyWidth, y + keyHeight, x + keyWidth - radius, y + keyHeight);
      ctx.lineTo(x + radius, y + keyHeight);
      ctx.quadraticCurveTo(x, y + keyHeight, x, y + keyHeight - radius);
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();
      ctx.fill();
      
      // 边框
      ctx.strokeStyle = isTarget ? '#FFA500' : fingerColor;
      ctx.lineWidth = isTarget ? 3 : 2;
      ctx.stroke();
      
      // 目标键的光晕动画
      if (isTarget) {
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }
      
      // 字母
      ctx.fillStyle = isTarget ? '#FF6B00' : '#555555';
      ctx.font = `bold 18px 'Comic Sans MS', cursive, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(key.toUpperCase(), x + keyWidth / 2, y + keyHeight / 2);
    }
  }
  
  ctx.restore();
}
