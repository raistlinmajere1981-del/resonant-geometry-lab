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

Complete:

- derive a document-wide polar list from visible circles and the explicit origin
- stable radial ordering by center distance
- stable clockwise angular ordering
- central circles remain in radial order but are excluded from angular order because their polar angle is undefined
- wrap-around angular gap sequence whose full-cycle gaps sum to 360° when two or more angular samples exist
- selected-circle radial rank, angular rank, inner/outer radial neighbors and adjacent angular gaps
- plain result objects suitable for later export/analysis without persisting derived ranks or gaps into primitives

B1 intentionally introduced no clustering tolerance. It exposes the measured ordering before deciding how circles should be grouped.

## Checkpoint B2 — radial band candidates

Current checkpoint:

- derived radial band / ring candidates from the stable B1 radial ordering
- explicit absolute source-plane tolerance supplied to the analysis function
- deterministic greedy grouping over radial order
- a circle joins the current candidate only when every member remains within tolerance of the candidate's updated mean radius
- band mean radius, min/max radius, span, maximum residual and RMS residual
- selected-circle signed residual and candidate membership
- tolerance carried in the derived result so later exports can state exactly how the grouping was produced
- compact transient tolerance control in the context panel; changing it does not modify geometry or undo/redo history

The first UI default is `0.005` source-plane units, equivalent to 0.5% of source width. This is a starting control value, not a claim that 0.005 is the statistically correct tolerance.

The algorithm deliberately does not use simple adjacent-gap chaining because a sequence of individually small gaps can otherwise merge points whose overall radial spread is large. It also does not search for an 'optimal' tolerance. Sensitivity to tolerance and null/randomized baselines belong to later analysis work.

Band candidates remain derived hypotheses. They never rewrite or label observed primitives.

Repeated radial interval/sequence analysis and optional angular/spoke grouping remain later work after B2 is verified.

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
