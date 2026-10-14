# Spielwerk font remixing

## Conversation Evidence

> user: "capture a spec from this prototype - ignore the code quality, I want the product intent and the requirements it demonstrates"
> user (selected): "split-as-proposed"

## Goal & Context

Designers can explore altered letterforms from an uploaded static font,
use the result as artwork, and export simplified outlines as a usable font.
Implementation depends on the shared workspace foundation milestone;
final workspace acceptance follows this tool.
<!-- Source: 100% [inferred] -->

## Architecture & Data Models

A remix owns the source font, sample text, selected filter, filter controls,
layout, colors, and an optional stamp. Simplification changes glyph outlines;
centerline mode places stamps along a letterform's skeleton. Font export
requires glyph outlines rather than a stamped artwork representation.
<!-- Source: 100% [inferred] -->

## Ownership and handoff contracts

This spec owns Rust glyph-outline transformations, simplification,
skeleton/stamp calculations, and installable-font/master output computation.
Svelte/browser code owns source-font and stamp loading, caret/text
interaction, preview rendering, and file delivery through the shared
foundation. Static source-font and fixed-artboard limits remain unchanged.

Font output uses actual glyph outlines and preserves the simplification-mode
restriction. A stamped artwork representation is not an installable glyph
outline. The shared font/asset-input contract retains uploaded-font bytes
and snapshot compatibility; this spec does not introduce a saved-data
migration or restore stamps excluded from snapshots.

## Edge Cases & Constraints

The demonstrated source-font contract is static TTF or OTF. Uploaded stamps
do not travel with snapshots. Compatible font masters are intermediate
outputs for an external variable-font build; a finished variable font is
not produced directly by the prototype.
<!-- Source: 100% [inferred] -->

## Acceptance Criteria

The following requirements capture behavior inferred from the prototype.

- **R1:** Users can load a static TTF or OTF font and edit sample text in the panel or directly on the artboard. Direct editing supports caret placement, navigation, insertion, deletion, line breaks, and pasted text while staying in sync with the panel. Without a loaded font, direct glyph editing has no rendered-font result; unsupported fonts are outside the demonstrated successful-input contract.

- **R2:** Users can select outline simplification or centerline stamping and adjust their controls. Simplification reduces visible outline detail; centerline mode places an uploaded SVG stamp or available stamp along skeleton paths. Missing uploaded stamps use the available default; the two modes do not promise equivalent font-export capability.

- **R3:** Users can export the current remixed text as SVG or PNG, including the optional original-outline comparison when enabled. Editing caret decoration is excluded from output. Export failures use the shared workspace indication; no GIF output is demonstrated.

- **R4:** In simplification mode, users can export an installable OTF or a pair of point-compatible OTF masters with a Simplify axis description and instructions for an external variable-font build. The second master's axis endpoint represents the selected simplification amount. Font export in centerline mode is rejected rather than pretending stamps are glyph outlines; the output bundle is not itself a finished variable font.

## Boundaries

The selected product scope has these limits.

- Cover static-source font remixing, text artwork, simplified OTF, and compatible-master output; variable-source-font editing and a built-in variable-font compiler are not demonstrated. [inferred]

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

Task fn-4-spielwerk-font-remixing.1 verifies actual Rust source-glyph and
simplification results with static-font fixtures. If it fails, re-evaluate
font parsing, contour representation, and render/output contracts before
building skeleton/stamp behavior or installable-font output.

## Delivery milestones and release gates

The entry task .1 is explicitly blocked on verified workspace foundation
tasks fn-1-spielwerk-shared-design-workspace.2 through .6. Release it only
after their done statuses, implementation commits in this checkout, focused
tests, and applicable review outcomes are checked. Preserve the block history
before reset; no cross-spec gate is automatically released.

Tasks .2 through .4 complete transform modes, direct text editing, artwork,
and font output through same-spec dependencies. Their final receipt must
establish actual OTF readability and point-compatible masters; source
comments or declarations are insufficient. The completed tool contributes
to fn-1-spielwerk-shared-design-workspace.1 final integration without depending
on that full-workspace gate.

## Quick commands

The foundation and tool tasks establish these planned focused gates.
Planning has not run them.

```bash
npm run test:fonts
cargo test --manifest-path crates/spielwerk-engine/Cargo.toml fonts
```

## Decision Context

Font remixing is a separate outcome because it produces glyph data as well
as artwork. The prototype's actual master bundle takes precedence over the
catalog's broader variable-font wording. This spec shares the workspace
dependency and origin of the other selected specs.
<!-- Source: 100% [inferred] -->

## Requirement coverage

| Req | Description | Task(s) | Gap justification |
| --- | --- | --- | --- |
| R1 | Users can load a static TTF or OTF font and edit sample text in the panel or directly on the artboard. Direct editing supports caret placement, navigation, insertion, deletion, line breaks, and pasted text while staying in sync with the panel. Without a loaded font, direct glyph editing has no rendered-font result; unsupported fonts are outside the demonstrated successful-input contract. | fn-4-spielwerk-font-remixing.1, fn-4-spielwerk-font-remixing.3 | — |
| R2 | Users can select outline simplification or centerline stamping and adjust their controls. Simplification reduces visible outline detail; centerline mode places an uploaded SVG stamp or available stamp along skeleton paths. Missing uploaded stamps use the available default; the two modes do not promise equivalent font-export capability. | fn-4-spielwerk-font-remixing.1, fn-4-spielwerk-font-remixing.2, fn-4-spielwerk-font-remixing.3 | — |
| R3 | Users can export the current remixed text as SVG or PNG, including the optional original-outline comparison when enabled. Editing caret decoration is excluded from output. Export failures use the shared workspace indication; no GIF output is demonstrated. | fn-4-spielwerk-font-remixing.3 | — |
| R4 | In simplification mode, users can export an installable OTF or a pair of point-compatible OTF masters with a Simplify axis description and instructions for an external variable-font build. The second master's axis endpoint represents the selected simplification amount. Font export in centerline mode is rejected rather than pretending stamps are glyph outlines; the output bundle is not itself a finished variable font. | fn-4-spielwerk-font-remixing.4 | — |
