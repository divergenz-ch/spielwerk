---
satisfies: [R2, R3]
---
# fn-3-spielwerk-logo-extrusion.2 Integrate extrusion materials, lighting, and explicit-time motion

## Description
Complete the scene/time consumer against the checked geometry and shared Svelte control contract.

**Size:** M
**Files:** `crates/spielwerk-engine/src/logo/appearance.rs`, `crates/spielwerk-engine/src/logo/motion.rs`, `src/tools/logo-extruder.ts`, `tests/logo/appearance.test.ts`
**Touches:** [crates/spielwerk-engine/src/logo/appearance.rs, crates/spielwerk-engine/src/logo/motion.rs, src/tools/logo-extruder.ts, tests/logo/appearance.test.ts, crates/spielwerk-engine/src/lib.rs, crates/spielwerk-engine/Cargo.toml, crates/spielwerk-engine/Cargo.lock]

### Approach

- Implement material/metal and lighting evaluation plus spin/rock/orbit/axis calculations in Rust. Keep browser rendering separate.
- Wire controls and optional background assets using the foundation state/input contract; no uploaded logo/background is added to snapshots.
- Use explicit time for preview and export frames rather than callback counts; keep every displayed scene full fidelity.

### Investigation targets

**Required** (existing source evidence, read before coding):
- `tools/logo-extruder.html:405-525`
- `tools/logo-extruder.html:562-599`

### Key context

Listed application paths are proposed new paths. Consume the checked fn-1
foundation contract and prerequisite commits, rather than recreating shared
storage, control, or export machinery. Library decisions require implementation
probes and current documentation. Preserve the original successful-input
boundaries and all user-owned prototype edits.

The root Rust registration/manifest/lockfile write surface is shared.
Dispatch these writes serially rather than treating disjoint tool modules
as sufficient evidence for concurrent writers.

## Acceptance
- [ ] Material/light and axis/motion fixture tests assert actual changes to calculated output and reproducibility at identical inputs/time.
- [ ] Control-driven previews use the delivered Rust scene, including optional background/no-background paths and vector-only bevel availability.
- [ ] Snapshot restore tests prove logo/background exclusions and the fixed-board contract remains intact.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
