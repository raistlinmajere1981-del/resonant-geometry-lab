import { describe, expect, it } from 'vitest'
import { pixelToPlane, planeDistance, planeToPixel, sourcePlaneHeight } from './coordinates'

describe('source-plane coordinates', () => {
  it('keeps x/y units isotropic', () => {
    const source = { width: 4000, height: 3000 }
    expect(sourcePlaneHeight(source)).toBeCloseTo(0.75)

    const point = pixelToPlane({ x: 1000, y: 1000 }, source.width)
    expect(point).toEqual({ x: 0.25, y: 0.25 })
    expect(planeDistance({ x: 0, y: 0 }, point)).toBeCloseTo(Math.sqrt(0.125))
  })

  it('round-trips pixel positions', () => {
    const width = 4096
    const pixelPoint = { x: 1337, y: 911 }
    const planePoint = pixelToPlane(pixelPoint, width)
    const restored = planeToPixel(planePoint, width)

    expect(restored.x).toBeCloseTo(pixelPoint.x)
    expect(restored.y).toBeCloseTo(pixelPoint.y)
  })

  it('rejects invalid dimensions', () => {
    expect(() => sourcePlaneHeight({ width: 0, height: 100 })).toThrow()
    expect(() => pixelToPlane({ x: 0, y: 0 }, 0)).toThrow()
  })
})
