---
satisfies: [R2, R3, R4, R5]
---
# fn-5-spielwerk-responsive-arrow-maze-embeds.1 Deliver independent host sizing and Rust-backed visual playback

## Description
Prove the runtime can resize and evaluate actual delivered generator computations without loading the editor.

**Size:** M
**Files:** `src/embeds/runtime.ts`, `src/embeds/playback.ts`, `src/embeds/resize.ts`, `tests/embeds/runtime.test.ts`
**Touches:** [src/embeds/runtime.ts, src/embeds/playback.ts, src/embeds/resize.ts, tests/embeds/runtime.test.ts]

### Approach

- Consume the actual fn-2 generator handoff and foundation scene/time/font contract; browser observers/scheduling stay outside Rust calculation.
- Implement host-box sizing and applicable playback/seek lifecycle with offscreen/reduced-motion behavior. Keep Arrow Maze fit/cell semantics tool-specific.
- Expose visual-only consumers for all eight generators; do not transfer pointer, widget, drag or text editing adapters or import the Svelte workspace.

### Investigation targets

**Required** (existing source evidence, read before coding):
- `tools/arrow-maze.embed.js:1220-1360`
- `tools/arrow-maze.embed.js:1356-1357`
- `tools/arrow-maze.html:572-617`

### Key context

Listed application paths are proposed new paths. Consume the checked fn-1
foundation contract and prerequisite commits, rather than recreating shared
storage, control, or export machinery. Library decisions require implementation
probes and current documentation. Preserve the original successful-input
boundaries and all user-owned prototype edits.

### Milestone gate

This entry task stays blocked until fn-1 foundation tasks .2-.6 and fn-2
generator handoff tasks .1-.6 have verified done receipts, supported layout/
time/font/artwork capabilities, and their commits present in the checkout.
fn-2 final task .7 is deliberately not an entry prerequisite. Preserve block
history and check evidence before an authorized manual release.

## Acceptance
- [ ] Independent-host runtime tests call real generator Rust/Wasm adapters at multiple box sizes and identical explicit seek times; responsive composition genuinely relayouts.
- [ ] Maze fit/cell/default-height and playback/host control scenarios pass, including offscreen and reduced-motion transitions; tools without motion remain still.
- [ ] All-eight-tool runtime fixtures render full fidelity with no editor UI or visitor-editing capability.

## Done summary
Blocked:
# Actual foundation and generator handoff prerequisites

This embed entry task is blocked until foundation tasks
fn-1-spielwerk-shared-design-workspace.2 through .6 and actual generator
handoff tasks fn-2-spielwerk-parametric-graphic-generators.1 through .6 have
verified done receipts. The handoff must include all eight tools' applicable
Rust layout, explicit-time, font and supported-artwork capabilities.

Verify done statuses, prerequisite commit ranges present in this checkout,
actual focused tests, applicable review outcomes, and limitations before an
authorized release. Preserve block history before reset.
Do not require fn-2 final task .7: it waits for these actual embed packages.
Do not mark fn-2 or fn-1 complete at their prerequisite handoffs.

No implementation evidence or release authorization exists at planning time.
## Evidence
- Commits:
- Tests:
- PRs:
