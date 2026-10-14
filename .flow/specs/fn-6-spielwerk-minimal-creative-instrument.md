# Spielwerk minimal creative instrument

## Goal & Context

People using Spielwerk must be able to choose a tool, adjust its parameters,
see the result, and export it without navigating decorative interface layers.
The work refines the existing desktop workspace. It preserves the delivered
eight generators and the existing contracts for pending tools.

The proposed direction is a preview-led workspace with one compact control
column, a short tool heading, and a directly available export action. Vanilla
Tweakpane is a candidate for parameter controls, subject to a parity gate.
Planning approval authorizes saving this plan only, not implementation.

## Architecture & Data Models

Keep the existing ownership boundaries throughout the UI changes.

- Svelte owns canonical parameters, assets, playback, and view preferences.
  A Tweakpane-bound object, if adopted, is a disposable editing mirror.
- Parameter edits pass through the existing normalization boundary. Restores
  refresh the controls without generating another edit or persistence loop.
- Rust/Wasm computes geometry and timing. The existing evaluation scheduler
  coalesces work and publishes only the latest full-detail result.
- Export captures current design inputs when activated, independently of
  preview completion. Zoom, pan, and control expansion remain view state.

No saved-data schema, engine interface, renderer, or embed runtime changes
are required. Native buttons and file inputs remain appropriate for actions
that are outside the parameter-control schema.

## Acceptance Criteria

The following criteria define the proposed design and its validation gates.

- **R1:** Evaluate stock Tweakpane against the existing native controls in
  the same browser fixture. Record the tested version, control-type coverage,
  keyboard/accessibility results, synchronization and disposal behavior, and
  delivered JavaScript size difference. Adopt it only if R2 passes with public
  APIs and no fork, plugin, third-party Svelte wrapper, or private-DOM patch.
  Errors: a failed parity gate retains native controls and records why;
  missing test infrastructure is a blocker, never a passing evaluation.
- **R2:** Grouped numeric, choice, color, text, and toggle controls retain
  their labels and direct feedback. Numeric controls support exact entry,
  step adjustment, and keyboard-reachable reset. Normalize relative to the
  declared minimum and step, clamp bounds, and retain the existing decimal
  precision. Tool changes, saved-state restoration, and snapshot loading keep
  displayed values synchronized with canonical values. Errors: blank or
  non-finite numeric edits retain the last valid value; invalid choices do
  not change it; hex-like text stays text; repeated mounting must not create
  duplicate listeners or edits. Focus remains visible and editing keys must
  not trigger workspace pan shortcuts.
- **R3:** The workspace presents one tool selector, the selected tool's name
  and short purpose, a dominant preview, and one compact control column.
  Parameters and export remain directly reachable; artboard and snapshot
  management use labeled disclosures, while typeface inputs remain reachable
  without opening snapshot management. Preserve tool links and all existing
  actions. Verify the layout at 1280 x 800 and 1024 x 768 desktop viewports.
  Errors: controls and export must remain reachable with scrolling and at
  200% browser zoom; an unknown tool link retains the current default-tool
  fallback; pending tools clearly state unavailability. No ornamental cards,
  gradients, decorative motion, icon-only essential actions, or new modes.
- **R4:** Control edits request full-detail updates during interaction rather
  than only on release. The preview distinguishes updating, current, and
  failed states. A retained older image is identified as such while updating
  or after failure; successful current rendering clears that indication.
  Errors: stale completions cannot replace newer work; evaluation or rendering
  failure must not label retained artwork current; the next valid edit can
  recover; navigation disposes pending publication. Playback must not flood
  the live region with frame-by-frame announcements.
- **R5:** Export uses one supported-format selector and one primary export
  action. The selected format remains the existing default until changed;
  this plan adds no preferred-format heuristic. Browser download is the
  default destination, with optional folder selection secondary. Export uses
  an immutable copy of current settings, selected artboard dimensions,
  assets, and time at activation, even when the preview is pending. The UI
  states that behavior when preview and settings differ. Errors: unsupported
  formats remain unavailable; duplicate activation is disabled while busy;
  progress and failures remain visible; folder cancellation retains the prior
  destination; folder-write failure retains download fallback and its warning.
  Download initiation must not claim a confirmed filesystem save. Keep the
  website-embed packaging guidance when that format is selected.

## Early proof point

Task fn-6-spielwerk-minimal-creative-instrument.1 validates the core approach
by comparing stock Tweakpane with the existing control fixture and proving
the selected implementation satisfies R2. If Tweakpane fails, re-evaluate
the control choice and validate the native path before continuing with
fn-6-spielwerk-minimal-creative-instrument.2+. Do not widen the dependency
or styling surface to force adoption.

## Boundaries

This work changes shared desktop interaction and hierarchy only.

- Preserve snapshots, typefaces, artboard controls, full-fidelity previews,
  supported exports, and existing storage compatibility.
- No new generators, extrusion/font algorithms, formats, presets, undo
  system, themes, dashboard, or plugin system.
- No mobile-editor project, Svelte replacement, Rust rewrite, saved-data
  migration, or change to visual-only website runtimes.
- No new cross-tab coordination, file-overwrite protocol, export cancellation
  system, or general storage-hardening project.
- Do not release or complete the existing whole-workspace integration owner.
  Its sibling delivery gates remain separate from this UI refinement.
- No implementation, commits, publication, or deployment in this planning run.

## Decision Context

The existing native controls already cover the required input types. Adding
Tweakpane is justified only if it provides a compact, maintainable parameter
surface without sacrificing precision or access. A small Svelte lifecycle
integration using its public API is compatible with the existing architecture.
A dependency that requires compensating UI machinery is not an improvement
for this request.

The parent fetched official Tweakpane documentation and package metadata.
They describe a dependency-free ES-module library; the retrieved package
version is 4.0.5 with an MIT license. Its public APIs cover numeric bounds and
steps, text/choice/color/toggle inputs, folders, custom containers, manual
refresh, and disposal. Documentation establishes plausibility, not browser
parity. No Tweakpane installation or executable probe ran during planning.

Sources are the [package metadata](https://www.npmjs.com/package/tweakpane),
[binding documentation](https://tweakpane.github.io/docs/input-bindings/), and
[lifecycle documentation](https://tweakpane.github.io/docs/misc/).

The current export pipeline already captures current settings rather than the
last displayed frame. Retain that behavior and explain pending-preview
exports; changing it would create an unnecessary second design-state owner.
The existing project decision retains Svelte UI and Rust/Wasm computation.

The repo, spec, and gap scouts completed. This is a bounded refinement of
existing behavior, not a replacement for the pending sibling implementations.
No new forward or reverse spec dependency was established. Existing final
integration remains responsible for ten-tool completion. Targeted guidance
for this UI must distinguish delivered behavior from those remaining gates.

## Memory findings

One project decision applies to the control-library evaluation.

| Track | Category | Entry | Why relevant |
| --- | --- | --- | --- |
| knowledge | decisions | rust-computation-engine-with-svelte-2026-10-13 | Retain Svelte state ownership, Rust computation, and full-fidelity previews. |

- Rust computation engine with Svelte browser UI constrains the integration;
  it does not establish a performance advantage or authorize data migration.

## Quick commands

After implementation, run the focused workspace checks for the changed
surfaces. These are planned commands, not results from this planning run.

```bash
npm run build
npx playwright test tests/workspace/controls.test.ts tests/workspace/exports.test.ts tests/workspace/storage.test.ts
```

Use the built app for a desktop browser walkthrough of a numeric edit,
restoration, pending/failed preview, and actual supported download. Inspect
screenshots and the console; preserve the current deterministic artwork for
identical inputs. No frame-rate target or speed improvement is claimed.

## Requirement coverage

| Req | Description | Task(s) | Gap justification |
| --- | --- | --- | --- |
| R1 | Evaluate stock Tweakpane against the existing native controls in the same browser fixture. Record the tested version, control-type coverage, keyboard/accessibility results, synchronization and disposal behavior, and delivered JavaScript size difference. Adopt it only if R2 passes with public APIs and no fork, plugin, third-party Svelte wrapper, or private-DOM patch. Errors: a failed parity gate retains native controls and records why; missing test infrastructure is a blocker, never a passing evaluation. | fn-6-spielwerk-minimal-creative-instrument.1, fn-6-spielwerk-minimal-creative-instrument.4 | — |
| R2 | Grouped numeric, choice, color, text, and toggle controls retain their labels and direct feedback. Numeric controls support exact entry, step adjustment, and keyboard-reachable reset. Normalize relative to the declared minimum and step, clamp bounds, and retain the existing decimal precision. Tool changes, saved-state restoration, and snapshot loading keep displayed values synchronized with canonical values. Errors: blank or non-finite numeric edits retain the last valid value; invalid choices do not change it; hex-like text stays text; repeated mounting must not create duplicate listeners or edits. Focus remains visible and editing keys must not trigger workspace pan shortcuts. | fn-6-spielwerk-minimal-creative-instrument.1 | — |
| R3 | The workspace presents one tool selector, the selected tool's name and short purpose, a dominant preview, and one compact control column. Parameters and export remain directly reachable; artboard and snapshot management use labeled disclosures, while typeface inputs remain reachable without opening snapshot management. Preserve tool links and all existing actions. Verify the layout at 1280 x 800 and 1024 x 768 desktop viewports. Errors: controls and export must remain reachable with scrolling and at 200% browser zoom; an unknown tool link retains the current default-tool fallback; pending tools clearly state unavailability. No ornamental cards, gradients, decorative motion, icon-only essential actions, or new modes. | fn-6-spielwerk-minimal-creative-instrument.2, fn-6-spielwerk-minimal-creative-instrument.4 | — |
| R4 | Control edits request full-detail updates during interaction rather than only on release. The preview distinguishes updating, current, and failed states. A retained older image is identified as such while updating or after failure; successful current rendering clears that indication. Errors: stale completions cannot replace newer work; evaluation or rendering failure must not label retained artwork current; the next valid edit can recover; navigation disposes pending publication. Playback must not flood the live region with frame-by-frame announcements. | fn-6-spielwerk-minimal-creative-instrument.3 | — |
| R5 | Export uses one supported-format selector and one primary export action. The selected format remains the existing default until changed; this plan adds no preferred-format heuristic. Browser download is the default destination, with optional folder selection secondary. Export uses an immutable copy of current settings, selected artboard dimensions, assets, and time at activation, even when the preview is pending. The UI states that behavior when preview and settings differ. Errors: unsupported formats remain unavailable; duplicate activation is disabled while busy; progress and failures remain visible; folder cancellation retains the prior destination; folder-write failure retains download fallback and its warning. Download initiation must not claim a confirmed filesystem save. Keep the website-embed packaging guidance when that format is selected. | fn-6-spielwerk-minimal-creative-instrument.3, fn-6-spielwerk-minimal-creative-instrument.4 | — |
