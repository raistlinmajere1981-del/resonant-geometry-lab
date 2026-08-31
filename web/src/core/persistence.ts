import type { GeometryPrimitive, PlanePoint, RglProject, SourceImage } from './model'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)

const isPlanePoint = (value: unknown): value is PlanePoint =>
  isRecord(value) && isFiniteNumber(value.x) && isFiniteNumber(value.y)

const hasOptionalString = (value: unknown) => value === undefined || typeof value === 'string'
const hasOptionalBoolean = (value: unknown) => value === undefined || typeof value === 'boolean'
const hasOptionalTags = (value: unknown) =>
  value === undefined || (Array.isArray(value) && value.every((tag) => typeof tag === 'string'))

const hasPrimitiveBase = (value: Record<string, unknown>) =>
  typeof value.id === 'string' &&
  hasOptionalString(value.label) &&
  hasOptionalTags(value.tags) &&
  hasOptionalBoolean(value.hidden) &&
  hasOptionalBoolean(value.locked)

const isGeometryPrimitive = (value: unknown): value is GeometryPrimitive => {
  if (!isRecord(value) || !hasPrimitiveBase(value) || typeof value.kind !== 'string') return false

  switch (value.kind) {
    case 'point':
      return isPlanePoint(value.position)
    case 'circle':
      return isPlanePoint(value.center) && isFiniteNumber(value.radius) && value.radius >= 0
    case 'ellipse':
      return (
        isPlanePoint(value.center) &&
        isFiniteNumber(value.radiusX) &&
        value.radiusX >= 0 &&
        isFiniteNumber(value.radiusY) &&
        value.radiusY >= 0 &&
        isFiniteNumber(value.rotationDegrees)
      )
    case 'line':
      return isPlanePoint(value.start) && isPlanePoint(value.end)
    case 'arc':
      return (
        isPlanePoint(value.center) &&
        isFiniteNumber(value.radius) &&
        value.radius >= 0 &&
        isFiniteNumber(value.startDegrees) &&
        isFiniteNumber(value.endDegrees)
      )
    case 'polyline':
    case 'polygon':
      return Array.isArray(value.points) && value.points.every(isPlanePoint)
    case 'region':
      return (
        Array.isArray(value.points) &&
        value.points.every(isPlanePoint) &&
        (value.role === undefined || ['occupied', 'empty', 'mask', 'reference'].includes(String(value.role)))
      )
    default:
      return false
  }
}

const normalizeSourceImage = (value: unknown): SourceImage | undefined => {
  if (value === undefined) return undefined
  if (!isRecord(value)) throw new Error('Invalid source image metadata.')
  if (
    typeof value.name !== 'string' ||
    !isFiniteNumber(value.width) ||
    value.width <= 0 ||
    !isFiniteNumber(value.height) ||
    value.height <= 0
  ) {
    throw new Error('Invalid source image metadata.')
  }

  return {
    assetId: typeof value.assetId === 'string' && value.assetId.length > 0 ? value.assetId : crypto.randomUUID(),
    name: value.name,
    width: value.width,
    height: value.height,
  }
}

export function parseProjectJson(text: string): RglProject {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    throw new Error('Project file is not valid JSON.')
  }

  if (!isRecord(value)) throw new Error('Project file must contain an object.')
  if (value.schemaVersion !== 1) throw new Error('Unsupported project schema version.')
  if (typeof value.id !== 'string' || value.id.length === 0) throw new Error('Project id is missing.')
  if (typeof value.name !== 'string' || value.name.length === 0) throw new Error('Project name is missing.')

  const geometry = value.geometry
  if (!isRecord(geometry) || !Array.isArray(geometry.primitives)) {
    throw new Error('Project geometry is missing.')
  }

  const primitives = geometry.primitives
  const origin = geometry.origin
  if (!primitives.every(isGeometryPrimitive)) {
    throw new Error('Project contains invalid geometry primitives.')
  }
  if (origin !== undefined && !isPlanePoint(origin)) {
    throw new Error('Project geometry origin is invalid.')
  }

  const sourceImage = normalizeSourceImage(value.sourceImage)

  return {
    schemaVersion: 1,
    id: value.id,
    name: value.name,
    ...(sourceImage ? { sourceImage } : {}),
    geometry: {
      ...(origin ? { origin } : {}),
      primitives: primitives as GeometryPrimitive[],
    },
  }
}

export function serializeProject(project: RglProject): string {
  return JSON.stringify(
    {
      schemaVersion: project.schemaVersion,
      id: project.id,
      name: project.name,
      ...(project.sourceImage
        ? {
            sourceImage: {
              assetId: project.sourceImage.assetId,
              name: project.sourceImage.name,
              width: project.sourceImage.width,
              height: project.sourceImage.height,
            },
          }
        : {}),
      geometry: project.geometry,
    },
    null,
    2,
  )
}

export function projectFileName(project: RglProject): string {
  const withoutExtension = project.name.replace(/\.[^.]+$/, '')
  const safeName = withoutExtension
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${safeName || 'untitled-project'}.rgl.json`
}
