import type { CirclePrimitive, PlanePoint } from '../core/model'
import { measureFromOrigin } from './measurements'

const ORIGIN_EPSILON = 1e-9

export type RadialStructureEntry = {
  circleId: string
  radius: number
  radialDistance: number
  angleDegrees?: number
  radialRank: number
  angularRank?: number
}

export type AngularGap = {
  fromCircleId: string
  toCircleId: string
  degrees: number
}

export type RadialStructure = {
  entries: RadialStructureEntry[]
  radialOrder: string[]
  angularOrder: string[]
  centralCircleIds: string[]
  angularGaps: AngularGap[]
}

type UnrankedEntry = Omit<RadialStructureEntry, 'radialRank' | 'angularRank'>

const compareIds = (a: string, b: string) => a.localeCompare(b)

/**
 * Builds a derived, origin-relative ordering of visible circles.
 *
 * Circles whose centers coincide with the origin do not have a meaningful
 * polar angle, so they remain in radial ordering but are excluded from the
 * angular sequence. Nothing returned here is persisted into the project.
 */
export function buildRadialStructure(
  circles: readonly CirclePrimitive[],
  origin: PlanePoint,
): RadialStructure {
  const unranked: UnrankedEntry[] = circles
    .filter((circle) => !circle.hidden)
    .map((circle) => {
      const polar = measureFromOrigin(circle.center, origin)
      return {
        circleId: circle.id,
        radius: circle.radius,
        radialDistance: polar.distance,
        ...(polar.distance > ORIGIN_EPSILON ? { angleDegrees: polar.angleDegrees } : {}),
      }
    })

  const radialSorted = [...unranked].sort((a, b) => {
    if (a.radialDistance !== b.radialDistance) return a.radialDistance - b.radialDistance
    const aAngle = a.angleDegrees ?? -1
    const bAngle = b.angleDegrees ?? -1
    if (aAngle !== bAngle) return aAngle - bAngle
    return compareIds(a.circleId, b.circleId)
  })

  const angularSorted = unranked
    .filter((entry): entry is UnrankedEntry & { angleDegrees: number } => entry.angleDegrees !== undefined)
    .sort((a, b) => {
      if (a.angleDegrees !== b.angleDegrees) return a.angleDegrees - b.angleDegrees
      if (a.radialDistance !== b.radialDistance) return a.radialDistance - b.radialDistance
      return compareIds(a.circleId, b.circleId)
    })

  const radialRankById = new Map(radialSorted.map((entry, index) => [entry.circleId, index + 1]))
  const angularRankById = new Map(angularSorted.map((entry, index) => [entry.circleId, index + 1]))

  const entries = unranked.map<RadialStructureEntry>((entry) => ({
    ...entry,
    radialRank: radialRankById.get(entry.circleId)!,
    ...(angularRankById.has(entry.circleId) ? { angularRank: angularRankById.get(entry.circleId)! } : {}),
  }))

  const angularGaps: AngularGap[] = []
  if (angularSorted.length >= 2) {
    for (let index = 0; index < angularSorted.length; index += 1) {
      const current = angularSorted[index]
      const next = angularSorted[(index + 1) % angularSorted.length]
      const degrees =
        index === angularSorted.length - 1
          ? 360 - current.angleDegrees + next.angleDegrees
          : next.angleDegrees - current.angleDegrees

      angularGaps.push({
        fromCircleId: current.circleId,
        toCircleId: next.circleId,
        degrees,
      })
    }
  }

  return {
    entries,
    radialOrder: radialSorted.map((entry) => entry.circleId),
    angularOrder: angularSorted.map((entry) => entry.circleId),
    centralCircleIds: radialSorted
      .filter((entry) => entry.angleDegrees === undefined)
      .map((entry) => entry.circleId),
    angularGaps,
  }
}

export function radialContextForCircle(structure: RadialStructure, circleId: string) {
  const entry = structure.entries.find((candidate) => candidate.circleId === circleId) ?? null
  if (!entry) return null

  const radialIndex = structure.radialOrder.indexOf(circleId)
  const innerId = radialIndex > 0 ? structure.radialOrder[radialIndex - 1] : null
  const outerId =
    radialIndex >= 0 && radialIndex < structure.radialOrder.length - 1
      ? structure.radialOrder[radialIndex + 1]
      : null
  const entryById = new Map(structure.entries.map((candidate) => [candidate.circleId, candidate]))
  const inner = innerId ? entryById.get(innerId) ?? null : null
  const outer = outerId ? entryById.get(outerId) ?? null : null

  const previousAngularGap = structure.angularGaps.find((gap) => gap.toCircleId === circleId) ?? null
  const nextAngularGap = structure.angularGaps.find((gap) => gap.fromCircleId === circleId) ?? null

  return {
    entry,
    innerCircleId: innerId,
    innerDistanceDelta: inner ? entry.radialDistance - inner.radialDistance : null,
    outerCircleId: outerId,
    outerDistanceDelta: outer ? outer.radialDistance - entry.radialDistance : null,
    previousAngularGap,
    nextAngularGap,
  }
}
