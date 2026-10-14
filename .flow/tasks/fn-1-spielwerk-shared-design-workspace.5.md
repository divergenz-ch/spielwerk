---
satisfies: [R1, R2, R3, R8, R14]
---
# fn-1-spielwerk-shared-design-workspace.5 Build grouped controls and fixed/responsive artboard views

## Description
Implement the shared editor against the checked state/adapter contract, leaving actual sibling artwork for its owners.

**Size:** M
**Files:** `src/workspace/App.svelte`, `src/workspace/Controls.svelte`, `src/workspace/Artboard.svelte`, `src/workspace/view.ts`, `tests/workspace/controls.test.ts`
**Touches:** [src/workspace/App.svelte, src/workspace/Controls.svelte, src/workspace/Artboard.svelte, src/workspace/view.ts, tests/workspace/controls.test.ts, src/workspace/SnapshotsPanel.svelte]

### Approach

- Reuse prototype control metadata and navigation intent with tool-specific links/default fallback; build grouped Svelte controls, exact numeric input, resets, and range handling.
- Keep dimension limits and exposed resize behavior tool-specific. Fixed/responsive mode passes real layout dimensions to the engine contract; zoom/pan affects only the view.
- Schedule expensive evaluations without lowering detail. Keep latest requested design/dimensions consistent with the displayed full-fidelity scene; preserve existing settings and view preferences.

- Correct the dependency's default-font cleanup in `SnapshotsPanel.svelte`: navigation must not pass an absent face to `document.fonts.delete`. This bounded correction was exposed by task .5's browser navigation tests; preserve regression coverage and avoid unrelated snapshot changes.

### Investigation targets

**Required** (existing source evidence, read before coding):
- `index.html:60-108`
- `tools/sliders.js:10-35`
- `tools/zoom.js:20-321`
- `tools/stripe-marquee.html:145-233`
- `tools/arrow-maze.html:473-490`

### Key context

Listed application paths are proposed new paths. Foundation/sibling implementation
commits must exist in the checkout before consumption. Keep user-owned Arrow Maze
prototype edits intact. Source evidence confirms product intent, not a passing
Rust port or browser gate. Libraries/build details are selected and verified
inside the owning implementation task.

## Acceptance
- [ ] Control, navigation, reset, and range-boundary tests call the Svelte UI with the registered metadata and checked deterministic engine fixture.
- [ ] Artboard tests exercise aspect presets, swap, ratio lock, supported handles, pan/zoom separation, and container dimension changes within each tool's declared limits.
- [ ] The eight generator capabilities enable responsive mode; Logo Extruder and Font Remixer remain fixed. Fixture relayout differs from merely magnifying fixed output.
- [ ] Delayed evaluation tests never substitute a reduced-detail scene or let an older control result replace the latest requested composition. Named-tool end-to-end acceptance remains in the final owner.

## Done summary
The shared editor now consumes registered tool controls, renders complete engine frames, and separates fixed or responsive layout from zoom and pan. The root catalog still marks every named tool unavailable; browser acceptance uses an explicitly internal Rust/Wasm fixture.

Measured evidence:
- Baseline green. `npm run build` and `npx playwright test tests/workspace/bootstrap.test.ts` exited 0 before edits; the latter ran 3 cases. Logs are `task-5-baseline-build.log` and `task-5-baseline-workspace.log` beside this summary.
- Final `npm run build` exited 0. `npx playwright test tests/workspace/controls.test.ts tests/workspace/storage.test.ts tests/workspace/bootstrap.test.ts` exited 0 with 10 passing cases. Logs are `task-5-verify-build.log` and `task-5-verify-workspace.log`.
- The four new cases mount the actual Svelte App on a disposable static HTTP host and call `evaluateFixture` through real Wasm. They cover catalog selection, hash navigation/default fallback, descriptions/links, all five control types, exact entry, slider changes, reset, range/step boundaries, tool-local persistence, snapshot load, and view preference restoration.
- Artboard assertions cover presets, swap, ratio locking at limits, eight enabled handles with keyboard movement, pointer resize, zoom/pan without evaluation, and ResizeObserver container changes. A 120 x 80 fixture has six 20-unit rectangles; a 200 x 80 responsive fixture has ten rectangles of the same width. Responsive layout reaches Rust rather than scaling the prior scene. Fixed dimensions survive switching modes.
- The capability case checks the eight generator IDs and both fixed exceptions, then mounts the internal fixture with each registered capability declaration. This verifies shared UI gating, not the ten named engines.
- The delayed-evaluation case holds a real full-detail frame, changes controls and dimensions, and observes only the latest ten-rectangle scene replacing the prior six-rectangle scene. Intermediate requests coalesce, stale results never publish, and engine inputs omit view state.
- All four new cases assert no browser page errors. The unchanged storage cases also pass, including the optional service with an isolated temporary HOME and real font upload. No user snapshot directory was accessed. Hosts stop and temporary fixture directories are removed by test teardown.
- `flowctl gate classify` returned FULL (exit 1), including pre-existing untracked `.pi/flow-next.json`. No lint/format command is configured. Final `git diff --check` passed. The conductor's task-spec amendment contained a trailing blank line when first staged; no application whitespace errors remain.
- Both user-owned Arrow Maze hashes exactly match dispatch. Those edits remain unstaged; `.pi/` and `AGENTS.md` remain untracked. No source outside the amended Touches changed.

Consumer handoff:
- `view.ts` exports `EditorTool` and `CatalogEntry`. Supply `App` with a catalog containing pending entries or ready editor registrations. The default remains `registry.ts` with all entries pending. The supervisor approved this minimal browser registration seam because the existing engine contract does not declare browser rendering or control exposure.
- A ready registration provides its slug, name, description, real `ToolAdapter`, `Renderer<Scene, HTMLElement>`, `accent` flag, and `artboard` metadata. Artboard metadata declares `initial` dimensions, whether dimension controls appear, supported ratio strings in `presets`, `swap`, `ratioLock`, and the exact `handles` directions. Limits, controls, defaults, and responsive capability come directly from the adapter. No named-tool metadata was invented.
- The renderer receives the complete engine frame and a fresh detached HTML target. It paints that frame synchronously; the editor atomically replaces the displayed target only for the latest requested result. Geometry stays in the adapter. A future renderer with external resources must supply its own ownership strategy; no renderer-disposal API exists in the shared contract.
- `Artboard` owns tool-local parameters, assets, current layout, and view preferences. It persists controls synchronously before snapshot save. Legacy `wpx`/`hpx`, `vw`/`vh`, `responsive`, `lock`, and `seed` feed layout; `zoom` (percent or `fit`), `pan`, and expanded groups stay in view storage. Existing `open` preferences are read. Snapshot restore preserves current view preferences.
- `SnapshotsPanel` is keyed by slug through the keyed editor. Primary/accent data URLs become binary engine assets with distinct roles. Image and stamp input remain with their owners.
- `latestEvaluation` serializes evaluations, keeps only the latest queued request, suppresses stale completion/errors, and disposes on tool changes. Each request is a full-detail design snapshot. The last complete frame and its own dimensions remain visible while updating. This task evaluates still previews at explicit time zero; animation playback and named-tool renderers remain outside this shared-control acceptance.
- Changed user route: the root now offers a tool selector and `#<slug>` links, showing pending-tool purpose and availability. Ready registrations mount the editor. No feature-map files were edited.

Defect route:
- prior fixes: local history shows `fc0196d` introduced the snapshot panel; no prior fix was found. Remote PR/tracker checks were not run for this bounded local defect. The supervisor inspected the failure and amended task .5 Touches to permit the correction.
- diagnosis: browser navigation/unmount threw `TypeError` from `FontFaceSet.delete` after default fonts assigned undefined entries. The source sweep found the other two font-delete calls already guarded; only unmount cleanup was unguarded.
- introduced by: skipped bisect; no known-good revision of this newly introduced panel was supplied.
- base: `task-5-controls-3.log` captures failing navigation and repeated mounting with unchanged dependency cleanup. Commit `7994cad` retains the regression before the fix. Head: `edc3713` guards absent faces; `task-5-controls-storage.log` reports 7 passing cases. Final head `7a152a1` passes all 10 affected cases.
- live: Chromium drove the actual Svelte selector, hash navigation, and panel unmount on the disposable static app. The final run records zero page errors.

Earlier new-test corrections:
- The first fixture registration used underscores, violating the existing snapshot slug contract. Test registration slugs now use `internal-fixture` and `internal-fixed-fixture`; the Rust adapter retains its required `__fixture__` ID.
- Exact select-label lookups exposed label text including option text; controls now carry explicit accessible labels.
- The new rectangle-width expectation was initially 30. Rust source uses `cell / 2`, so it now asserts 20 for 40-unit cells. Responsive rectangle counts and equal-size invariants remain strict. Failed logs `task-5-controls.log`, `task-5-controls-2.log`, and `task-5-controls-3.log` are retained.

Remaining scope:
- Only Chromium is measured. `test:integration` remains unavailable until final real-tool integration. Native Rust tests were not rerun for this browser-only consumer change; the browser fixture exercised the existing compiled Rust engine.
- Named-tool calculations, readiness, artwork/export encoders, playback orchestration, and final end-to-end acceptance remain with their existing owners. No publication or sibling admission occurred.

stage: impl-review - skipped(config: REVIEW_MODE=none)
Tier: session (jev-unavailable(no_key)) (model: gpt-6-astra, evidenced by PI_MODEL)

stage: plan-sync - skipped(config: planSync.enabled != true)
## Evidence
- Commits: 7994cad373c263b035f07ba828164b2daaaec62e, edc371352ed1388cf3ff15446b0ad2eaf497e85a, 7a152a16c545c62818adc17a6b2de3002c8c85fc
- Tests: npm run build (exit 0; task-5-verify-build.log), npx playwright test tests/workspace/controls.test.ts tests/workspace/storage.test.ts tests/workspace/bootstrap.test.ts (exit 0; 10 passed; task-5-verify-workspace.log), baseline: green - npm run build; npx playwright test tests/workspace/bootstrap.test.ts (3 passed)
- PRs: