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
TBD

## Evidence
- Commits:
- Tests:
- PRs:
