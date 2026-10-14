---
satisfies: [R1, R2]
---
# fn-6-spielwerk-minimal-creative-instrument.1 Prove and select the parameter-control implementation

Touches: package.json, package-lock.json, src/workspace/Controls.svelte, src/workspace/Artboard.svelte, tests/workspace/controls.test.ts

## Description
Evaluate stock Tweakpane in the existing control fixture, then retain the simplest implementation that passes R1 and R2. This is the early proof point for the remaining UI work.

**Size:** M
**Files:** `package.json`, `package-lock.json`, `src/workspace/Controls.svelte`, `src/workspace/Artboard.svelte`, `tests/workspace/controls.test.ts`
**Touches:** [package.json, package-lock.json, src/workspace/Controls.svelte, src/workspace/Artboard.svelte, tests/workspace/controls.test.ts]

### Approach

- Record the native baseline before changing controls. Use the disposable Vite/Svelte fixture pattern in `tests/workspace/controls.test.ts:15-83`, including real Wasm and page-error capture. Compare identical edit sequences and normalized engine inputs, not screenshots alone.
- Probe Tweakpane 4.0.5 using its stock bindings, folders, and buttons. Compare numeric, choice, text, color, and toggle behavior, accessible names, focus, reset, fractional steps with a nonzero minimum, empty edits, and installed build size. Use a disposable directory before retaining any dependency. Record actual version and results in the task evidence.
- If the gate passes, integrate the public API within `Controls.svelte` and pin the dependency/lockfile. Keep the existing props and callback boundary. Use a local binding mirror rather than binding the pane directly to Svelte proxies. Normalize through `controlValue`, guarding blank edits before conversion.
- Refresh the mirror on restored settings and snapshots without writing them back; preserve expanded groups; dispose on unmount. Force text bindings to text so color-like strings are not auto-detected as colors. Keep pointer and keyboard reset behavior available.
- Update the workspace shortcut guard only as required for the selected controls. Space on buttons, summaries, pane widgets, and text editors must not activate panning; keep canvas Space-and-drag behavior.
- If parity needs a fork, plugin, wrapper package, or private-DOM patch, discard the candidate and dependency changes. Retain native controls, apply the bounded numeric/shortcut fixes, and validate that path before continuing. Do not ship two selectable control implementations.

### Investigation targets

Read the required sources before coding.

**Required:**
- `src/workspace/Controls.svelte:1-46` supplies the current input and callback contract.
- `src/workspace/view.ts:52-63` owns min-relative normalization and restore handling.
- `src/workspace/Artboard.svelte:80-85,205-218` owns view expansion, parameter commits, and shortcut handling.
- `tests/workspace/controls.test.ts:15-83,102-150,215-242` supplies the fixture, restore checks, and stale-result assertions.
- `package.json:54-61` identifies the installed Svelte/Vite dependency baseline.

**Optional:**
- `src/engine/contracts.ts:32-36` defines the supported control types.

### Key context

Tweakpane v4 uses `addBinding`, not the older `addInput`. External value changes require `refresh`; components and panes expose `dispose`. The public docs also expose `view: 'text'` for color-like strings. Sources: https://tweakpane.github.io/docs/input-bindings/ and https://tweakpane.github.io/docs/misc/. The parent fetched docs but did not run this probe.

The interface must remain readable without a custom skin. No DESIGN.md exists. Preserve labels, contrast, and visible focus; use stock pane styling if adopted.

### Quick commands

Run the focused proof after installing only the selected dependency.

```bash
npm run build
npx playwright test tests/workspace/controls.test.ts
```

## Acceptance
- [ ] Record the actual candidate version, license, parity matrix, lifecycle results, and JavaScript byte delta against the native baseline; state adopt or retain-native with evidence for R1.
- [ ] Extend the browser fixture to exercise R2 boundaries, keyboard/reset behavior, color-like text, snapshot restoration, and repeated tool mounting; no assertion is weakened merely to fit the library.
- [ ] Identical normalized designs reach the existing engine and restore without duplicate callbacks; pending evaluations still publish only the latest result.
- [ ] Focused controls tests and a real-browser inspection pass for the selected implementation; retain no rejected dependency or temporary probe artifact.

## Done summary
Users retain native parameter controls with valid-value recovery and keyboard reset.
Stock Tweakpane 4.0.5 (MIT) failed the accessibility/precision parity gate, so
package.json and package-lock.json remain unchanged.

Tier: session (jev-unavailable(no_key)) (model: gpt-6-astra)
stage: impl-review - skipped(config: REVIEW_MODE=none)

### Selection evidence

Measured in Chromium with the existing disposable Svelte/App fixture, real Wasm,
and page-error capture. The candidate used only Pane, addFolder, addBinding,
addButton, refresh, and dispose. A plain mirror forwarded edits through
controlValue; text explicitly used view: 'text'. DOM queries observed stock
widgets but did not patch them. No wrapper, plugin, fork, or skin was retained.

| Probe | Native baseline | Stock Tweakpane 4.0.5 | Selected native |
| --- | --- | --- | --- |
| Numeric, choice, color, text, toggle | All edit canonical params | All edit canonical params | All pass |
| Accessible input labels | Six of six named inputs | Zero of six named inputs; visible labels are unassociated | Six named inputs retained |
| Exact 43; cell step 5, minimum 10 | Canonical/display 45 | Canonical/display 45 | 45 |
| Fraction minimum .15, step .2 | .35 displayed .35; .46 becomes .55 | .35 displayed .3; .46 canonical .55 displayed .6 | Exact .55; clamp .15/1.15 |
| Fraction ArrowUp after .55 | Canonical/display .75 | Canonical .75 displayed .8 | Canonical/display .75 |
| Empty numeric input | Incorrectly becomes minimum | Retains last valid value | Retains valid value without edit callback |
| Non-finite input, invalid choice | Added tests expose native recovery gaps | Not separately qualified after rejection | Browser-sanitized 1e309 and invalid choice retain canonical/display values, zero edits |
| Color-like text #aabbcc | Text preserved | Text preserved with view: 'text' | Preserved through restore/remount |
| Pointer reset | Pass | Pass | Pass, including existing range double-click |
| Space reset | Blocked by shared Artboard shortcut | Same inherited shortcut blocks reset | Activates reset; summaries toggle; text retains Space |
| Focus | Native auto outline | Focusable, tabindex 0; input outline/shadow none | Visible native outline observed in browser screenshot |
| Snapshot restore | Restores values | Restores values via mirror refresh | Browser snapshot and saved-tool restores pass |
| Three unmount/remount cycles | One evaluation per subsequent text edit | One evaluation per subsequent text edit; no duplicate widgets | Direct Controls harness records exactly one edit each cycle |
| Restore callbacks | App restore produces three evaluations | Same three evaluations as native | Direct Controls restore emits zero edit callbacks |
| Page errors | None | None | None |

Decision: retain-native. Unnamed stock inputs fail R2 without DOM repair.
The observed fractional display mismatch is an additional stock-default gap;
no compensating custom control implementation was pursued.

Measured production JS totals using identical Vite entrypoints and base sources:
- Native baseline: 137,635 bytes (49,074 gzip).
- Candidate: 284,813 bytes (79,084 gzip).
- Candidate delta: +147,178 bytes (+30,010 gzip).
- Selected native final: 137,841 bytes (49,136 gzip), +206 bytes (+62 gzip).
- Same lib-mode fixture delta: +173,786 bytes (+32,975 gzip). This fixture
  includes inlined Wasm and is separate from the production-delivery comparison.
- Disposable installed Tweakpane directory occupied 560 KiB on this filesystem.

Raw measurements are in task-1-probe-results.json, task-1-fraction-results.json,
task-1-production-bytes.json, and task-1-selected-bytes.json beside this summary.
Candidate/native screenshots are task-1-candidate.png and task-1-native.png.
Disposable dependency directories, build trees, and probe scripts were deleted.
No rejected dependency or probe implementation remains in the shipped tree.

### Implementation and validation

Svelte/Artboard still owns canonical params; controlValue retains minimum-relative
rounding, clamping, and decimal precision. Controls guards blank edits before
conversion, suppresses unchanged callbacks, and restores rejected choice display.
The Space guard now excludes buttons, summaries, links, and text editors while
preserving canvas panning and Escape cancellation from focused resize handles.

Measured baseline: green. npm run build exited 0; the original controls suite
passed 4 tests. Logs: task-1-baseline-build.log and task-1-baseline-controls.log.

Measured final: npm run build exited 0; npx playwright test
 tests/workspace/controls.test.ts exited 0, 7 tests passed, zero page errors.
Logs: task-1-final-build.log and task-1-final-controls.log. No lint/format command
is configured. gate classify selected FULL (exit 1); only task-focused gates ran.

R2 coverage in tests/workspace/controls.test.ts:
- Numeric boundary table covers nonzero minimum, fractional step, clamping,
  empty/overflow edits, exact entry, and immediate slider keyboard edits.
- Keyboard test covers Tab-reachable reset, visible focus, Space activation,
  disclosure toggling, text entry, and no accidental pan.
- Restore/remount test covers every displayed type, hex-like text, collapsed
  group preservation, invalid choices, zero restore/rejection callbacks, and
  exactly one callback per subsequent edit across three mounts.
- Existing real-Wasm catalog/snapshot tests and latest-result assertions remain.
  Canvas pan still asserts the same displacement and unchanged artwork/design.
  Its setup now clicks canvas padding rather than starting Space on a button,
  matching R2's deliberately changed shortcut contract. Escape resize rollback
  also retains its original dimensions.

Measured browser inspection used the built /#arrow-maze page at 1280x800 with a
fresh profile and disposable static host. Base blank Seed became 1 and Space
reset left 84; selected blank Seed stays 42 and Space reset returns 42. Snapshot
and tool-switch restoration return 84; focus outline remains visible. Inspected
screenshots: task-1-live-base.png and task-1-live-head.png. Raw observations:
task-1-live-results.json. The live run covered c089fb7; the final b90f162 change
only narrows the new guard to preserve Escape, proven by the focused browser test.
The feature map is absent; route discovery used /#arrow-maze.

Both base and head static hosting emit the existing optional /snaps/ping 404
once per tool mount. Snapshot fallback works; this console noise is inherited
and was recorded, not changed. No page exceptions occurred. Probe setup first
needed Vite's native minifier instead of optional esbuild; early probe locator
attempts hit hidden stock widgets. Neither attempt was counted as a passing
parity observation; final measurement runs completed.

### Defect route

The selected native corrections are bounded to the observed input/shortcut gaps.
- Prior fixes: affected-file git history inspected; bug-memory search returned
  no matches. PR/tracker sources unchecked because no reported cross-repo defect
  or known-good release was supplied for this control-selection task.
- Diagnosis: browser observations confirmed empty string conversion to minimum,
  rejected choice remaining visually empty, and shared Space prevention blocking
  native button activation. The controlValue formula itself remained correct.
- Introduced by: skipped; no known-good revision.
- Base: new focused tests failed all three cases before implementation, recorded
  in task-1-red-controls.log and committed as 7da95d5. Head: all 7 pass.
- Live: built Arrow Maze base/head observations above reproduce and close blank
  input and keyboard-reset failures. Canvas Escape/pan retain browser coverage.

Only task .1 implementation files and its lifecycle receipt are committed.
Preexisting tools/arrow-maze.html, tools/arrow-maze.embed.js, .pi/, AGENTS.md,
parent spec files, and sibling task files remain untouched and unstaged.
No publication, delegation, or independent review ran. No follow-up code was
added outside this task's control-editing boundary.

stage: plan-sync - skipped(config: planSync.enabled != true)
## Evidence
- Commits: 7da95d562975c09c75738bd878f7de7ebaa7e900, c089fb7368198ed8c25aeb01fced6c306471bc01, b90f1621921b4682e49ccecca9afedd2b52a5491
- Tests: baseline: green - npm run build (exit 0); npx playwright test tests/workspace/controls.test.ts (exit 0, original 4 tests), npm run build (exit 0; task-1-final-build.log), npx playwright test tests/workspace/controls.test.ts (exit 0, 7 passed; task-1-final-controls.log), node .flow/tmp/fn-6-work/task-1-probe.mjs (final exit 0; task-1-probe-results.json; rejected Tweakpane 4.0.5), node .flow/tmp/fn-6-work/task-1-size.mjs (exit 0; task-1-production-bytes.json), node .flow/tmp/fn-6-work/task-1-fraction-probe.mjs (exit 0; task-1-fraction-results.json), node .flow/tmp/fn-6-work/task-1-live.mjs (final exit 0; task-1-live-results.json; disposable scripts cleaned after capture)
- PRs: