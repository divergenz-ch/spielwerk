---
satisfies: [R5, R6]
---
# fn-1-spielwerk-shared-design-workspace.4 Preserve compatible settings, snapshots, and uploaded typefaces

## Description
Deliver the saved-work and asset contract before the control/output consumers bind it.

**Size:** M
**Files:** `src/workspace/storage.ts`, `src/workspace/snapshots.ts`, `src/workspace/fonts.ts`, `src/workspace/SnapshotsPanel.svelte`, `tests/workspace/storage.test.ts`
**Touches:** [src/workspace/storage.ts, src/workspace/snapshots.ts, src/workspace/fonts.ts, src/workspace/SnapshotsPanel.svelte, tests/workspace/storage.test.ts]

### Approach

- Reuse current slug-local settings and the spielwerk/kv IndexedDB keys font:<slug>, font:<slug>:accent, and snaps:<slug>; preserve {tool,snaps:[{name,at,params,font,accent}]} and optional GET/PUT /snaps/<slug>.
- Retain existing parameter/migration flags and unknown saved values needed by sibling adapters; split view preferences from snapshot design payloads without discarding saved work.
- Bind an injectable persistence adapter and snapshot/typeface UI; keep images/stamps excluded and no account/cloud service. Any breaking format proposal stops for a migration decision.

### Investigation targets

**Required** (existing source evidence, read before coding):
- `tools/snapshots.js:19-148`
- `tools/fontpick.js:14-53`
- `serve.py:29-58`
- `tools/stripe-marquee.html:145-233`

### Key context

Listed application paths are proposed new paths. Foundation/sibling implementation
commits must exist in the checkout before consumption. Keep user-owned Arrow Maze
prototype edits intact. Source evidence confirms product intent, not a passing
Rust port or browser gate. Libraries/build details are selected and verified
inside the owning implementation task.

## Acceptance
- [ ] Existing representative saved settings, named snapshots, and primary/accent font payloads survive save/load round trips without cross-tool contamination or unapproved migration.
- [ ] Focused tests cover missing defaults, generated names, overwrite/delete, same-name imports, accepted/rejected cross-tool confirmation, and omitted view/image/stamp data.
- [ ] Both optional-service and static browser-local contexts are exercised against their real adapters; the service is not required for static use.
- [ ] The snapshot/typeface UI calls the storage adapters and passes the focused workspace gate; malformed-import recovery is not claimed as a new contract.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
