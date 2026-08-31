# Architecture

## Purpose

RGL is an analysis workbench, not a crop-circle-specific editor. Its central contract is a reusable geometric document that can be rendered and analysed through multiple views.

The application is split into four concerns:

1. **Project model** — source metadata, source-plane geometry and future analysis references.
2. **Workspace shell** — stable application frame and context-sensitive panels.
3. **View adapters** — 2D image/vector views and later Babylon.js 3D views.
4. **Analysis engines** — geometry and resonance calculations that do not depend on React components.

## Coordinate contract

Geometry is stored in a resolution-independent, isotropic source plane rather than source pixels.

- `(0, 0)` is the top-left of the source plane.
- Source image width is always `1.0` plane unit.
- Source image height is `imageHeight / imageWidth` plane units.
- A pixel point `(px, py)` therefore becomes `(px / imageWidth, py / imageWidth)`.
- Radius and distance use the same plane unit, so Euclidean geometry stays isotropic.
- Pixel-space values are derived at render time by multiplying plane units by source width.

For a 4000 × 3000 image the source plane therefore spans `1.0 × 0.75`, not `1.0 × 1.0`. This avoids the hidden x/y scale mismatch that occurs when both axes are independently normalized to `[0, 1]`.

The coordinate contract lets the same geometric document survive source-resolution changes with the same aspect ratio and gives geometry and simulation a common metric space.

Perspective rectification will be represented as a transform rather than by rewriting primitive coordinates in place. That feature belongs to a later Geometry stage, but the model must not block it.

## Primitive contract

The project model supports general primitives:

- point
- circle
- ellipse
- line
- arc
- polyline
- polygon
- region

The first interactive editor will only implement circles. Supporting more kinds in the model now prevents the rest of the application from assuming that every formation is a collection of circles.

Derived measurements such as diameter, angle from origin, pairwise ratio or symmetry residual are not stored as authoritative primitive fields. They are recomputed from geometry to avoid stale results.

## Workspace contract

The initial workspaces are Geometry, Resonance and Compare. A workspace provides:

- a viewport adapter,
- a context panel,
- optional selection tools,
- optional analysis commands.

The outer shell must stay stable as capabilities are added. New analyses should add tools/panels or view adapters rather than new permanent screen regions.

## View adapters

The same model can eventually be presented as:

- source image + 2D overlay,
- vector-only geometry,
- negative-space geometry,
- graph view,
- resonance heatmap,
- Babylon.js 3D surface,
- comparison overlay.

Babylon.js is deliberately isolated to 3D views. It is not used to implement the application UI.

## Computation boundary

Simple interactive geometry operations may live in TypeScript so that dragging and measurement remain immediate.

Numerical simulation will later live behind a small local engine boundary. The likely first implementation is Python/NumPy/SciPy because modal analysis and validation are easier to express and test there. The UI will exchange plain JSON/arrays with that engine rather than importing simulation implementation details.

No backend is introduced during Foundation merely to reserve this boundary.

## Persistence

The canonical project format is versioned JSON. Source image files remain separate from geometry data. Temporary browser object URLs are runtime-only and must never be treated as persisted source paths.

A future project package may contain:

```text
project.rgl.json
source-image.ext
optional derived outputs
```

The persisted format should keep human-edited geometry separate from derived analysis results.

## v0.1 dependency policy

Keep the dependency set deliberately small:

- React + TypeScript + Vite for the shell.
- Native SVG/Canvas for the first 2D editor unless measurement needs prove otherwise.
- Babylon.js only when the 3D adapter is implemented.
- Python numerical dependencies only when the Resonance stage begins.

A new library should solve a measured problem, not merely provide convenience.
