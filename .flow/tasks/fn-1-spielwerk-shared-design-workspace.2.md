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
The Spielwerk root now mounts a Svelte browser workspace from static assets. The shell explicitly says design tools are unavailable; engine, storage, controls, exports, and final catalog integration remain with their owning tasks.

Measured validation:
- baseline: unavailable (no package.json, application build, or focused harness existed before editing). No planned application gate was counted as passing at baseline.
- `npm install` and `npx playwright install chromium` exited 0.
- `npm run test:bootstrap` exited 0, including production build and 3 Chromium smoke cases.
- `npm ci` exited 0 from the committed lockfile, with 0 vulnerabilities. npm reported an optional fsevents install-script approval warning; the following build and browser gate passed without approving it.
- `npm run test:workspace` exited 0 after the clean install, including production build and 3 Chromium smoke cases. Log: `.flow/tmp/work-20261014-fn1/task-2-workspace.log`.
- Tests navigate the real browser entry via Vite development, Python static HTTP at root, and Python static HTTP at `/workspace/`. They assert mounted headings, compiled styling, successful JavaScript/CSS MIME responses, no browser errors, and local asset requests without snapshot-service requests.
- `flowctl gate classify` returned 1 (FULL), selecting focused executable checks. No lint/format gate is configured.
- `git diff --check` passed. Pre-existing Arrow Maze hashes match the dispatch hashes; those files remain unstaged.

Script contracts and install/build/serve instructions live in `package.json` under `spielwerk`. `test:integration` reserves `tests/integration` and deliberately fails until final integration provides tests. Integration and Cargo gates were not run and are not claimed as passing. No sibling test scripts were introduced.

Changed source paths: `.gitignore`, `package.json`, `package-lock.json`, `index.html`, `vite.config.ts`, `src/main.ts`, `src/workspace/App.svelte`, `tests/workspace/bootstrap.test.ts`. The required pre-existing `.flow/` planning state was included in the implementation commit. `.pi/` and `AGENTS.md` remain untracked.

Route change: `/` now opens the foundation shell instead of the prototype iframe catalog. No feature map exists. README.md and CLAUDE.md still describe the prototype; their updates are outside this task's Touches. Built hosting serves `dist/`, not raw source HTML. Tests require Python 3 and Playwright Chromium; mobile and other browser engines were not checked.

stage: impl-review - skipped(config: REVIEW_MODE=none)
Tier: session (jev-unavailable(no_key)) (model: gpt-6-astra, evidenced by PI_MODEL)

stage: plan-sync - skipped(config: planSync.enabled != true)
## Evidence
- Commits: e8fca4d23dffb742c4282c48a0af3899f4a90dcb
- Tests: baseline: unavailable (application manifest and harness absent pre-edit), npm ci (exit 0), npm run test:bootstrap (exit 0; build and 3 browser cases), npm run test:workspace (exit 0; build and 3 browser cases after npm ci), git diff --check (exit 0)
- PRs: