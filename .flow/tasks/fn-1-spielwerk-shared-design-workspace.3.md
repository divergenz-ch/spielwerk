---
satisfies: [R11, R12, R13]
---
# fn-1-spielwerk-shared-design-workspace.3 Prove the static Svelte and Rust/Wasm adapter contract

## Description
Establish the checked foundation boundary consumed by every sibling. This is the early proof point, not a named-tool implementation.

**Size:** M
**Files:** `crates/spielwerk-engine/Cargo.toml`, `crates/spielwerk-engine/src/lib.rs`, `src/engine/client.ts`, `src/workspace/registry.ts`, `tests/workspace/engine.test.ts`
**Touches:** [crates/spielwerk-engine/**, src/engine/**, src/workspace/registry.ts, tests/workspace/engine.test.ts, package.json, .gitignore, crates/spielwerk-engine/Cargo.lock]

### Approach

- Build on the checked Svelte bootstrap. Select and pin Rust binding/rendering/font-input tooling with a disposable real-Wasm probe; wire its build/test commands into the existing scripts. Fetch current official APIs during implementation.
- Define the shared tool metadata, dimension/asset, scene/frame, explicit-time, and capability contract. Register the ten tool identities without claiming unfinished calculations as delivered.
- Exercise actual Rust/Wasm computation through an internal deterministic fixture and a statically served Svelte caller. Introduce no JavaScript proxy engine or mandatory backend.

### Investigation targets

**Required** (existing source evidence, read before coding):
- `AGENTS.md`
- `README.md:3-47`
- `CLAUDE.md:49-105`
- `index.html:60-108`

### Key context

Listed application paths are proposed new paths. Foundation/sibling implementation
commits must exist in the checkout before consumption. Keep user-owned Arrow Maze
prototype edits intact. Source evidence confirms product intent, not a passing
Rust port or browser gate. Libraries/build details are selected and verified
inside the owning implementation task.

Generated build outputs, dependencies, and Wasm glue need appropriate
ignore rules; their presence is not a source change to stage.

## Acceptance
- [ ] A reproducible build emits and serves the browser app and Wasm assets; both static and local-server loading paths call actual Rust computation.
- [ ] Identical fixture inputs, dimensions, seed, and explicit time reproduce geometry/timing; changing dimensions is demonstrably different from scaling a fixed image.
- [ ] The adapter contract separates design and view state, fixed/responsive capabilities, supported output formats, and rendering from computation. All sibling task input/output expectations are documented.
- [ ] Build and focused Rust/browser boundary tests pass. Record absent pre-bootstrap manifests as unavailable baseline, not a passing app gate; the newly introduced commands must pass before done.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
