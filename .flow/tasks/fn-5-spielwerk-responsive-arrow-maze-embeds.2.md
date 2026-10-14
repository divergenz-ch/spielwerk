---
satisfies: [R1, R4, R5]
---
# fn-5-spielwerk-responsive-arrow-maze-embeds.2 Package all eight responsive embeds with demo and snippet assets

## Description
Deliver the actual portable packages consumed by independent websites and shared workspace embed export.

**Size:** M
**Files:** `src/embeds/packages.ts`, `src/embeds/templates.ts`, `src/workspace/ExportPanel.svelte`, `tests/embeds/packages.test.ts`
**Touches:** [src/embeds/**, src/workspace/ExportPanel.svelte, src/workspace/exports.ts, src/main.ts, src/engine/build.mjs, tests/embeds/packages.test.ts, tests/workspace/exports.test.ts, tests/generators/truchet-tiles-imprint.test.ts]

### Approach

- Export design settings and required font data with the separate runtime/Wasm assets, demo and reusable snippet for each supported tool.
- Use safe inert configuration encoding for valid user text/font metadata, so special characters do not break the exported host page.
- Bind package creation to shared export progress/failure/folder/download handling without adding logo/font-remixer embeds or a new host-error contract.

### Investigation targets

**Required** (existing source evidence, read before coding):
- `tools/arrow-maze.html:572-617`
- `tools/fontpick.js:14-53`
- `tools/export.js:9-101`

### Key context

Listed application paths are proposed new paths. Consume the checked fn-1
foundation contract and prerequisite commits, rather than recreating shared
storage, control, or export machinery. Library decisions require implementation
probes and current documentation. Preserve the original successful-input
boundaries and all user-owned prototype edits.

## Acceptance
- [ ] All eight actual packages load from an independent static fixture server with their required local runtime/Wasm/font assets and no editor dependency.
- [ ] Demo/snippet configuration preserves design inputs/typeface appearance, including valid special-character text, and supports responsive visual playback/still behavior.
- [ ] Workspace package export exercises progress/failure and ordinary download/folder behavior; Logo Extruder and Font Remixer have no embed capability.

## Done summary
Designers can download portable website ZIPs from all eight generators through the shared export panel. Each ZIP carries its demo, reusable snippet, local visual runtime, Rust/Wasm binary, and original font bytes; the workspace retains shared immutable-input, progress, failure, folder, and download handling.

Tier: session (jev-unavailable(no_key)) (model: gpt-6.1-sol)
stage: impl-review - skipped(config: review.backend=none)
stage: wave-join - ran (original 1ad6d22 normalized to integrated 3a62a4f)
stage: plan-sync - skipped(config: planSync.enabled=false)
Gates: focused (full suite not requested)

Measured integrated-target verification passed: npm run build; npm run test:embeds (20 tests); npx playwright test tests/workspace/exports.test.ts tests/generators/truchet-tiles-imprint.test.ts (11 tests); git diff --check. Logs: .flow/tmp/fn5-task2-integrated-{build,embeds,regressions}.log. Spec-wide quality follows final host acceptance; no independent implementation-review SHIP is claimed.

Measured gates passed:
- Baseline `npm run test:embeds` passed 10 Chromium tests; native `cargo test --manifest-path crates/spielwerk-engine/Cargo.toml tools` passed 24 tests before edits.
- `npm run build` passed. The separate runtime is 26.28 kB of JavaScript plus the existing 657.37 kB local Wasm asset. The application and packages share that binary without a Svelte/editor runtime in the exported package.
- Final `npm run test:embeds` passed 20 tests. All eight actual workspace downloads were CRC-checked and extracted with Python zipfile, then displayed on another static HTTP origin as demos and relocated snippets under subdirectories. Tests compare original 600x800 frames, resize to 800x800, seek/play supported motion, and confirm Truchet's still output and absence of visitor controls.
- Uploaded primary fonts change the four applicable tools' output. Maze's distinct uploaded accent font also changes its output. Local font files match original bytes, and exported visual frames match the editor frames. Inert configuration preserves closing-script text, quotes, ampersands, Unicode, and font metadata; no injected script executes. Maze's external configuration URL also loads actual local fonts and artwork.
- Package-specific workspace cases pass for visible progress, immutable in-flight dimensions, failed runtime-asset fetch and recovery, ordinary downloads, actual ZIP folder writes through the browser destination contract, retained destination after cancellation, and denied-write download fallback. Only the platform folder-picker/write boundary is simulated; package creation, bytes, evaluation, and downloads are real. Logo Extruder and Font Remixer have no embed output.
- `npx playwright test tests/workspace/exports.test.ts tests/generators/truchet-tiles-imprint.test.ts` passed 11 regression cases, retaining original artwork, raw-adapter, and internal-fixture assertions. The supervisor authorized the two actual-workspace format-pin updates to include the newly requested embed output.
- After correcting the external-host screenshot filename, `npx playwright test tests/embeds/packages.test.ts` passed all 10 package cases. `git diff --check` passed; no files are staged. Gate classification is FULL. No repository lint/format gate is configured.

Evidence lives in `/Users/baran/Repositories/spielwerk-fn5-task2/.flow/tmp/`. Logs are `baseline-embeds.log`, `baseline-rust.log`, `verify-build-final2.log`, `verify-embeds-final2.log`, `verify-rust-final.log`, `verify-export-regressions2.log`, `verify-packages-final.log`, and `gate-classify.log`. Actual downloaded archives are `package-<tool-id>.zip`; inspected screenshots are `package-<tool-id>-demo.png` and `package-<tool-id>-snippet.png`, plus `package-arrow-maze-external.png`. Test fixtures close their servers and browsers and remove their disposable hosting trees.

Initial probes failed on retained artwork encoders, fixture charset and optional-snapshot-service assumptions, and a fixture's read-only `window.closed` property. Those were corrected without weakening assertions. One incorrectly anchored test-selection command collected no tests and is inconclusive, not green (`debug-package-console.log`). Static workspace hosting probes `/snaps/ping` for the optional snapshot service; the known absent-service 404 is excluded explicitly from the workspace console check, while package consoles and all other errors remain checked.

No dependencies, calculation ports, prototype edits, publication, or deployment were added. Packages require compatible HTTP hosting and available dependencies; existing static TTF/OTF and script-shaping limits remain unchanged. Font-hosting rights remain the author's responsibility. Broader final hosting acceptance belongs to task .3. The inherited untracked `node_modules` dependency link remains untouched.

Changed user route is unmapped (`.flow/features/` is absent). Select a generator, choose `Website embed (ZIP)` in `Output format`, and click `Export artwork`.
## Evidence
- Commits: 3a62a4f5c6c18fd965c27c37d469f23f348f4f17
- Tests: npm run build (passed; .flow/tmp/fn5-task2-integrated-build.log), npm run test:embeds (20 passed; .flow/tmp/fn5-task2-integrated-embeds.log), npx playwright test tests/workspace/exports.test.ts tests/generators/truchet-tiles-imprint.test.ts (11 passed; .flow/tmp/fn5-task2-integrated-regressions.log)
- PRs: