import { useMemo, useState } from 'react'
import type { CirclePrimitive, PlanePoint } from '../core/model'
import { PanelHelp } from '../ui/PanelHelp'
import { findNearestCircle, measureCircle, measureFromOrigin } from './measurements'
import { buildRadialBandCandidates, radialBandForCircle } from './radialBands'
import { buildRadialStructure, radialContextForCircle } from './radialStructure'
import { evaluateRotationalSymmetry } from './rotationalSymmetry'
import './RadialBands.css'

type GeometryAnalysisPanelProps = {
  circles: readonly CirclePrimitive[]
  origin?: PlanePoint
  selectedCircle: CirclePrimitive
}

const DEFAULT_BAND_TOLERANCE = 0.005
const format = (value: number, digits = 5) => value.toFixed(digits)

export function GeometryAnalysisPanel({ circles, origin, selectedCircle }: GeometryAnalysisPanelProps) {
  const [bandTolerance, setBandTolerance] = useState(DEFAULT_BAND_TOLERANCE)
  const [symmetryOrder, setSymmetryOrder] = useState(2)
  const circleMetrics = measureCircle(selectedCircle)
  const polar = origin ? measureFromOrigin(selectedCircle.center, origin) : null
  const nearest = findNearestCircle(selectedCircle, circles)
  const radialStructure = origin ? buildRadialStructure(circles, origin) : null
  const radialContext = radialStructure
    ? radialContextForCircle(radialStructure, selectedCircle.id)
    : null
  const bandAnalysis = useMemo(
    () => (radialStructure ? buildRadialBandCandidates(radialStructure, bandTolerance) : null),
    [radialStructure, bandTolerance],
  )
  const bandContext = bandAnalysis
    ? radialBandForCircle(bandAnalysis, selectedCircle.id)
    : null
  const symmetryEligibleCount = radialStructure?.angularOrder.length ?? 0
  const activeSymmetryOrder = Math.min(Math.max(2, symmetryOrder), Math.max(2, symmetryEligibleCount))
  const symmetryCandidate = useMemo(
    () =>
      origin && symmetryEligibleCount >= 2
        ? evaluateRotationalSymmetry(circles, origin, activeSymmetryOrder)
        : null,
    [circles, origin, symmetryEligibleCount, activeSymmetryOrder],
  )

  return (
    <>
      <section className="context-section geometry-analysis-section">
        <h3>Analysis</h3>
        <div className="measurement-list">
          <div><span>Area</span><strong>{format(circleMetrics.area)}</strong></div>
          <div><span>Circumference</span><strong>{format(circleMetrics.circumference)}</strong></div>

          {polar && (
            <>
              <div><span>Origin Δx</span><strong>{format(polar.dx)}</strong></div>
              <div><span>Origin Δy</span><strong>{format(polar.dy)}</strong></div>
              <div><span>Radial distance</span><strong>{format(polar.distance)}</strong></div>
              <div>
                <span>Polar angle</span>
                <strong>{polar.angleDegrees === undefined ? 'center' : `${polar.angleDegrees.toFixed(2)}°`}</strong>
              </div>
            </>
          )}

          {nearest && (
            <>
              <div><span>Nearest</span><strong>{nearest.circleId.slice(0, 8)}</strong></div>
              <div><span>Center distance</span><strong>{format(nearest.centerDistance)}</strong></div>
              <div><span>Edge gap</span><strong>{format(nearest.edgeGap)}</strong></div>
              <div><span>Radius ratio</span><strong>{nearest.radiusRatio.toFixed(4)}</strong></div>
            </>
          )}
        </div>
      </section>

      {radialStructure && radialContext && (
        <section className="context-section geometry-analysis-section">
          <h3>Radial structure</h3>
          <div className="measurement-list">
            <div>
              <span>Radial rank</span>
              <strong>{radialContext.entry.radialRank} / {radialStructure.radialOrder.length}</strong>
            </div>
            <div>
              <span>Angular rank</span>
              <strong>
                {radialContext.entry.angularRank
                  ? `${radialContext.entry.angularRank} / ${radialStructure.angularOrder.length}`
                  : 'center'}
              </strong>
            </div>

            {radialContext.innerCircleId && radialContext.innerDistanceDelta !== null && (
              <>
                <div><span>Inner circle</span><strong>{radialContext.innerCircleId.slice(0, 8)}</strong></div>
                <div><span>Inner Δr</span><strong>{format(radialContext.innerDistanceDelta)}</strong></div>
              </>
            )}

            {radialContext.outerCircleId && radialContext.outerDistanceDelta !== null && (
              <>
                <div><span>Outer circle</span><strong>{radialContext.outerCircleId.slice(0, 8)}</strong></div>
                <div><span>Outer Δr</span><strong>{format(radialContext.outerDistanceDelta)}</strong></div>
              </>
            )}

            {radialContext.previousAngularGap && (
              <div>
                <span>Previous angle gap</span>
                <strong>{radialContext.previousAngularGap.degrees.toFixed(2)}°</strong>
              </div>
            )}
            {radialContext.nextAngularGap && (
              <div>
                <span>Next angle gap</span>
                <strong>{radialContext.nextAngularGap.degrees.toFixed(2)}°</strong>
              </div>
            )}
          </div>
        </section>
      )}

      {bandAnalysis && bandContext && (
        <section className="context-section geometry-analysis-section">
          <div className="analysis-section-heading">
            <h3>Radial bands</h3>
            <PanelHelp label="Radial band help">
              Candidate bands use an explicit absolute source-plane tolerance. Smaller values split bands; larger values merge nearby radial distances.
            </PanelHelp>
          </div>

          <label className="analysis-parameter-row">
            <span>Band tolerance</span>
            <input
              aria-label="Radial band tolerance"
              className="analysis-number-input"
              min="0"
              onChange={(event) => {
                const value = event.currentTarget.valueAsNumber
                if (Number.isFinite(value) && value >= 0) setBandTolerance(value)
              }}
              step="0.001"
              type="number"
              value={bandTolerance}
            />
          </label>
          <div className="analysis-parameter-meta">
            {(bandTolerance * 100).toFixed(3)}% of source-plane width
          </div>

          <div className="measurement-list band-measurements">
            <div><span>Band candidate</span><strong>{bandContext.band.bandIndex} / {bandAnalysis.bands.length}</strong></div>
            <div><span>Members</span><strong>{bandContext.band.members.length}</strong></div>
            <div><span>Mean radius</span><strong>{format(bandContext.band.centerRadius)}</strong></div>
            <div><span>Selected residual</span><strong>{format(bandContext.member.residual)}</strong></div>
            <div><span>Max residual</span><strong>{format(bandContext.band.maxResidual)}</strong></div>
            <div><span>RMS residual</span><strong>{format(bandContext.band.rmsResidual)}</strong></div>
            <div><span>Band span</span><strong>{format(bandContext.band.span)}</strong></div>
          </div>
        </section>
      )}

      {symmetryCandidate && (
        <section className="context-section geometry-analysis-section">
          <div className="analysis-section-heading">
            <h3>Rotational symmetry</h3>
            <PanelHelp label="Rotational symmetry help">
              Rotate the observed circle set by 360/order and compare it back to the observation. Residual components stay separate; no single symmetry score is inferred.
            </PanelHelp>
          </div>

          <label className="analysis-parameter-row">
            <span>Candidate order</span>
            <input
              aria-label="Rotational symmetry candidate order"
              className="analysis-number-input"
              max={symmetryEligibleCount}
              min="2"
              onChange={(event) => {
                const value = event.currentTarget.valueAsNumber
                if (Number.isInteger(value) && value >= 2) setSymmetryOrder(value)
              }}
              step="1"
              type="number"
              value={activeSymmetryOrder}
            />
          </label>
          <div className="analysis-parameter-meta">
            orders 2–{symmetryEligibleCount} · central circles do not constrain rotation
          </div>

          <div className="measurement-list band-measurements">
            <div><span>Rotation step</span><strong>{symmetryCandidate.stepDegrees.toFixed(2)}°</strong></div>
            <div><span>Samples</span><strong>{symmetryCandidate.sampleCount}</strong></div>
            <div><span>Center RMS</span><strong>{format(symmetryCandidate.centerRms)}</strong></div>
            <div><span>Center max</span><strong>{format(symmetryCandidate.centerMax)}</strong></div>
            <div><span>Angular RMS</span><strong>{symmetryCandidate.angularRmsDegrees.toFixed(2)}°</strong></div>
            <div><span>Radial RMS</span><strong>{format(symmetryCandidate.radialRms)}</strong></div>
            <div><span>Circle radius RMS</span><strong>{format(symmetryCandidate.circleRadiusRms)}</strong></div>
            <div><span>Unique coverage</span><strong>{(symmetryCandidate.uniqueMatchCoverage * 100).toFixed(1)}%</strong></div>
            {symmetryCandidate.centralCircleCount > 0 && (
              <div><span>Central ignored</span><strong>{symmetryCandidate.centralCircleCount}</strong></div>
            )}
          </div>
        </section>
      )}
    </>
  )
}
