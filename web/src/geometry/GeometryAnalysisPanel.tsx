import type { CirclePrimitive, PlanePoint } from '../core/model'
import { findNearestCircle, measureCircle, measureFromOrigin } from './measurements'

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

  return (
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
            <div><span>Polar angle</span><strong>{polar.angleDegrees.toFixed(2)}°</strong></div>
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
  )
}
