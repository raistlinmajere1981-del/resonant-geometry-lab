import { describe, expect, it } from 'vitest'
import type { CirclePrimitive } from '../core/model'
import { buildRadialStructure, radialContextForCircle } from './radialStructure'

const circle = (id: string, x: number, y: number, radius = 0.05, hidden = false): CirclePrimitive => ({
  id,
  kind: 'circle',
  center: { x, y },
  radius,
  ...(hidden ? { hidden: true } : {}),
})

const origin = { x: 0, y: 0 }

describe('radial structure', () => {
  it('orders visible circles by radial distance', () => {
    const structure = buildRadialStructure(
      [circle('far', 0.6, 0), circle('near', 0.2, 0), circle('middle', 0.4, 0)],
      origin,
    )

    expect(structure.radialOrder).toEqual(['near', 'middle', 'far'])
    expect(structure.entries.find((entry) => entry.circleId === 'middle')?.radialRank).toBe(2)
  })

  it('orders angles clockwise in image space and computes wrap-around gaps', () => {
    const structure = buildRadialStructure(
      [
        circle('left', -1, 0),
        circle('up', 0, -1),
        circle('right', 1, 0),
        circle('down', 0, 1),
      ],
      origin,
    )

    expect(structure.angularOrder).toEqual(['right', 'down', 'left', 'up'])
    expect(structure.angularGaps.map((gap) => gap.degrees)).toEqual([90, 90, 90, 90])
    expect(structure.angularGaps.reduce((sum, gap) => sum + gap.degrees, 0)).toBeCloseTo(360)
  })

  it('keeps origin-centered circles in radial order but excludes them from angular order', () => {
    const structure = buildRadialStructure(
      [circle('center', 0, 0), circle('right', 0.4, 0), circle('down', 0, 0.4)],
      origin,
    )

    expect(structure.radialOrder).toEqual(['center', 'right', 'down'])
    expect(structure.centralCircleIds).toEqual(['center'])
    expect(structure.angularOrder).toEqual(['right', 'down'])
    expect(structure.entries.find((entry) => entry.circleId === 'center')?.angleDegrees).toBeUndefined()
  })

  it('ignores hidden circles', () => {
    const structure = buildRadialStructure(
      [circle('visible', 0.3, 0), circle('hidden', 0.1, 0, 0.05, true)],
      origin,
    )

    expect(structure.radialOrder).toEqual(['visible'])
    expect(structure.entries).toHaveLength(1)
  })

  it('reports radial neighbors and adjacent angular gaps for a selected circle', () => {
    const structure = buildRadialStructure(
      [circle('a', 0.2, 0), circle('b', 0, 0.4), circle('c', -0.6, 0)],
      origin,
    )
    const context = radialContextForCircle(structure, 'b')

    expect(context?.entry.radialRank).toBe(2)
    expect(context?.innerCircleId).toBe('a')
    expect(context?.innerDistanceDelta).toBeCloseTo(0.2)
    expect(context?.outerCircleId).toBe('c')
    expect(context?.outerDistanceDelta).toBeCloseTo(0.2)
    expect(context?.previousAngularGap?.fromCircleId).toBe('a')
    expect(context?.nextAngularGap?.toCircleId).toBe('c')
  })
})
