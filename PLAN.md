# Bottle-cap game plan

Status: the user tested the original game successfully. The revised game moves
and counter-rotates the bottle, hides manual controls, and shares scores through
a single Share action. The playfield now uses the former instruction strip,
central stamps show outcomes, and consecutive misses can incur extra-star fines.
Hosting is GitHub Pages.

## Confirmed concept

A phone-first web arcade game with cheeky satire about bottle caps. Plastic caps
fall straight down; tilting the phone moves the bottle under them at the bottom.
The challenge gets faster until the player loses all 12 European stars. The
result becomes a shareable PNG.

Confirmed during brainstorming:

- Tilt left/right moves the bottle under vertically falling caps.
- The bottle counter-rotates against gravity-relative phone roll with a small
  damped wobble. Falling and attached cap sizes match.
- No on-screen manual controls or dragging fallback. Desktop keyboard input is
  retained; phones require motion permission and usable readings.
- The 12 stars are lives, with a separate caught-cap score: one catch = one point.
- Each miss costs one star. Every second consecutive miss also deducts an extra
  star and shows FINED. A catch resets the streak. Zero stars means game over.
- Fall and bottle steering speed increase together, using the same multiplier.
- Missed caps animate with gravity, spin, floor bounces, and energy loss. Rim
  clips deflect outward. Each cap still affects scoring/lives only once.
- End-of-run PNG sharing is part of the first version.
- Results show Share only, with no PNG save/download button. Shared posts contain
  the playable GitHub Pages URL only, without the repository link.
- The former bottom instruction/footer strip is playable canvas space. Large
  central stamps contain only APPROVED, NON COMPLIANT, or FINED, with no subtitles.
- Keep the display awake during countdown/play with a best-effort screen wake
  lock; release on pause/game over and tolerate unsupported/denied requests.
- Host on GitHub Pages at `https://stell0.github.io/europecatcher/`; add a start
  screen link to star `https://github.com/Stell0/europecatcher`.
- The personality is cheeky satire about bottle caps.
- The interface looks like a deadpan official document, with stamps and approval
  notices.

Everything below is a proposed default unless explicitly described as confirmed.
Names, specific visual details, and tuning remain open within that direction.

## Creative direction

Working title: **Uncap Europe**. Alternatives: **Cap Chaos** or **Keep It Together**.

**Confirmed direction:** a deadpan official-looking interface with stamps and
approval notices. Treat the run like a cap-reunification procedure administered
by a fictional office. The absurdity comes from taking the task very seriously.

Proposed visual treatment: warm off-white paper, navy headings and thin form
rules, European blue and yellow accents, and restrained green/red ink stamps.
Use formal headings with monospaced counters and reference labels. Keep the
playfield uncluttered; caps should look like ridged plastic, and the bottle mouth
must be easy to read against the paper background.

Suggested fictional heading: "Directorate for Cap Reunification".
Suggested opening notice: "Please return all caps to the designated bottle."
Suggested feedback and result copy:

| Event | Notice / stamp |
| --- | --- |
| Catch | APPROVED |
| Miss | NON COMPLIANT |
| Second consecutive miss | FINED |
| Difficulty rises | Processing rate increased. |
| Game over | CASE CLOSED — All stars exhausted. |
| Result score | Caps reunited: 42 |

The three gameplay stamps use the exact text above, without supporting copy.
They briefly overlay the screen center at large size, without intercepting input
or delaying play. Keep Play, Pause, and Share labels clear.

A star ring in the HUD loses stars in a consistent order, leaving faint empty
positions so the loss is clear. Pair it with `Stars remaining: 9/12` and keep the
`Caps reunited` point counter separate. A short snap-on motion can accompany a
catch; decorative stamp motion should respect reduced-motion preferences.

## Gameplay mockup

The first visual proposal is [gameplay-v1.png](mockups/gameplay-v1.png), generated
with the built-in image-generation tool. It shows the official paper treatment,
one falling cap, the fixed bottle, separate score and star counters, touch
controls, and a compact APPROVED stamp. This historical mockup predates the move
to bottle steering and hidden controls. The example run has 24 catches and 8 of
12 stars remaining. This is a static design proposal, not a playable screen or
confirmation that the layout works on a real phone.

The generation and correction prompts are saved in
[gameplay.prompt.txt](mockups/gameplay.prompt.txt).

## First-version game loop

1. **Ready:** show the premise, tilt instructions, Play, and Star on GitHub.
2. **Set up controls:** request motion access if needed, check for readings, and
   calibrate the player's comfortable hold. On phones, explain how to retry if
   readings fail; do not offer dragging or manual steering buttons.
3. **Countdown:** give the player a short, visible moment to get ready.
4. **Play:** spawn a cap above the playfield at a random reachable horizontal
   position. It falls straight down while input moves the bottle beneath it.
5. **Resolve:** crossing the mouth with enough horizontal overlap catches it,
   adds one point, and plays a short snap-on animation. Passing the catch line
   outside the mouth counts as a miss and removes one star. Every second miss
   in an unbroken streak also removes an extra star and shows FINED. Catches
   reset the streak. Animate misses with bounces; resolve scoring only once.
6. **Repeat faster:** continue until all stars are gone; eight unbroken misses
   end a run, while isolated misses still cost one star each.
7. **Results:** freeze the final score; show Play again and Share.

Start with one active cap at a time. Input controls bottle velocity: neutral
hold stops sideways movement, while stronger tilt increases it up to a limit.
Keep the bottle mouth within the side edges. Missed caps bounce visually and
expire without further scoring; do not add collisions between caps.
The mouth hitbox should be a little more forgiving than the artwork suggests.

Increase falling and bottle speed using the same active-time multiplier,
independently of score and frame rate. Begin gently, then speed up smoothly.
The speed curve, maximum speed, mouth width, and steering sensitivity are tuning
decisions. First ensure caps remain reachable at every permitted spawn position.
Overlapping caps and other difficulty systems can wait until this loop is fun.

## Controls and browser behavior

Interpret phone movement as gentle left/right tilt, rather than estimating the
phone's physical position. Prototype `devicemotion` using the gravity-inclusive
accelerometer readings, then smooth and normalize the lateral signal relative
to the calibrated hold. Hardware testing must establish sign and sensitivity.
MDN documents these readings as accelerometer data including gravity effects:
[accelerationIncludingGravity](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent/accelerationIncludingGravity).

Serve phone tests over HTTPS. Feature-detect `DeviceMotionEvent.requestPermission`
and call it directly from Play when present. Permission alone is insufficient:
handle denied access, missing/null data, and readings that never arrive. See
[motion permission requirements](https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent/requestPermission_static).

Hide on-screen manual controls and use no dragging fallback. Retain arrow keys
for desktop play/testing. Include pause and recalibrate
actions. Freeze simulation when hidden or interrupted; pause on rotation and ask
the player to return to portrait. Resume deliberately without advancing time.

## Score PNG

Render a dedicated result card locally, rather than taking a screenshot of the
page. Proposed format: a 1080 × 1080 PNG styled as a "Cap Reunification Report",
with working title, prominent `Caps reunited` score, bottle/cap illustration,
CASE CLOSED stamp, and the actual game URL once one exists. Suggested challenge
copy: "42 caps processed. Your inspection is next." A decorative star motif must
not look like remaining lives after defeat.

Prepare the Blob/File on the results screen before enabling Share. On a button
tap, check `navigator.canShare({ files })` and call `navigator.share` if supported.
The payload includes only the playable Pages URL, not the repository URL. Where images
cannot be shared, share text/links or copy them to the clipboard. Do not expose
save/download controls. Cancellation leaves the results screen usable. No upload or
automatic posting is needed. Browser requirements are documented in
[file-share validation](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/canShare)
and [native sharing](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share).

## Technical baseline and scope

Implemented with plain HTML/CSS/JavaScript modules, Canvas 2D gameplay, and HTML overlays.
Use `requestAnimationFrame`, time-based updates, and collision checks that detect
crossing the catch line even between frames. Cap frame deltas and discard paused
time. Keep only the small separation needed for simulation, input, and PNG export.
No framework, physics library, or backend is used. `npm run build` copies the
static application into `dist/` for hosting without compiling it.

Scale one logical portrait playfield to the available screen without changing
the rules between phone sizes. Account for safe areas and browser bars, keep
buttons outside the catch area, and bound canvas pixel density for performance.
Keep assets local. Document how to serve locally and test a phone over HTTPS.

First version includes the complete loop, 12 lives, progressive speed, motion
calibration, hidden desktop keyboard input, pause/restart, and PNG sharing.
Optional polish after a playable trial: local personal best, short muted-by-default
sound effects, and a bottle that reacts to catches. These are not MVP requirements.

Defer accounts, online leaderboards, multiplayer, collectibles, power-ups, paid
features, app-store packaging, and PWA/offline support.

## Delivery steps

- [x] Capture the concept, controls, lives/score distinction, satirical tone, and
  deadpan official visual direction.
- [x] Create `AGENTS.md` and `PLAN.md`.
- [x] Create a static gameplay mockup in the confirmed bureaucratic style.
- [x] User trial of the original motion-controlled game: reported working.
  Device/browser unspecified; revised bottle motion still needs hardware testing.
- [x] Complete the game loop with scoring, stars, collision, and increasing speed.
  Exit: each cap resolves once and losing the final star ends the run immediately.
- [x] Add responsive art/UI, countdown, pause, recalibration, restart, and feedback.
  Exit: the player understands the controls and can replay without reloading.
- [x] Generate the result PNG and share it with the playable link only.
  Exit: exported score matches the run; results offer Share only.
- [x] Move the bottle, unify cap sizes, and add damped counter-rotation.
- [x] Hide manual buttons and remove dragging and PNG save controls.
- [x] Expand the playfield, enlarge/center the three exact-text outcome stamps,
  add paired-miss fines and bouncing caps, and scale bottle/fall speeds together.
- [x] Add a best-effort screen wake lock for active play and release it on pause/end.
- [x] Publish and verify GitHub Pages deployment.
  Live at `https://stell0.github.io/europecatcher/`; GitHub Actions checks the
  rules and publishes `dist/` on pushes to `main`.
- [ ] Tune on iOS Safari and Android Chrome and document real run/check commands.
  Exit: record tested devices/browsers and remaining limitations honestly.

## Acceptance checks

- A fresh run has zero points and all 12 stars. A catch adds exactly one point;
  a miss removes one star, plus one extra on every second consecutive miss.
  A catch resets the fine streak. Lives cannot go negative.
- The final miss freezes gameplay immediately. No later event changes the result.
  Replay clears old caps, timers, held input, and result/share state.
- No double scoring, missed collisions at high speed, duplicate animation loops,
  or accumulating sensor listeners after restarts.
- Equivalent elapsed play produces equivalent difficulty across frame rates.
  Pausing, app switching, rotating, and returning never cause instant losses.
- Motion works over HTTPS on actual iOS and Android devices; test permission
  granted, denied, unsupported, and unavailable readings. Phones request a retry
  when readings fail; desktop keyboard input remains usable.
- Small phone screens, safe areas, and browser-bar resizing preserve hitboxes and
  visible controls. Inputs do not accidentally scroll the gameplay area.
- Buttons have labels/focus states; remaining lives are available as text; reduced
  motion removes decorative shaking/flashing. Do not announce every frame.
- Large centered stamps use exactly APPROVED, NON COMPLIANT, or FINED, with no
  subtitles; they do not intercept input or delay the game. No lower footer remains.
- The shared PNG contains the exact final score, with only the playable link in the
  share payload. Unsupported image sharing uses text/link sharing or clipboard;
  cancellation preserves results. No PNG save/download or dragging controls exist.

Nineteen deterministic checks cover fines/streak reset, nonnegative lives,
bounce energy loss/cleanup, speed scaling, collision, and wake-lock lifecycle/races.
Browser checks cover the full-height playfield, centered fine/miss stamps,
bouncing caps, pause/restart, and a PNG payload with only the playable URL.
Use real-device play to verify physical steering direction, sensitivity, OS
permission prompts, native sharing, and browser safe areas before release.

## Remaining brainstorm

- Choose a final name and whether the suggested jokes fit the desired tone.
- Refine the fictional office name, stamp designs, and paper/form treatment
  within the confirmed deadpan official style.
- Decide after a phone trial whether one cap at a time creates enough pressure;
  keep multiple simultaneous caps out until steering feels good.
