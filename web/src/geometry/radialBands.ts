import type { RadialStructure, RadialStructureEntry } from './radialStructure'

const BAND_EPSILON = 1e-12

export type RadialBandMember = {
  circleId: string
  radialDistance: number
  residual: number
}

export type RadialBandCandidate = {
  bandIndex: number
  centerRadius: number
  minRadius: number
  maxRadius: number
  span: number
  maxResidual: number
  rmsResidual: number
  members: RadialBandMember[]
}

export type RadialBandAnalysis = {
  tolerance: number
  bands: RadialBandCandidate[]
}

const meanDistance = (entries: readonly RadialStructureEntry[]) =>
  entries.reduce((sum, entry) => sum + entry.radialDistance, 0) / entries.length

const maxResidualFromMean = (entries: readonly RadialStructureEntry[]) => {
  const mean = meanDistance(entries)
  return Math.max(...entries.map((entry) => Math.abs(entry.radialDistance - mean)))
}

const finalizeBand = (
  entries: readonly RadialStructureEntry[],
  bandIndex: number,
): RadialBandCandidate => {
  const centerRadius = meanDistance(entries)
  const distances = entries.map((entry) => entry.radialDistance)
  const residuals = distances.map((distance) => distance - centerRadius)
  const maxResidual = Math.max(...residuals.map(Math.abs))
  const rmsResidual = Math.sqrt(
    residuals.reduce((sum, residual) => sum + residual * residual, 0) / residuals.length,
  )

  return {
    bandIndex,
    centerRadius,
    minRadius: Math.min(...distances),
    maxRadius: Math.max(...distances),
    span: Math.max(...distances) - Math.min(...distances),
    maxResidual,
    rmsResidual,
    members: entries.map((entry) => ({
      circleId: entry.circleId,
      radialDistance: entry.radialDistance,
      residual: entry.radialDistance - centerRadius,
    })),
  }
}

/**
 * Groups the radial ordering into candidate bands using an explicit absolute
 * source-plane tolerance. The grouping is greedy over stable radial order.
 * A new member is accepted only when every member of the candidate remains
 * within `tolerance` of that candidate's updated mean radius.
 *
 * The result is derived analysis data. No band identity is written back into
 * geometry primitives.
 */
export function buildRadialBandCandidates(
  structure: RadialStructure,
  tolerance: number,
): RadialBandAnalysis {
  if (!Number.isFinite(tolerance) || tolerance < 0) {
    throw new Error('Radial band tolerance must be a finite non-negative number.')
  }

  const entryById = new Map(structure.entries.map((entry) => [entry.circleId, entry]))
  const radialEntries = structure.radialOrder
    .map((circleId) => entryById.get(circleId))
    .filter((entry): entry is RadialStructureEntry => Boolean(entry))

  if (radialEntries.length === 0) return { tolerance, bands: [] }

  const groups: RadialStructureEntry[][] = []
  let current: RadialStructureEntry[] = []

  for (const entry of radialEntries) {
    if (current.length === 0) {
      current = [entry]
      continue
    }

    const candidate = [...current, entry]
    if (maxResidualFromMean(candidate) <= tolerance + BAND_EPSILON) {
      current = candidate
    } else {
      groups.push(current)
      current = [entry]
    }
  }

  if (current.length > 0) groups.push(current)

  return {
    tolerance,
    bands: groups.map((entries, index) => finalizeBand(entries, index + 1)),
  }
}

export function radialBandForCircle(analysis: RadialBandAnalysis, circleId: string) {
  for (const band of analysis.bands) {
    const member = band.members.find((candidate) => candidate.circleId === circleId)
    if (member) return { band, member }
  }
  return null
}
