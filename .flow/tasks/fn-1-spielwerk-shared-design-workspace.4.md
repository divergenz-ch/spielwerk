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
Workspace consumers can restore tool-local settings and manage named snapshots with primary and accent typefaces through injectable adapters and an independently mountable Svelte panel. The five declared source/test paths retain the legacy slug keys, IndexedDB `spielwerk/kv` keys, snapshot envelope, and optional service endpoints.

Measured evidence:
- Baseline green. `npm run build` and `npx playwright test tests/workspace/bootstrap.test.ts` exited 0 before edits (3 bootstrap cases). Logs are `task-4-baseline-build.log` and `task-4-baseline-workspace.log` beside this summary.
- Post-commit `npm run build` exited 0. `npx playwright test tests/workspace/storage.test.ts` exited 0 with 3 cases. Logs are `task-4-verify-build.log` and `task-4-verify-storage.log`.
- The storage gate bundles the actual Svelte component and adapters into a disposable production fixture. Chromium exercises static HTTP hosting with real localStorage/IndexedDB and the unchanged Python snapshot service with real GET/PUT requests. The service subprocess uses an isolated temporary HOME. Tests remove that directory and stop both foreground-owned hosts. No real Documents snapshot directory was accessed.
- R5 assertions cover missing defaults, distinct tool settings, unknown nested values, and migration flags. R6 assertions cover generated names, overwrite/delete, same-name imports, accepted/rejected cross-tool confirmation, primary/accent payload round trips, view omission, and image/stamp asset omission. Numeric `stamp` remains a design parameter, matching Font Remixer.
- The UI case saves, restores, imports, downloads snapshot JSON, deletes, rejects an invalid font, uploads both valid faces, clears them, and restores them from a snapshot. The valid font is read from installed macOS Arial; nothing is copied into the repository. The test also supports installed Linux DejaVu Sans and Windows Arial, and fails explicitly if none exists.
- Initial new tests failed on an ambiguous locator, then exposed Svelte proxy objects reaching IndexedDB during snapshot font restore. The locator now uses exact labels; the component passes `$state.snapshot(snap)` across that boundary. Both failed logs remain as `task-4-storage.log` and `task-4-storage-2.log`. The final run passes without weakening assertions.
- `flowctl gate classify` returned FULL (exit 1), including the pre-existing untracked `.pi/flow-next.json`. No configured lint/format gate exists. `git diff --check` passed.
- Both user-owned Arrow Maze SHA-256 hashes match dispatch. Those edits remain unstaged; `.pi/` and `AGENTS.md` remain untracked. Implementation commit is `fc0196d284bd9f885e39379e9b4e8d27c8494c23`, based on `311a92ff6e0bdf7f436f705ca2dfecf36c97d7b4`.

Consumer contract and remaining scope:
- `browserPersistence()` provides settings, key/value, and fetch adapters. `settingsStore(slug, persistence)` merges saved values over defaults and preserves unknown saved keys on writes. Its result separates `params` and `view`; it keeps the compatible flat localStorage representation.
- `snapshots(slug, persistence)` provides list/save/load/remove/import/export. Save reads current persisted settings and both typeface keys. Callers persist current controls before saving. Uploaded image/stamp assets remain outside this settings API and the snapshot envelope. Service discovery validates the existing JSON `ok` response; static fallback needs no service. Existing local snapshot transfer keeps server name precedence and clears local entries only after successful service persistence.
- Mount `SnapshotsPanel` keyed by slug. It accepts persistence, accent support, onload, and onfontchange props. Task .5 owns binding it into the editor and translating restored params/assets to actual tool adapters. Typefaces retain `{family,file,dataURL}`; the browser loads faces with FontFace and removes component-owned faces on replacement/unmount.
- Root navigation is unchanged. No named-tool engine, editor controls, artwork export UI, cloud service, or new saved-data format was added. `test:integration` and native Rust tests were not run for this storage-only change. Full workspace integration remains unfinished. Malformed-import recovery is not claimed.
- Only Chromium is measured. Shared-service multi-writer conflict resolution remains the existing last-write behavior; no cloud synchronization guarantee is added. The installed-font test prerequisite is a portability limitation.

stage: impl-review - skipped(config: REVIEW_MODE=none)
Tier: session (jev-unavailable(no_key)) (model: gpt-6-astra, evidenced by PI_MODEL)

stage: plan-sync - skipped(config: planSync.enabled != true)
## Evidence
- Commits: fc0196d284bd9f885e39379e9b4e8d27c8494c23
- Tests: npm run build (exit 0; baseline and post-commit), npx playwright test tests/workspace/bootstrap.test.ts (exit 0; pre-edit baseline, 3 tests), npx playwright test tests/workspace/storage.test.ts (exit 0; post-commit, 3 tests), git diff --check (exit 0)
- PRs: