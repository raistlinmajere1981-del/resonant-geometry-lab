import { describe, expect, it } from 'vitest'
import type { CirclePrimitive } from '../core/model'
import { buildRadialBandCandidates, radialBandForCircle } from './radialBands'
import { buildRadialStructure } from './radialStructure'

const circle = (id: string, distance: number): CirclePrimitive => ({
  id,
  kind: 'circle',
  center: { x: distance, y: 0 },
  radius: 0.02,
})

const structureFor = (distances: number[]) =>
  buildRadialStructure(
    distances.map((distance, index) => circle(String.fromCharCode(97 + index), distance)),
    { x: 0, y: 0 },
  )

describe('radial band candidates', () => {
  it('groups a tight radial cluster and splits a distant circle', () => {
    const analysis = buildRadialBandCandidates(structureFor([0.2, 0.204, 0.207, 0.3]), 0.005)

    expect(analysis.bands).toHaveLength(2)
    expect(analysis.bands[0].members.map((member) => member.circleId)).toEqual(['a', 'b', 'c'])
    expect(analysis.bands[1].members.map((member) => member.circleId)).toEqual(['d'])
  })

  it('does not chain adjacent small gaps into a band that exceeds the tolerance from its mean', () => {
    const analysis = buildRadialBandCandidates(structureFor([0.1, 0.109, 0.118, 0.127]), 0.01)

    expect(analysis.bands).toHaveLength(2)
    expect(analysis.bands[0].members.map((member) => member.circleId)).toEqual(['a', 'b', 'c'])
    expect(analysis.bands[0].maxResidual).toBeLessThanOrEqual(0.01)
    expect(analysis.bands[1].members.map((member) => member.circleId)).toEqual(['d'])
  })

  it('with zero tolerance only groups equal radial distances', () => {
    const analysis = buildRadialBandCandidates(structureFor([0.2, 0.2, 0.21]), 0)

    expect(analysis.bands).toHaveLength(2)
    expect(analysis.bands[0].members).toHaveLength(2)
    expect(analysis.bands[0].maxResidual).toBeCloseTo(0)
  })

  it('reports mean radius, span and residual metrics', () => {
    const analysis = buildRadialBandCandidates(structureFor([0.19, 0.2, 0.21]), 0.011)
    const band = analysis.bands[0]

    expect(band.centerRadius).toBeCloseTo(0.2)
    expect(band.minRadius).toBeCloseTo(0.19)
    expect(band.maxRadius).toBeCloseTo(0.21)
    expect(band.span).toBeCloseTo(0.02)
    expect(band.maxResidual).toBeCloseTo(0.01)
    expect(band.rmsResidual).toBeGreaterThan(0)
  })

  it('returns the selected circle assignment and signed residual', () => {
    const analysis = buildRadialBandCandidates(structureFor([0.2, 0.202, 0.35]), 0.005)
    const result = radialBandForCircle(analysis, 'b')

    expect(result?.band.bandIndex).toBe(1)
    expect(result?.band.members).toHaveLength(2)
    expect(result?.member.residual).toBeCloseTo(0.001)
  })

  it('rejects invalid tolerance values explicitly', () => {
    const structure = structureFor([0.2])
    expect(() => buildRadialBandCandidates(structure, -0.1)).toThrow('Radial band tolerance')
    expect(() => buildRadialBandCandidates(structure, Number.NaN)).toThrow('Radial band tolerance')
  })
})
