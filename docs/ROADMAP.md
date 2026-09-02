# Roadmap

RGL is developed through small checkpoints. Each checkpoint is locally typechecked, tested, built and exercised before merge.

## Current sequence

### Foundation — complete

- stable React workspace shell
- general geometry primitive model
- isotropic source-plane coordinates
- project save/load
- source reconnect flow
- transactional undo/redo
- compact UI/help contracts

### Geometry Workspace v0.1 — complete

- image load / replace
- SVG overlay
- manual circle create/select/move/resize/delete
- pan / zoom / fit
- normalized and pixel measurements

### Geometry Analysis

**A — Measurement foundation — complete**

- explicit analysis origin
- circle measurements
- origin-relative polar measurements
- nearest-circle relations

**B1 — Radial ordering — complete**

- document-wide origin-centered radial ordering
- clockwise angular ordering
- angular gap sequence including wrap-around
- selected-circle radial/angular rank and immediate neighbors
- no grouping/clustering assumptions

**B2 — Radial band candidates — current**

- explicit absolute source-plane grouping tolerance
- radial band / ring candidates
- mean radius, span and residual metrics
- selected-circle candidate membership and residual
- tolerance remains a visible analysis parameter rather than a hidden heuristic

**C — Symmetry — next after B2 verification**

- rotational symmetry candidates
- residuals rather than binary labels
- later reflection symmetry

**D — Negative space**

- occupied/empty region representation
- negative-space measurements and topology groundwork

Repeated radial interval/sequence analysis, angular/spoke grouping, advanced constant exploration, Voronoi/Delaunay, sequence/phase interpretation and automated structure search remain later Geometry work.

## Model / Simulation layer

The visible v0.1 sequence remains Geometry → Resonance → Compare. Internally, simulation uses a generic model-family contract so Resonance does not become a special-case project format.

### Resonance — first implemented model family

Planned initial models:

- plate / Chladni-like modes
- circular membrane
- later water/interference candidates

The first numerical engine may use Python/NumPy/SciPy behind the generic `ModelAdapter` boundary.

### 3D View Adapter

Babylon.js is added only as a renderer/view adapter after a simulation model produces useful state. Rendering remains separate from the numerical engine.

### Compare

Observed geometry and model output are aligned and compared through multiple explicit metrics rather than one opaque match score.

## Reserved future model family — Kinematics / Mechanism

Kinematics is intentionally **not** part of the current implementation sequence. The architecture reserves it now so adding it later does not require changing geometry primitives, persistence, simulation boundaries or 2D/3D rendering contracts.

Future candidate semantic roles include:

- pivot / axis
- rotor / rotating body
- mass
- rigid link / arm
- orbit / track
- eccentric offset
- spring / constraint
- phase / rotation relation

Initial questions are mechanical consistency questions: paths, angular relationships, periodicity, collisions, constraint violations and sensitivity to measured geometry. Torque and energy accounting follow only after a coherent kinematic model exists.

Sensitivity sweeps should perturb measured geometry (for example ±1%, ±2%, ±5%). Null/randomized models are reserved so apparent fine tuning can later be judged against an explicit baseline.

Possible views for the same future result:

- schematic 2D
- trajectory 2D
- Babylon 3D

No physics library is selected at this reservation stage.

## Longer-term model families

The same contracts may later support other generative interpretations, including 3D projection/reconstruction models, without changing the observed geometry layer.

The governing research flow is:

```text
Observed Geometry
      |
      +-- structural / mathematical analysis
      +-- resonance / wave models
      +-- kinematics / mechanism models
      +-- future model families
                    |
                    v
                 Compare
```

RGL reports what each model explains, its residuals and how many assumptions/free parameters it needs. The UI does not decide which interpretation is true.
