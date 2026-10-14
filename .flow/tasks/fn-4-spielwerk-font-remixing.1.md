---
satisfies: [R1, R2]
---
# fn-4-spielwerk-font-remixing.1 Deliver static-font glyph parsing and Rust outline simplification

## Description
Prove the source-glyph and simplification boundary using real static-font input before direct editing or font serialization.

**Size:** M
**Files:** `crates/spielwerk-engine/src/fonts/source.rs`, `crates/spielwerk-engine/src/fonts/simplify.rs`, `src/tools/font-remixer.ts`, `tests/fonts/simplify.test.ts`
**Touches:** [crates/spielwerk-engine/src/fonts/source.rs, crates/spielwerk-engine/src/fonts/simplify.rs, src/tools/font-remixer.ts, tests/fonts/simplify.test.ts, crates/spielwerk-engine/src/lib.rs, crates/spielwerk-engine/src/fonts/mod.rs, crates/spielwerk-engine/Cargo.toml, crates/spielwerk-engine/Cargo.lock]

### Approach

- Read the shared font-input contract; preserve source bytes and static TTF/OTF capability. Select/validate font parsing and contour representations in Rust.
- Port simplification calculations and emitted glyph geometry; browser code loads input and renders evaluated results.
- Keep sample-text state and glyph metrics available to later editor/output consumers. A missing source font does not invent a rendered-font result.

### Investigation targets

**Required** (existing source evidence, read before coding):
- `tools/font-remixer.html:305-565`
- `tools/fontpick.js:14-53`

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
- [ ] Real TTF and OTF fixtures yield repeatable glyph geometry and metrics through the Rust/Wasm caller.
- [ ] Simplification tests verify changed outline detail, preserved correspondence needed by later master output, and parameter-boundary behavior.
- [ ] Browser source-loading/no-loaded-font paths and focused transform tests pass; no installable/master output is claimed yet.

## Done summary
Blocked:
# Workspace foundation prerequisite

This font-transform entry task is blocked until
fn-1-spielwerk-shared-design-workspace.2 through .6 have verified done
receipts and their implementation commits are available here.
Check fixed-board/control, compatible primary/accent font and snapshot
state, Rust/browser, and shared output contracts, focused tests, applicable
review outcomes, and limitations before authorized release. Preserve block
history before reset. fn-1's final integration is downstream of this tool.

No implementation receipts or release authorization exist at planning time.
## Evidence
- Commits:
- Tests:
- PRs:
