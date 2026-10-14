---
title: Rust computation engine with Svelte browser UI
date: "2026-10-13"
track: knowledge
category: decisions
module: spielwerk shared architecture
tags: [architecture, rust, wasm, svelte]
applies_when: Rust computation engine with Svelte browser UI
---

Use Rust, compiled to WebAssembly, for Spielwerk's core geometry and
computation, with Svelte for the separate browser UI. The user chose a Rust
engine over leaving the language open or using Rust throughout. Precision
means repeatable geometry and timing, with browser rasterization differences
allowed; previews retain full fidelity throughout interaction.

Rust is a chosen architecture constraint, not a measured performance result.
Rendering libraries and the Rust-to-browser integration library remain
unselected. No full rewrite or saved-data migration follows automatically
from this decision.
