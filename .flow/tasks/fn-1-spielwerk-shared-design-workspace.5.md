---
satisfies: [R1, R2, R3, R8, R14]
---
# fn-1-spielwerk-shared-design-workspace.5 Build grouped controls and fixed/responsive artboard views

## Description
Implement the shared editor against the checked state/adapter contract, leaving actual sibling artwork for its owners.

**Size:** M
**Files:** `src/workspace/App.svelte`, `src/workspace/Controls.svelte`, `src/workspace/Artboard.svelte`, `src/workspace/view.ts`, `tests/workspace/controls.test.ts`
**Touches:** [src/workspace/App.svelte, src/workspace/Controls.svelte, src/workspace/Artboard.svelte, src/workspace/view.ts, tests/workspace/controls.test.ts]

### Approach

- Reuse prototype control metadata and navigation intent with tool-specific links/default fallback; build grouped Svelte controls, exact numeric input, resets, and range handling.
- Keep dimension limits and exposed resize behavior tool-specific. Fixed/responsive mode passes real layout dimensions to the engine contract; zoom/pan affects only the view.
- Schedule expensive evaluations without lowering detail. Keep latest requested design/dimensions consistent with the displayed full-fidelity scene; preserve existing settings and view preferences.

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
TBD

## Evidence
- Commits:
- Tests:
- PRs:
