export const RULES = Object.freeze({
  width: 360, height: 500, lives: 12,
  capRadius: 19, catchY: 306, mouthX: 180, mouthWidth: 48,
  bottleWidth: 87, bottleHeight: 164,
  steeringSpeed: 235, initialFallSpeed: 118, maxFallSpeed: 355,
  rampSeconds: 65, respawnDelay: 0.32, step: 1 / 120,
});

export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
export const fallSpeed = seconds => RULES.initialFallSpeed +
  (RULES.maxFallSpeed - RULES.initialFallSpeed) * (1 - Math.exp(-seconds / RULES.rampSeconds));

function spawn(random, bottleX = RULES.mouthX) {
  // Keep caps reachable from the bottle's current position, even at full speed.
  const side = random() < 0.5 ? -1 : 1;
  return { x: clamp(bottleX + side * (55 + random() * 89),
    RULES.bottleWidth / 2, RULES.width - RULES.bottleWidth / 2), y: -RULES.capRadius };
}

export function createGame(random = Math.random) {
  return { phase: 'playing', score: 0, lives: RULES.lives, elapsed: 0,
    bottleX: RULES.mouthX, cap: spawn(random), delay: 0 };
}

export function bottleBounds() {
  return { min: RULES.bottleWidth / 2, max: RULES.width - RULES.bottleWidth / 2 };
}

export function stepGame(game, dt, input, random = Math.random) {
  if (game.phase !== 'playing' || !Number.isFinite(dt) || dt <= 0) return null;
  game.elapsed += dt;
  const bounds = bottleBounds();
  const oldBottleX = game.bottleX;
  const velocityX = clamp(Number.isFinite(input) ? input : 0, -1, 1) * RULES.steeringSpeed;
  game.bottleX = clamp(game.bottleX + velocityX * dt, bounds.min, bounds.max);
  if (!game.cap) {
    game.delay -= dt;
    if (game.delay <= 0) game.cap = spawn(random, game.bottleX);
    return null;
  }
  const cap = game.cap;
  const oldY = cap.y;
  cap.y += fallSpeed(game.elapsed) * dt;
  if (cap.y + RULES.capRadius < RULES.catchY) return null;

  // Check where the cap crossed the mouth, even when one frame spans the line.
  const fraction = clamp((RULES.catchY - RULES.capRadius - oldY) / (cap.y - oldY), 0, 1);
  const crossingX = clamp(oldBottleX + velocityX * dt * fraction, bounds.min, bounds.max);
  const caught = Math.abs(cap.x - crossingX) <= RULES.mouthWidth / 2 + RULES.capRadius * 0.5;
  if (caught) game.score += 1;
  else game.lives = Math.max(0, game.lives - 1);
  game.cap = null;
  game.delay = RULES.respawnDelay;
  if (game.lives === 0) game.phase = 'over';
  return caught ? 'catch' : 'miss';
}
