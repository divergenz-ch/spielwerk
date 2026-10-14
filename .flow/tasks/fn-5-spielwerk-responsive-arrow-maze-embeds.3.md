---
satisfies: [R1, R2, R3, R4, R5]
---
# fn-5-spielwerk-responsive-arrow-maze-embeds.3 Verify website embed delivery and downstream handoff receipts

## Description
Establish the real independent-host delivery receipt that releases generator final acceptance and workspace final integration.

**Size:** M
**Files:** `tests/embeds/hosts.spec.ts`, `tests/embeds/playback.spec.ts`, `src/embeds/packages.ts`
**Touches:** [tests/embeds/hosts.spec.ts, tests/embeds/playback.spec.ts, tests/embeds/package-fixture.ts, tests/embeds/packages.test.ts, src/embeds/**]

### Approach

- Drive actual exported packages for all eight tools independently of the workspace, using multiple container sizes and explicit-time playback scenarios.
- Assert supported motion/still behavior, editor/visitor interaction separation, self-hosted assets/typefaces, and Maze-specific fit/playback controls.
- Record completed task ranges/tests and remaining host limitations; source presence or one Arrow Maze runtime does not establish all-eight-tool delivery.

### Investigation targets

**Required** (existing source evidence, read before coding):
- `tools/arrow-maze.embed.js:1220-1360`
- `tools/arrow-maze.html:572-617`
- `README.md:16-35`

### Key context

Listed application paths are proposed new paths. Consume the checked fn-1
foundation contract and prerequisite commits, rather than recreating shared
storage, control, or export machinery. Library decisions require implementation
probes and current documentation. Preserve the original successful-input
boundaries and all user-owned prototype edits.

## Acceptance
- [ ] Independent-host browser tests verify every fn-5 R-ID across the eight delivered packages, including applicable host play/pause/restart/seek, offscreen and reduced-motion behavior.
- [ ] Responsive geometry/time and full-fidelity behavior are asserted from real engine output; no unfinished adapters, copied editor bundle, or proxy-JS computation passes.
- [ ] The final receipt identifies real delivered packages/assets, exact validation results and applicable review outcomes, releasing fn-2 .7 only through an authorized receipt check.

## Done summary
All eight exported packages pass real independent-host acceptance. Runtime, local Wasm, original typeface bytes, demo and reusable snippet are delivered through workspace ZIP exports. Browser tests cover responsive/mobile host dimensions, explicit seeks and visual motion, static tools, all playback policies, host controls, offscreen/reduced-motion transitions and overrides, Maze fit/cell/proportions, and absence of visitor-editing handlers.

Recovery: worker fc30e059 timed out before producing its handover, after committing 55daef5. Conductor inspected its clean workspace, recorded 38 passing embed and 24 Rust tests in final worker logs, and confirmed no live commands remained. Changes were fast-forward integrated; no restart of completed implementation occurred. Initial target run hung in large SVG polling assertions. Commit 8ad29a6 preserves exact inequality via Boolean polling; fresh target checks then passed 38 cases.

Quality audits: correctness run 54ac8615 found two Should Fix findings. Commit 448d7ec resolves per-element font bases for multiple exported packages on one page and maps draw/grow loop/once overrides before Rust evaluation. Added package regressions verify distinct uploaded-font geometries on one page and repeated/completed geometry for Poster, Comb, and Imprint. Final playback testing also exposed a deadline crossed during asynchronous frame evaluation; runtime now publishes the completed once/in-view frame before stopping RAF. Focused regression checks passed. Standards run b73ebc14 found one Consider about duplicated fixture hosting, deferred as a nonblocking refactor. These audits walked source and cited measured logs, not independently executed tests; no host implementation-review receipt or renewed SHIP verdict is claimed.

Measured final integrated verification: npm run test:embeds passed 42 cases (.flow/tmp/fn5-verified-embeds.log); cargo fmt --manifest-path crates/spielwerk-engine/Cargo.toml -- --check passed; git diff --check passed. Earlier native tools gate passed 24, unchanged Rust after that verification. The temporary full embed run before the deadline fix passed 41 and failed 1; it is not a passing receipt. Focused playback and final 42-case run passed after the fix.

R1: all-eight downloadable/extractable packages and local asset/font fidelity; R2: Maze regenerate/contain/cover/fixed and cell/default height; R3: loop/once/in-view/static, seek/control and browser policy transitions; R4: all-eight responsive full-fidelity layouts and applicable motion; R5: visual-only output with editor and visitor interactions absent. Source tests cover each requirement using actual Rust/Wasm and exported artifacts.

Limits: HTTP hosting and compatible browser required; engine dimensions remain 100-8000. Static TTF/OTF supported, not WOFF/WOFF2 decoding or complex-script shaping. Keep the reusable snippet's module immediately before its artwork to preserve per-package inline-font bases; external configuration uses its own URL base. Font hosting rights remain the author's responsibility. No pixel-identical prototype parity or performance measurement claimed. User-owned prototype edits remain untouched. fn-2 final catalog acceptance still requires its own release check and receipt.

stage: impl-review - skipped(config: review.backend=none)
stage: quality-audit - ran (source-only correctness and standards)
stage: wave-join - ran (original 55daef5 retained; conductor fixes 8ad29a6 and 448d7ec)
stage: plan-sync - skipped(config: planSync.enabled=false)
Gates: focused (full suite not requested)
Tier: session (jev-unavailable(no_key))
## Evidence
- Commits: 55daef51c4744eb729c6694c899e14f5c63cedf2, 8ad29a60b72a5066586897fa30118557cfd74977, 448d7ec3f7b139ba0952783a77e394caa785e860
- Tests: npm run test:embeds (42 passed; .flow/tmp/fn5-verified-embeds.log), cargo fmt --manifest-path crates/spielwerk-engine/Cargo.toml -- --check (passed), git diff --check (passed)
- PRs: