---
satisfies: [R8, R9, R10, R11]
---
# fn-2-spielwerk-parametric-graphic-generators.6 Deliver Stripe Marquee Rust stripe/text geometry and timing

## Description
Implement font-derived stripe geometry, column/shear and direction/scroll calculations through Rust, preserving the existing text-as-stripe product contract and uploaded-font bytes.

**Size:** M
**Files:** `crates/spielwerk-engine/src/tools/mod.rs`, `crates/spielwerk-engine/src/tools/stripe_marquee.rs`, `src/tools/stripe-marquee.ts`, `tests/generators/stripe-marquee.test.ts`
**Touches:** [crates/spielwerk-engine/src/tools/mod.rs, crates/spielwerk-engine/src/tools/stripe_marquee.rs, src/tools/stripe-marquee.ts, tests/generators/stripe-marquee.test.ts, crates/spielwerk-engine/src/lib.rs, crates/spielwerk-engine/Cargo.toml, crates/spielwerk-engine/Cargo.lock, src/engine/client.ts, src/main.ts]

### Approach

- Read the checked fn-1 foundation interfaces and use its dimensions/assets/seed/time and scene/output contracts. Register actual Rust tool computations and the Svelte adapter; prototype JS is not the new engine.
- Adapt the calculation entry points at the required source locations. Bind supported controls/interactions and existing artwork formats, preserving dimension limits and selected responsive preview exports.
- Add focused Rust and browser-adapter fixtures for the tool-specific requirements and boundary cases. Update the shared module registration deliberately; its overlap makes these tasks serial when needed.

### Investigation targets

**Required** (existing source evidence, read before coding):
- `tools/stripe-marquee.html:235`
- `tools/stripe-marquee.html:312`
- `tools/fontpick.js:14-53`

### Key context

Listed application paths are proposed new paths. Foundation/sibling implementation
commits must exist in the checkout before consumption. Keep user-owned Arrow Maze
prototype edits intact. Source evidence confirms product intent, not a passing
Rust port or browser gate. Libraries/build details are selected and verified
inside the owning implementation task.

### Milestone gate

The first checked generator proves the concrete adapter; same-spec deps
apply. Shared Rust module registration and any lockfile/generated outputs
prevent concurrent overlapping writers even within a potential wave.

The root Rust registration/manifest/lockfile write surface is shared.
Dispatch these writes serially rather than treating disjoint tool modules
as sufficient evidence for concurrent writers.

## Acceptance
- [ ] Use real font/text fixtures to check that stripe geometry carries the lettering and changes with column/shear/direction controls. Verify reproducible times, relayout and baked/embedded appearance, plus supported SVG/PNG/GIF scene requests.
- [ ] Actual Rust/Wasm calculations, registered browser adapter, and ordinary supported artwork outputs pass their focused generator gate. Record exact commands/results and commit range.
- [ ] The handoff identifies delivered responsive/time/font capabilities and remaining website-runtime work. It does not mark fn-2 R12 delivered before fn-5.

## Done summary
Stripe Marquee is registered at `/#stripe-marquee` with Rust/Wasm font-outline scan conversion, seeded column subdivision, sheared stripe polygons, directional scrolling, and fixed/responsive relayout. Uploaded static TTF/OTF bytes drive the stripe thickness directly; SVG/PNG bake the selected instant and GIF evaluates the motion cycle through the same Rust generator, matching the prototype's format capabilities.

Measured verification:
- Baseline: green. `npm run test:generators -- --grep 'Comb'` exited 0 (11 cases, including the combined Poster/Comb file); `cargo test --manifest-path crates/spielwerk-engine/Cargo.toml tools::arrow_comb` exited 0 (3 cases), before implementation.
- `npm run test:generators -- --grep 'Stripe:'` exited 0: 3 Chromium cases after building actual Wasm and the application. The real workspace case uploads an authored valid A-with-counter font, imports and repeatedly loads a legacy snapshot, migrates pixel settings before merge, resizes the responsive container, plays motion, downloads SVG/PNG/GIF, decodes raster dimensions and five distinct-cycle GIF frames, restores the font after reload, and observes no console/page errors.
- `cargo test --manifest-path crates/spielwerk-engine/Cargo.toml tools::stripe_marquee` exited 0: 2 native cases covering font-derived geometry, repeatability, column/shear/direction changes, relayout, dimension endpoints, rejected dimensions/time/font bytes, and still output.
- After strengthening the lettering test, `npx playwright test tests/generators/stripe-marquee.test.ts --grep 'uploaded outlines'` exited 0 (1 case). It pins actual thick A stems, a thin counter, and zero-width paper cells, rather than merely checking that font bytes change the output.
- `flowctl gate classify --base 8aee76032fc7a02c2591ba47c91b8e2b76505de2` selected FULL/code (exit 1, expected classification rather than a failed suite). Focused gates ran; no full-suite claim.
- `git diff --check` passed. No staged files remain. Only the inherited untracked `node_modules` link remains; no prototype files or user-owned Arrow Maze files changed.

Evidence logs and screenshot are in `/Users/baran/Repositories/spielwerk-fn2-task6/.flow/tmp/`: `baseline-browser.log`, `baseline-rust.log`, `verify-browser.log`, `verify-rust.log`, `verify-lettering.log`, `stripe-classify.log`, and `stripe-marquee-workspace.png`. The screenshot was opened and inspected: visible repeated A silhouettes are expressed through stripe thickness, including their counters. Playwright closed its browser context and local Vite server. Intermediate failures were a new fixture's intentional space glyph mapping and an asynchronous snapshot-load test race; both were corrected without weakening existing assertions.

Capabilities and boundaries: generator time is explicit and repeatable, row lag preserves the prototype's phase-dependent horizontal sampling drift, geometry settings use width-relative units, and legacy saves/snapshots migrate once via `rel: 1`. The bundled default is a deterministic 5×7 Latin/digit display face (lowercase displays as capitals), not host Helvetica; uploaded faces use their own outline weight. As in the checked foundation, WOFF/WOFF2 decoding and complex-script shaping are not delivered. No pixel-identical prototype parity or performance benchmark is claimed. Website visual runtimes, embed packaging, and R12 remain fn-5 work, not delivered here.

Integrated by fast-forward; original implementation commit IDs remain reachable. Integration fix 56354cb sorts module declarations for rustfmt. Correctness audit found changed row-lag semantics; restored the prototype calculation in 45ae648. A new scene-level regression failed before the fix (exit 101, .flow/tmp/task6-rowlag-red.log), then passed. Native assertions pin horizontal lag, directional period, zero-time behavior, and phase progression. Post-fix measured target gates: npm run build passed; npx playwright test tests/generators/stripe-marquee.test.ts passed 3; cargo test --manifest-path crates/spielwerk-engine/Cargo.toml tools::stripe_marquee passed 4; rustfmt and git diff checks passed. Logs: .flow/tmp/task6-rowlag-{build,browser,rust}.log.

Audit disposition: correctness Should Fix resolved with regression coverage; standards Should Fix about repeated mask preparation deferred by conductor judgment. No playback performance measurement showed a defect; bounded cache preparation and invalidation need profiling and dedicated validation. No renewed audit or independent SHIP is claimed. Source-only audit runs: 8fb6f4cd-d41a-4505-85b6-5e7060963021 (correctness) and 9ff733fc-2e72-41ff-8384-770648b6a096 (standards).

stage: impl-review - skipped(config: review.backend=none)
stage: quality-audit - ran
stage: wave-join - ran (original commits retained, formatting and regression fixes added)
stage: plan-sync - skipped(config: planSync.enabled=false)
Gates: focused (full suite not requested)
Tier: session (jev-unavailable(no_key)) (model: gpt-6.1-sol)
## Evidence
- Commits: 0c74c91b3345c911c3e247fd5864e60b7ce21206, 0034d963b0b4b4d332e85f8f3eaab111185d2eb1, 56354cbea44043a989e8b9e33408f828ebbaa972, 45ae648c7ef71700dadf6e3425c2c1c651e69c14
- Tests: npm run build (exit 0; .flow/tmp/task6-rowlag-build.log), npx playwright test tests/generators/stripe-marquee.test.ts (exit 0; 3 passed; .flow/tmp/task6-rowlag-browser.log), cargo test --manifest-path crates/spielwerk-engine/Cargo.toml tools::stripe_marquee (exit 0; 4 passed; .flow/tmp/task6-rowlag-rust.log), cargo fmt --manifest-path crates/spielwerk-engine/Cargo.toml -- --check (passed), git diff --check (passed)
- PRs: