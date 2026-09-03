import { describe, expect, it } from 'vitest'
import type { CirclePrimitive } from '../core/model'
import { buildRotationalSymmetryCandidates, evaluateRotationalSymmetry } from './rotationalSymmetry'

const circle = (id: string, x: number, y: number, radius = 0.05, hidden = false): CirclePrimitive => ({
  id,
  kind: 'circle',
  center: { x, y },
  radius,
  ...(hidden ? { hidden: true } : {}),
})

const origin = { x: 0, y: 0 }

const fourfold = [
  circle('right', 1, 0),
  circle('down', 0, 1),
  circle('left', -1, 0),
  circle('up', 0, -1),
]

describe('rotational symmetry', () => {
  it('reports zero residual for an exact fourfold arrangement', () => {
    const result = evaluateRotationalSymmetry(fourfold, origin, 4)

    expect(result).not.toBeNull()
    expect(result?.stepDegrees).toBeCloseTo(90)
    expect(result?.centerRms).toBeCloseTo(0)
    expect(result?.centerMax).toBeCloseTo(0)
    expect(result?.angularRmsDegrees).toBeCloseTo(0)
    expect(result?.radialRms).toBeCloseTo(0)
    expect(result?.circleRadiusRms).toBeCloseTo(0)
    expect(result?.uniqueMatchCoverage).toBeCloseTo(1)
  })

  it('keeps residual components separate when circle size breaks an otherwise exact arrangement', () => {
    const changed = fourfold.map((item) => item.id === 'down' ? { ...item, radius: 0.08 } : item)
    const result = evaluateRotationalSymmetry(changed, origin, 4)

    expect(result?.centerRms).toBeCloseTo(0)
    expect(result?.angularRmsDegrees).toBeCloseTo(0)
    expect(result?.radialRms).toBeCloseTo(0)
    expect(result?.circleRadiusRms).toBeGreaterThan(0)
  })

  it('raises spatial residual when one center is perturbed', () => {
    const changed = fourfold.map((item) => item.id === 'down' ? { ...item, center: { x: 0.12, y: 1 } } : item)
    const result = evaluateRotationalSymmetry(changed, origin, 4)

    expect(result?.centerRms).toBeGreaterThan(0)
    expect(result?.angularRmsDegrees).toBeGreaterThan(0)
  })

  it('ignores hidden and origin-centered circles in candidate scoring', () => {
    const result = evaluateRotationalSymmetry(
      [...fourfold, circle('center', 0, 0), circle('hidden', 0.2, 0.3, 0.05, true)],
      origin,
      4,
    )

    expect(result?.sampleCount).toBe(4)
    expect(result?.centralCircleCount).toBe(1)
    expect(result?.centerRms).toBeCloseTo(0)
  })

  it('builds explicit candidate orders only up to the eligible sample count', () => {
    const analysis = buildRotationalSymmetryCandidates(fourfold, origin, 12)

    expect(analysis.eligibleCircleCount).toBe(4)
    expect(analysis.maxOrder).toBe(4)
    expect(analysis.candidates.map((candidate) => candidate.order)).toEqual([2, 3, 4])
  })

  it('rejects invalid candidate limits and unsupported orders', () => {
    expect(() => buildRotationalSymmetryCandidates(fourfold, origin, 1)).toThrow()
    expect(() => evaluateRotationalSymmetry(fourfold, origin, 1)).toThrow()
    expect(evaluateRotationalSymmetry(fourfold, origin, 5)).toBeNull()
  })
})
