import { describe, expect, it } from 'vitest'
import type { RglProject } from './model'
import { parseProjectJson, projectFileName, serializeProject } from './persistence'

const project: RglProject = {
  schemaVersion: 1,
  id: 'project-1',
  name: 'Milk Hill.jpg',
  sourceImage: {
    assetId: 'source-1',
    name: 'milk-hill.jpg',
    width: 4000,
    height: 3000,
  },
  geometry: {
    origin: { x: 0.5, y: 0.25 },
    primitives: [
      {
        id: 'circle-1',
        kind: 'circle',
        center: { x: 0.5, y: 0.25 },
        radius: 0.1,
      },
    ],
  },
}

describe('project persistence', () => {
  it('round-trips canonical project JSON without runtime source data', () => {
    const json = serializeProject(project)
    const restored = parseProjectJson(json)

    expect(restored).toEqual(project)
    expect(json).not.toContain('objectUrl')
  })

  it('round-trips generic model documents without changing geometry primitives', () => {
    const modeledProject: RglProject = {
      ...project,
      models: [
        {
          id: 'model-1',
          family: 'kinematics',
          modelType: 'mechanism-sketch',
          name: 'Candidate mechanism',
          bindings: [
            {
              id: 'rotor-a',
              geometryPrimitiveIds: ['circle-1'],
              role: 'rotor',
              parameters: { phaseDegrees: 0 },
            },
          ],
          parameters: { speedScale: 1 },
          constraints: [],
        },
      ],
    }

    expect(parseProjectJson(serializeProject(modeledProject))).toEqual(modeledProject)
    expect(modeledProject.geometry.primitives[0]).not.toHaveProperty('role')
  })

  it('rejects unsupported schema versions', () => {
    expect(() => parseProjectJson('{"schemaVersion":2,"id":"x","name":"x","geometry":{"primitives":[]}}')).toThrow(
      'Unsupported project schema version.',
    )
  })

  it('rejects invalid primitives', () => {
    expect(() =>
      parseProjectJson(
        '{"schemaVersion":1,"id":"x","name":"x","geometry":{"primitives":[{"id":"c","kind":"circle","center":{"x":0,"y":0},"radius":"bad"}]}}',
      ),
    ).toThrow('Project contains invalid geometry primitives.')
  })

  it('rejects invalid model documents', () => {
    expect(() =>
      parseProjectJson(
        '{"schemaVersion":1,"id":"x","name":"x","geometry":{"primitives":[]},"models":[{"id":"m","family":"kinematics","modelType":"x","bindings":[{"id":"b","geometryPrimitiveIds":"bad","role":"rotor"}],"parameters":{},"constraints":[]}]}',
      ),
    ).toThrow('Project contains invalid model documents.')
  })

  it('uses the project name for the download filename', () => {
    expect(projectFileName(project)).toBe('Milk-Hill.rgl.json')
  })
})
