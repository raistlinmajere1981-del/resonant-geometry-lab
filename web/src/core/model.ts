export type PlanePoint = {
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
  position: PlanePoint
}

export type CirclePrimitive = PrimitiveBase & {
  kind: 'circle'
  center: PlanePoint
  radius: number
}

export type EllipsePrimitive = PrimitiveBase & {
  kind: 'ellipse'
  center: PlanePoint
  radiusX: number
  radiusY: number
  rotationDegrees: number
}

export type LinePrimitive = PrimitiveBase & {
  kind: 'line'
  start: PlanePoint
  end: PlanePoint
}

export type ArcPrimitive = PrimitiveBase & {
  kind: 'arc'
  center: PlanePoint
  radius: number
  startDegrees: number
  endDegrees: number
}

export type PolylinePrimitive = PrimitiveBase & {
  kind: 'polyline'
  points: PlanePoint[]
}

export type PolygonPrimitive = PrimitiveBase & {
  kind: 'polygon'
  points: PlanePoint[]
}

export type RegionPrimitive = PrimitiveBase & {
  kind: 'region'
  points: PlanePoint[]
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
  assetId: string
  name: string
  width: number
  height: number
}

export type GeometryDocument = {
  origin?: PlanePoint
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
