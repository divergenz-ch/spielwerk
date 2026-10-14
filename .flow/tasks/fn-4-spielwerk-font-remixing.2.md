---
satisfies: [R2]
---
# fn-4-spielwerk-font-remixing.2 Deliver Rust centerline skeleton and stamp geometry

## Description
Complete the second transform mode separately from source-font and output serialization contracts.

**Size:** M
**Files:** `crates/spielwerk-engine/src/fonts/skeleton.rs`, `crates/spielwerk-engine/src/fonts/stamps.rs`, `src/tools/font-remixer.ts`, `tests/fonts/stamps.test.ts`
**Touches:** [crates/spielwerk-engine/src/fonts/skeleton.rs, crates/spielwerk-engine/src/fonts/stamps.rs, src/tools/font-remixer.ts, tests/fonts/stamps.test.ts, crates/spielwerk-engine/src/lib.rs, crates/spielwerk-engine/src/fonts/mod.rs, crates/spielwerk-engine/Cargo.toml, crates/spielwerk-engine/Cargo.lock]

### Approach

- Use source contours from the checked font adapter to evaluate skeleton paths and stamp placements in Rust.
- Wire uploaded SVG stamps and available default stamps through browser asset handling; preserve stamp snapshot exclusions.
- Keep stamped artwork distinct from glyph-outline font output and publish the mode/capability restriction for the final exporter.

### Investigation targets

**Required** (existing source evidence, read before coding):
- `tools/font-remixer.html:305-565`
- `tools/font-remixer.html`

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
- [ ] Real glyph/stamp fixtures exercise skeleton placement and parameter changes at identical inputs/time.
- [ ] Default-stamp and uploaded-stamp browser paths produce calculated geometry; snapshot restore does not restore the uploaded stamp.
- [ ] Transform-mode tests retain different output capabilities; stamped artwork cannot be misrepresented as an installable font.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
