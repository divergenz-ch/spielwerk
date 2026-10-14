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
TBD

## Evidence
- Commits:
- Tests:
- PRs:
