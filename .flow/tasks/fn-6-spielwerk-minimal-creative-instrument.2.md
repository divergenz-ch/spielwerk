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
Spielwerk now keeps the tool identity in a compact top strip and gives the
preview the remaining desktop space beside a scrollable control column.
Artboard and snapshot actions use labeled native disclosures; parameters,
export, and primary/accent typefaces remain independently reachable.

Tier: session (jev-unavailable(no_key)) (model: gpt-6-astra)
stage: impl-review - skipped(config: REVIEW_MODE=none)

### Scope and state

The three Svelte script blocks are byte-identical to the task base. Canonical
parameters, assets, view preferences, routing, font lifecycle, snapshot
callbacks, and export logic retain their existing owners. The diff changes
markup and CSS only. Disclosure state adds no persistence keys.
`task-2-state-ownership.json` records the script comparison.

The conductor explicitly expanded task .2 to disclosure-navigation updates in
`tests/workspace/bootstrap.test.ts`, `tests/workspace/exports.test.ts`, and
`tests/embeds/packages.test.ts`. The task's Files/Touches and Quick commands
were amended through `flowctl task set-spec` before those edits. Five added
navigation clicks preserve every existing assertion. No fixture or export
behavior changed. Commits are 5374ed7 and 1c3c1ea.

### Measured validation

Baseline was green before implementation. `npm run build` exited 0 and the
original controls/storage selection passed 10 tests. Logs are
`task-2-baseline-build.log` and `task-2-baseline-tests.log`.

Final gates passed with command exit code 0:

- `npm run build`. Log `task-2-gate-build.log`.
- `npx playwright test tests/workspace/controls.test.ts tests/workspace/storage.test.ts`.
  All 11 passed. Log `task-2-gate-tests.log`.
- `npx playwright test tests/workspace/bootstrap.test.ts tests/workspace/exports.test.ts`.
  All 7 passed. Log `task-2-route-tests.log`.
- `npx playwright test tests/embeds/packages.test.ts --grep 'package progress, immutable design'`.
  One selected test passed. Log `task-2-package-test.log`.
- `node .flow/tmp/fn-6-work/task-2-live.mjs before` and the same command with
  `after`. Built-app replay passed on disposable hosts and browser profiles.
- `git diff --check` passed. The staging area is empty.

The new controls test checks preview dominance at both R3 desktop sizes,
viewport containment, a single tool selector, Tab-reachable disclosures and
snapshot/typeface actions, visible focus, and unchanged saved state/artwork
when disclosures toggle. Existing tests retain numeric, resize, responsive,
pan, restore, callback, invalid-font, and payload assertions. Storage uploads
both font slots while snapshot management is closed, then verifies their
callbacks again after reopening and loading a snapshot. Existing
catalog tests and the live replay cover unknown-link fallback and pending
unavailability. The new disclosures require intentional navigation in tests;
one intermediate storage run failed because a role locator excluded a hidden
save button. Adding includeHidden retained its existing enabled assertion.

`gate classify` returned FULL (exit 1); it noticed the preexisting untracked
`.pi/flow-next.json`. This task also changes executable Svelte paths. No
lint/format command is configured. No full repository suite ran.

### Measured browser replay and screenshots

The feature map is absent. Live discovery used the built `/#arrow-maze` page.
The replay edited Seed to 84, selected fixed width 640, set view zoom to 50%,
uploaded Arial, saved/exported a snapshot, changed Seed to 126, cleared the
font, then loaded the snapshot. It also followed the pending tool route and
an unknown hash. Before/after design and view settings, normalized snapshot
payloads, font bytes, tool link, and rendered SVG compare identically.
Only the snapshot timestamp was omitted from the comparison.

`task-2-before-live.json`, `task-2-after-live.json`, and
`task-2-replay-comparison.json` contain the observations and hashes.
All artifact names in this summary resolve beside this file.

Inspected screenshots include:

- `task-2-before-1280.png` and `task-2-after-1280.png`.
- `task-2-after-1024.png` and `task-2-after-1024-export.png`.
- `task-2-after-1280-zoom200.png` and
  `task-2-after-1280-zoom200-preview.png`.
- `task-2-after-1024-zoom200-export.png` and
  `task-2-after-1024-zoom200-controls.png`.

The desktop screenshots show the full fitted artwork, neutral palette,
compact identity strip, and independently scrolling controls/export.
Actual Chromium tab zoom used chrome.tabs.setZoom(2) in a disposable browser
extension. getZoom returned 2; the 1280 x 800 viewport reported a 640 x 400
CSS viewport and devicePixelRatio 2. At both desktop sizes with 200% zoom,
keyboard Tab reached export, SVG downloads completed, and scrolling exposed
artboard controls, fonts, and the fitted preview. Zoom reflow uses normal
vertical scrolling. The extension and temporary profiles were deleted.

An initial Playwright scrolled screenshot at browser zoom captured blank
pixels despite successful interaction assertions. Those captures were not
accepted as visual proof. Raw CDP capture replaced them; the final scrolled
screenshots were opened and inspected. An early live probe also corrected
its Tool locator before producing the successful baseline replay.

### Boundaries

Both live runs had zero page exceptions. Static hosting retains the existing
optional `/snaps/ping` 404 behavior; bootstrap tests verify the expected
console responses. No new console failure was attributed to this change.
Independent review did not run under REVIEW_MODE=none.

Preexisting edits to `tools/arrow-maze.html` and `tools/arrow-maze.embed.js`,
untracked `.pi/` and `AGENTS.md`, and preview PID 47475 were preserved.
All hosts and browsers started by this worker exited. No publication,
delegation, saved-data migration, renderer change, or new dependency occurred.
Changed user routes are opening Artboard for dimensions and Snapshots for
snapshot actions; typefaces stay outside those disclosures.

stage: plan-sync - skipped(config: planSync.enabled != true)
## Evidence
- Commits: 5374ed73baccc3e52665d0b465dfaf6eac417e83, 1c3c1eae387281e53d6dd67ab438c0c258593355
- Tests: npm run build, npx playwright test tests/workspace/controls.test.ts tests/workspace/storage.test.ts, npx playwright test tests/workspace/bootstrap.test.ts tests/workspace/exports.test.ts, npx playwright test tests/embeds/packages.test.ts --grep 'package progress, immutable design', node .flow/tmp/fn-6-work/task-2-live.mjs before, node .flow/tmp/fn-6-work/task-2-live.mjs after, git diff --check
- PRs: