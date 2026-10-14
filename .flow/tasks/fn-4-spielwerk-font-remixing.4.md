---
satisfies: [R4]
---
# fn-4-spielwerk-font-remixing.4 Deliver installable OTF and point-compatible master bundles

## Description
Prove actual font-output validity and compatible master topology as the final font-remixer delivery gate.

**Size:** M
**Files:** `crates/spielwerk-engine/src/fonts/output.rs`, `src/tools/font-remixer.ts`, `tests/fonts/output.test.ts`, `tests/integration/font-output.spec.ts`
**Touches:** [crates/spielwerk-engine/src/fonts/output.rs, src/tools/font-remixer.ts, tests/fonts/output.test.ts, tests/integration/font-output.spec.ts, crates/spielwerk-engine/src/lib.rs, crates/spielwerk-engine/src/fonts/mod.rs, crates/spielwerk-engine/Cargo.toml, crates/spielwerk-engine/Cargo.lock]

### Approach

- Serialize simplification-mode glyph outlines in Rust using the checked contour/metric contract and selected font-output tooling.
- Deliver actual OTF files and the two-master bundle with axis endpoint/instructions; the external variable-font compilation remains outside this tool.
- Reject centerline font export through capability-aware UI/output handling; do not count stamped visual shapes as font outlines.

### Investigation targets

**Required** (existing source evidence, read before coding):
- `tools/font-remixer.html:565-601`
- `tools/font-remixer.html:730-749`
- `tools/export.js:9-101`

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
- [ ] An independent parser and browser FontFace loading validate emitted OTF glyph/metric data; a source assertion or file extension alone is insufficient.
- [ ] Emitted masters preserve per-glyph point order/count compatibility, with the second endpoint matching the selected simplification; the bundle contains the promised axis/instructions.
- [ ] Centerline font-output rejection and shared visible output failure handling are tested. No built-in finished variable-font compiler or variable-source editing is added.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
