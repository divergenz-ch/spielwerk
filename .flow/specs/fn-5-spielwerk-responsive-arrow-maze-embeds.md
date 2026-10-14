# Spielwerk responsive Arrow Maze embeds

## Conversation Evidence

> user: "capture a spec from this prototype - ignore the code quality, I want the product intent and the requirements it demonstrates"
> user (selected): "split-as-proposed"

## Goal & Context

Designers can place compositions from any of the eight graphic generators
on a website, retaining responsive layout and supported visual playback.
Implementation depends on the graphic-generator handoff milestone, before
that spec's final embed acceptance. Arrow Maze remains
the demonstrated prototype baseline; the approved product scope extends
website embedding to all eight generators.
<!-- Source: 100% [paraphrase] -->

## Architecture & Data Models

An embed carries its tool's design parameters and required font data.
Its host box determines available dimensions. Arrow Maze's demonstrated fit
modes choose relayout, containment, coverage, or fixed sizing. Other tools
must adapt their compositions to the host box without adopting Arrow Maze's
grid-cell model. Playback state belongs to the placed artwork, separate
from the author's workspace.
<!-- Source: 50% [paraphrase] / 50% [inferred] -->

## Ownership and handoff contracts

This spec owns independent website runtimes, host-box observation,
playback/lifecycle browser integration, and portable demo/snippet packages
for all eight generators. It consumes their actual Rust/WebAssembly layout
and explicit-time computation adapters. It neither ports generator algorithms
nor loads the Svelte editor to play exported artwork.

The runtime receives design settings and required font data, supplies host
dimensions and playback time to the applicable engine, and renders full
fidelity visual output. Editor-only interactions do not cross this boundary.
Arrow Maze fit and cell controls remain tool-specific. Existing host
configuration/dependency limits remain in force.

## API Contracts

The demonstrated Arrow Maze integration accepts embedded configuration
or a configuration URL, fit and playback choices, and a cell-size override.
Its host can replace configuration or play, pause, restart, and seek to a
time in seconds. Cell-size controls apply to Arrow Maze, not to every
graphic tool. The expanded scope requires each tool's responsive visual
output; it does not prescribe a new public wire format or rendering library.
<!-- Source: 50% [paraphrase] / 50% [inferred] -->

## Edge Cases & Constraints

External configuration and rendering dependencies must be available to the
host page. Self-hosting is supported by the demonstrated integration.
Offscreen playback and reduced-motion preferences affect motion independently
of the visual design. Invalid-configuration and network-failure behavior
was not established by static inspection.
<!-- Source: 100% [inferred] -->

## Acceptance Criteria

The existing requirements capture behavior inferred from the prototype.
R2's maze layout and cell-size behavior remains Arrow Maze-specific.
The added requirements extend responsive visual embeds to all eight tools.

- **R1:** Users can export an embed package with a demo page and a reusable website snippet containing their design parameters and fonts. A compatible host page can display that composition independently of the editor. Unavailable dependencies or unreadable configuration are outside the demonstrated successful-integration contract; shared export failures remain visible.

- **R2:** The embed offers regenerate, contain, cover, and fixed fit modes. Regenerate relays out the maze for its host box using a fixed cell size; without an explicit host height, the embed retains artboard proportions. Resizing is constrained by host dimensions and selected fit mode, not by a promise of identical geometry across sizes.

- **R3:** The embed offers loop, once, in-view, and static playback; supports host play, pause, restart, and seek; and pauses offscreen and respects reduced-motion preferences unless overridden. Static mode displays still artwork. No additional playback error surface beyond valid configuration, available dependencies, and the selected host dimensions is established.

- **R4:** Users can export responsive website embeds for Arrow Maze,
  Arrow Poster, Arrow Comb, Arrow Field, Switchboard, Truchet Tiles,
  Imprint, and Stripe Marquee. Each embed adapts its composition to its
  containing box and plays the tool's supported motion. Tools without motion
  display responsive still artwork. The existing host-dependency and
  configuration limitations remain applicable; export failures remain
  visible through the shared workspace contract. [paraphrase]

- **R5:** Website embeds provide visual playback only. Pointer attraction,
  widget clicks, composition dragging, and text editing remain workspace
  interactions rather than visitor interactions. Mobile-device support for
  the editing workspace remains out of scope; responsive website artwork
  remains in scope. There is no visitor-editing error surface because the
  embeds expose no visitor-editing capability. [paraphrase]

## Boundaries

The selected product scope has these limits.

- This embed contract covers all eight graphic generators. Logo Extruder
  and Font Remixer retain fixed artboards and do not gain website embeds
  through this scope expansion. [paraphrase]
- The prototype demonstrates an Arrow Maze runtime. The other seven embeds
  are approved product requirements, not claims of existing implementation.
  [paraphrase]

## Planning evidence and memory

The repository and spec scouts confirmed the source mechanisms behind the
prototype-derived acceptance, and the gap analyst checked the ownership
handoffs. Confirmation establishes product intent, not runtime correctness.
Actual Rust ports, browser behavior, font validity, and outputs still require
the owning tasks' checks. All active R-IDs and the retired workspace R4
remain intact.

| Track | Category | Entry | Why relevant |
|---|---|---|---|
| knowledge | decisions | rust-computation-engine-with-svelte-2026-10-13 | Rust calculations, Svelte browser UI, deterministic inputs/time, full-fidelity previews |

- Rust computation engine with Svelte browser UI sets the shared architecture;
  it makes no measured speed claim and authorizes no saved-data loss.

## Early proof point

Task fn-5-spielwerk-responsive-arrow-maze-embeds.1 proves independent
container-resizing and seek/playback using real generator Rust computation
outside the editor. If it fails, re-evaluate asset loading and engine/runtime
separation before packaging all eight embeds.

## Delivery milestones and release gates

Entry task .1 remains explicitly blocked until the workspace foundation and
generator handoff tasks fn-2-spielwerk-parametric-graphic-generators.1 through
.6 have verified receipts. Release it only after done statuses, actual
supported layout/timing/artwork capabilities, prerequisite commits present
in the checkout, focused tests, and applicable review outcomes are checked.

Final generator task fn-2-spielwerk-parametric-graphic-generators.7 waits
for this spec's actual embed delivery. It is not an embed-entry prerequisite.
The whole-spec dependency on fn-2 is removed to keep these two milestones
acyclic. Record cross-spec blockers through flowctl, preserve their history
before reset, and release them only after checking evidence; no automatic
cross-spec unblocking is implied.

Tasks .2 and .3 complete packaging and independent-host verification through
same-spec dependencies. Their completed receipts release fn-2's final
catalog acceptance, then contribute to fn-1's full-workspace integration.

## Quick commands

The foundation and embed tasks introduce these planned focused gates.
They have not run during planning.

```bash
npm run test:embeds
cargo test --manifest-path crates/spielwerk-engine/Cargo.toml tools
```

## Decision Context

The user chose website embedding as a separate spec. It depends on the
graphic-generator output and shares the prototype origin. Static SVG and
responsive animated website artwork are distinct deliverables, so the embed
must not imply that SVG itself retains Arrow Maze playback.
<!-- Source: 50% [paraphrase] / 50% [inferred] -->

The approved shared-workspace decisions expand the originally
Arrow Maze-only embed scope to all eight graphic generators. The retained
spec identifier reflects the original capture, not the current coverage.
Ordinary artwork files use the selected responsive preview size; website
embeds continue adapting to their host box. Embedded output preserves
visual motion while leaving direct interactions in the workspace.
[paraphrase]

## Requirement coverage

| Req | Description | Task(s) | Gap justification |
| --- | --- | --- | --- |
| R1 | Users can export an embed package with a demo page and a reusable website snippet containing their design parameters and fonts. A compatible host page can display that composition independently of the editor. Unavailable dependencies or unreadable configuration are outside the demonstrated successful-integration contract; shared export failures remain visible. | fn-5-spielwerk-responsive-arrow-maze-embeds.2, fn-5-spielwerk-responsive-arrow-maze-embeds.3 | — |
| R2 | The embed offers regenerate, contain, cover, and fixed fit modes. Regenerate relays out the maze for its host box using a fixed cell size; without an explicit host height, the embed retains artboard proportions. Resizing is constrained by host dimensions and selected fit mode, not by a promise of identical geometry across sizes. | fn-5-spielwerk-responsive-arrow-maze-embeds.1, fn-5-spielwerk-responsive-arrow-maze-embeds.3 | — |
| R3 | The embed offers loop, once, in-view, and static playback; supports host play, pause, restart, and seek; and pauses offscreen and respects reduced-motion preferences unless overridden. Static mode displays still artwork. No additional playback error surface beyond valid configuration, available dependencies, and the selected host dimensions is established. | fn-5-spielwerk-responsive-arrow-maze-embeds.1, fn-5-spielwerk-responsive-arrow-maze-embeds.3 | — |
| R4 | Users can export responsive website embeds for Arrow Maze, Arrow Poster, Arrow Comb, Arrow Field, Switchboard, Truchet Tiles, Imprint, and Stripe Marquee. Each embed adapts its composition to its containing box and plays the tool's supported motion. Tools without motion display responsive still artwork. The existing host-dependency and configuration limitations remain applicable; export failures remain visible through the shared workspace contract. | fn-5-spielwerk-responsive-arrow-maze-embeds.1, fn-5-spielwerk-responsive-arrow-maze-embeds.2, fn-5-spielwerk-responsive-arrow-maze-embeds.3 | — |
| R5 | Website embeds provide visual playback only. Pointer attraction, widget clicks, composition dragging, and text editing remain workspace interactions rather than visitor interactions. Mobile-device support for the editing workspace remains out of scope; responsive website artwork remains in scope. There is no visitor-editing error surface because the embeds expose no visitor-editing capability. | fn-5-spielwerk-responsive-arrow-maze-embeds.1, fn-5-spielwerk-responsive-arrow-maze-embeds.2, fn-5-spielwerk-responsive-arrow-maze-embeds.3 | — |
