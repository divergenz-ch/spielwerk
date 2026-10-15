# Spielwerk Tweakpane controls

## Goal

Replace the current native parameter surface with Tweakpane, as explicitly
requested after fn-6's retain-native outcome. Tweakpane adoption is now required,
not another library-selection exercise. Preserve the completed workspace layout,
preview, export, snapshot, and typeface behavior. Work locally on the current
branch; publication is not authorized.

## State ownership and implementation boundary

Svelte owns canonical parameters, assets, dimensions, time, and saved view state.
Tweakpane edits a disposable plain-object mirror. Normalize through controlValue,
write canonical changes once, refresh from restored state without feedback loops,
and dispose panes and listeners on unmount. Keep latestEvaluation and the export
activation-time capture unchanged.

Use the pinned stock package and public APIs. A small local integration may use
documented public element handles and standard semantic DOM attributes/events
for labels, keyboard behavior, and focus. Do not depend on private controllers,
internal CSS classes, a library fork, plugins, or third-party Svelte wrappers.
Do not ship a native/Tweakpane switch or duplicate editable parameter surfaces.
Native file inputs and non-parameter actions remain appropriate.

## Acceptance criteria

- **R1:** The built app visibly uses real Tweakpane folders and bindings for
  grouped numeric, choice, color, text, and toggle parameters. Pin the dependency
  and lockfile. Keep tool metadata and one compact control column. No rejected
  fallback: if a required behavior cannot be achieved within the boundary, report
  the exact blocker rather than silently retaining the native UI.
- **R2:** Preserve exact numeric entry, bounds, minimum-relative steps, decimal
  precision, keyboard increments, and keyboard-reachable per-number resets.
  Blank/nonfinite edits and invalid choices retain the last valid value.
  Color-like text remains text. Inputs have programmatic names, visible focus,
  and editing keys never activate workspace panning. Any localized public-element
  accessibility or input adapter must have browser regression coverage.
- **R3:** Canonical edits and full-detail preview updates occur during interaction,
  not only on release. Saved-state, snapshot, and tool restoration refresh controls
  and group expansion without duplicate callbacks or persistence loops. Repeated
  mounting disposes every pane/listener. Preserve retained/failed/current preview
  state, latest-only publication, navigation disposal, and immutable export capture.
- **R4:** Inspect the built Tweakpane UI at 1280 x 800, 1024 x 768, and 200% browser
  zoom. Controls and export remain reachable. Run the focused browser contracts,
  adapt affected interaction routes without reducing behavioral coverage, and
  perform a real edit/restore/download walkthrough. Record actual delivered JS
  size without treating the previously measured size increase as an adoption veto.
- **R5:** Update current repository guidance to describe Tweakpane integration and
  its maintenance boundary. Preserve the earlier stock evaluation as historical
  evidence; do not falsely claim its accessibility findings disappeared without
  implementation. No pending-generator completion, schema/engine/embed changes,
  new modes, or unrelated legacy-tool edits.

## Resolved via Research

The previous browser comparison tested Tweakpane 4.0.5 (MIT). Stock bindings
edited all required types and refreshed/disposed successfully, but unnamed
inputs and default fractional formatting failed the original unmodified-stock
gate. The new user instruction supersedes the retain-native choice.

Official binding documentation provides the public numeric format callback,
min/max/step, options, explicit text view, and color settings. Lifecycle docs
provide custom containers, binding change events during interaction, refresh,
visibility, and disposal. These are implementation tools, not proof of parity;
browser tests must establish the final behavior. Read installed public typings
before relying on element handles; do not use controller internals.

Sources: https://tweakpane.github.io/docs/input-bindings/ and
https://tweakpane.github.io/docs/misc/ . Prior measured evidence:
.flow/tasks/fn-6-spielwerk-minimal-creative-instrument.1.md and
.flow/tmp/fn-6-work/task-1-summary.md.

## Quick commands

```bash
npm run build
npx playwright test tests/workspace/controls.test.ts tests/workspace/exports.test.ts tests/workspace/storage.test.ts
```

Run other affected browser cases by file or test-name selection when their
control locators change. Do not run the full repository suite. No lint/format
script is configured. Preserve preexisting tools/arrow-maze.html,
tools/arrow-maze.embed.js, .pi/, AGENTS.md, and preview PID 47475.
