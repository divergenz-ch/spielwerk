# Spielwerk parametric graphic generators

## Conversation Evidence

> user: "capture a spec from this prototype - ignore the code quality, I want the product intent and the requirements it demonstrates"
> user (selected): "split-as-proposed"

## Goal & Context

Designers can explore a family of constrained visual styles through live
parameters and export the resulting compositions for reuse. The eight tools
cover arrow compositions, connected widgets, geometric tiles, relief patterns,
and stripe-based typography. Implementation depends on the shared workspace
foundation milestone; final workspace acceptance follows these generators.
<!-- Source: 100% [inferred] -->

## Architecture & Data Models

A composition holds its tool's parameters, artboard, colors, text and
typefaces where supported, and a seed where exposed. Motion controls describe
the composition's cycle. Pointer-driven preview state is separate from a
portable artwork export; an exported asset need not be an interactive editor.
<!-- Source: 100% [inferred] -->

## Ownership and handoff contracts

This spec owns all eight generators' Rust geometry, responsive layout,
animation evaluation, and tool-specific workspace interaction calculations.
Svelte adapters deliver their controls and interaction events through the
shared foundation. Shared browser facilities handle rendering and file
delivery from the engine's applicable scene/frame output.

The generator handoff includes actual calculations, fonts where supported,
fixed/responsive dimension handling, deterministic time evaluation, supported
artwork formats, and workspace interaction adapters. Website runtimes and
embed packaging belong to fn-5-spielwerk-responsive-arrow-maze-embeds.
R12 remains an actual embed-delivery requirement; an adapter interface alone
does not satisfy it.

## Edge Cases & Constraints

Seeded generation repeats the same arrangement for the same seed and
settings. Font uploads customize text-bearing tools. Static and animated
formats have different capabilities; a format is available only when the
tool supports it. Dense Arrow Maze layouts can leave words unplaced.
<!-- Source: 100% [inferred] -->

## Acceptance Criteria

The existing requirements capture behavior inferred from the prototype.
The added responsive requirements record the approved workspace decisions.

- **R1:** Arrow Maze generates branching arrows that weave without overlapping, with bend or arc styles, panels, polarity, text placement, layers, and palette controls. Users can drag words and preview draw-in motion. Words that cannot fit may remain unplaced; density and clearance constrain placement rather than guaranteeing every word fits.

- **R2:** Arrow Poster generates seeded grid-based arrow compositions with contour and draw-in controls. Clicking an arrow raises it in the composition. Interaction outside an arrow has no additional required behavior.

- **R3:** Arrow Comb generates arrow bands with fan, wave, or swirl profiles, tapered tails, and optional text rows using an uploaded typeface. Motion can draw the arrows into place. No error surface beyond the shared control and asset-input limits is demonstrated.

- **R4:** Arrow Field offers noise, swirl, radial, and grid arrangements with rotation and pointer attraction or repulsion. Pointer response applies in the preview; exports do not promise live pointer interaction.

- **R5:** Switchboard generates linked buttons, toggles, sliders, knobs, indicators, meters, chips, and fields. Clicking changes and propagates state; dragging swaps cells; motion shows wire flow. Actions require a widget or cell target; exported SVG motion does not promise the editor's click or drag behavior.

- **R6:** Truchet Tiles produces quarter-circle arcs, triangles, diagonal tiles, or mixed styles with strand and two-ink controls. It exports SVG and PNG. Animated GIF output is not part of its demonstrated format set.

- **R7:** Imprint produces raised or pressed ray-burst relief with light, shadow, halo, and growth or drift controls. It exports SVG and PNG. A PNG is still artwork; a GIF format is not demonstrated.

- **R8:** Stripe Marquee renders uploaded-font text through changing stripe thickness, with column, shear, and directional scrolling controls. The composition expresses the text through stripe geometry. No error surface beyond the shared control and asset-input limits is demonstrated.

- **R9:** Text-bearing graphic tools accept uploaded typefaces and retain their appearance in supported artwork exports through embedded type or baked geometry. A missing upload leaves the available default face; unsupported or unreadable font files are outside the demonstrated successful-input contract.

- **R10:** Arrow Maze, Arrow Poster, Arrow Comb, Arrow Field, Switchboard, and Stripe Marquee export SVG, PNG, and GIF. Arrow Maze SVG is static; Arrow Poster, Arrow Comb, Arrow Field, and Switchboard preserve their supported SVG motion. PNG is a still frame and GIF represents a motion cycle at selected output settings. Export failures use the shared workspace indication; live pointer behavior is not transferred to these files.

- **R11:** All eight graphic generators support fixed and responsive
  artboards. In responsive mode, the composition adapts to the selected
  container dimensions rather than only magnifying a fixed picture.
  Ordinary SVG, PNG, and GIF exports, where supported by the tool, use the
  selected responsive preview dimensions and layout. Dimension limits and
  export failures follow the shared workspace contract. [paraphrase]

- **R12:** All eight graphic generators provide responsive website embeds
  with visual playback only, through the sibling embed specification.
  Supported motion remains visible; tools without motion display responsive
  still artwork. Pointer attraction, widget clicks, composition dragging,
  and text editing remain workspace-only. Export failures follow the
  shared workspace contract; website-host limitations follow the embed
  specification. [paraphrase]

## Boundaries

The selected product scope has these limits.

- Cover these eight visual generators, their responsive artboards, and their
  supported artwork formats. Logo extrusion and installable-font output
  belong to sibling specs. The responsive embed spec owns website
  integration for all eight generators; this spec owns their composition
  behavior. [paraphrase]
- No pixel-identical implementation, rendering library, or current algorithm structure is mandated by this product capture. [inferred]

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

Task fn-2-spielwerk-parametric-graphic-generators.1 delivers an actual Arrow
Maze Rust computation adapter through the checked foundation. If it fails,
re-evaluate layout, font, and scene/time contracts before extending the
catalog. Existing JavaScript artwork is product evidence, not a completed
Rust port.

## Delivery milestones and release gates

Tasks .1 through .6 deliver the eight generator implementations and supported
artwork adapters. Their entry tasks remain blocked until workspace
foundation tasks fn-1-spielwerk-shared-design-workspace.2 through .6 have
verified receipts and their commits are present in the implementation
checkout. Same-spec dependencies and declared shared write surfaces govern
the remaining order; potential waves do not authorize overlapping writers.

The .1 through .6 handoff releases the embed work in fn-5. It does not
complete this spec. Final catalog task .7 also remains explicitly blocked
until fn-5's actual eight-tool embed delivery passes its focused checks.
Task .7 verifies R12 against those packages as well as the catalog's
ordinary artwork outputs and interactions.

Whole-spec fn-2-to-fn-1 and fn-5-to-fn-2 prerequisites would block the
foundation/engine handoffs on downstream final acceptance. Use receipt-checked
task blocks for these cross-spec milestones. Before authorized release,
verify referenced tasks are done, their implementation commits are present,
and their tests and applicable review outcomes are recorded. Preserve block
history before reset; Flow does not automatically release cross-spec gates.
Do not mark this spec complete at the generator-only handoff.

## Quick commands

The foundation introduces the build and test harness. These are planned
focused gates, not results observed during planning.

```bash
npm run test:generators
cargo test --manifest-path crates/spielwerk-engine/Cargo.toml tools
```

## Decision Context

The user selected separate specs for independent product outcomes. These
eight generators stay together as one graphic-exploration catalog, even
though they contain more than eight criteria. Their implementations depend
on the shared workspace foundation; the embed implementation depends on
the generator handoff. Final generator acceptance waits for actual embeds.
The prototype's
controls and outputs supply the inferred requirements.
<!-- Source: 50% [paraphrase] / 50% [inferred] -->

The approved shared-workspace decisions extend responsive artboards and
visual-only website embeds to all eight graphic generators. Ordinary
artwork exports match the selected responsive preview. Mobile-device
support for the editor remains out of scope. These requirements supersede
the prototype's Arrow Maze-only responsive coverage without changing the
existing per-tool artwork format sets. [paraphrase]

## Requirement coverage

| Req | Description | Task(s) | Gap justification |
| --- | --- | --- | --- |
| R1 | Arrow Maze generates branching arrows that weave without overlapping, with bend or arc styles, panels, polarity, text placement, layers, and palette controls. Users can drag words and preview draw-in motion. Words that cannot fit may remain unplaced; density and clearance constrain placement rather than guaranteeing every word fits. | fn-2-spielwerk-parametric-graphic-generators.1, fn-2-spielwerk-parametric-graphic-generators.7 | — |
| R2 | Arrow Poster generates seeded grid-based arrow compositions with contour and draw-in controls. Clicking an arrow raises it in the composition. Interaction outside an arrow has no additional required behavior. | fn-2-spielwerk-parametric-graphic-generators.2, fn-2-spielwerk-parametric-graphic-generators.7 | — |
| R3 | Arrow Comb generates arrow bands with fan, wave, or swirl profiles, tapered tails, and optional text rows using an uploaded typeface. Motion can draw the arrows into place. No error surface beyond the shared control and asset-input limits is demonstrated. | fn-2-spielwerk-parametric-graphic-generators.2, fn-2-spielwerk-parametric-graphic-generators.7 | — |
| R4 | Arrow Field offers noise, swirl, radial, and grid arrangements with rotation and pointer attraction or repulsion. Pointer response applies in the preview; exports do not promise live pointer interaction. | fn-2-spielwerk-parametric-graphic-generators.3, fn-2-spielwerk-parametric-graphic-generators.7 | — |
| R5 | Switchboard generates linked buttons, toggles, sliders, knobs, indicators, meters, chips, and fields. Clicking changes and propagates state; dragging swaps cells; motion shows wire flow. Actions require a widget or cell target; exported SVG motion does not promise the editor's click or drag behavior. | fn-2-spielwerk-parametric-graphic-generators.4, fn-2-spielwerk-parametric-graphic-generators.7 | — |
| R6 | Truchet Tiles produces quarter-circle arcs, triangles, diagonal tiles, or mixed styles with strand and two-ink controls. It exports SVG and PNG. Animated GIF output is not part of its demonstrated format set. | fn-2-spielwerk-parametric-graphic-generators.5, fn-2-spielwerk-parametric-graphic-generators.7 | — |
| R7 | Imprint produces raised or pressed ray-burst relief with light, shadow, halo, and growth or drift controls. It exports SVG and PNG. A PNG is still artwork; a GIF format is not demonstrated. | fn-2-spielwerk-parametric-graphic-generators.5, fn-2-spielwerk-parametric-graphic-generators.7 | — |
| R8 | Stripe Marquee renders uploaded-font text through changing stripe thickness, with column, shear, and directional scrolling controls. The composition expresses the text through stripe geometry. No error surface beyond the shared control and asset-input limits is demonstrated. | fn-2-spielwerk-parametric-graphic-generators.6, fn-2-spielwerk-parametric-graphic-generators.7 | — |
| R9 | Text-bearing graphic tools accept uploaded typefaces and retain their appearance in supported artwork exports through embedded type or baked geometry. A missing upload leaves the available default face; unsupported or unreadable font files are outside the demonstrated successful-input contract. | fn-2-spielwerk-parametric-graphic-generators.1, fn-2-spielwerk-parametric-graphic-generators.2, fn-2-spielwerk-parametric-graphic-generators.6, fn-2-spielwerk-parametric-graphic-generators.7 | — |
| R10 | Arrow Maze, Arrow Poster, Arrow Comb, Arrow Field, Switchboard, and Stripe Marquee export SVG, PNG, and GIF. Arrow Maze SVG is static; Arrow Poster, Arrow Comb, Arrow Field, and Switchboard preserve their supported SVG motion. PNG is a still frame and GIF represents a motion cycle at selected output settings. Export failures use the shared workspace indication; live pointer behavior is not transferred to these files. | fn-2-spielwerk-parametric-graphic-generators.1, fn-2-spielwerk-parametric-graphic-generators.2, fn-2-spielwerk-parametric-graphic-generators.3, fn-2-spielwerk-parametric-graphic-generators.4, fn-2-spielwerk-parametric-graphic-generators.6, fn-2-spielwerk-parametric-graphic-generators.7 | — |
| R11 | All eight graphic generators support fixed and responsive artboards. In responsive mode, the composition adapts to the selected container dimensions rather than only magnifying a fixed picture. Ordinary SVG, PNG, and GIF exports, where supported by the tool, use the selected responsive preview dimensions and layout. Dimension limits and export failures follow the shared workspace contract. | fn-2-spielwerk-parametric-graphic-generators.1, fn-2-spielwerk-parametric-graphic-generators.2, fn-2-spielwerk-parametric-graphic-generators.3, fn-2-spielwerk-parametric-graphic-generators.4, fn-2-spielwerk-parametric-graphic-generators.5, fn-2-spielwerk-parametric-graphic-generators.6, fn-2-spielwerk-parametric-graphic-generators.7 | — |
| R12 | All eight graphic generators provide responsive website embeds with visual playback only, through the sibling embed specification. Supported motion remains visible; tools without motion display responsive still artwork. Pointer attraction, widget clicks, composition dragging, and text editing remain workspace-only. Export failures follow the shared workspace contract; website-host limitations follow the embed specification. | fn-2-spielwerk-parametric-graphic-generators.7 | — |
