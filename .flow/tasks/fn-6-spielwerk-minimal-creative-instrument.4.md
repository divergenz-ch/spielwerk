---
satisfies: [R1, R3, R5]
---
# fn-6-spielwerk-minimal-creative-instrument.4 Document the instrument workflow and evaluation outcome

Touches: README.md, CLAUDE.md, src/engine/README.md

## Description
Publish targeted local guidance for R1, R3, and R5 after the actual control decision and UI behavior are known. This task writes repository documentation only; it does not publish a site or release the existing final integration gate.

**Size:** M
**Files:** `README.md`, `CLAUDE.md`, `src/engine/README.md`
**Touches:** [README.md, CLAUDE.md, src/engine/README.md]

### Approach

- Update the current-app entrypoint and short choose/edit/preview/export instructions in README. Distinguish the built Svelte/Rust workspace from the retained legacy single-file tools; do not delete useful legacy instructions without identifying their scope.
- Record the measured control-library outcome and its maintenance boundary in CLAUDE.md. If Tweakpane is adopted, document public lifecycle integration and the dependency version actually tested. If rejected, record the concrete failed gate without adding a second UI option.
- Correct the engine guide's stale claim that every named tool is pending. Keep its probe/engine ownership contract and name remaining pending capabilities accurately.
- Explain current-settings export during preview lag, folder/download behavior, and where snapshot/typeface actions now live. Keep broader ten-tool final integration documentation with the existing fn-1 owner.
- Check all changed command examples against package.json and the preceding task evidence. Do not claim unrun checks, all-tool completion, a performance improvement, or runtime parity based on documentation alone.

### Investigation targets

Read the required sources before editing.

**Required:**
- `README.md:3-47` contains legacy serving and export guidance.
- `CLAUDE.md:3-18,30-47,107-114` contains the old authoring and export conventions.
- `src/engine/README.md:3-6` contains stale pending-tool status.
- `package.json:9-51` is the current source for build, development, and focused-test commands.

**Optional:**
- `src/tools/registry.ts:12-18` identifies the delivered generator registrations.
- `.flow/tasks/fn-1-spielwerk-shared-design-workspace.1.md:17-25,94-114` preserves the separate final integration owner's scope and gates.

### Key context

Use the docs-writer skill. The doc changes must describe completed task evidence, not planned behavior. The architecture decision remains Svelte UI plus Rust/Wasm; no new setup platform or documentation site is needed.

### Verification

Check changed paths and links, command names, delivered/pending claims, and instructions against the actual built UI. Reuse the preceding focused test evidence; this docs-only task does not need to rerun the entire test suite.

## Acceptance
- [ ] Current-app and legacy instructions are explicitly distinguished, and the documented workflow matches the delivered hierarchy and export messages.
- [ ] The Tweakpane decision names the actual tested outcome and ownership/lifecycle constraints without making unsupported performance or accessibility claims.
- [ ] Setup/test command names and links match the repository; delivered and pending tools are described accurately.
- [ ] Existing final integration ownership and approval boundaries remain unchanged; the diff contains only the three scoped documentation files.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
