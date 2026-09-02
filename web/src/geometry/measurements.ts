import { planeDistance } from '../core/coordinates'
import type { CirclePrimitive, PlanePoint } from '../core/model'

export type CircleMetrics = {
  radius: number
  diameter: number
  circumference: number
  area: number
}

export type PolarMeasurement = {
  dx: number
  dy: number
  distance: number
  angleDegrees?: number
}

export type CirclePairMeasurement = {
  circleId: string
  centerDistance: number
  edgeGap: number
  radiusRatio: number
}

const ORIGIN_EPSILON = 1e-9
const normalizeAngleDegrees = (angle: number) => ((angle % 360) + 360) % 360

export function measureCircle(circle: CirclePrimitive): CircleMetrics {
  return {
    radius: circle.radius,
    diameter: circle.radius * 2,
    circumference: 2 * Math.PI * circle.radius,
    area: Math.PI * circle.radius * circle.radius,
  }
}

/**
 * Image-space polar measurement. Source-plane y increases downward, so angles
 * increase clockwise from the positive x axis: right=0°, down=90°.
 * A point coincident with the origin has no meaningful polar angle.
 */
export function measureFromOrigin(point: PlanePoint, origin: PlanePoint): PolarMeasurement {
  const dx = point.x - origin.x
  const dy = point.y - origin.y
  const distance = Math.hypot(dx, dy)

  return {
    dx,
    dy,
    distance,
    ...(distance > ORIGIN_EPSILON
      ? { angleDegrees: normalizeAngleDegrees((Math.atan2(dy, dx) * 180) / Math.PI) }
      : {}),
  }
}

export function measureCirclePair(circle: CirclePrimitive, other: CirclePrimitive): CirclePairMeasurement {
  const centerDistance = planeDistance(circle.center, other.center)

  return {
    circleId: other.id,
    centerDistance,
    edgeGap: centerDistance - circle.radius - other.radius,
    radiusRatio: other.radius === 0 ? Number.POSITIVE_INFINITY : circle.radius / other.radius,
  }
}

export function findNearestCircle(
  circle: CirclePrimitive,
  circles: readonly CirclePrimitive[],
): CirclePairMeasurement | null {
  let nearest: CirclePairMeasurement | null = null

  for (const other of circles) {
    if (other.id === circle.id || other.hidden) continue
    const measurement = measureCirclePair(circle, other)
    if (!nearest || measurement.centerDistance < nearest.centerDistance) nearest = measurement
  }

  return nearest
}
