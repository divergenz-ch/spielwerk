---
satisfies: [R11]
---
# fn-1-spielwerk-shared-design-workspace.2 Establish the statically served Svelte editor and focused gates

## Description
Create the browser build/serve entry point and test runner before the Rust
boundary proof. This bootstrap delivers application infrastructure only.

**Size:** M
**Files:** `package.json`, `package-lock.json`, `index.html`, `vite.config.ts`, `src/main.ts`, `src/workspace/App.svelte`
**Touches:** [package.json, package-lock.json, index.html, vite.config.ts, src/main.ts, src/workspace/App.svelte, tests/workspace/bootstrap.test.ts, .gitignore]

### Approach

- Read the prototype catalog and approved static-host contract. Select/pin
  Svelte and static build/test dependencies; the listed Vite path is the
  proposed client-only build configuration, not an existing manifest.
- Establish build and focused workspace/integration script names, keeping
  sibling test script creation with the corresponding implementation tasks.
- Prove built assets and local development can mount the editor without a
  mandatory application backend. Do not advertise unfinished named tools.

### Investigation targets

**Required** (read before coding):
- `AGENTS.md`
- `README.md:3-47`
- `index.html:60-108`
- `serve.py`

### Key context

No app manifests or focused application harness exist at planning time.
Record that baseline as unavailable. Generated dependency lockfiles make
this bootstrap serial. Rust computation is proved by the next task.

Generated build outputs, dependencies, and Wasm glue need appropriate
ignore rules; their presence is not a source change to stage.

## Acceptance
- [ ] Pinned install/build/serve steps mount a Svelte browser entry point from static assets, without SSR or a mandatory backend.
- [ ] Focused bootstrap smoke tests exercise served/built asset resolution and the mounted UI; script contracts needed by later tasks are documented.
- [ ] Build and bootstrap gates pass after introduction. No absent-manifest baseline or unavailable named tool is reported as a passing application requirement.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
