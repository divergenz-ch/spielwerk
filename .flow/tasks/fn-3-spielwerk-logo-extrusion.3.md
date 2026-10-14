---
satisfies: [R1, R2, R3, R4]
---
# fn-3-spielwerk-logo-extrusion.3 Verify the fixed-board Logo Extruder and PNG/GIF delivery

## Description
Verify the completed extrusion workflow and its actual outputs before releasing the final workspace gate.

**Size:** M
**Files:** `src/tools/logo-extruder.ts`, `tests/logo/output.test.ts`, `tests/integration/logo.spec.ts`
**Touches:** [src/tools/logo-extruder.ts, tests/logo/output.test.ts, tests/integration/logo.spec.ts]

### Approach

- Bind delivered geometry/appearance/motion to shared preview and export orchestration; use the same explicit-time scene requests for still and cycle outputs.
- Drive the real fixed-board browser tool, controls/uploads, snapshot restore and output UI.
- Check the two supported formats and dimension boundaries with real emitted files, using shared visible failure/progress/folder handling.

### Investigation targets

**Required** (existing source evidence, read before coding):
- `tools/logo-extruder.html:562-599`
- `tools/export.js:9-101`
- `tools/snapshots.js:89-148`

### Key context

Listed application paths are proposed new paths. Consume the checked fn-1
foundation contract and prerequisite commits, rather than recreating shared
storage, control, or export machinery. Library decisions require implementation
probes and current documentation. Preserve the original successful-input
boundaries and all user-owned prototype edits.

## Acceptance
- [ ] The browser workflow and emitted PNG/GIF pass focused tests at the demonstrated dimension boundaries; SVG/model formats are unavailable.
- [ ] PNG is an actual still view and GIF captures the evaluated motion cycle at selected settings with usable decoded dimensions/frames.
- [ ] The final receipt covers fn-3 R1-R4 and fixed-board/image exclusions; unsupported/unreadable asset recovery is not invented as a new promise.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
