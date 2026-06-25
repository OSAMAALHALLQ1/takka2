# ADR 1: SVG Grouping for Loader Animation

## Context
The Takka logo SVG is composed of multiple independent paths. To implement a realistic "click" animation, the pointer hand (which is composed of two separate paths) needs to move as a single cohesive unit, while the rest of the logo body remains hidden and reveals itself only after the click gesture is completed.

Animating individual paths with different starting positions and timing caused desynchronization and broken visuals.

## Decision
We group the SVG paths into semantic XML groups:
- `<g class="logo-hand">` for the hand paths.
- `<g class="logo-body">` for the rest of the logo paths.

This allows us to apply translate and scale animations on the entire group using CSS transforms, maintaining structural integrity and avoiding complex path morphing or absolute positioning calculations.

## Consequences
- **Pros**: Perfectly synchronized animation of the hand, clean CSS code, GPU-acceleration using transforms on the group.
- **Cons**: Minor change to the SVG structure inside `index.html` and `App.jsx`, which must be kept in sync.
