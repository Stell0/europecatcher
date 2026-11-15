# Uncap Europe

A deeply official bottle-cap arcade game. Tilt your phone to move the bottle
under falling caps. Each catch earns a point. Each miss removes one of twelve
European stars. Processing gets faster until the final star is gone.

[Play the game](https://stell0.github.io/europecatcher/) ·
[Star the repository](https://github.com/Stell0/europecatcher)

The interface follows the approved mockup's bureaucratic direction: paper forms,
navy ink, star counters, and rubber-stamp approval notices. The Directorate for
Cap Reunification is fictional.

## Run locally

Requires Node.js 20+ for tests/build and Python 3 for the development server.
There are no npm dependencies to install.

```sh
npm start
```

Open <http://localhost:4173>. Desktop players use arrow keys or A/D; P or Escape
pauses/resumes. On a phone, Play requests motion access and registers a comfortable
neutral hold. Phones use tilt only, with no steering buttons or dragging fallback.
If access fails, enable motion in the browser and retry. Resume recalibrates to
the current hold; the pause panel also offers explicit recalibration.

Motion access requires a secure context. A laptop's plain-HTTP LAN address is
useful for testing layout, but use an HTTPS deployment or a
trusted local HTTPS server to test motion on a phone. localhost on the laptop
is not localhost on the phone.

## Check and package

```sh
npm test
npm run build
```

The build copies only the game into `dist/`. Host that directory with a static
HTTPS server; no backend, environment variables, or API keys are needed.
`.github/workflows/pages.yml` tests, builds, and deploys `dist/` to GitHub Pages
on pushes to `main`. Pages uses GitHub Actions as its publishing source. Relative
assets support the `/europecatcher/` project path. Canonical links are in
`src/project.js`; the start screen links to the repository so players can star it.
The ignored `.openai/` and `.site-source/` directories belong to the earlier
private preview and are not used for GitHub Pages.

## Controls and rules

- Caps fall straight down. All input moves the bottle under them.
- The bottle counter-rotates against phone roll to stay upright relative to the
  ground, with a small damped wobble. Rotation pivots at the neck, preserving the
  catch point. Reduced motion retains counter-rotation without the wobble.
- Falling and attached caps use the same radius.
- One scoreable cap is active at a time. Returning to neutral stops horizontal movement.
- The cap is judged when it crosses the bottle-mouth line. A generous overlap
  catches it; crossing elsewhere loses one star, exactly once. Every second
  consecutive miss costs an extra star (FINED); a catch resets the streak.
- Missed caps spin and bounce with gravity and energy loss. Rim clips ricochet
  outward. These visual caps cannot cause another score or penalty.
- Fall and bottle speeds increase together, keeping their ratio constant.
- Screen wake lock keeps the display awake during countdown/play when supported.
  Pause/game over releases it; browser or battery-policy denial does not block play.
- The lower instruction strip is gone; the canvas uses that space. Large central
  stamps contain only APPROVED, NON COMPLIANT, or FINED and never block input.
- Pause, backgrounding, rotation, and missing motion readings freeze the run.
  Resume uses a fresh countdown; phone motion readings must return before play
  resumes. Portrait is required on phones.
- Results offer a single Share action, with a locally rendered 1080 × 1080 PNG
  and the playable link only. Where images cannot be shared, share
  text/links or copy them to the clipboard. There is no PNG save/download action.
  Sharing cancellation preserves the result.
- Sensor readings are used only for controls and never sent to a server. The
  game makes no third-party asset requests and does not store personal data.

## Files

- `src/game.js`: rules, bottle movement, reachable spawns, simulation, collision.
- `src/bottle.js`: damped counter-rotation.
- `src/main.js`: UI state, inputs, lifecycle, fixed-step animation loop.
- `src/motion.js`: permission, calibration, gravity-relative roll, stale readings.
- `src/art.js`: reusable Canvas artwork and exact twelve-star SVG counters.
- `src/report.js`: score PNG generation, using the same game artwork.
- `src/wake-lock.js`: best-effort display wake lock and lifecycle cleanup.
- `tests/game.test.js`: scoring, fines/streak reset, crossing collision, pause,
  bounce/cleanup, speed scaling, reachable spawns, and frame-rate independence.
- `PLAN.md`: design decisions, delivery progress, and acceptance criteria.

## Verification limits

Nineteen Node tests cover scoring, fines/streak reset, moving-bottle collision,
pause, bounces/cleanup, speed scaling, spawns, frame-rate independence, wobble,
and wake-lock acquisition/release, unsupported APIs, and pending-request races.
Browser checks cover the full-height playfield, central penalty stamps, bounce
animation, pause/restart, and a PNG share payload containing only the playable link.

The user reported the original motion-controlled version works on a phone
(device/browser unspecified). The revised movement and wobble still need real
hardware confirmation; desktop simulation cannot verify tilt feel or OS sharing.
