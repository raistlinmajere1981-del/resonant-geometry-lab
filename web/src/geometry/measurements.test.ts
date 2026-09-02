import { describe, expect, it } from 'vitest'
import type { CirclePrimitive } from '../core/model'
import { findNearestCircle, measureCircle, measureCirclePair, measureFromOrigin } from './measurements'

const circle = (id: string, x: number, y: number, radius: number): CirclePrimitive => ({
  id,
  kind: 'circle',
  center: { x, y },
  radius,
})

describe('geometry measurements', () => {
  it('derives circle metrics without storing them on the primitive', () => {
    const metrics = measureCircle(circle('a', 0.5, 0.5, 0.25))

    expect(metrics.radius).toBeCloseTo(0.25)
    expect(metrics.diameter).toBeCloseTo(0.5)
    expect(metrics.circumference).toBeCloseTo(Math.PI / 2)
    expect(metrics.area).toBeCloseTo(Math.PI / 16)
  })

  it('uses clockwise image-space polar angles', () => {
    const origin = { x: 0.5, y: 0.5 }

    expect(measureFromOrigin({ x: 0.75, y: 0.5 }, origin).angleDegrees).toBeCloseTo(0)
    expect(measureFromOrigin({ x: 0.5, y: 0.75 }, origin).angleDegrees).toBeCloseTo(90)
    expect(measureFromOrigin({ x: 0.25, y: 0.5 }, origin).angleDegrees).toBeCloseTo(180)
    expect(measureFromOrigin({ x: 0.5, y: 0.25 }, origin).angleDegrees).toBeCloseTo(270)
  })

  it('leaves polar angle undefined when the point coincides with the origin', () => {
    const origin = { x: 0.5, y: 0.5 }
    const measurement = measureFromOrigin(origin, origin)

    expect(measurement.distance).toBe(0)
    expect(measurement.angleDegrees).toBeUndefined()
  })

  it('measures pair distance, edge gap and directional radius ratio', () => {
    const result = measureCirclePair(circle('a', 0, 0, 0.1), circle('b', 0.5, 0, 0.2))

    expect(result.centerDistance).toBeCloseTo(0.5)
    expect(result.edgeGap).toBeCloseTo(0.2)
    expect(result.radiusRatio).toBeCloseTo(0.5)
  })

  it('finds the nearest visible circle by center distance', () => {
    const selected = circle('selected', 0, 0, 0.1)
    const hidden = { ...circle('hidden', 0.1, 0, 0.05), hidden: true }
    const nearest = circle('nearest', 0.3, 0, 0.08)
    const farther = circle('farther', 0.6, 0, 0.12)

    expect(findNearestCircle(selected, [selected, hidden, farther, nearest])).toMatchObject({
      circleId: 'nearest',
      centerDistance: 0.3,
    })
  })
})
