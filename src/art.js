import { RULES } from './game.js';

export const INK = '#14294c';
export const PAPER = '#f6f1e5';

export function starPoints(cx, cy, outer, inner) {
  return Array.from({ length: 10 }, (_, i) => {
    const angle = -Math.PI / 2 + i * Math.PI / 5;
    const r = i % 2 ? inner : outer;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  });
}

export function starRing(svg, remaining = 12, emblem = false) {
  svg.replaceChildren();
  for (let i = 0; i < 12; i++) {
    const angle = -Math.PI / 2 + i * Math.PI / 6;
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', starPoints(50 + Math.cos(angle) * 37,
      50 + Math.sin(angle) * 37, 7, 3.1).map(point => point.join(',')).join(' '));
    polygon.setAttribute('fill', i < remaining ? '#eebd37' : 'none');
    polygon.setAttribute('stroke', i < remaining ? '#c39325' : '#9c9f9e');
    polygon.setAttribute('stroke-width', emblem ? '0' : '1.4');
    svg.append(polygon);
  }
}

export function drawCap(ctx, x, y, radius = RULES.capRadius, angle = -0.24) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const r = radius;
  const wall = ctx.createLinearGradient(-r, 0, r, 0);
  wall.addColorStop(0, '#062b70'); wall.addColorStop(0.38, '#468ce0');
  wall.addColorStop(0.75, '#1760b9'); wall.addColorStop(1, '#062b70');
  ctx.fillStyle = wall;
  ctx.strokeStyle = '#0b3478'; ctx.lineWidth = 0.8;
  ctx.beginPath();ctx.moveTo(-r, -r * 0.3);ctx.lineTo(-r, r * 0.35);
  ctx.ellipse(0, r * 0.35, r, r * 0.45, 0, Math.PI, 0, true);
  ctx.lineTo(r, -r * 0.3);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.strokeStyle = '#b5d7f0';ctx.lineWidth = 0.6;
  for (let i = -9; i <= 9; i++) {
    const rx = r * i / 10;
    const edge = Math.sqrt(1 - (rx / r) ** 2) * r * 0.38;
    ctx.beginPath();ctx.moveTo(rx, -r * 0.3 + edge);ctx.lineTo(rx, r * 0.35 + edge);ctx.stroke();
  }
  const top = ctx.createLinearGradient(-r, -r, r, r);
  top.addColorStop(0, '#71b6ed');top.addColorStop(0.45, '#347dce');top.addColorStop(1, '#124595');
  ctx.fillStyle = top;ctx.strokeStyle = '#092f73';ctx.lineWidth = 0.9;
  ctx.beginPath();ctx.ellipse(0, -r * 0.3, r, r * 0.45, 0, 0, Math.PI * 2);ctx.fill();ctx.stroke();
  ctx.strokeStyle = '#8dbce4';ctx.lineWidth = 0.65;
  ctx.beginPath();ctx.ellipse(0, -r * 0.3, r * 0.78, r * 0.31, 0, 0, Math.PI * 2);ctx.stroke();
  ctx.restore();
}

export function drawBottle(ctx, centerX, mouthY, width = 87, height = 164) {
  ctx.save();ctx.translate(centerX - width / 2, mouthY);ctx.scale(width / 100, height / 190);
  const body = new Path2D('M29 5 L71 5 L71 23 C71 34 94 43 96 59 L96 171 Q96 188 81 187 L67 185 Q58 193 50 185 Q42 193 33 185 L19 187 Q4 188 4 171 L4 59 C6 43 29 34 29 23 Z');
  const gradient = ctx.createLinearGradient(0, 0, 100, 0);
  gradient.addColorStop(0, '#346b8f24');gradient.addColorStop(0.14, '#c2d8e36b');
  gradient.addColorStop(0.28, '#ffffffa0');gradient.addColorStop(0.48, '#8ba8be28');
  gradient.addColorStop(0.7, '#ffffff8f');gradient.addColorStop(0.9, '#517d9c42');gradient.addColorStop(1, '#244f7255');
  ctx.fillStyle = gradient;ctx.strokeStyle = '#426984';ctx.lineWidth = 0.95;ctx.fill(body);ctx.stroke(body);
  ctx.save();ctx.clip(body);
  ctx.fillStyle = '#8faebb14';ctx.fillRect(0, 85, 100, 105);
  for (const y of [70, 87, 104, 121, 138, 155, 171]) {
    ctx.strokeStyle = '#577b9266';ctx.lineWidth = 1.15;
    ctx.beginPath();ctx.moveTo(4, y);ctx.bezierCurveTo(22, y + 7, 78, y + 7, 96, y);ctx.stroke();
    ctx.strokeStyle = '#ffffffba';ctx.lineWidth = 2.4;
    ctx.beginPath();ctx.moveTo(5, y + 2.5);ctx.bezierCurveTo(24, y + 10, 76, y + 10, 95, y + 2.5);ctx.stroke();
  }
  ctx.strokeStyle = '#ffffffc0';ctx.lineWidth = 3;
  ctx.beginPath();ctx.moveTo(21, 65);ctx.lineTo(19, 174);ctx.stroke();
  ctx.strokeStyle = '#446d8555';ctx.lineWidth = 1;
  ctx.beginPath();ctx.moveTo(82, 62);ctx.lineTo(84, 176);ctx.stroke();
  ctx.restore();
  for (const y of [5, 10, 16, 22]) {
    ctx.fillStyle = '#d9e6e994';ctx.strokeStyle = '#3d6685';ctx.lineWidth = 0.9;
    ctx.beginPath();ctx.ellipse(50, y, 22, 4, 0, 0, Math.PI * 2);ctx.fill();ctx.stroke();
  }
  ctx.fillStyle = '#6b8d9d48';ctx.strokeStyle = '#345d7e';ctx.lineWidth = 1.2;
  ctx.beginPath();ctx.ellipse(50, 1, 21.5, 4.2, 0, 0, Math.PI * 2);ctx.fill();ctx.stroke();
  ctx.strokeStyle = '#faffff';ctx.lineWidth = 1;
  ctx.beginPath();ctx.ellipse(50, 0, 19, 2.6, 0, Math.PI, 0);ctx.stroke();
  ctx.restore();
}

export function drawGame(ctx, game, caughtAt, now, reducedMotion, angle = 0) {
  const x = game?.bottleX ?? RULES.mouthX;
  const snap = !reducedMotion && now - caughtAt < 220 ? Math.sin((now - caughtAt) / 220 * Math.PI) * 2 : 0;
  ctx.strokeStyle = '#14294c25';ctx.lineWidth = 0.5;
  ctx.beginPath();ctx.moveTo(x - 60, 478);ctx.lineTo(x + 60, 478);ctx.stroke();
  ctx.save();ctx.translate(x, RULES.catchY + snap);ctx.rotate(angle);
  drawBottle(ctx, 0, 0, RULES.bottleWidth, RULES.bottleHeight);
  if (now - caughtAt < 220) drawCap(ctx, 0, -2, RULES.capRadius, 0);
  ctx.restore();
  if (game?.cap) drawCap(ctx, game.cap.x, game.cap.y);
  ctx.fillStyle = '#14294cb3';ctx.textAlign = 'center';ctx.font = '8px "Courier New", monospace';
  ctx.fillText('DESIGNATED BOTTLE', x, 494);
}
