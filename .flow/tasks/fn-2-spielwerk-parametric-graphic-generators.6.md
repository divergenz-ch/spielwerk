---
satisfies: [R8, R9, R10, R11]
---
# fn-2-spielwerk-parametric-graphic-generators.6 Deliver Stripe Marquee Rust stripe/text geometry and timing

## Description
Implement font-derived stripe geometry, column/shear and direction/scroll calculations through Rust, preserving the existing text-as-stripe product contract and uploaded-font bytes.

**Size:** M
**Files:** `crates/spielwerk-engine/src/tools/mod.rs`, `crates/spielwerk-engine/src/tools/stripe_marquee.rs`, `src/tools/stripe-marquee.ts`, `tests/generators/stripe-marquee.test.ts`
**Touches:** [crates/spielwerk-engine/src/tools/mod.rs, crates/spielwerk-engine/src/tools/stripe_marquee.rs, src/tools/stripe-marquee.ts, tests/generators/stripe-marquee.test.ts, crates/spielwerk-engine/src/lib.rs, crates/spielwerk-engine/Cargo.toml, crates/spielwerk-engine/Cargo.lock]

### Approach

- Read the checked fn-1 foundation interfaces and use its dimensions/assets/seed/time and scene/output contracts. Register actual Rust tool computations and the Svelte adapter; prototype JS is not the new engine.
- Adapt the calculation entry points at the required source locations. Bind supported controls/interactions and existing artwork formats, preserving dimension limits and selected responsive preview exports.
- Add focused Rust and browser-adapter fixtures for the tool-specific requirements and boundary cases. Update the shared module registration deliberately; its overlap makes these tasks serial when needed.

### Investigation targets

**Required** (existing source evidence, read before coding):
- `tools/stripe-marquee.html:235`
- `tools/stripe-marquee.html:312`
- `tools/fontpick.js:14-53`

### Key context

Listed application paths are proposed new paths. Foundation/sibling implementation
commits must exist in the checkout before consumption. Keep user-owned Arrow Maze
prototype edits intact. Source evidence confirms product intent, not a passing
Rust port or browser gate. Libraries/build details are selected and verified
inside the owning implementation task.

### Milestone gate

The first checked generator proves the concrete adapter; same-spec deps
apply. Shared Rust module registration and any lockfile/generated outputs
prevent concurrent overlapping writers even within a potential wave.

The root Rust registration/manifest/lockfile write surface is shared.
Dispatch these writes serially rather than treating disjoint tool modules
as sufficient evidence for concurrent writers.

## Acceptance
- [ ] Use real font/text fixtures to check that stripe geometry carries the lettering and changes with column/shear/direction controls. Verify reproducible times, relayout and baked/embedded appearance, plus supported SVG/PNG/GIF scene requests.
- [ ] Actual Rust/Wasm calculations, registered browser adapter, and ordinary supported artwork outputs pass their focused generator gate. Record exact commands/results and commit range.
- [ ] The handoff identifies delivered responsive/time/font capabilities and remaining website-runtime work. It does not mark fn-2 R12 delivered before fn-5.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
