---
satisfies: [R7, R9, R11]
---
# fn-1-spielwerk-shared-design-workspace.6 Deliver shared artwork export orchestration and foundation handoff

## Description
Complete the browser-side output facilities and the checked foundation receipt that releases sibling work.

**Size:** M
**Files:** `src/workspace/exports.ts`, `src/workspace/ExportPanel.svelte`, `src/workspace/App.svelte`, `tests/workspace/exports.test.ts`
**Touches:** [src/workspace/exports.ts, src/workspace/ExportPanel.svelte, src/workspace/App.svelte, tests/workspace/exports.test.ts, src/workspace/Artboard.svelte]

### Approach

- Consume the adapter's supported format list and selected fixed/responsive scene request. Reuse or adapt prototype download/folder/GIF helpers rather than duplicating existing behavior.
- Pass preserved font bytes to sibling consumers and preserve embedded/baked appearance in supported output paths. Keep geometry and animation evaluation in Rust; browser file encoding/delivery remains behind the shared adapter.
- Verify static build serving and the optional service's asset-serving path using the existing service. The final integration owner updates README/CLAUDE guidance once the actual sibling capabilities are delivered.

- Connect the live design request owned by `Artboard.svelte` to export orchestration, preserving selected dimensions, settings, and original asset bytes. This bounded consumer connection must not reconstruct current design from potentially stale persistence or move ownership of artboard state.

### Investigation targets

**Required** (existing source evidence, read before coding):
- `tools/export.js:9-101`
- `tools/fontpick.js:14-53`
- `tools/arrow-maze.html:484-486`
- `tools/arrow-maze.html:620-626`
- `serve.py`

### Key context

Listed application paths are proposed new paths. Foundation/sibling implementation
commits must exist in the checkout before consumption. Keep user-owned Arrow Maze
prototype edits intact. Source evidence confirms product intent, not a passing
Rust port or browser gate. Libraries/build details are selected and verified
inside the owning implementation task.

## Acceptance
- [ ] Focused tests assert exact selected responsive dimensions/layout requests, supported-format filtering, progress, visible failures, folder permission/download fallback, and cancelled picker destination retention.
- [ ] SVG/PNG/GIF adapter fixtures use the same scene/time inputs; no exported fixture is presented as a delivered named-tool engine or independent embed.
- [ ] The served foundation UI and optional/local versus static paths are exercised; browser console results and output evidence are recorded.
- [ ] Publish only a local task handoff with done statuses, delivered contracts/paths, commit ranges, test commands/results, applicable review outcomes, and unfinished sibling capabilities. It does not mark fn-1.1 or fn-1 complete.

## Done summary
The shared editor now exports its live selected design through registered sibling encoders, with progress, visible failures, and folder or browser-download delivery. This completes the bounded foundation handoff; the default ten-tool catalog remains pending, task .1 remains blocked, and the workspace spec remains open.

Measured verification:
- Baseline green at `314fca268ad8b2783cd97b9448562274c07f4476`. `npm run build` exited 0; `npx playwright test tests/workspace/controls.test.ts` exited 0 with four cases. Logs are `task-6-baseline-build.log` and `task-6-baseline-controls.log` beside this summary.
- Tested implementation HEAD `1a5ac2e33b8e067ce4b6b858a85ad5d80a569854`. Implementation range `314fca268ad8b2783cd97b9448562274c07f4476..1a5ac2e33b8e067ce4b6b858a85ad5d80a569854`.
- `npm run test:workspace` exited 0 with 19 passing Chromium cases, including the build, bootstrap, Rust/Wasm boundary, storage, controls, and exports. Log `task-6-final-workspace.log` records all collected cases. This was the single requested final foundation-consumer gate.
- `npm run test:rust` exited 0 with three passing workspace-filtered native tests using the pinned toolchain. Log `task-6-final-rust.log`.
- The focused export run exited 0 with four cases (`task-6-exports-2.log`). The first run had three passes and one fixture failure (`task-6-exports.log`): its fake writable assigned the browser's read-only `window.closed`, causing delivery fallback. Renaming that test-owned marker to `writeClosed` fixed the fixture. No assertion was weakened.
- `flowctl gate classify` returned FULL (exit 1), including the pre-existing untracked `.pi/flow-next.json`. No lint or format script is configured. `git diff --check` passed; the staged index is empty after the implementation commit.

Export acceptance evidence:
- `tests/workspace/exports.test.ts` contains four focused cases. Static and service cases assert the exact 200 x 120 responsive request, updated 20-unit cell setting, 60 engine rectangles, time zero, and equal SVG/PNG/GIF fixture frames. Each fixture also calls the same captured design at 0.5 seconds through actual Rust/Wasm. View zoom is absent from the request.
- Supported-format tests expose only SVG/PNG/GIF where both declared capability and handler exist. Declared OTF without a handler and an undeclared embed handler are hidden; direct unsupported export rejects visibly through the orchestration API.
- The progress/failure case drives the actual Svelte export button, observes the disabled button and encoder progress, edits fixed dimensions during an in-flight export, and verifies that both initial and later frames retain 120 x 80. Primary and accent fonts are uploaded through their UI; output records preserve both roles and every original byte of the local browser-loadable Arial font. The encoder error remains visible and the button becomes usable again.
- The folder case uses a fake browser directory handle without touching any real export folder. It checks readwrite picker options, cancellation before and after destination selection, denied picker fallback, completed write/close, and revoked write permission falling back to a real browser download with a visible warning. Cancellation retains the prior destination.
- Real browser downloads are read back from disposable Playwright paths and parsed. Their names are `internal-svg-contract.json`, `internal-png-contract.json`, and `internal-gif-contract.json`. These are delivery and adapter-contract records, not valid SVG/PNG/GIF encoders or named-tool artwork. No embed package is delivered.
- Each export case asserts zero page errors and zero non-404 console errors. Expected static-host missing snapshot-probe and favicon 404 messages are excluded from the console-error assertion. Build logs have informational default-config and external temporary output-directory notices; there are no remaining Svelte compiler warnings.
- Both serving cases navigate to the built default application and a built fixture bundle over HTTP. The service case runs an unchanged copy of `serve.py` beside those built assets with an isolated temporary HOME and verifies the snapshot JSON under that HOME. The static case verifies the absent snapshot API and browser-local save. These tests never serve raw Svelte as the application and never read real saved snapshots. Teardown stops all child servers and deletes temporary build, HOME, and fixture directories.

Consumer handoff:
- `src/workspace/exports.ts` exports `ExportHandlers`, `ExportContext`, `ExportFile`, `Exporters`, `supportedFormats`, `exportArtwork`, and `exportDestination`. `App` accepts optional `exporters`, keyed by the same browser tool slug used by its catalog. Each value is a partial format-to-async-handler map. Existing registrations without handlers remain valid and show exports unavailable.
- `App` creates one session destination shared across tool selections and passes the selected handlers to `Artboard`. `Artboard` still owns parameters, layout, original asset bytes, and view state. Its derived live `EvaluationInput` supplies both the preview evaluator and `ExportPanel`; export never rebuilds current design from localStorage. Still evaluation remains explicit time zero.
- `exportArtwork` intersects handlers with actual adapter capabilities, clones the current request before awaiting, evaluates the initial frame, and gives the encoder `{ input, frame, evaluate(timeSeconds), progress(message) }`. Additional evaluation calls clone that same captured design with explicit time. Rust retains geometry, responsive layout, and animation evaluation ownership. The callback returns `{ name, blob }` for shared delivery.
- Sibling encoders own browser rendering/format encoding, motion sampling schedules, and preserving embedded or baked asset appearance. They receive the original binary assets; this foundation verifies byte preservation only. Real glyph appearance and valid SVG/PNG/GIF/font output remain acceptance work for the owning siblings.
- `ExportPanel.svelte` offers only working registered formats, progress, errors, and an explicit folder button where supported. Downloads are the initial destination. Picker cancellation does not change it; folder failures preserve the selected destination while downloading the current output and showing a warning. Destination state is session-only and does not alter saved design state.
- Changed user route for registered tools is the Artboard's Artwork export fieldset. No feature map exists; no feature-map files were changed.

Local foundation receipt:
- Anchor verified .2, .3, .4, and .5 done with prerequisite commits present in this checkout. Their exact earlier handoffs remain `task-2-summary.md` through `task-5-summary.md` and corresponding evidence JSON files in this directory. This task records .6 only; no sibling status changes, admissions, owner resets, or spec closure occurred.
- Pending owners still supply the eight generator engines, logo extrusion, font remixing, artwork encoders/renderers, independent responsive embeds, and final ten-tool integration. `test:integration` was not run and remains unavailable until real sibling integration; it is not a passing gate.
- Only Chromium was measured. Native picker UI was simulated; permission branches and download/file payload delivery were exercised. Font appearance and actual output codecs are explicitly unmeasured.
- Both user-owned Arrow Maze SHA-256 hashes match dispatch and their edits remain unstaged. `.pi/` and `AGENTS.md` remain untracked. Application changes stay within the five amended Touches paths; lifecycle receipts are the only other tracked changes.
- No publication, push, PR, or deployment occurred. Independent review is not claimed.

stage: impl-review - skipped(config: REVIEW_MODE=none)
Tier: session (jev-unavailable(no_key)) (model: gpt-6-astra, evidenced by PI_MODEL)

stage: plan-sync - skipped(config: planSync.enabled != true)
## Evidence
- Commits: 1a5ac2e33b8e067ce4b6b858a85ad5d80a569854
- Tests: npm run build (baseline exit 0; task-6-baseline-build.log), npx playwright test tests/workspace/controls.test.ts (baseline exit 0, 4 passed; task-6-baseline-controls.log), npx playwright test tests/workspace/exports.test.ts (exit 0, 4 passed; task-6-exports-2.log), npm run test:workspace (exit 0, 19 passed; task-6-final-workspace.log; tested HEAD 1a5ac2e33b8e067ce4b6b858a85ad5d80a569854), npm run test:rust (exit 0, 3 passed; task-6-final-rust.log)
- PRs: