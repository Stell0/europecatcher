import { RULES, clamp, createGame, stepGame, fallSpeed } from './game.js';
import { starRing, drawGame } from './art.js';
import { MotionInput } from './motion.js';
import { createReport } from './report.js';
import { updateBottleWobble } from './bottle.js';
import { REPOSITORY_URL, PROJECT_URL } from './project.js';
import { ScreenWakeLock } from './wake-lock.js';

const $ = selector => document.querySelector(selector);
const canvas = $('#game');
const ctx = canvas.getContext('2d');
const overlay = $('#overlay');
const motion = new MotionInput();
const wakeLock = new ScreenWakeLock();
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const coarseLandscape = window.matchMedia('(orientation: landscape) and (pointer: coarse)');
const keys = new Set();
const bottlePose = { angle: 0, velocity: 0 };
let view = 'ready';
let game = null;
let control = 'manual';
let lastFrame = 0;
let accumulator = 0;
let countdown = 0;
let caughtAt = -Infinity;
let stampUntil = 0;
let result = null;
let run = 0;
let starting = false;
let viewport = { scale: 1, x: 0, y: 0, dpr: 1 };

function announce(text) { $('#announcer').textContent = text; }

function showPanel(html, focus = true) {
  overlay.innerHTML = `<section class="panel" aria-labelledby="panel-title">${html}</section>`;
  const title = overlay.querySelector('h2');
  if (title) {
    title.id ||= 'panel-title';
    overlay.querySelector('section').setAttribute('aria-labelledby', title.id);
  }
  if (focus) overlay.querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
}

function updateStats() {
  $('#score').textContent = String(game?.score ?? 0).padStart(3, '0');
  const lives = game?.lives ?? RULES.lives;
  $('#lives').textContent = `${lives}/12`;
  $('#lives').setAttribute('aria-label', `${lives} of 12 stars remaining`);
  starRing($('#life-stars'), lives);
}

function setControl(mode) {
  control = mode;
  if (mode === 'manual') motion.disable();
}

function clearInput() {
  keys.clear();
}

function inputValue() {
  const manual = Number(keys.has('ArrowRight') || keys.has('KeyD')) - Number(keys.has('ArrowLeft') || keys.has('KeyA'));
  return keys.size ? clamp(manual, -1, 1) : control === 'motion' ? motion.value : 0;
}

const starLink = `<a class="secondary github-star" href="${REPOSITORY_URL}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">☆</span> Star on GitHub</a>`;

function ready() {
  view = 'ready';
  $('#stage-label').textContent = '01 / AWAITING INSTRUCTIONS';
  showPanel(`
    <p class="eyebrow">NOTICE TO THE CAP HANDLER</p>
    <h2>An attachment matter.</h2>
    <p>Loose caps have been reported.<br>Your cooperation is required.</p>
    <div class="instructions"><span><b>01 / STEER</b>Tilt the bottle.</span><span><b>02 / REUNITE</b>Catch the cap.</span><span><b>03 / RETAIN</b>Protect 12 stars.</span></div>
    <button class="primary" data-action="play">Play</button>
    ${starLink}
    <p class="small-note">Two misses in a row cost an extra star.<br>Fictional office. Very real loose caps.</p>`, false);
}

async function start() {
  if (starting || !['ready', 'results'].includes(view)) return;
  if (coarseLandscape.matches) return;
  starting = true;
  const thisRun = ++run;
  clearInput();
  result = null;caughtAt = -Infinity;bottlePose.angle = 0;bottlePose.velocity = 0;
  $('#stamp').hidden = true;
  game = createGame();updateStats();
  $('#rate').textContent = 'RATE 1.00×';
  view = 'setup';
  showPanel('<p class="eyebrow">CONTROL REGISTRATION</p><h2>Hold steady.</h2><p>Keep your phone in a comfortable upright position while we establish the neutral tilt.</p>', false);
  const enabled = await motion.enable();
  if (thisRun !== run) return;
  starting = false;
  if (!enabled && window.matchMedia('(pointer: coarse)').matches) {
    motionRequired();
    return;
  }
  setControl(enabled ? 'motion' : 'manual');
  const note = !enabled ? 'Use the left and right arrow keys to move the bottle.' : '';
  beginCountdown(note);
}

function motionRequired() {
  view = 'ready';motion.disable();
  $('#pause').disabled = true;
  showPanel(`<p class="eyebrow">CONTROL REGISTRATION INCOMPLETE</p><h2>Motion access required.</h2><p>Allow motion access in your browser settings, then try again. Hold your phone upright while it calibrates.</p><button class="primary" data-action="play">Try again</button>${starLink}`);
}

function beginCountdown(note = '') {
  clearInput();
  accumulator = 0;
  if (document.hidden || coarseLandscape.matches) {
    view = 'playing';
    game.phase = 'playing';
    pause('Your run is ready. Resume when you are back in portrait.');
    return;
  }
  view = 'countdown';countdown = 3;
  wakeLock.setActive(true);
  $('#pause').disabled = false;
  $('#stage-label').textContent = '01 / PREPARING PROCESSING';
  showPanel(`<p class="eyebrow">PROCESSING COMMENCES IN</p><h2 id="countdown-number" class="countdown-number">3</h2><p>Keep it together.</p>${note ? `<p class="small-note">${note}</p>` : ''}`, false);
  announce(note || 'Get ready. Processing begins in three seconds.');
}

function pause(reason = 'Processing has been suspended.') {
  if (!['playing', 'countdown'].includes(view)) return;
  view = 'paused';game.phase = 'paused';accumulator = 0;
  wakeLock.setActive(false);
  clearInput();
  $('#pause').disabled = true;
  $('#stage-label').textContent = '01 / PROCESSING SUSPENDED';
  showPanel(`
    <p class="eyebrow">TEMPORARY SUSPENSION</p><h2>On official hold.</h2><p>${reason}</p>
    <button class="primary" data-action="resume">Resume</button>
    ${control === 'motion' ? '<button class="secondary" data-action="calibrate">Recalibrate tilt</button>' : ''}
    <p id="pause-note" class="small-note">Your stars are safe during this interruption.</p>`);
  announce('Game paused. Your stars are safe.');
}

function resume() {
  if (view !== 'paused' || document.hidden || coarseLandscape.matches) return;
  let note = '';
  if (control === 'motion') {
    if (!motion.fresh) {
      $('#pause-note').textContent = 'Waiting for motion readings. Check motion access in your browser, then resume.';
      return;
    }
    else motion.calibrate();
  }
  beginCountdown(note);
}

function stamp(outcome, now) {
  const node = $('#stamp');
  node.classList.toggle('rejected', outcome !== 'catch');
  node.classList.toggle('fined', outcome === 'fined');
  node.querySelector('strong').textContent = outcome === 'catch' ? 'APPROVED' : outcome === 'fined' ? 'FINED' : 'NON COMPLIANT';
  node.hidden = false;stampUntil = now + (outcome === 'fined' ? 1300 : 900);
  if (outcome === 'catch') { caughtAt = now;bottlePose.velocity += 0.25; }
}

async function prepareReport() {
  const thisRun = run;
  try {
    const prepared = await createReport(game.score, PROJECT_URL);
    if (thisRun !== run || view !== 'results') return;
    result = prepared;
    const share = $('[data-action="share"]');share.disabled = false;
    $('#report-note').textContent = 'Report prepared. Share your score and invite the next cap handler.';
  } catch {
    if (thisRun !== run || view !== 'results') return;
    $('#report-note').textContent = 'The report could not be prepared. Please try again.';
    $('[data-action="retry-report"]').hidden = false;
  }
}

function finish() {
  view = 'results';clearInput();accumulator = 0;
  wakeLock.setActive(false);
  motion.disable();
  $('#pause').disabled = true;$('#stamp').hidden = true;
  $('#stage-label').textContent = '01 / PROCESSING CONCLUDED';
  showPanel(`
    <p class="eyebrow">FINAL INSPECTION REPORT</p><h2 id="panel-title" class="case-stamp">CASE CLOSED</h2>
    <span class="result-score">${game.score}</span><p class="eyebrow">CAPS SUCCESSFULLY REUNITED</p>
    <p>${game.missStreak % 2 === 0 ? 'FINED — an extra star was deducted.<br>' : ''}All twelve stars exhausted.<br>The paperwork remains.</p>
    <button class="primary" data-action="play">Play again</button>
    <button class="secondary" data-action="share" disabled>Share</button>
    <p id="report-note" class="report-note" role="status">Preparing your official report…</p>
    <button class="text-button" data-action="retry-report" hidden>Retry PNG export</button>`);
  announce(`Case closed. You reunited ${game.score} caps. All twelve stars are gone.`);
  prepareReport();
}

async function shareReport() {
  if (!result) return;
  const button = $('[data-action="share"]');
  const text = `${game.score} caps processed. Your inspection is next.\nPlay: ${PROJECT_URL}`;
  try {
    if (navigator.share && navigator.canShare?.({ files: [result.file] })) {
      button.disabled = true;
      await navigator.share({ files: [result.file], title: 'Uncap Europe — Cap Reunification Report', text, url: PROJECT_URL });
    } else if (navigator.share) {
      await navigator.share({ title: 'Uncap Europe', text, url: PROJECT_URL });
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      $('#report-note').textContent = 'Score and play link copied. Share the PNG from a phone that supports image sharing.';
    } else {
      $('#report-note').textContent = 'Sharing is unavailable in this browser. Open the game on your phone to share your report.';
    }
  } catch (error) {
    if (error.name !== 'AbortError') $('#report-note').textContent = 'Sharing could not be completed. Please try again.';
  } finally {
    if (view === 'results') button.disabled = false;
  }
}

overlay.addEventListener('click', event => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'play') start();
  if (action === 'resume') resume();
  if (action === 'calibrate') {
    if (!motion.fresh) $('#pause-note').textContent = 'Waiting for motion readings. Check motion access in your browser, then resume.';
    else { motion.calibrate();$('#pause-note').textContent = 'Neutral position registered. Hold here and resume.'; }
  }
  if (action === 'share') shareReport();
  if (action === 'retry-report') { event.target.hidden = true;prepareReport(); }
});

$('#pause').addEventListener('click', () => pause());
const movementKeys = new Set(['ArrowLeft', 'ArrowRight', 'KeyA', 'KeyD']);
window.addEventListener('keydown', event => {
  if (event.code === 'Escape' || event.code === 'KeyP') {
    if (view === 'playing' || view === 'countdown') { event.preventDefault();pause(); }
    else if (view === 'paused' && !event.repeat) { event.preventDefault();resume(); }
  }
  if (movementKeys.has(event.code) && view === 'playing') {
    event.preventDefault();keys.add(event.code);
  }
});
window.addEventListener('keyup', event => keys.delete(event.code));

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { clearInput();pause('Your application was placed in the background.'); }
});
window.addEventListener('blur', () => { clearInput();pause('Focus has moved to another matter.'); });
window.addEventListener('pagehide', () => { clearInput();wakeLock.setActive(false);pause('Your processing session was interrupted.'); });
function rotated() { clearInput();pause('Orientation changed. Return to portrait and resume to recalibrate.'); }
window.addEventListener('orientationchange', rotated);
screen.orientation?.addEventListener('change', rotated);
coarseLandscape.addEventListener('change', () => { if (coarseLandscape.matches) rotated(); });

new ResizeObserver(entries => {
  const { width, height } = entries[0].contentRect;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr);canvas.height = Math.round(height * dpr);
  const scale = Math.min(width / RULES.width, height / RULES.height);
  viewport = { dpr, scale, x: (width - RULES.width * scale) / 2, y: height - RULES.height * scale };
}).observe($('.stage'));

function frame(now) {
  const dt = Math.min(Math.max((now - (lastFrame || now)) / 1000, 0), 0.08);
  lastFrame = now;
  if (view === 'countdown') {
    countdown -= dt;
    const countNode = $('#countdown-number');
    if (countNode) countNode.textContent = Math.max(1, Math.ceil(countdown));
    if (countdown <= 0) {
      view = 'playing';game.phase = 'playing';accumulator = 0;overlay.replaceChildren();
      wakeLock.setActive(true);
      $('#stage-label').textContent = '01 / ACTIVE PROCESSING';
      announce('Processing active. Move the bottle to catch the caps.');
    }
  } else if (view === 'playing') {
    if (control === 'motion' && !motion.fresh) pause('Motion readings stopped. Check motion access and resume when readings return.');
    else {
      if (reducedMotion.matches) { bottlePose.angle = control === 'motion' ? -motion.roll : 0;bottlePose.velocity = 0; }
      else updateBottleWobble(bottlePose, control === 'motion' ? motion.roll : 0, dt);
      accumulator += dt;
      while (accumulator >= RULES.step && view === 'playing') {
        const outcome = stepGame(game, RULES.step, inputValue());
        accumulator -= RULES.step;
        if (outcome) {
          updateStats();stamp(outcome, now);
          if (outcome !== 'catch' && game.lives > 0) announce(`${outcome === 'fined' ? 'Fined for two consecutive misses. Extra star deducted.' : 'Cap missed.'} ${game.lives} stars remaining.`);
          if (game.phase === 'over') finish();
        }
      }
      $('#rate').textContent = `RATE ${(fallSpeed(game.elapsed) / RULES.initialFallSpeed).toFixed(2)}×`;
    }
  }
  if (now > stampUntil) $('#stamp').hidden = true;
  ctx.setTransform(1, 0, 0, 1, 0, 0);ctx.clearRect(0, 0, canvas.width, canvas.height);
  const { dpr, scale, x, y } = viewport;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, x * dpr, y * dpr);
  drawGame(ctx, game, caughtAt, now, reducedMotion.matches, bottlePose.angle);
  requestAnimationFrame(frame);
}

starRing($('#office-stars'), 12, true);
updateStats();ready();requestAnimationFrame(frame);
