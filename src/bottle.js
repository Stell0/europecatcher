import { clamp } from './game.js';

export function updateBottleWobble(pose, phoneRoll, dt) {
  if (dt <= 0) return;
  const target = -phoneRoll;
  // A lightly damped spring counteracts phone roll without looking rigid.
  const steps = Math.ceil(Math.min(dt, 0.1) / (1 / 120));
  const step = Math.min(dt, 0.1) / steps;
  for (let i = 0; i < steps; i++) {
    pose.velocity += ((target - pose.angle) * 110 - pose.velocity * 13) * step;
    pose.angle = clamp(pose.angle + pose.velocity * step, -Math.PI / 2, Math.PI / 2);
  }
}
