export type NormalizedPoint = {
  x: number
  y: number
}

export type PrimitiveKind =
  | 'point'
  | 'circle'
  | 'ellipse'
  | 'line'
  | 'arc'
  | 'polyline'
  | 'polygon'
  | 'region'

export type PrimitiveBase = {
  id: string
  kind: PrimitiveKind
  label?: string
  tags?: string[]
  hidden?: boolean
  locked?: boolean
}

export type PointPrimitive = PrimitiveBase & {
  kind: 'point'
  position: NormalizedPoint
}

export type CirclePrimitive = PrimitiveBase & {
  kind: 'circle'
  center: NormalizedPoint
  radius: number
}

export type EllipsePrimitive = PrimitiveBase & {
  kind: 'ellipse'
  center: NormalizedPoint
  radiusX: number
  radiusY: number
  rotationDegrees: number
}

export type LinePrimitive = PrimitiveBase & {
  kind: 'line'
  start: NormalizedPoint
  end: NormalizedPoint
}

export type ArcPrimitive = PrimitiveBase & {
  kind: 'arc'
  center: NormalizedPoint
  radius: number
  startDegrees: number
  endDegrees: number
}

export type PolylinePrimitive = PrimitiveBase & {
  kind: 'polyline'
  points: NormalizedPoint[]
}

export type PolygonPrimitive = PrimitiveBase & {
  kind: 'polygon'
  points: NormalizedPoint[]
}

export type RegionPrimitive = PrimitiveBase & {
  kind: 'region'
  points: NormalizedPoint[]
  role?: 'occupied' | 'empty' | 'mask' | 'reference'
}

export type GeometryPrimitive =
  | PointPrimitive
  | CirclePrimitive
  | EllipsePrimitive
  | LinePrimitive
  | ArcPrimitive
  | PolylinePrimitive
  | PolygonPrimitive
  | RegionPrimitive

export type SourceImage = {
  name: string
  width: number
  height: number
  objectUrl?: string
}

export type GeometryDocument = {
  origin?: NormalizedPoint
  primitives: GeometryPrimitive[]
}

export type RglProject = {
  schemaVersion: 1
  id: string
  name: string
  sourceImage?: SourceImage
  geometry: GeometryDocument
}

export const emptyProject = (): RglProject => ({
  schemaVersion: 1,
  id: crypto.randomUUID(),
  name: 'Untitled project',
  geometry: {
    primitives: [],
  },
})
