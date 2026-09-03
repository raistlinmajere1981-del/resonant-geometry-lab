import type { CirclePrimitive, PlanePoint } from '../core/model'
import { measureFromOrigin } from './measurements'

const ORIGIN_EPSILON = 1e-9

export type RotationalSymmetryCandidate = {
  order: number
  stepDegrees: number
  sampleCount: number
  centralCircleCount: number
  centerRms: number
  centerMax: number
  angularRmsDegrees: number
  radialRms: number
  circleRadiusRms: number
  uniqueMatchCoverage: number
}

export type RotationalSymmetryAnalysis = {
  eligibleCircleCount: number
  centralCircleCount: number
  maxOrder: number
  candidates: RotationalSymmetryCandidate[]
}

type Sample = {
  id: string
  center: PlanePoint
  radialDistance: number
  angleDegrees: number
  radius: number
}

type Residual = {
  center: number
  angular: number
  radial: number
  circleRadius: number
}

const rms = (values: readonly number[]) =>
  values.length === 0 ? 0 : Math.sqrt(values.reduce((sum, value) => sum + value * value, 0) / values.length)

const angularDifference = (a: number, b: number) => {
  const delta = Math.abs(a - b) % 360
  return Math.min(delta, 360 - delta)
}

const rotatePoint = (point: PlanePoint, origin: PlanePoint, degrees: number): PlanePoint => {
  const radians = (degrees * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const dx = point.x - origin.x
  const dy = point.y - origin.y

  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  }
}

const compareIds = (a: string, b: string) => a.localeCompare(b)

const nearestSample = (point: PlanePoint, samples: readonly Sample[]) => {
  let best: Sample | null = null
  let bestDistance = Number.POSITIVE_INFINITY

  for (const sample of samples) {
    const distance = Math.hypot(point.x - sample.center.x, point.y - sample.center.y)
    if (distance < bestDistance || (distance === bestDistance && best && compareIds(sample.id, best.id) < 0)) {
      best = sample
      bestDistance = distance
    }
  }

  return best ? { sample: best, distance: bestDistance } : null
}

const residualBetween = (
  targetCenter: PlanePoint,
  targetRadialDistance: number,
  targetAngleDegrees: number,
  targetCircleRadius: number,
  observed: Sample,
): Residual => ({
  center: Math.hypot(targetCenter.x - observed.center.x, targetCenter.y - observed.center.y),
  angular: angularDifference(targetAngleDegrees, observed.angleDegrees),
  radial: Math.abs(targetRadialDistance - observed.radialDistance),
  circleRadius: Math.abs(targetCircleRadius - observed.radius),
})

export function evaluateRotationalSymmetry(
  circles: readonly CirclePrimitive[],
  origin: PlanePoint,
  order: number,
): RotationalSymmetryCandidate | null {
  if (!Number.isInteger(order) || order < 2) throw new Error('Rotational symmetry order must be an integer of at least 2.')

  const visible = circles.filter((circle) => !circle.hidden)
  let centralCircleCount = 0
  const samples: Sample[] = []

  for (const circle of visible) {
    const polar = measureFromOrigin(circle.center, origin)
    if (polar.distance <= ORIGIN_EPSILON || polar.angleDegrees === undefined) {
      centralCircleCount += 1
      continue
    }

    samples.push({
      id: circle.id,
      center: circle.center,
      radialDistance: polar.distance,
      angleDegrees: polar.angleDegrees,
      radius: circle.radius,
    })
  }

  if (samples.length < 2 || order > samples.length) return null

  const stepDegrees = 360 / order
  const rotated = samples.map((sample) => {
    const center = rotatePoint(sample.center, origin, stepDegrees)
    const polar = measureFromOrigin(center, origin)
    return {
      source: sample,
      center,
      radialDistance: polar.distance,
      angleDegrees: polar.angleDegrees ?? sample.angleDegrees,
    }
  })

  const forwardResiduals: Residual[] = []
  const forwardMatches = new Set<string>()
  for (const target of rotated) {
    const nearest = nearestSample(target.center, samples)
    if (!nearest) continue
    forwardMatches.add(nearest.sample.id)
    forwardResiduals.push(
      residualBetween(
        target.center,
        target.radialDistance,
        target.angleDegrees,
        target.source.radius,
        nearest.sample,
      ),
    )
  }

  const rotatedAsSamples: Sample[] = rotated.map((target) => ({
    id: target.source.id,
    center: target.center,
    radialDistance: target.radialDistance,
    angleDegrees: target.angleDegrees,
    radius: target.source.radius,
  }))

  const reverseResiduals: Residual[] = []
  const reverseMatches = new Set<string>()
  for (const observed of samples) {
    const nearest = nearestSample(observed.center, rotatedAsSamples)
    if (!nearest) continue
    reverseMatches.add(nearest.sample.id)
    reverseResiduals.push(
      residualBetween(
        observed.center,
        observed.radialDistance,
        observed.angleDegrees,
        observed.radius,
        nearest.sample,
      ),
    )
  }

  const residuals = [...forwardResiduals, ...reverseResiduals]
  const centerResiduals = residuals.map((residual) => residual.center)

  return {
    order,
    stepDegrees,
    sampleCount: samples.length,
    centralCircleCount,
    centerRms: rms(centerResiduals),
    centerMax: centerResiduals.length ? Math.max(...centerResiduals) : 0,
    angularRmsDegrees: rms(residuals.map((residual) => residual.angular)),
    radialRms: rms(residuals.map((residual) => residual.radial)),
    circleRadiusRms: rms(residuals.map((residual) => residual.circleRadius)),
    uniqueMatchCoverage: Math.min(forwardMatches.size, reverseMatches.size) / samples.length,
  }
}

export function buildRotationalSymmetryCandidates(
  circles: readonly CirclePrimitive[],
  origin: PlanePoint,
  requestedMaxOrder = 12,
): RotationalSymmetryAnalysis {
  if (!Number.isInteger(requestedMaxOrder) || requestedMaxOrder < 2) {
    throw new Error('Maximum rotational symmetry order must be an integer of at least 2.')
  }

  const visible = circles.filter((circle) => !circle.hidden)
  const centralCircleCount = visible.filter((circle) => measureFromOrigin(circle.center, origin).distance <= ORIGIN_EPSILON).length
  const eligibleCircleCount = visible.length - centralCircleCount
  const maxOrder = Math.min(requestedMaxOrder, eligibleCircleCount)
  const candidates: RotationalSymmetryCandidate[] = []

  for (let order = 2; order <= maxOrder; order += 1) {
    const candidate = evaluateRotationalSymmetry(circles, origin, order)
    if (candidate) candidates.push(candidate)
  }

  return {
    eligibleCircleCount,
    centralCircleCount,
    maxOrder,
    candidates,
  }
}
