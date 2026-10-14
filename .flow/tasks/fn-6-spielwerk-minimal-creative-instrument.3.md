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
TBD

## Evidence
- Commits:
- Tests:
- PRs:
