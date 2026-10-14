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
Foundation consumers now have a typed Rust/browser adapter contract and a reproducible, pinned Wasm build. The internal Svelte page at `/src/engine/probe.html` evaluates Rust geometry and font bytes on Vite and plain static hosting, including a hosting subdirectory; all ten named tools remain explicitly pending.

Measured validation:
- baseline: green for existing `npm run build` and `npm run test:workspace` (3 bootstrap browser tests). Logs are `task-3-baseline-build.log` and `task-3-baseline-workspace.log` in this directory. The pre-edit Cargo manifest and engine/browser boundary gate were unavailable, not passing.
- A disposable real-Wasm probe compiled wasm-bindgen 0.2.129 and ttf-parser 0.25.1, returned 7 columns for 300/40, and parsed local Arial bytes with unitsPerEm 2048. Official binding deployment, font Face APIs, and SVG documentation were fetched before implementation; source URLs are in `src/engine/README.md`.
- Rust 1.98.0 and wasm32-unknown-unknown installation, binding CLI installation, and Cargo lock generation exited 0. Build checks the binding CLI version, uses the crate-local compiler pin and locked dependencies, and emits a separate Wasm asset. Existing ignore rules already cover targets, pkg glue, and dist.
- `npm run test:engine` exited 0 after the implementation commit. It includes the production app/Wasm build, 3 native Rust tests, and 5 Chromium tests. Full log is `task-3-verify-engine.log`.
- `npx playwright test tests/workspace/bootstrap.test.ts` exited 0 after the implementation commit (3 tests). Full log is `task-3-verify-bootstrap.log`.
- Browser assertions exercise actual Svelte rendering on development/static-root/static-subdirectory paths, repeatable geometry and explicit time, responsive relayout (6 versus 10 cells without scaling cell width), font-byte parsing and invalid-font rejection, Wasm MIME/URL resolution, and failure when the Wasm request is blocked. No JavaScript proxy engine supplies results.
- The initial new browser test counted Vite's `?import&url` JavaScript wrapper as a second binary response. It failed 1 of 5 tests. The response filter now distinguishes the URL-wrapper module from the binary, while retaining exact binary count, MIME, and status checks. `task-3-engine.log` preserves the failed run; the final gate passes all cases.
- `flowctl gate classify` returned 1 (FULL). Executable engine/build paths changed; no lint/format gate is configured. `cargo fmt` and `git diff --check` passed.
- User-owned Arrow Maze files retain both dispatch SHA-256 hashes and remain unstaged. `.pi/` and `AGENTS.md` remain untracked. No feature map was edited.

Contract and limits:
- `src/engine/contracts.ts` separates design/assets from zoom/pan/panels, explicit time from rendering, and fixed/responsive and output-format capabilities. Actual adapters must provide defaults, controls, limits, and Rust evaluation. `src/engine/README.md` documents all foundation/generator/extrusion/font/embed handoffs.
- `src/workspace/registry.ts` records the ten identities, purposes, owners, and intended format limits without invented dimension limits or ready engines.
- The selected foundation renderer is native SVG through Svelte. The font probe demonstrates ttf-parser metrics, not shaping, WOFF decoding, transformed glyphs, or generated font validity. The committed font fixture is authored minimal sfnt metadata, not a third-party font.
- No named-tool engine, storage, controls, artwork encoder, export UI, or embed package was implemented. `test:integration` was not run and is not claimed to pass. Final integration, full tool calculations, and their format-specific rendering/encoding remain with their owners.
- Only Chromium was measured. No cross-browser raster identity, performance advantage, CSP-host compatibility, or mobile-editor support is claimed. Root navigation remains the task .2 shell; the new route is the internal computation proof.

stage: impl-review - skipped(config: REVIEW_MODE=none)
Tier: session (jev-unavailable(no_key)) (model: gpt-6-astra, evidenced by PI_MODEL)

stage: plan-sync - skipped(config: planSync.enabled != true)
## Evidence
- Commits: 2d4c208c21def6c9b8cdb8a0708f3b555a05378c
- Tests: npm run test:engine, npx playwright test tests/workspace/bootstrap.test.ts, git diff --check
- PRs: