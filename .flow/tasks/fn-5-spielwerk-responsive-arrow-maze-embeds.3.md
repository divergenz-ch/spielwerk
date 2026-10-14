---
satisfies: [R1, R2, R3, R4, R5]
---
# fn-5-spielwerk-responsive-arrow-maze-embeds.3 Verify website embed delivery and downstream handoff receipts

## Description
Establish the real independent-host delivery receipt that releases generator final acceptance and workspace final integration.

**Size:** M
**Files:** `tests/embeds/hosts.spec.ts`, `tests/embeds/playback.spec.ts`, `src/embeds/packages.ts`
**Touches:** [tests/embeds/hosts.spec.ts, tests/embeds/playback.spec.ts, tests/embeds/package-fixture.ts, tests/embeds/packages.test.ts, src/embeds/**]

### Approach

- Drive actual exported packages for all eight tools independently of the workspace, using multiple container sizes and explicit-time playback scenarios.
- Assert supported motion/still behavior, editor/visitor interaction separation, self-hosted assets/typefaces, and Maze-specific fit/playback controls.
- Record completed task ranges/tests and remaining host limitations; source presence or one Arrow Maze runtime does not establish all-eight-tool delivery.

### Investigation targets

**Required** (existing source evidence, read before coding):
- `tools/arrow-maze.embed.js:1220-1360`
- `tools/arrow-maze.html:572-617`
- `README.md:16-35`

### Key context

Listed application paths are proposed new paths. Consume the checked fn-1
foundation contract and prerequisite commits, rather than recreating shared
storage, control, or export machinery. Library decisions require implementation
probes and current documentation. Preserve the original successful-input
boundaries and all user-owned prototype edits.

## Acceptance
- [ ] Independent-host browser tests verify every fn-5 R-ID across the eight delivered packages, including applicable host play/pause/restart/seek, offscreen and reduced-motion behavior.
- [ ] Responsive geometry/time and full-fidelity behavior are asserted from real engine output; no unfinished adapters, copied editor bundle, or proxy-JS computation passes.
- [ ] The final receipt identifies real delivered packages/assets, exact validation results and applicable review outcomes, releasing fn-2 .7 only through an authorized receipt check.

## Done summary
TBD

## Evidence
- Commits:
- Tests:
- PRs:
