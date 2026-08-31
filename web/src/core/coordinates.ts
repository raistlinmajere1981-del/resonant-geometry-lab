import type { PlanePoint, SourceImage } from './model'

export type PixelPoint = {
  x: number
  y: number
}

export const sourcePlaneHeight = (source: Pick<SourceImage, 'width' | 'height'>): number => {
  if (source.width <= 0 || source.height <= 0) {
    throw new Error('Source image dimensions must be positive')
  }

  return source.height / source.width
}

export const pixelToPlane = (
  point: PixelPoint,
  sourceWidth: number,
): PlanePoint => {
  if (sourceWidth <= 0) {
    throw new Error('Source image width must be positive')
  }

  return {
    x: point.x / sourceWidth,
    y: point.y / sourceWidth,
  }
}

export const planeToPixel = (
  point: PlanePoint,
  sourceWidth: number,
): PixelPoint => {
  if (sourceWidth <= 0) {
    throw new Error('Source image width must be positive')
  }

  return {
    x: point.x * sourceWidth,
    y: point.y * sourceWidth,
  }
}

export const planeDistance = (a: PlanePoint, b: PlanePoint): number =>
  Math.hypot(b.x - a.x, b.y - a.y)
