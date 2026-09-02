import type { CirclePrimitive, PlanePoint } from '../core/model'
import { findNearestCircle, measureCircle, measureFromOrigin } from './measurements'
import { buildRadialStructure, radialContextForCircle } from './radialStructure'

type GeometryAnalysisPanelProps = {
  circles: readonly CirclePrimitive[]
  origin?: PlanePoint
  selectedCircle: CirclePrimitive
}

const format = (value: number, digits = 5) => value.toFixed(digits)

export function GeometryAnalysisPanel({ circles, origin, selectedCircle }: GeometryAnalysisPanelProps) {
  const circleMetrics = measureCircle(selectedCircle)
  const polar = origin ? measureFromOrigin(selectedCircle.center, origin) : null
  const nearest = findNearestCircle(selectedCircle, circles)
  const radialStructure = origin ? buildRadialStructure(circles, origin) : null
  const radialContext = radialStructure
    ? radialContextForCircle(radialStructure, selectedCircle.id)
    : null

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
    </>
  )
}
