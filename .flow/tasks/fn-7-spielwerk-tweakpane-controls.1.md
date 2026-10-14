---
satisfies: [R1, R2, R3, R4, R5]
---
# fn-7-spielwerk-tweakpane-controls.1 Integrate Tweakpane with preserved control contracts

## Description
Replace the native Controls.svelte surface with pinned Tweakpane and prove the spec contracts against the actual browser UI. Required reads: parent spec; src/workspace/Controls.svelte; src/workspace/view.ts; Artboard.svelte; tests/workspace/controls.test.ts and exports.test.ts; prior fn-6 task .1 evidence; installed Tweakpane public declarations; README.md and CLAUDE.md. Svelte remains canonical and Tweakpane owns only its editing mirror. Reuse current behavioral tests as the characterization contract; new library-specific interaction routes must not weaken assertions. Load docs-writer before markdown edits.

**Touches:** [package.json, package-lock.json, src/workspace/Controls.svelte, src/workspace/tweakpane.ts, src/workspace/Artboard.svelte, src/workspace/view.ts, tests/workspace/*.test.ts, tests/generators/*.test.ts, tests/embeds/*.test.ts, tests/integration/*.spec.ts, README.md, CLAUDE.md, src/engine/README.md]

Tests outside controls.test.ts may change only for parameter-control interaction routes introduced by this task. No engine, renderer, encoder, storage schema, or legacy tool changes. A local helper src/workspace/tweakpane.ts is optional only if it makes this integration easier to follow; no framework or extensibility abstraction.

### Quick commands

npm run build
npx playwright test tests/workspace/controls.test.ts tests/workspace/exports.test.ts tests/workspace/storage.test.ts

Also run every additional affected browser case with focused selection and inspect built-app desktop/zoom screenshots. Stop on missing infrastructure or an unmet behavior, never fallback silently.

## Acceptance
Real Tweakpane is visible and all R1-R5 criteria pass with measured browser evidence. Preserve exact edit normalization, labels/focus/keyboard reset, restoration, disposal and export contracts. Record actual version and bundle size. Update guidance honestly. Commit only this task files plus .flow; verify flowctl done status before reporting completion.

## Done summary
Spielwerk now uses pinned Tweakpane 4.0.5 for its parameter folders and bindings. The integration preserves Svelte-owned settings, precise numeric editing, keyboard reset, restoration, full-detail preview, and activation-time export capture.

Tier: session (jev-unavailable(no_key)) (model: openai-codex/gpt-6-astra)
stage: impl-review - skipped(config: REVIEW_MODE=none)

### Implementation

- Similar-code search found `controlValue` in `src/workspace/view.ts`; reused unchanged. No existing pane integration existed. The bounded `src/workspace/tweakpane.ts` helper owns the disposable mirror and public-API lifecycle; `Controls.svelte` mounts, refreshes, and disposes it.
- Public APIs provide folders, bindings, buttons, element handles, formatting, bounds, key/pointer scales, events, refresh, and disposal. Standard DOM attributes/events supply names, numeric roles/values, last-valid raw-entry recovery, keyboard steps, and focus. `controlValue` alone rounds minimum-relative steps. Color-like text explicitly uses the text view. Color pickers expand inline and relabel rebuilt channel inputs.
- Tweakpane 4.0.5 is the pinned runtime dependency. Its published declarations import `@tweakpane/core`, pinned at 2.0.5 as a development-only dependency. Application runtime imports use `tweakpane` exclusively. No private controller/class selectors, fork, plugin, wrapper package, duplicate native parameter UI, or fallback was introduced.
- `README.md`, `CLAUDE.md`, and `src/engine/README.md` describe the integration and its maintenance boundary. The earlier fn-6 stock evaluation and its failed accessibility/default-format findings remain historical evidence.

### Measured verification

Baseline was green before implementation. `npm run build` exited 0 and the three focused browser files passed 19 tests. Logs are `baseline-build.log` and `baseline-tests.log` in this directory.

Final commands all exited 0:

- `npm run build` (`final-build.log`). No lint/format script is configured.
- `npx playwright test tests/workspace/controls.test.ts tests/workspace/exports.test.ts tests/workspace/storage.test.ts` (`final-tests.log`). All 20 tests passed, including 12 control cases.
- `npx playwright test tests/generators/arrow-poster-arrow-comb.test.ts --grep 'arrow-poster: legacy pixel settings'` (`affected-generator.log`). One affected checkbox interaction case passed.
- `node .flow/tmp/fn-7-work/inspect-built.mjs` (`built-inspection.log` and `built-inspection.json`). Disposable static host and fresh Chromium profile; all owned processes closed.
- `git diff --check` passed.

`gate classify --base 96485869fb6c79be184569088a7b8759e21c9f17` selected FULL, exit 1. Its first matching path was preexisting `.pi/flow-next.json`; the task also changes executable paths. Only the requested focused gates ran. No full repository suite ran.

### Acceptance evidence

- R1: Built screenshots show real Tweakpane in the existing single control column. All five control types are exercised against real Wasm in `controls.test.ts`.
- R2: Numeric boundary cases cover bounds, fractional minimum-relative steps, blank, overflow, NaN, Infinity, and malformed text. Keyboard tests retain exact increments, Tab/Space reset, double-click reset, visible focus, text Space, and no panning from pane fields. The public-element test checks field focus, checkbox keyboard editing, color editing, and RGB/HSL/HSV/HEX channel names. Existing behavioral assertions were retained; native range values became equivalent `aria-valuenow` assertions, disclosure assertions use folder expansion, and checkbox pointer routes use their visible labels.
- R3: Three remounts retain one pane and exactly one callback per text/numeric edit. Detached old inputs cannot emit edits. Restored values and expansion emit no callbacks; invalid choices retain the displayed valid selection. Existing snapshot/tool restoration, held-pointer full-detail updates, latest-only publication, retained/failed/current previews, navigation disposal, playback announcements, and immutable export-capture cases pass unchanged in meaning. Artboard, evaluator, storage, renderer, and export implementations were not changed.
- R4: Inspected `1280x800-parameters.png`, `1280x800-export.png`, `1024x768-parameters.png`, `1024x768-export.png`, `1280x800-zoom200-parameters.png`, and `1280x800-zoom200-export.png`. Controls and export are reachable without horizontal overflow. Actual browser zoom uses a disposable extension's `chrome.tabs.setZoom(2)`, confirmed by `getZoom() = 2`, 640 x 400 CSS viewport, and DPR 2. Export was hit-tested and produced `zoom200-arrow-maze.svg` at that zoom.
- R4 walkthrough: Built `/#arrow-maze`, seed 84, save snapshot, edit to 126, restore snapshot, switch tools and return, then download `walkthrough-arrow-maze.svg`. Restored artwork matched exactly; all 47 exported geometry nodes matched the preview. Screenshot `walkthrough-downloaded.png` shows download initiation. The browser recorded zero page exceptions and no non-404 console errors; four static-host HTTP 404 messages remain recorded.
- R5: The three existing guides now distinguish current Tweakpane adoption from the earlier retain-native decision. Pending generators, schemas, engine code, embed runtime, legacy tools, and publication remain outside this task.

### Delivered size and limits

`built-inspection.json` records Tweakpane 4.0.5 and every emitted JS asset. Total emitted JS is 289,270 bytes, or 80,480 bytes summed with Node's default gzip. This includes the separate probe entry and embed runtime asset. The fresh built workspace actually fetched 260,776 JS body bytes (workspace and shared client); those two files gzip to 70,980 bytes. The static inspection host serves uncompressed bodies. These are size observations, not speed or bundle-budget claims.

Earlier integration runs exposed rejected-value display recovery and dynamic picker-label gaps; the final tests close them. The first live script used the wrong Tool locator, and Playwright's scrolled 200% screenshot was blank despite a valid DOM hit target. The final run uses the correct combobox role and raw CDP viewport capture, with an actual 200% download. Failed attempts are not counted as acceptance evidence.

Chromium coverage does not certify other browsers or an OS screen reader. Independent review was not run under REVIEW_MODE=none. The feature map is absent; the user route remains `/#arrow-maze`, with Tweakpane folder buttons replacing parameter disclosures.

Implementation commit: `ba6a13023e2231be8b3a6d5c856626e2ebaab9e6`.
Base: `96485869fb6c79be184569088a7b8759e21c9f17`.
Preexisting `tools/arrow-maze.html`, `tools/arrow-maze.embed.js`, `.pi/`, and `AGENTS.md` remain untouched and unstaged. Preview PID 47475 remains running. No delegation or publication occurred.

stage: plan-sync - skipped(config: planSync.enabled != true)
## Evidence
- Commits: ba6a13023e2231be8b3a6d5c856626e2ebaab9e6
- Tests: npm run build, npx playwright test tests/workspace/controls.test.ts tests/workspace/exports.test.ts tests/workspace/storage.test.ts, npx playwright test tests/generators/arrow-poster-arrow-comb.test.ts --grep 'arrow-poster: legacy pixel settings', node .flow/tmp/fn-7-work/inspect-built.mjs, git diff --check
- PRs: