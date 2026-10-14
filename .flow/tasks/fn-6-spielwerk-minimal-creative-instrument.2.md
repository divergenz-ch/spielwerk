---
satisfies: [R3]
---
# fn-6-spielwerk-minimal-creative-instrument.2 Establish the preview-led desktop hierarchy

Touches: src/workspace/App.svelte, src/workspace/Artboard.svelte, src/workspace/SnapshotsPanel.svelte, tests/workspace/controls.test.ts, tests/workspace/storage.test.ts, tests/workspace/bootstrap.test.ts, tests/workspace/exports.test.ts, tests/embeds/packages.test.ts

## Description
Apply the minimal workspace hierarchy from R3 after the control choice is proven. Keep the artwork prominent while preserving the existing actions and their state.

**Size:** M
**Files:** `src/workspace/App.svelte`, `src/workspace/Artboard.svelte`, `src/workspace/SnapshotsPanel.svelte`, `tests/workspace/controls.test.ts`, `tests/workspace/storage.test.ts`, `tests/workspace/bootstrap.test.ts`, `tests/workspace/exports.test.ts`, `tests/embeds/packages.test.ts`
**Touches:** [src/workspace/App.svelte, src/workspace/Artboard.svelte, src/workspace/SnapshotsPanel.svelte, tests/workspace/controls.test.ts, tests/workspace/storage.test.ts, tests/workspace/bootstrap.test.ts, tests/workspace/exports.test.ts, tests/embeds/packages.test.ts]

### Approach

- Consolidate the current separate header, tool navigation, name, and purpose into a compact top strip. Keep the hash routing, direct link, accessible heading, and pending-tool branch from `App.svelte:21-43`. Do not add a catalog landing screen.
- Rebalance the existing grid in `Artboard.svelte:268-279` so the preview receives the remaining desktop space. Keep the control column scrollable and avoid clipping essential actions at the two R3 viewport sizes. Keep view controls attached to the preview.
- Keep grouped parameters and the existing ExportPanel directly available. Put artboard options and snapshot management in native labeled disclosures. Keep primary/accent typeface inputs outside snapshot management, preserving their existing lifecycle and component callbacks. Do not add panel-preference storage keys.
- Use the existing neutral colors and system font as the starting point. Reduce duplicated margins, borders, and headings rather than adding a design system. Use typography and spacing to indicate grouping; retain visible focus and useful resize affordances.
- Adjust the controls/storage browser tests only for intentional disclosure navigation. The conductor also authorizes disclosure navigation and strictly necessary selector updates in bootstrap, exports, and embed-package browser tests. Preserve every existing assertion and avoid unrelated fixture or behavior changes. Record a before/after replay of parameter edits, snapshot load, and typeface selection to prove the markup reorganization preserves payloads and callbacks.

### Investigation targets

Read the required sources before coding.

**Required:**
- `src/workspace/App.svelte:21-72` supplies the current header, routing, and neutral styling.
- `src/workspace/Artboard.svelte:215-279` supplies the editor structure and preview sizing.
- `src/workspace/SnapshotsPanel.svelte:27-92,96-130` owns typeface lifecycle and snapshot actions.
- `tests/workspace/controls.test.ts:102-150` exercises navigation, expansion, and snapshot restoration.
- `tests/workspace/storage.test.ts` supplies snapshot/typeface browser workflows.

**Optional:**
- `src/workspace/ExportPanel.svelte:35-48` identifies the export component kept directly reachable.

### Key context

No DESIGN.md was found. R3 and the existing neutral palette are the design contract; do not introduce a component framework, icons package, decorative animation, or mobile-editor scope. Disclosure defaults are presentation choices, not changes to saved design data.

### Quick commands

Run the focused checks and inspect screenshots at both desktop sizes plus 200% browser zoom.

```bash
npm run build
npx playwright test tests/workspace/controls.test.ts tests/workspace/storage.test.ts
npx playwright test tests/workspace/bootstrap.test.ts tests/workspace/exports.test.ts
npx playwright test tests/embeds/packages.test.ts --grep 'package progress, immutable design'
```

## Acceptance
- [ ] The two specified desktop viewports show the tool identity, dominant preview, and directly reachable parameters/export with no clipped controls; 200% browser zoom remains operable.
- [ ] Keyboard navigation reaches each disclosure and action; typeface inputs remain available independently of snapshot management.
- [ ] Before/after interaction replay preserves design inputs, artboard behavior, snapshot payloads, typeface callbacks, and tool links.
- [ ] Focused controls/storage, bootstrap, exports, and affected embed-package tests pass and screenshots confirm the R3 hierarchy without ornamental additions.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
