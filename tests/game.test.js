import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES, createGame, stepGame, fallSpeed, bottleSpeed, bottleBounds, floorY } from '../src/game.js';
import { updateBottleWobble } from '../src/bottle.js';

const fixedRandom = () => 0;

test('a fresh run resets score, twelve lives, timers and cap', () => {
  const game = createGame(fixedRandom);
  assert.equal(game.score, 0);assert.equal(game.lives, 12);assert.equal(game.elapsed, 0);
  assert.equal(game.phase, 'playing');assert.ok(game.cap);assert.equal(game.delay, 0);
  assert.equal(game.bottleX, RULES.mouthX);
  assert.equal(game.missStreak, 0);assert.deepEqual(game.missedCaps, []);
});

test('a catch gives one point and cannot resolve twice', () => {
  const game = createGame(fixedRandom);
  game.cap = { x: RULES.mouthX, y: RULES.catchY - RULES.capRadius - 1 };
  assert.equal(stepGame(game, 0.02, 0, fixedRandom), 'catch');
  assert.equal(game.score, 1);assert.equal(game.lives, 12);assert.equal(game.cap, null);
  assert.equal(stepGame(game, 0.01, 0, fixedRandom), null);
  assert.equal(game.score, 1);
});

test('twelve isolated misses end the run and freeze the result', () => {
  const game = createGame(fixedRandom);
  for (let i = 1; i <= 12; i++) {
    if (i > 1) {
      game.cap = { x: game.bottleX, y: RULES.catchY };
      assert.equal(stepGame(game, RULES.step, 0, fixedRandom), 'catch');
    }
    game.cap = { x: 30, y: RULES.catchY };
    assert.equal(stepGame(game, RULES.step, 0, fixedRandom), 'miss');
    assert.equal(game.lives, 12 - i);
    assert.equal(game.phase, i === 12 ? 'over' : 'playing');
  }
  const snapshot = structuredClone(game);
  assert.equal(stepGame(game, 10, 1), null);assert.deepEqual(game, snapshot);
});

test('each pair of consecutive misses costs three stars in total', () => {
  const game = createGame(fixedRandom);
  for (let i = 1; i <= 8; i++) {
    game.cap = { x: 30, y: RULES.catchY };
    assert.equal(stepGame(game, RULES.step, 0, fixedRandom), i % 2 ? 'miss' : 'fined');
    assert.equal(game.lives, 12 - i - Math.floor(i / 2));
    assert.equal(game.missStreak, i);
  }
  assert.equal(game.phase, 'over');
});

test('a catch resets the fine streak and a fine never makes lives negative', () => {
  const game = createGame(fixedRandom);
  game.cap = { x: 30, y: RULES.catchY };
  stepGame(game, RULES.step, 0, fixedRandom);
  game.cap = { x: game.bottleX, y: RULES.catchY };
  stepGame(game, RULES.step, 0, fixedRandom);
  assert.equal(game.missStreak, 0);
  game.cap = { x: 30, y: RULES.catchY };
  assert.equal(stepGame(game, RULES.step, 0, fixedRandom), 'miss');
  assert.equal(game.lives, 10);
  game.lives = 1;
  game.cap = { x: 30, y: RULES.catchY };
  assert.equal(stepGame(game, RULES.step, 0, fixedRandom), 'fined');
  assert.equal(game.lives, 0);assert.equal(game.phase, 'over');
});

test('a fast cap is judged against the bottle position at the crossing', () => {
  const game = createGame(fixedRandom);
  game.cap = { x: RULES.mouthX, y: RULES.catchY - RULES.capRadius - 0.1 };
  assert.equal(stepGame(game, 0.6, 1, fixedRandom), 'catch');
  assert.equal(game.score, 1);
  game.cap = { x: 40, y: RULES.catchY - RULES.capRadius - 0.1 };
  assert.equal(stepGame(game, 0.6, 1, fixedRandom), 'miss');
});

test('pause freezes elapsed time, cap, score, and lives', () => {
  const game = createGame(fixedRandom);
  game.cap = { x: 30, y: RULES.catchY };
  stepGame(game, RULES.step, 0, fixedRandom);
  game.phase = 'paused';
  const snapshot = structuredClone(game);
  stepGame(game, 30, 1);assert.deepEqual(game, snapshot);
});

test('input is bounded and missing input stays neutral', () => {
  const a = createGame(fixedRandom), b = createGame(fixedRandom);
  const capX = a.cap.x;
  stepGame(a, 0.1, 100);stepGame(b, 0.1, 1);assert.equal(a.bottleX, b.bottleX);
  assert.equal(a.cap.x, capX);
  const x = a.bottleX;stepGame(a, 0.1, NaN);assert.equal(a.bottleX, x);
  for (let i = 0; i < 100; i++) stepGame(b, 0.01, -1);
  assert.equal(b.bottleX, bottleBounds().min);
});

test('speed increases smoothly with active time and has a playable limit', () => {
  assert.equal(fallSpeed(0), RULES.initialFallSpeed);
  assert.ok(fallSpeed(60) > fallSpeed(30));
  assert.ok(fallSpeed(600) <= RULES.maxFallSpeed);
  const maxTravel = 144;
  const fallTime = RULES.catchY / RULES.maxFallSpeed;
  assert.ok(maxTravel / RULES.steeringSpeed < fallTime);
  for (const time of [0, 30, 120, 600]) {
    assert.ok(Math.abs(bottleSpeed(time) / fallSpeed(time) - RULES.steeringSpeed / RULES.initialFallSpeed) < 1e-12);
  }
  assert.ok(bottleSpeed(60) > bottleSpeed(30));
});

test('missed caps fall, bounce with energy loss, and expire without scoring again', () => {
  const game = createGame(fixedRandom);
  game.cap = { x: 30, y: RULES.catchY };
  assert.equal(stepGame(game, RULES.step, 0, fixedRandom), 'miss');
  const cap = game.missedCaps[0];
  assert.ok(cap.vy > 0);
  const originalY = cap.y;
  stepGame(game, RULES.step, 0, fixedRandom);
  assert.ok(cap.y > originalY);
  for (let i = 0; i < 120 && cap.bounces === 0; i++) stepGame(game, RULES.step, 0, fixedRandom);
  assert.equal(cap.bounces, 1);assert.ok(cap.vy < 0);
  assert.ok(cap.y <= floorY - RULES.capRadius * 0.8);
  const firstRebound = Math.abs(cap.vy);
  for (let i = 0; i < 120 && cap.bounces === 1; i++) stepGame(game, RULES.step, 0, fixedRandom);
  assert.ok(cap.bounces >= 2);assert.ok(Math.abs(cap.vy) < firstRebound);
  assert.equal(game.lives, 11);assert.equal(game.score, 0);
  for (let i = 0; i < 160; i++) stepGame(game, RULES.step, 0, fixedRandom);
  assert.ok(!game.missedCaps.includes(cap));
});

test('a cap clipping the rim deflects outward and upward', () => {
  const game = createGame(fixedRandom);
  game.cap = { x: game.bottleX + 40, y: RULES.catchY };
  assert.equal(stepGame(game, RULES.step, 0, fixedRandom), 'miss');
  assert.ok(game.missedCaps[0].vx > 0);assert.ok(game.missedCaps[0].vy < 0);
});

test('the bottle keeps moving between caps, and new caps stay reachable', () => {
  const game = createGame(fixedRandom);
  game.cap = null;game.delay = 0.3;
  stepGame(game, 0.1, -1, fixedRandom);
  assert.ok(game.bottleX < RULES.mouthX);assert.equal(game.cap, null);
  stepGame(game, 0.3, -1, fixedRandom);
  assert.ok(Math.abs(game.cap.x - game.bottleX) <= 144);
});

test('counter-rotation settles upright with a small damped wobble', () => {
  const pose = { angle: 0, velocity: 0 };
  let furthest = 0;
  const roll = Math.PI / 6;
  for (let i = 0; i < 360; i++) {
    updateBottleWobble(pose, roll, 1 / 120);
    furthest = Math.min(furthest, pose.angle);
  }
  assert.ok(furthest < -roll, 'the spring has a small overshoot');
  assert.ok(furthest > -roll - 0.1, 'the wobble stays restrained');
  assert.ok(Math.abs(pose.angle + roll) < 0.001, 'bottle cancels the phone roll');
  assert.ok(Math.abs(pose.velocity) < 0.001, 'wobble settles');
});

test('fixed-step simulation gives the same results at 30 and 120 display fps', () => {
  function simulate(fps) {
    const game = createGame(fixedRandom);
    let accumulator = 0;
    for (let frame = 0; frame < fps * 20; frame++) {
      accumulator += 1 / fps;
      while (accumulator + 1e-12 >= RULES.step) {
        stepGame(game, RULES.step, Math.sin(game.elapsed * 2), fixedRandom);
        accumulator -= RULES.step;
      }
    }
    return game;
  }
  assert.deepEqual(simulate(30), simulate(120));
});

test('every spawn is inside the playfield and requires steering', () => {
  for (const values of [[0, 0], [0, 0.9999], [0.9999, 0], [0.9999, 0.9999]]) {
    const queue = [...values];const game = createGame(() => queue.shift());
    assert.ok(game.cap.x >= RULES.capRadius && game.cap.x <= RULES.width - RULES.capRadius);
    assert.ok(Math.abs(game.cap.x - RULES.mouthX) > RULES.mouthWidth / 2 + RULES.capRadius / 2);
  }
});
