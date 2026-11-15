import test from 'node:test';
import assert from 'node:assert/strict';
import { ScreenWakeLock } from '../src/wake-lock.js';

function browser(t, wakeLock) {
  for (const [name, value] of Object.entries({ navigator: { wakeLock }, document: { hidden: false } })) {
    const original = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { configurable: true, value });
    t.after(() => original ? Object.defineProperty(globalThis, name, original) : delete globalThis[name]);
  }
}

test('wake lock is acquired once, released on pause, and reacquired on resume', async t => {
  let requests = 0, releases = 0;
  browser(t, { request: async type => {
    assert.equal(type, 'screen');requests += 1;
    const sentinel = new EventTarget();
    sentinel.release = async () => { releases += 1;sentinel.dispatchEvent(new Event('release')); };
    return sentinel;
  } });
  const wake = new ScreenWakeLock();
  await wake.setActive(true);await wake.setActive(true);
  assert.equal(requests, 1);
  await wake.setActive(false);assert.equal(releases, 1);assert.equal(wake.lock, null);
  await wake.setActive(true);assert.equal(requests, 2);
  await wake.setActive(false);assert.equal(releases, 2);
});

test('a wake lock arriving after pause is immediately released', async t => {
  let resolve, releases = 0;
  browser(t, { request: () => new Promise(done => { resolve = done; }) });
  const sentinel = new EventTarget();sentinel.release = async () => { releases += 1; };
  const wake = new ScreenWakeLock();
  const pending = wake.setActive(true);
  await wake.setActive(false);resolve(sentinel);await pending;
  assert.equal(releases, 1);assert.equal(wake.lock, null);
});

test('unsupported and denied wake locks do not interrupt the game', async t => {
  browser(t, undefined);
  const wake = new ScreenWakeLock();
  await assert.doesNotReject(() => wake.setActive(true));
  navigator.wakeLock = { request: async () => { throw new Error('Battery policy'); } };
  await assert.doesNotReject(() => wake.setActive(true));
  assert.equal(wake.pending, false);assert.equal(wake.lock, null);
});

test('hidden documents do not request a wake lock', async t => {
  let requests = 0;
  browser(t, { request: async () => { requests += 1; } });
  document.hidden = true;
  await new ScreenWakeLock().setActive(true);
  assert.equal(requests, 0);
});
