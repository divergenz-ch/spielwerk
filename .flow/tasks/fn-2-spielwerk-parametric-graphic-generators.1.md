---
satisfies: [R1, R9, R10, R11]
---
# fn-2-spielwerk-parametric-graphic-generators.1 Deliver the Arrow Maze Rust geometry, timing, and interaction adapter

## Description
Port the maze layout/time calculations and font-aware placement through the shared Rust contract. Preserve branch/clearance/word-placement boundaries and workspace word dragging; actual user-owned prototype files are read-only evidence.

**Size:** M
**Files:** `crates/spielwerk-engine/src/tools/mod.rs`, `crates/spielwerk-engine/src/tools/arrow_maze.rs`, `src/tools/arrow-maze.ts`, `tests/generators/arrow-maze.test.ts`
**Touches:** [crates/spielwerk-engine/src/tools/mod.rs, crates/spielwerk-engine/src/tools/arrow_maze.rs, src/tools/arrow-maze.ts, tests/generators/arrow-maze.test.ts, crates/spielwerk-engine/src/lib.rs, crates/spielwerk-engine/Cargo.toml, crates/spielwerk-engine/Cargo.lock]

### Approach

- Read the checked fn-1 foundation interfaces and use its dimensions/assets/seed/time and scene/output contracts. Register actual Rust tool computations and the Svelte adapter; prototype JS is not the new engine.
- Adapt the calculation entry points at the required source locations. Bind supported controls/interactions and existing artwork formats, preserving dimension limits and selected responsive preview exports.
- Add focused Rust and browser-adapter fixtures for the tool-specific requirements and boundary cases. Update the shared module registration deliberately; its overlap makes these tasks serial when needed.

### Investigation targets

**Required** (existing source evidence, read before coding):
- `tools/arrow-maze.embed.js:214-1113`
- `tools/arrow-maze.embed.js:1113-1218`
- `tools/arrow-maze.html:473-626`

### Key context

Listed application paths are proposed new paths. Foundation/sibling implementation
commits must exist in the checkout before consumption. Keep user-owned Arrow Maze
prototype edits intact. Source evidence confirms product intent, not a passing
Rust port or browser gate. Libraries/build details are selected and verified
inside the owning implementation task.

### Milestone gate

This entry task remains blocked until fn-1 foundation tasks .2 through .6
have verified done receipts and their commits are present here. Release requires
an authorized receipt check; it is not completion of fn-1.

The root Rust registration/manifest/lockfile write surface is shared.
Dispatch these writes serially rather than treating disjoint tool modules
as sufficient evidence for concurrent writers.

## Acceptance
- [ ] Use seeded fixtures with bend/arc, layer/polarity/panel/text combinations; assert collision/clearance behavior and allowed unplaced words. Compare repeated evaluation at fixed time and relayout at multiple supported dimensions. Drive word dragging through the browser adapter and verify static SVG plus PNG/GIF frame requests.
- [ ] Actual Rust/Wasm calculations, registered browser adapter, and ordinary supported artwork outputs pass their focused generator gate. Record exact commands/results and commit range.
- [ ] The handoff identifies delivered responsive/time/font capabilities and remaining website-runtime work. It does not mark fn-2 R12 delivered before fn-5.

## Done summary
Blocked:
# Workspace foundation prerequisite

This generator entry task is blocked until
fn-1-spielwerk-shared-design-workspace.2 through .6 have actual verified done
receipts for static Svelte serving, real Rust/Wasm boundary, compatible
saved-work/font state, grouped controls/artboards, and output orchestration.

Verify done statuses, relevant implementation commit ranges present here,
focused test results, applicable review receipts/configuration skips, and
limitations before an authorized release. Preserve this block history before
reset. Final fn-1.1 is not a prerequisite; foundation is an intermediate
handoff and does not complete the workspace.

No implementation evidence exists and no release is authorized by planning.
## Evidence
- Commits:
- Tests:
- PRs:
