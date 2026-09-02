# Architecture

## Purpose

RGL is an analysis workbench, not a crop-circle-specific editor and not a tool for proving one preferred interpretation. Its central contract is a reusable observed geometry that can be analysed under multiple mathematical and generative model families.

The application is split into five concerns:

1. **Project model** — source metadata, source-plane geometry and optional semantic model documents.
2. **Workspace shell** — stable application frame and context-sensitive panels.
3. **View adapters** — 2D image/vector views and later simulation/3D views.
4. **Analysis engines** — derived structural measurements that do not mutate authoritative geometry.
5. **Model/simulation engines** — resonance, kinematics and future generative models behind a common engine boundary.

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

The first interactive editor only implements circles. Supporting more kinds in the model prevents the rest of the application from assuming that every formation is a collection of circles.

Derived measurements such as diameter, angle from origin, pairwise ratio or symmetry residual are not stored as authoritative primitive fields. They are recomputed from geometry to avoid stale results.

Semantic interpretations also do not belong on `GeometryPrimitive`. A circle remains a circle even if one model interprets it as a resonant boundary and another interprets it as a rotor or orbit.

## Geometry analysis contract

Geometry Analysis begins with small pure TypeScript measurement functions that consume the authoritative project geometry and return derived values. React components display those results but do not own the calculations.

The first analysis reference is `geometry.origin`. It is an explicit user-edited source-plane point, persisted with the project and tracked by undo/redo. Setting the origin from a selected circle copies that circle's current center; it does not create a live link to the circle, so later primitive edits cannot silently move the analysis reference.

Polar measurements use image-space orientation:

- positive x points right,
- positive y points down,
- `0°` points right,
- angles increase clockwise (`90°` points down).

This convention matches the source image coordinate system and must remain explicit when later symmetry, radial-profile and sequence analyses are added.

Initial derived circle measurements include area and circumference. Initial relational measurements include distance from origin, polar angle, nearest-circle center distance, edge gap and directional radius ratio. These values remain derived outputs and are not persisted into primitives.

## Model document contract

Observed geometry and candidate generative models are separate authoritative layers.

A project may contain optional `ModelDocument` records. A model document has:

- a model `family` such as `resonance`, `kinematics` or a future family,
- a model-specific `modelType`,
- geometry-to-model `bindings`,
- model parameters,
- constraints.

Bindings refer to geometry primitive IDs and assign a semantic role without modifying those primitives. A future kinematics model could therefore express mappings such as:

```text
circle C17 -> rotor
point P3   -> axis
line L4    -> rigid-link
arc A2     -> constrained-path
```

The same geometry can simultaneously participate in multiple model documents with different meanings. Model roles are strings owned by the model family rather than a growing union on the geometry core.

Bindings are hypotheses, not observations. Automatic tools may eventually propose bindings, but authoritative model construction remains explicit and human-controlled.

## Simulation contract

All model families use the same high-level engine boundary:

```text
Observed Geometry + ModelDocument
              |
              v
          ModelAdapter
              |
              v
       SimulationResult
```

`ModelAdapter` owns family-specific validation and simulation. The core contract does not choose a numerical implementation. A resonance adapter may later call Python/NumPy/SciPy; a kinematics adapter may later use TypeScript, Python, Rapier, Havok or another solver.

`SimulationResult` is renderer-independent. It carries model state frames, summary values and diagnostics. Rendering code must consume simulation output rather than becoming the source of physical truth.

The first shared reference validator only checks structural links such as missing geometry primitive IDs or constraints that reference missing model bindings. Family-specific physical validation belongs to the relevant adapter.

### Reserved model families

**Resonance** is the first planned implementation family. Initial model types are plate/Chladni and circular membrane, with water/interference candidates later.

**Kinematics** is a reserved future family for neutrally testing whether observed geometry can support a coherent mechanism interpretation. Candidate semantic roles may include pivot, axis, rotor, rotating mass, rigid link/arm, orbit/track, eccentric offset, spring and other constraints.

A future kinematics engine should begin with kinematic consistency rather than extraordinary energy claims. Candidate outputs include paths, eccentricity, angular relationships, phase locking, relative rotation ratios, collisions, periodicity, return periods, constraint violations and velocity/acceleration profiles. Torque and energy accounting belong only after the kinematic layer is coherent.

Sensitivity analysis is part of the future model-evaluation contract: measured radius/spacing/angle inputs should be perturbable (for example ±1%, ±2%, ±5%) to determine whether a behavior survives small geometry changes. Future null/randomized models should provide the baseline needed to interpret apparent fine tuning statistically.

## Workspace contract

The visible initial workspaces remain Geometry, Resonance and Compare. Reserving another model family does **not** create a fourth permanent workspace.

A workspace provides:

- a viewport adapter,
- a context panel,
- optional selection tools,
- optional analysis/model commands.

The outer shell must stay stable as capabilities are added. New analyses should add tools/panels or view adapters rather than new permanent screen regions.

The visible `Resonance` label may remain during v0.1 because resonance is the first implemented model family. Its internal implementation must use the generic model/simulation contracts rather than creating a Resonance-only project format. If multiple model families later need equal UI status, the shell can evolve toward a model-family selector without changing the underlying project or engine contracts.

## UI density contract

The viewport owns most of the screen. The right context panel contains only controls and measurements needed for the active task.

- One-use source operations such as image open/replace and source metadata belong in compact viewport controls or popovers, not permanent context-panel sections.
- Project-level open/save and undo/redo actions belong in compact global controls.
- Tool actions use the shared SVG icon system and may be grouped under small categories such as Navigate, Create, Analyze and View.
- Persistent instructional paragraphs are avoided. Panel headers use the reusable `PanelHelp` control, which exposes at most one or two short contextual sentences on hover/focus.

The governing rule is: **information that is not continuously required to do the work should not continuously occupy screen space.**

## View adapters

The same authoritative data can eventually be presented as:

- source image + 2D geometry overlay,
- vector-only geometry,
- negative-space geometry,
- graph view,
- resonance heatmap,
- 2D mechanism schematic,
- 2D trajectory/path view,
- Babylon.js 3D resonance or mechanism view,
- comparison overlay.

Simulation views consume the shared `SimulationResult` / model-state boundary. A future kinematics model can therefore feed schematic 2D, trajectory 2D and Babylon 3D views without duplicating the simulation engine.

Babylon.js is deliberately isolated to view adapters. It is not used to implement the application UI and must not become the mandatory physics source. A 3D adapter may display pivots, axes, bodies, links, trails, vectors, phase state, animation controls and camera presets while remaining replaceable independently of the numerical engine.

## Computation boundary

Simple interactive geometry operations and structural analysis may live in TypeScript so that dragging and measurement remain immediate.

Numerical model simulation lives behind `ModelAdapter`. The likely first numerical backend is Python/NumPy/SciPy because modal analysis and validation are easy to express and test there. The UI exchanges plain structured data with that engine rather than importing implementation details.

No physics backend is introduced merely to reserve this boundary. Solver selection happens only when an implemented model demonstrates requirements that justify it.

## Compare contract

Compare evaluates observed geometry against model output without collapsing everything into one authoritative score.

Future model comparisons should expose separate metrics appropriate to the model family. For kinematics these may include center/pivot alignment, radius/length agreement, angular agreement, path agreement, phase/symmetry agreement, topology/connection agreement and sensitivity/stability.

Higher-level ranking may later compare how well different model families explain the same observation, but it must retain residuals, free-parameter counts and metric components so the UI does not imply that a single opaque percentage establishes a mechanism or cause.

## Persistence

The canonical project format is versioned JSON. Source image files remain separate from geometry data. Temporary browser object URLs are runtime-only and must never be treated as persisted source paths.

The project file contains project identity, source metadata, authoritative geometry and optional model documents. Geometry and model semantics remain separate even though both are persisted.

A source image reference contains a stable project-local `assetId`, filename and pixel dimensions, but not the image bytes or a browser URL.

When a saved project is reopened, its geometry is available immediately while the source image is intentionally disconnected. The user reconnects the external image file; the editor verifies its dimensions before enabling image-based editing.

A future project package may contain:

```text
project.rgl.json
source-image.ext
optional derived outputs
```

Derived simulation results do not need to become authoritative project fields. They may be recomputed or stored later as explicitly derived/cache artifacts.

## History contract

Undo/redo tracks authoritative project edits, not transient view state.

Included in history:

- primitive creation/deletion,
- primitive geometry edits,
- source metadata changes,
- analysis origin and future authoritative project parameters,
- future edits to model documents, bindings and constraints.

Excluded from history:

- selection,
- panel/popover visibility,
- viewport pan/zoom,
- temporary browser source attachments,
- transient simulation frames and rendered view state.

Continuous pointer gestures are transactions. A circle move or radius drag may update the live project many times while the pointer moves, but the entire gesture becomes one undo step when it ends. Opening a different project resets undo/redo history rather than mixing two project documents into one timeline.

## v0.1 dependency policy

Keep the dependency set deliberately small:

- React + TypeScript + Vite for the shell.
- Native SVG/Canvas for the first 2D editor unless measurement needs prove otherwise.
- Babylon.js only when the 3D adapter is implemented.
- Python numerical dependencies only when the first simulation model actually needs them.
- A rigid-body/physics library is not selected until kinematics requirements are concrete.

A new library should solve a measured problem, not merely provide convenience.
