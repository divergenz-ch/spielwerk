---
satisfies: [R4, R5]
---
# fn-6-spielwerk-minimal-creative-instrument.3 Clarify preview state and keep export direct

Touches: src/workspace/Artboard.svelte, src/workspace/ExportPanel.svelte, tests/workspace/controls.test.ts, tests/workspace/exports.test.ts

## Description
Make the existing preview and export pipeline communicate R4 and R5 without adding a second design state or changing export encoders.

**Size:** M
**Files:** `src/workspace/Artboard.svelte`, `src/workspace/ExportPanel.svelte`, `tests/workspace/controls.test.ts`, `tests/workspace/exports.test.ts`
**Touches:** [src/workspace/Artboard.svelte, src/workspace/ExportPanel.svelte, tests/workspace/controls.test.ts, tests/workspace/exports.test.ts]

### Approach

- Extend the existing busy/error/displayed presentation at `Artboard.svelte:109-136,245-246`. Describe retained artwork honestly during updates and after evaluator or renderer failure. Preserve `latestEvaluation` as the publication authority instead of adding another queue.
- Keep updates connected to control changes throughout dragging. Announce meaningful status changes without reporting every playback frame. Clearing an error must follow a new successful current render, not simply the existence of an older frame.
- Pass only preview-status information into ExportPanel to explain current-settings export while a preview is pending or failed. Continue using the existing EvaluationInput and `exportArtwork` immutable capture; do not export the DOM or last displayed frame.
- Keep one format selector and primary action. Make optional folder selection visually secondary without hiding its cancellation/fallback feedback. Distinguish download initiation from completed folder writes; retain embed-specific package instructions.
- Extend the existing held-evaluation and held-encoder fixture patterns to cover export before preview completion, then mutate settings during encoding and inspect the actual downloaded payload. Add evaluator and renderer failures followed by a valid edit, with explicit stale/current status assertions.

### Investigation targets

Read the required sources before coding.

**Required:**
- `src/workspace/Artboard.svelte:109-136,240-246` owns preview scheduling and feedback.
- `src/workspace/ExportPanel.svelte:9-48` owns format selection, progress, and destination messages.
- `src/workspace/exports.ts:14-26,38-70` supplies capability filtering, cloned requests, and folder/download fallback.
- `tests/workspace/controls.test.ts:215-242` supplies delayed full-detail evaluation checks.
- `tests/workspace/exports.test.ts:102-208` supplies actual downloads, immutable requests, and folder failure cases.

**Optional:**
- `src/workspace/view.ts:65-92` defines stale-result rejection and disposal.

### Key context

Exports already capture current settings at activation. Preview lag is not permission to change that contract. The preview can update continuously during motion, so disabling export whenever preview evaluation is busy would make animation export unreliable. Do not add that gate.

General storage failures, competing-tab writes, and export cancellation are outside this task. Preserve existing behavior there and report unrelated defects separately.

### Quick commands

Run the focused checks, then download a real supported artifact from the built app and inspect it.

```bash
npm run build
npx playwright test tests/workspace/controls.test.ts tests/workspace/exports.test.ts
```

## Acceptance
- [ ] Held and failed preview tests distinguish current, retained, and failed output; stale completions and post-navigation publication remain rejected, and a valid edit recovers.
- [ ] A download started during a pending preview contains activation-time inputs, not the older visible frame or later edits; existing fixed/responsive and asset assertions remain intact.
- [ ] Duplicate activation, unsupported formats, folder cancellation, denied writes, encoder failure, and retry preserve the R5 visible outcomes.
- [ ] The built-app edit-to-export walkthrough and focused tests pass; playback does not produce per-frame live announcements and download text does not claim a confirmed save.

## Done summary
The preview now identifies updating, current, and failed output, including
retained artwork. Export explains its activation-time capture during preview
lag or failure and reports browser download initiation separately from a
completed folder write.

Tier: session (jev-unavailable(no_key)) (model: gpt-6-astra)
stage: impl-review - skipped(config: REVIEW_MODE=none)

### Ownership and scope

Svelte still owns parameters, assets, dimensions, and playback time.
`latestEvaluation` remains the only publication authority. Artboard derives
feedback from its existing busy/error/displayed state, retains an error during
retry, and clears it only after a successful current render. A separate live
status stays constant during ordinary playback while visible feedback continues
to reflect preview state. Existing evaluator disposal and detached rendering
remain unchanged.

ExportPanel receives only preview status. `exportArtwork`, encoders, and
immutable request cloning are unchanged. The existing supported-format order
still selects the default; export remains enabled while preview work is pending.
Folder selection is visually secondary. Existing cancellation, write fallback,
and embed package guidance remain available.

Only the four authorized implementation/test files changed. Commits are
4c7fe6b (failing contracts) and 7f70a09 (implementation and completed coverage).
Base is 6a8a04278af341c533e1047c19d31a3829c02608.

### Measured verification

Baseline was green before edits. `npm run build` exited 0, and the original
controls/export selection passed all 12 tests. Logs are
`task-3-baseline-build.log` and `task-3-baseline-tests.log` beside this summary.

Final commands exited 0:

- `npm run build`. See `task-3-final-build.log`.
- `npx playwright test tests/workspace/controls.test.ts tests/workspace/exports.test.ts`.
  All 16 tests passed. See `task-3-final-tests.log`.
- `git diff --check`.

`gate classify --base 6a8a04278af341c533e1047c19d31a3829c02608` returned FULL
(exit 1), mentioning preexisting `.pi/flow-next.json`. This task also changes
executable Svelte files. No lint/format script is configured. No full repository
suite ran.

The focused browser evidence covers R4 and R5:

- A held evaluation retains the previous image and dimensions, coalesces edits,
  publishes only the latest result, and clears the retained indication. A real
  slider drag renders full-detail output before pointer release.
- Parameterized evaluator and renderer failures retain the old image, report
  failure, keep the last error during retry, and recover on successful rendering.
  Navigation while another evaluation is held prevents its later publication.
- Playback produces more than ten additional rendered frames with zero changes
  to the live announcement after its stable playing message.
- Export starts while a held preview still shows six rectangles. The actual
  downloaded contract payload contains the activation-time 20-unit cell size,
  120 x 80 fixed artboard, both original font byte arrays, and nonzero captured
  playback time. It contains 24 rectangles. Later edits change cell size to 10,
  width to 200, remove the primary font, and restart playback during encoding;
  none changes the captured payload. Exactly one encode completes despite a
  second disabled activation. Releasing preview work yields 160 rectangles.
- Responsive SVG/PNG/GIF contract assertions remain intact. Unsupported formats,
  encoding progress, encoder failure/retry, failed-preview guidance, folder
  cancellation, picker denial, completed folder writes, and denied-write download
  fallback all pass. Download messages assert initiation rather than a save.

The new contracts failed on the unchanged UI before implementation; see
`task-3-red-tests.log`. Intermediate test-authoring failures are retained in
`task-3-gate-tests.log`, `task-3-extended-tests.log`, and `task-3-live-test.log`.
Corrections used the fixture engine's integer cell count, the existing Tool
combobox role locator, an explicit wait for asynchronous snapshot save, and XML
serialization on both sides of the SVG comparison. No production workaround or
weakened existing assertion was introduced.

### Built-app walkthrough

The feature map is absent. A fresh Chromium context on a disposable static host
opened the built `/#arrow-maze` route, edited Seed to 84 and Width to 640, saved
a snapshot, changed Seed to 126, and restored it. Restored scene markup matches
exactly. The default SVG export downloaded `arrow-maze.svg`; parsing succeeded,
width is 640, and every exported path/rect/text element matches the preview via
the same XML serializer. The test then selected Website embed and checked its
packaging guidance. Page exceptions and non-404 console errors were empty.

Inspected and retained artifacts beside this summary:

- `task-3-built-export.png` shows the current full artwork, the single format
  selector/action, secondary folder action, and download-started message.
- `task-3-arrow-maze.svg` is the actual supported download.
- `task-3-failed-preview.png` and `task-3-pending-preview.png` show the browser
  fixture's retained image and explicit failed/updating messages.

The screenshots and test cases distinguish the real Arrow Maze download from
fixture contract payloads. Failure injection and held evaluations run through
the compiled real workspace components with fixture adapters. No claim of an
OS screen-reader listening test is made; live-region mutation behavior was
measured in Chromium.

### Boundaries

Independent review did not run under REVIEW_MODE=none. Preexisting changes to
`tools/arrow-maze.html` and `tools/arrow-maze.embed.js`, untracked `.pi/` and
`AGENTS.md`, and preview PID 47475 were preserved. The staging area is empty.
All test-owned hosts and browser contexts exited. No publication, delegation,
renderer/encoder change, storage migration, or new dependency occurred.

stage: plan-sync - skipped(config: planSync.enabled != true)
## Evidence
- Commits: 4c7fe6bd21b167f3683688549386cb2f12e8a608, 7f70a0929219e6ef2405aa2ac327cd7b565b134e
- Tests: npm run build, npx playwright test tests/workspace/controls.test.ts tests/workspace/exports.test.ts, git diff --check
- PRs: