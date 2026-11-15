# Project instructions

## Purpose and scope

This repository is for a small phone-first web arcade game with cheeky satire
about bottle caps. Read `PLAN.md` before making changes; it records confirmed
decisions, proposed defaults, milestones, and acceptance criteria.

The game is implemented in plain browser JavaScript. Keep subsequent work within
the user's current scope, and update the plan when decisions change.

## Confirmed game rules

- Plastic bottle caps fall from the top of the screen.
- Caps fall straight down. Tilt left/right to move the bottle under them.
- Counter-rotate the bottle against phone roll so it stays vertical to the
  ground, with a small damped wobble. Falling and attached caps share one size.
- The 12 European flag stars represent lives. Each miss costs one star; every
  second consecutive miss is FINED and costs an additional star. A catch resets
  the streak. Losing the final star ends the run; lives never go below zero.
- Each caught cap adds one point to a separate score.
- Fall and bottle steering speeds increase together with the same multiplier.
- Missed caps keep moving with gravity, spin, and damped bounces. Rim clips
  deflect outward. These visual caps cannot score or deduct lives again.
- After game over, show a single Share action for the score PNG and playable
  link only. Do not include the repository URL or PNG save/download controls.
- Host at `https://stell0.github.io/europecatcher/` using GitHub Pages. The start
  screen links to `https://github.com/Stell0/europecatcher` to star the repository.
- The tone is cheeky bottle-cap satire.
- The visual direction is a deadpan official-looking interface with stamps and
  approval notices.

## Implementation approach

- Prefer the smallest complete solution. The stack is static HTML, CSS, and
  JavaScript modules, Canvas 2D for gameplay, and HTML for controls.
- Reuse existing code and browser APIs. Add dependencies only for a concrete
  need; keep the first version free of a backend, accounts, and leaderboards.
- Keep simulation updates independent of rendering and sensor events so core
  rules can be checked without a phone. Avoid general-purpose game engines or
  abstractions for hypothetical future features.
- Centralize tuning values for steering, falling speed, spawning, and hitboxes.
  Use elapsed time, not frame counts, for movement and difficulty.
- Keep artwork local or draw it with Canvas/SVG so PNG export stays reliable.

## Phone controls and lifecycle

- Request motion permission from an explicit user action where required. Use
  feature detection and verify that usable readings actually arrive.
- Calibrate a comfortable neutral hold. Smooth jitter, provide a dead zone, and
  clamp input. Confirm axis direction on real devices.
- Phones use tilt only: no on-screen manual controls and no dragging fallback.
  If permission/readings are unavailable, explain how to retry. Retain hidden
  desktop keyboard input for play and testing.
- Pause when the page is hidden, on orientation changes, and when active motion
  input is lost. Resume explicitly, recalibrating when needed. Never charge lives
  for time spent paused or in the background.
- Support portrait play, phone safe areas, and changing browser viewport height.
- Request a screen wake lock during countdown/play where supported. Release it
  on pause, backgrounding, or game over. Unsupported/denied locks must not block
  play or produce repeated requests on every frame.

## Interface and sharing

- Use the confirmed bureaucratic style: paper-like panels, formal headings,
  document rules, and dry administrative copy. Large stamps briefly overlay the
  center of the screen without intercepting input or delaying the next cap.
  Their entire visible text is APPROVED, NON COMPLIANT, or FINED. No subtitles.
- The playfield extends into the former lower instruction/footer area. Keep
  instructions on the ready screen and do not restore a lower instruction strip.
- Keep action labels understandable (Play, Pause, Share). Put jokes
  in headings and feedback; use fictional office names for the satire.
- Keep the bottle mouth, caps, score, and remaining stars easy to distinguish.
  Include a numeric lives label; do not communicate losses through color alone.
- Use accessible HTML buttons with visible focus and generous touch targets.
  Respect reduced motion for decoration without changing essential gameplay.
- Generate the PNG locally from the final score. Prepare the file before the
  share-button tap and feature-detect file sharing. If images cannot be shared,
  share the score/link as text or copy it when possible. Treat cancellation as
  a normal outcome. Include only the playable Pages URL in shared text and links.
- Do not collect or send sensor readings. Any proposed local best score must
  tolerate unavailable storage.

## Verification and reporting

- For game logic changes, check single resolution, fine streak reset, eight
  consecutive misses ending a run (or 12 isolated misses), restart clearing all
  state, and fast caps not skipping collision.
- Check bounce energy loss/cleanup and that bottle speed scales with fall speed.
- Check pause/resume, frame-rate independence, and fallback input when affected.
- Test motion and PNG sharing on real iOS Safari and Android Chrome before
  claiming mobile compatibility. Desktop emulation cannot verify sensor feel.
- Use focused tests for rules and manual checks for feel and layout. Do not add
  tests that merely mirror markup or implementation details.
- Use `npm start` for the local server, `npm test` for deterministic rule checks,
  and `npm run build` to copy deployable files to `dist/`. No dependency install
  is needed. See `README.md` for mobile testing and verification limits.
- Report what changed, what was verified, and any remaining limitations. Keep
  `PLAN.md` checkboxes accurate.
