# Geometry Analysis checkpoints

Geometry Analysis is intentionally split into small checkpoints so that each layer can be validated before more interpretive analysis is added.

## Checkpoint A — measurement foundation

Complete:

- pure TypeScript derived measurements
- explicit persisted analysis origin
- clockwise image-space polar convention
- circle area and circumference
- origin delta, radial distance and polar angle
- nearest-circle center distance, edge gap and radius ratio
- contextual right-panel presentation only when a circle is selected

## Checkpoint B1 — radial ordering

Current checkpoint:

- derive a document-wide polar list from visible circles and the explicit origin
- stable radial ordering by center distance
- stable clockwise angular ordering
- central circles remain in radial order but are excluded from angular order because their polar angle is undefined
- wrap-around angular gap sequence whose full-cycle gaps sum to 360° when two or more angular samples exist
- selected-circle radial rank, angular rank, inner/outer radial neighbors and adjacent angular gaps
- plain result objects suitable for later export/analysis without persisting derived ranks or gaps into primitives

No clustering tolerance is introduced here. B1 exposes the measured ordering before deciding how circles should be grouped.

## Checkpoint B2 — radial band candidates

Planned only after B1 is locally verified:

- derived radial band / ring candidates
- explicit, inspectable grouping tolerance rather than a hidden heuristic
- band membership and residual-to-band values
- repeated radial interval / sequence groundwork
- later optional angular/spoke grouping if the data justifies it

Band candidates remain derived hypotheses. They must not silently rewrite or label observed primitives.

## Checkpoint C — symmetry

Planned after the radial structure contract is stable:

- candidate rotational orders
- rotational residuals rather than a single match percentage
- reflection-axis candidates
- explicit tolerance and confidence inputs

## Checkpoint D — negative space

Kept separate because it requires a geometric representation decision rather than merely more scalar measurements:

- occupied vs empty regions
- boundary construction
- later Voronoi/Delaunay experiments if they solve a measured need

Constant exploration, sequence interpretation and resonance-model matching remain later layers built on these lower-level measurements.
