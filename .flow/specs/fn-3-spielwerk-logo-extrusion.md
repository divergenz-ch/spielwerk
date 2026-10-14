# Spielwerk logo extrusion

## Conversation Evidence

> user: "capture a spec from this prototype - ignore the code quality, I want the product intent and the requirements it demonstrates"
> user (selected): "split-as-proposed"

## Goal & Context

Designers can turn uploaded two-dimensional artwork into a lit,
three-dimensional-looking logo composition, adjust its motion, and export
still or looping artwork. Implementation depends on the shared workspace
foundation milestone; final workspace acceptance follows this tool.
<!-- Source: 100% [inferred] -->

## Architecture & Data Models

A composition owns its uploaded logo, extrusion and material settings,
motion, optional background image, and canvas dimensions. Vector and raster
inputs yield different representations of depth. The output is rendered
artwork, not an editable three-dimensional model.
<!-- Source: 100% [inferred] -->

## Ownership and handoff contracts

This spec owns Rust extrusion geometry, vector bevels, raster slice
placement, material/lighting evaluation, and explicit-time motion
calculations. Browser code loads assets, delivers Svelte controls, renders
the calculated scene, and sends PNG/GIF output through shared export
facilities. Uploaded assets remain composition-local; they are not added to
snapshot payloads.

The foundation supplies the fixed-artboard, storage, asset-input,
Rust/browser, and export contracts. Logo Extruder remains fixed-size within
its demonstrated limits. Foundation completion releases this tool's work
without requiring completion of the entire ten-tool workspace.

## Edge Cases & Constraints

The prototype exposes canvas dimensions from 100 to 4000 pixels. Uploaded
logos and background images do not travel with shared snapshots. Users need
to re-upload those assets when restoring a composition in another context.
<!-- Source: 100% [inferred] -->

## Acceptance Criteria

The following requirements capture behavior inferred from the prototype.

- **R1:** Users can upload an SVG logo or a raster image and preview extrusion. SVG supports beveled depth; raster artwork supports stacked slices. With no uploaded logo, the tool retains its starting composition; unreadable or unsupported files are outside the demonstrated successful-input contract.

- **R2:** Users can adjust depth, bevel where applicable, material or metal appearance, and lighting while observing the resulting logo. Bevel controls apply to vector geometry rather than promising the same result for raster slices; remaining input bounds follow displayed controls.

- **R3:** Users can select spin, rock, or orbit motion with axis controls and an optional uploaded background image. A background is optional; restoring a snapshot does not restore the uploaded logo or background image.

- **R4:** Users can export PNG and a looping GIF using selected output settings within the demonstrated 100-to-4000-pixel canvas range. PNG captures a still view; GIF captures motion. SVG and three-dimensional model export are not demonstrated; export failures use the shared workspace indication.

## Boundaries

The selected product scope has these limits.

- This spec covers logo-to-artwork extrusion and its PNG/GIF output; it does not define model interchange or manufacturing output. [inferred]

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

Task fn-3-spielwerk-logo-extrusion.1 checks actual Rust vector bevel and raster
slice calculations against representative asset fixtures. If it fails,
re-evaluate the geometry/rendering handoff before adding materials, motion,
and output adapters.

## Delivery milestones and release gates

The entry task .1 is explicitly blocked on verified workspace foundation
tasks fn-1-spielwerk-shared-design-workspace.2 through .6. Release it only
after their done statuses, implementation commits in this checkout, focused
tests, and applicable review outcomes are checked. Preserve the block history
before a reset; no cross-spec gate is automatically released.

Tasks .2 and .3 follow the checked geometry through same-spec dependencies.
Their completed tool and PNG/GIF evidence contributes to the final
fn-1-spielwerk-shared-design-workspace.1 integration gate. This spec does not
depend on that final gate.

## Quick commands

These focused gates are introduced by the foundation and tool tasks.
Planning has not run them.

```bash
npm run test:logo
cargo test --manifest-path crates/spielwerk-engine/Cargo.toml logo
```

## Decision Context

Logo extrusion is independently reviewable because uploaded artwork,
material controls, and raster motion output form a complete workflow.
It shares the workspace dependency and prototype origin with the other
selected specs. No technology choice follows from the current renderer.
<!-- Source: 100% [inferred] -->

## Requirement coverage

| Req | Description | Task(s) | Gap justification |
| --- | --- | --- | --- |
| R1 | Users can upload an SVG logo or a raster image and preview extrusion. SVG supports beveled depth; raster artwork supports stacked slices. With no uploaded logo, the tool retains its starting composition; unreadable or unsupported files are outside the demonstrated successful-input contract. | fn-3-spielwerk-logo-extrusion.1, fn-3-spielwerk-logo-extrusion.3 | — |
| R2 | Users can adjust depth, bevel where applicable, material or metal appearance, and lighting while observing the resulting logo. Bevel controls apply to vector geometry rather than promising the same result for raster slices; remaining input bounds follow displayed controls. | fn-3-spielwerk-logo-extrusion.1, fn-3-spielwerk-logo-extrusion.2, fn-3-spielwerk-logo-extrusion.3 | — |
| R3 | Users can select spin, rock, or orbit motion with axis controls and an optional uploaded background image. A background is optional; restoring a snapshot does not restore the uploaded logo or background image. | fn-3-spielwerk-logo-extrusion.2, fn-3-spielwerk-logo-extrusion.3 | — |
| R4 | Users can export PNG and a looping GIF using selected output settings within the demonstrated 100-to-4000-pixel canvas range. PNG captures a still view; GIF captures motion. SVG and three-dimensional model export are not demonstrated; export failures use the shared workspace indication. | fn-3-spielwerk-logo-extrusion.3 | — |
