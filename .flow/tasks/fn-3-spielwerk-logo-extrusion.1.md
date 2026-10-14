---
satisfies: [R1, R2]
---
# fn-3-spielwerk-logo-extrusion.1 Deliver vector-bevel and raster-slice Rust extrusion geometry

## Description
Prove the actual extrusion geometry handoff for both demonstrated input representations before material/motion/output integration.

**Size:** M
**Files:** `crates/spielwerk-engine/src/logo/geometry.rs`, `crates/spielwerk-engine/src/logo/mod.rs`, `src/tools/logo-extruder.ts`, `tests/logo/geometry.test.ts`
**Touches:** [crates/spielwerk-engine/src/logo/geometry.rs, crates/spielwerk-engine/src/logo/mod.rs, src/tools/logo-extruder.ts, tests/logo/geometry.test.ts, crates/spielwerk-engine/src/lib.rs, crates/spielwerk-engine/Cargo.toml, crates/spielwerk-engine/Cargo.lock]

### Approach

- Reuse svgShapes/build source behavior as evidence; select and validate vector triangulation/bevel versus raster slice representations in Rust.
- Pass loaded asset data through the foundation asset contract and keep the no-upload starting composition. Attach fixed-board metadata and bounded geometry controls.
- Expose calculated geometry to the renderer without promising editable 3D/model interchange. Rust computation must be demonstrable from the browser caller.

### Investigation targets

**Required** (existing source evidence, read before coding):
- `tools/logo-extruder.html:314`
- `tools/logo-extruder.html:405-525`

### Key context

Listed application paths are proposed new paths. Consume the checked fn-1
foundation contract and prerequisite commits, rather than recreating shared
storage, control, or export machinery. Library decisions require implementation
probes and current documentation. Preserve the original successful-input
boundaries and all user-owned prototype edits.

### Milestone gate

This entry task remains explicitly blocked until fn-1 foundation tasks
.2 through .6 have verified done receipts and their commits exist in this
checkout. Check focused tests and applicable review outcomes before an
authorized release; preserve block history before reset. Final fn-1.1 is
not this task's prerequisite.

The root Rust registration/manifest/lockfile write surface is shared.
Dispatch these writes serially rather than treating disjoint tool modules
as sufficient evidence for concurrent writers.

## Acceptance
- [ ] Real vector and raster fixtures exercise the distinct bevel/slice paths and depth controls using emitted geometry assertions.
- [ ] Browser upload and no-upload/default scenarios call the actual Rust geometry adapter; output dimensions follow the fixed-board metadata.
- [ ] Focused Rust/browser geometry tests pass and establish the material/motion handoff without introducing model exports.

## Done summary
Blocked:
# Workspace foundation prerequisite

This extrusion entry task is blocked until
fn-1-spielwerk-shared-design-workspace.2 through .6 have verified done
receipts and their implementation commits are available here.
Check fixed-board/control, asset/snapshot-exclusion, Rust/browser, and
PNG/GIF orchestration contracts, focused tests, applicable review outcomes,
and limitations before an authorized release. Preserve block history before
reset. Do not wait for fn-1's final whole-workspace acceptance.

No implementation receipts or release authorization exist at planning time.
## Evidence
- Commits:
- Tests:
- PRs:
