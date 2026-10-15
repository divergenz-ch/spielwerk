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
Readers can now distinguish the built Svelte/Rust workspace from retained
single-file tools and follow the delivered choose/edit/preview/export workflow.
The authoring and engine guides record the native-control decision and separate
eight delivered generators from pending extrusion, font remixing, and final
integration.

Tier: session (jev-unavailable(no_key)) (model: gpt-6-astra)
stage: impl-review - skipped(config: REVIEW_MODE=none)

### Scope and investigation

Only README.md, CLAUDE.md, and src/engine/README.md changed in implementation
commit 21eb184. Base is 584bb40cde7cab5174c1ba277f79d10207a6f492.
The lifecycle receipt is separate. No executable code or test assertion changed.

Similar-content search found legacy root guidance, the engine boundary guide,
and task .1-.3 receipts. This change extends those guides and reuses the
measured receipts rather than creating another documentation surface. Required
sources, package scripts, actual catalog merging, export handling, and the
final integration owner's scope were read before editing. The architecture
memory confirms Svelte state ownership and Rust computation without a speed
claim.

README now documents the current root/hash entrypoint, setup/build/preview
commands, parameter and export hierarchy, Artboard and Snapshots disclosures,
independent typeface inputs, retained-preview status, activation-time export,
folder cancellation/fallback, download initiation, and website ZIP guidance.
Legacy serving, snapshot storage, phone layout, and p5 embed instructions retain
an explicit legacy scope. The removed root-manifest instruction no longer
matches index.html.

CLAUDE records stock Tweakpane 4.0.5's concrete label and fractional-display
failures, measured Chromium behavior and bundle sizes, public-API probe
lifecycle, and the selected native ownership boundary. It does not introduce
a dependency, a second UI option, or an accessibility/performance guarantee.
The engine guide retains the probe and ownership contract while correcting
pending-tool and embed status. Final ten-tool integration remains with
fn-1-spielwerk-shared-design-workspace.1; no approval boundary changed.

### Verification

Baseline: green for scoped documentation checks. Before editing,
`git diff --check -- README.md CLAUDE.md src/engine/README.md` exited 0, and
Python assertions verified package script names and focused-test paths. No
lint or format script is configured. Runtime baseline evidence was reused
from the supplied preceding handovers, as this task explicitly requires.

Measured final checks exited 0:

- `python3 .flow/tmp/fn-6-work/task-4-doc-check.py`. Its log confirms three
  scoped docs, seven local links/anchors, nine npm script references, referenced
  paths, eight registrations, UI labels, typeface placement, and the recorded
  JavaScript byte delta. See task-4-doc-check.log beside this summary.
- `git diff --check 584bb40cde7cab5174c1ba277f79d10207a6f492 HEAD -- README.md CLAUDE.md src/engine/README.md`.
- Scope and staging inspection showed exactly the three authorized docs in the
  implementation diff and an empty staging area after commit.

`gate classify --base 584bb40cde7cab5174c1ba277f79d10207a6f492` returned FULL
(exit 1), identifying the preexisting untracked .pi/flow-next.json. See
 task-4-classify.log. This is not recorded as a tier-B classification or a
failed suite. Per the task-specific documentation verification instruction,
no executable suite was rerun for these Markdown changes. No fabricated
GATE_SKIPPED tier-B receipt was emitted.

Reused evidence, explicitly not new measurements:

- Task .1's native/Tweakpane comparison and task-1-production-bytes.json;
  selected native controls passed seven focused tests.
- Task .2's task-2-gate-tests.log, 11 controls/storage tests passed, plus its
  recorded 1280 x 800, 1024 x 768, and actual 200% browser zoom walkthrough.
- Task .3's task-3-final-tests.log, 16 controls/export tests passed, its build
  receipt, real Arrow Maze SVG download, and retained-preview failure cases.
  The task-3-built-export.png screenshot was reopened and inspected against
  the written hierarchy, Artboard, format selector, and download message.

Source inspection independently confirms activation-time structured cloning,
format filtering, folder cancellation and write fallback, and pending catalog
fallback. No new browser session, installation, performance measurement, or
runtime parity claim was made. Existing external reference links in the engine
guide were unchanged; new local links and their anchors were checked.

### Boundaries and follow-up

The preexisting Arrow Maze diff still hashes to
50b5046f8e20da11c8b5d5e6420a4fd89353ec143625e4ab10086026c9917443,
matching preexisting-arrow-maze.patch. Untracked .pi/ and AGENTS.md remain
unstaged and untouched. Preview PID 47475 was not touched. No processes were
started, no publication or delegation occurred, and no new test was needed
for this documentation-only task.

Found, outside scope: package.json's descriptive testContracts text still says
integration has no tests, although tests/integration/generators.spec.ts now
exists. The engine guide names that actual limited generator/embed coverage;
the package metadata was not edited. Independent review did not run under
REVIEW_MODE=none. No claim of final ten-tool acceptance is made.

stage: plan-sync - skipped(config: planSync.enabled != true)
## Evidence
- Commits: 21eb184ee761a65a0da18c2933bbf8e3d7a7490e
- Tests: baseline: green - scoped documentation diff, package script names, and focused-test paths checked before editing; prior executable evidence reused per task, python3 .flow/tmp/fn-6-work/task-4-doc-check.py (exit 0; task-4-doc-check.log), git diff --check 584bb40cde7cab5174c1ba277f79d10207a6f492 HEAD -- README.md CLAUDE.md src/engine/README.md (exit 0), gate classify --base 584bb40cde7cab5174c1ba277f79d10207a6f492 (FULL, exit 1: preexisting .pi/flow-next.json; task-specific docs checks used; no tier-B claim), Reused, not rerun: task-3-final-tests.log (16 controls/export tests passed), task-2-gate-tests.log (11 controls/storage tests passed), task-1 comparison and size evidence
- PRs: