---
satisfies: [R1, R9, R10, R11]
---
# fn-2-spielwerk-parametric-graphic-generators.1 Deliver the Arrow Maze Rust geometry, timing, and interaction adapter

## Description
Port the maze layout/time calculations and font-aware placement through the shared Rust contract. Preserve branch/clearance/word-placement boundaries and workspace word dragging; actual user-owned prototype files are read-only evidence.

**Size:** M
**Files:** `crates/spielwerk-engine/src/tools/mod.rs`, `crates/spielwerk-engine/src/tools/arrow_maze.rs`, `src/tools/arrow-maze.ts`, `tests/generators/arrow-maze.test.ts`
**Touches:** [crates/spielwerk-engine/src/tools/mod.rs, crates/spielwerk-engine/src/tools/arrow_maze.rs, src/tools/arrow-maze.ts, tests/generators/arrow-maze.test.ts, crates/spielwerk-engine/src/lib.rs, crates/spielwerk-engine/Cargo.toml, crates/spielwerk-engine/Cargo.lock, package.json, src/engine/client.ts, src/main.ts, src/workspace/view.ts, src/workspace/Artboard.svelte, tests/workspace/bootstrap.test.ts, tests/workspace/exports.test.ts]

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

### Preserved foundation block history

The original block is retained below before resetting runtime state.

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

### Preserved startup block history

The startup observations are retained below before the authorized reset.

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

Blocked:
# Generator startup gate unavailable

BLOCKED: TOOLING_FAILURE
Task: fn-2-spielwerk-parametric-graphic-generators.1
Summary: Foundation release passed, but the planned focused generator gates
are not established in the delivered foundation checkout.
Impact: No fn-2 writer was dispatched; generator implementation has not begun.
Suggested resolution: Authorize a bounded generator-harness bootstrap with
package.json in the declared write surface, establish real browser and Rust
generator checks, then resume the Arrow Maze proof point.

Measured before any application edit at HEAD
`160bbc2446cbf073e51d47675df7d82f12086995`:

- `npm run test:generators` exited 1: missing script `test:generators`.
  Full log: `.flow/tmp/release-20261014/generator-gate-baseline.log`.
- `cargo test --manifest-path crates/spielwerk-engine/Cargo.toml tools`
  exited 0 but collected 0 tests, with 3 workspace cases filtered out.
  This is inconclusive, not a passing generator gate.
  Full log: `.flow/tmp/release-20261014/rust-tools-baseline.log`.
- `flowctl ready --spec fn-2-spielwerk-parametric-graphic-generators --json`
  showed .1 ready after the receipt-checked foundation release.
- `flowctl spec chain` reported eligible with no open dependency.

The historical foundation blocker and verified release evidence remain in
this task's preserved-history and authorized-release sections. This new
block is startup tooling, not a reversal of the foundation receipt check.
fn-3.1 and fn-4.1 remain eligible without implementation dispatch. fn-1.1,
fn-2.7, and fn-5.1 remain blocked on their original final-delivery gates.
No generator work, review verdict, completion, publication, or deployment
is claimed. The existing Arrow Maze edits are untouched.

stage: work - failed(TOOLING_FAILURE: focused generator harness unavailable)
stage: impl-review - skipped(config: review.backend=none; no implementation)

### Approved harness bootstrap and implementation bindings

The user replied "Ok i approve" to the request to approve generator-harness
bootstrap, including package.json in this task's write scope, then resume
Arrow Maze. This releases the startup tooling block, not downstream gates.

- Add the real focused generator command in package.json. Its gate must build
  the actual Wasm and collect generator browser cases. Zero-case collection
  is not a pass. Keep the missing-command and zero-Rust-test baseline
  observations as unavailable/inconclusive; do not relabel them green.
- Establish this tooling in a distinct bootstrap change, before the feature
  implementation. Red tests of the requested Arrow Maze behavior are valid
  pre-fix evidence, not permission to weaken tests or claim a green baseline.
- Use real tools-filtered Rust cases and the browser user surface to prove
  Arrow Maze, not the existing internal fixture as a substitute.
- src/engine/client.ts may expose the actual Arrow Maze Wasm call while
  preserving fixture behavior. src/main.ts may supply its ready registration
  and artwork handlers through App's existing catalog/exporter props; leave
  all other named tools pending. Final eight-tool registry integration remains
  with .7. Avoid changing App or the pending registry when existing props fit.
- src/workspace/view.ts and Artboard.svelte may provide the minimal optional
  interaction/playback binding needed for tool-owned word dragging and preview
  draw-in motion. The artboard still owns saved parameters, fonts, dimensions,
  and view state. Rust still owns calculations and explicit-time evaluation;
  do not maintain a second hidden design in the renderer. Existing adapters
  without these bindings must keep their behavior.
- tests/workspace/bootstrap.test.ts may update the deliberate root-content
  expectation from pending-only shell to actual Arrow Maze. Preserve hosting,
  asset, console, storage-exclusion, and unavailable-tool assertions by testing
  the delivered root behavior, not deleting the checks for convenience.
- Keep font-aware text and actual supported SVG/PNG/GIF outputs within this
  tool handoff. Do not declare an encoder ready from a request fixture alone.
  No fn-5 website package or fn-2 R12 delivery is claimed here.

The additional write paths are the necessary existing foundation consumer
seams for the original Arrow Maze acceptance, not new product scope.
The task remains a serial writer because it shares the Rust entry point.

### Consumer compatibility decision during implementation

The supervisor checked snapshots.ts and the consumer tests after the worker
reported a green Arrow Maze gate and two stale root-only expectations.
Automatic snapshot-service detection is existing foundation behavior and must
remain enabled. Do not introduce local-only root persistence, host metadata,
or an opt-in setting as part of this task.

The ready root now mounts the snapshot panel; the previous pending shell did
not. Bootstrap may recognize the same-origin /snaps/ping discovery request
explicitly, while still asserting successful hosting-relative assets, no page
errors or failed requests, and no unexpected snapshot API requests or writes.
A static host's expected 404 may be excluded only for that exact discovery
response and its matching resource-console message. Never ignore all 404s or
all console errors. Development hosts may return non-service content instead;
verify that service rejection and browser-local fallback work. Preserve the
static subdirectory asset checks while recognizing the existing origin-root
service endpoint. Existing service and local snapshot consumer tests remain
required evidence, with disposable service HOME, not real saved data.

tests/workspace/exports.test.ts is added to Touches solely for its two
pending-shell root expectations: assert the delivered Arrow Maze preview and
continued availability of SVG/PNG/GIF, then keep its internal-fixture output,
font, error, folder, and service/local assertions intact. This is the narrow
intentional root-content update required by the approved Arrow Maze delivery,
not authorization to weaken export checks or change persistence policy.

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

Blocked:
# Generator startup gate unavailable

BLOCKED: TOOLING_FAILURE
Task: fn-2-spielwerk-parametric-graphic-generators.1
Summary: Foundation release passed, but the planned focused generator gates
are not established in the delivered foundation checkout.
Impact: No fn-2 writer was dispatched; generator implementation has not begun.
Suggested resolution: Authorize a bounded generator-harness bootstrap with
package.json in the declared write surface, establish real browser and Rust
generator checks, then resume the Arrow Maze proof point.

Measured before any application edit at HEAD
`160bbc2446cbf073e51d47675df7d82f12086995`:

- `npm run test:generators` exited 1: missing script `test:generators`.
  Full log: `.flow/tmp/release-20261014/generator-gate-baseline.log`.
- `cargo test --manifest-path crates/spielwerk-engine/Cargo.toml tools`
  exited 0 but collected 0 tests, with 3 workspace cases filtered out.
  This is inconclusive, not a passing generator gate.
  Full log: `.flow/tmp/release-20261014/rust-tools-baseline.log`.
- `flowctl ready --spec fn-2-spielwerk-parametric-graphic-generators --json`
  showed .1 ready after the receipt-checked foundation release.
- `flowctl spec chain` reported eligible with no open dependency.

The historical foundation blocker and verified release evidence remain in
this task's preserved-history and authorized-release sections. This new
block is startup tooling, not a reversal of the foundation receipt check.
fn-3.1 and fn-4.1 remain eligible without implementation dispatch. fn-1.1,
fn-2.7, and fn-5.1 remain blocked on their original final-delivery gates.
No generator work, review verdict, completion, publication, or deployment
is claimed. The existing Arrow Maze edits are untouched.

stage: work - failed(TOOLING_FAILURE: focused generator harness unavailable)
stage: impl-review - skipped(config: review.backend=none; no implementation)
## Evidence
- Commits:
- Tests:
- PRs:

