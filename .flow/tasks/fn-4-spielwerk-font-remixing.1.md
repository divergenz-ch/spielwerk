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

### Preserved foundation block history

The original block is retained below before resetting runtime state.

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

### Authorized foundation gate release

The user requested: "Release the verified foundation gates and start
fn-2-spielwerk-parametric-graphic-generators". Receipt check at
2026-10-14T13:40:37.851Z, checkout `160bbc2446cbf073e51d47675df7d82f12086995`:

- `fn-1-spielwerk-shared-design-workspace.2`: done; implementation commits `e8fca4d23dffb742c4282c48a0af3899f4a90dcb` are ancestors of HEAD. Focused tests are recorded in its done receipt.
- `fn-1-spielwerk-shared-design-workspace.3`: done; implementation commits `2d4c208c21def6c9b8cdb8a0708f3b555a05378c` are ancestors of HEAD. Focused tests are recorded in its done receipt.
- `fn-1-spielwerk-shared-design-workspace.4`: done; implementation commits `fc0196d284bd9f885e39379e9b4e8d27c8494c23` are ancestors of HEAD. Focused tests are recorded in its done receipt.
- `fn-1-spielwerk-shared-design-workspace.5`: done; implementation commits `7994cad373c263b035f07ba828164b2daaaec62e`, `edc371352ed1388cf3ff15446b0ad2eaf497e85a`, `7a152a16c545c62818adc17a6b2de3002c8c85fc` are ancestors of HEAD. Focused tests are recorded in its done receipt.
- `fn-1-spielwerk-shared-design-workspace.6`: done; implementation commits `1a5ac2e33b8e067ce4b6b858a85ad5d80a569854` are ancestors of HEAD. Focused tests are recorded in its done receipt.

All five receipts explicitly record
`stage: impl-review - skipped(config: REVIEW_MODE=none)`.
Reviewed the task-2 through task-6 handoffs and task-6 final logs:
19 Chromium workspace cases and 3 native workspace tests passed. These
are existing measured receipts, not a new test run. Foundation fixtures
prove interfaces, not named-tool computations or real artwork codecs.

This releases only the foundation prerequisite. fn-3 and fn-4 become
eligible, but no workers for those specs are authorized in this run.
The fn-1 final owner, fn-2 final catalog, and fn-5 embed gates stay blocked.

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
