---
satisfies: [R1, R4, R5]
---
# fn-5-spielwerk-responsive-arrow-maze-embeds.2 Package all eight responsive embeds with demo and snippet assets

## Description
Deliver the actual portable packages consumed by independent websites and shared workspace embed export.

**Size:** M
**Files:** `src/embeds/packages.ts`, `src/embeds/templates.ts`, `src/workspace/ExportPanel.svelte`, `tests/embeds/packages.test.ts`
**Touches:** [src/embeds/packages.ts, src/embeds/templates.ts, src/workspace/ExportPanel.svelte, tests/embeds/packages.test.ts]

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
TBD

## Evidence
- Commits:
- Tests:
- PRs:
