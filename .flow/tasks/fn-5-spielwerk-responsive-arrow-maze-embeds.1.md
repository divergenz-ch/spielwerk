---
satisfies: [R2, R3, R4, R5]
---
# fn-5-spielwerk-responsive-arrow-maze-embeds.1 Deliver independent host sizing and Rust-backed visual playback

## Description
Prove the runtime can resize and evaluate actual delivered generator computations without loading the editor.

**Size:** M
**Files:** `src/embeds/runtime.ts`, `src/embeds/playback.ts`, `src/embeds/resize.ts`, `tests/embeds/runtime.test.ts`
**Touches:** [src/embeds/runtime.ts, src/embeds/playback.ts, src/embeds/resize.ts, tests/embeds/runtime.test.ts, package.json, crates/spielwerk-engine/src/tools/arrow_maze.rs, src/engine/client.ts, src/tools/arrow-maze.ts, tests/generators/arrow-maze.test.ts]

### Approach

- Consume the actual fn-2 generator handoff and foundation scene/time/font contract; browser observers/scheduling stay outside Rust calculation.
- Implement host-box sizing and applicable playback/seek lifecycle with offscreen/reduced-motion behavior. Keep Arrow Maze fit/cell semantics tool-specific.
- Expose visual-only consumers for all eight generators; do not transfer pointer, widget, drag or text editing adapters or import the Svelte workspace.

### Investigation targets

**Required** (existing source evidence, read before coding):
- `tools/arrow-maze.embed.js:1220-1360`
- `tools/arrow-maze.embed.js:1356-1357`
- `tools/arrow-maze.html:572-617`

### Key context

Listed application paths are proposed new paths. Consume the checked fn-1
foundation contract and prerequisite commits, rather than recreating shared
storage, control, or export machinery. Library decisions require implementation
probes and current documentation. Preserve the original successful-input
boundaries and all user-owned prototype edits.

### Milestone gate

This entry task stays blocked until fn-1 foundation tasks .2-.6 and fn-2
generator handoff tasks .1-.6 have verified done receipts, supported layout/
time/font/artwork capabilities, and their commits present in the checkout.
fn-2 final task .7 is deliberately not an entry prerequisite. Preserve block
history and check evidence before an authorized manual release.

## Acceptance
- [ ] Independent-host runtime tests call real generator Rust/Wasm adapters at multiple box sizes and identical explicit seek times; responsive composition genuinely relayouts.
- [ ] Maze fit/cell/default-height and playback/host control scenarios pass, including offscreen and reduced-motion transitions; tools without motion remain still.
- [ ] All-eight-tool runtime fixtures render full fidelity with no editor UI or visitor-editing capability.

## Preserved block history
Blocked:
# Actual foundation and generator handoff prerequisites

This embed entry task is blocked until foundation tasks
fn-1-spielwerk-shared-design-workspace.2 through .6 and actual generator
handoff tasks fn-2-spielwerk-parametric-graphic-generators.1 through .6 have
verified done receipts. The handoff must include all eight tools' applicable
Rust layout, explicit-time, font and supported-artwork capabilities.

Verify done statuses, prerequisite commit ranges present in this checkout,
actual focused tests, applicable review outcomes, and limitations before an
authorized release. Preserve block history before reset.
Do not require fn-2 final task .7: it waits for these actual embed packages.
Do not mark fn-2 or fn-1 complete at their prerequisite handoffs.

No implementation evidence or release authorization exists at planning time.
## Release verification

The user delegated the release decision on October 14, 2026. The conductor
verified foundation tasks .2-.6 and generator tasks .1-.6 report done,
record tests, and have every evidence commit reachable from HEAD.
Both specs validate without warnings. Fresh measured generator gates pass:
`npm run test:generators` (34 browser cases), native `tools` tests (23).
`npm run test:workspace` passed 16 cases and found 3 obsolete bootstrap
expectations that Poster was unavailable. Commit c65a7a0 replaces that
placeholder assertion with actual Poster geometry and pins the three tool
mounts' discovery requests; focused bootstrap rerun passed all 3 host modes.
Logs: .flow/tmp/fn5-prerequisite-{browser,rust,workspace}.log and
.flow/tmp/fn5-prerequisite-bootstrap-fixed.log. No full-suite pass claimed.
All eight actual Rust-backed adapters deliver layout, explicit time,
supported fonts, and artwork. Known boundaries remain static TTF/OTF,
no complex-script shaping or WOFF decoding, and no pixel-identical
prototype claim. Existing quality audits and addressed fixes are recorded
in task receipts; implementation review backend is configured none.
This releases entry only, not fn-2 R12 or final catalog acceptance.
No publication or deployment is authorized. The original blocker remains
above. fn-2 final task .7 waits for actual fn-5 package delivery.

## Done summary
Independent website hosts can render and resize all eight delivered generators through `EmbedRuntime`, with host play, pause, restart, and explicit seek. Rust evaluates layout, fonts, and time; browser observers and the runtime clock manage offscreen, reduced-motion, once, in-view, loop, and static playback.

Tier: session (jev-unavailable(no_key)) (model: openai-codex/gpt-6.1-sol)
stage: impl-review - skipped(config: review.backend=none)
stage: wave-join - ran (cherry-picked 0574739 as 8fbc2b3; formatting fix bf801ff)
stage: plan-sync - skipped(config: planSync.enabled=false)
Gates: focused (full suite not requested)

Integrated target checks passed: npm run test:embeds (10), native tools tests (24), and tests/generators/arrow-maze.test.ts (4). Logs: .flow/tmp/fn5-task1-integrated-{embeds,rust,maze}.log. System cargo fmt fixed the host-cell formatting and its check passed. No independent audit or SHIP receipt is claimed; spec-wide quality follows packaging and host verification.

Measured verification:
- Baseline native tools gate passed 23 tests before edits. The planned `test:embeds` command and directory did not exist at entry; no pre-existing embed suite was available. This task adds that declared command.
- `npm run test:embeds` passed 10 Chromium cases. Eight real-adapter fixtures compare identical explicit seek frames, resize from 400x300 to 800x300, exercise offscreen/reduced-motion/once lifecycle, and test visitor input isolation. Four applicable text tools receive actual primary/accent font bytes. Truchet remains still. Runtime requests include Wasm and exclude workspace/Svelte modules.
- Maze-specific cases cover regenerate/contain/cover/fixed mapping, explicit cell override, absent host height, config replacement, in-view restart, reduced-motion restoration/override, offscreen override, and host controls.
- `cargo +1.98.0 test --manifest-path crates/spielwerk-engine/Cargo.toml tools` passed 24 native tests.
- `npx playwright test tests/generators/arrow-maze.test.ts` passed all 4 cases, including existing editor dragging, playback, downloaded artwork, and Wasm failure checks.
- `git diff --check` passed. Gate classification is FULL. No repository lint/format gate is configured. An optional `rustfmt +1.98.0` attempt failed because that component is not installed; it changed no files.
- Screenshots for all eight independent hosts were captured and inspected. All eight fixture consoles had no errors. Playwright closes browsers and the Vite fixture closes its server.

Logs and screenshots are in `/Users/baran/Repositories/spielwerk-fn5-task1/.flow/tmp/`: `baseline-rust.log`, `verify-embeds-final2.log`, `verify-rust-final.log`, `verify-maze-final.log`, and `embed-<tool-id>.png`. Initial local test failures exposed fixture middleware ordering and inactive Switchboard source widgets; both were corrected before the recorded green runs.

The supervisor authorized additional touches in the Maze Rust engine, client, adapter, and generator test because the prerequisite handoff lacked host-cell sizing. Optional `hostCell` is Rust-owned; omission preserves existing editor density calculations. Zero chooses saved `ecell` or the original artboard's cell. Like the prototype, a requested cell chooses rounded grid counts, and the actual cell fits the remaining box. Runtime uses foundation artboard dimensions as the original basis. Native tests also cover saved zero-cell fallback and negative-cell rejection. No prototype `tools/` files were changed.

Downstream package integration can import `EmbedRuntime` and `adapters` from `src/embeds/runtime.ts`. Runtime takes a foundation `DesignState` with asset bytes and optional `{fit, cell, playback, pauseOffscreen, reducedMotion}`. Fit/cell apply only to Maze. Methods are `play`, `pause`, `restart`, `seek`, `redraw`, `setConfig`, and `destroy`; `frame` and `spielwerk:frame` expose evaluated output. Shadow-root artwork isolates SVG identifiers and host CSS. No visitor-editing handlers or editor UI cross this boundary. Configuration fetching and package/snippet assets remain task .2's responsibility.

Existing adapter bounds remain 100-8000 output dimensions, static TTF/OTF fonts, and no complex-script shaping or WOFF decoding. No pixel-identical prototype or full-suite claim is made. The only remaining untracked entry is the inherited `node_modules` workspace dependency link; no files are staged. This adds an unmapped independent-host API surface and leaves existing workspace routes unchanged.
## Evidence
- Commits: 8fbc2b33ea929d3dfdea6b703b6c190a8adfcf1a, bf801ff1554d31cc2c42e29f1ad25de77d26752d
- Tests: npm run test:embeds (10 passed; .flow/tmp/fn5-task1-integrated-embeds.log), cargo test --manifest-path crates/spielwerk-engine/Cargo.toml tools (24 passed; .flow/tmp/fn5-task1-integrated-rust.log), npx playwright test tests/generators/arrow-maze.test.ts (4 passed; .flow/tmp/fn5-task1-integrated-maze.log), cargo fmt --manifest-path crates/spielwerk-engine/Cargo.toml -- --check (passed)
- PRs: