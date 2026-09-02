import { describe, expect, it } from 'vitest'
import type { GeometryDocument } from './model'
import type { ModelDocument } from './modelDocuments'
import { validateModelReferences } from './simulation'

const geometry: GeometryDocument = {
  primitives: [
    {
      id: 'circle-1',
      kind: 'circle',
      center: { x: 0.4, y: 0.3 },
      radius: 0.1,
    },
  ],
}

const baseModel: ModelDocument = {
  id: 'model-1',
  family: 'kinematics',
  modelType: 'mechanism-sketch',
  bindings: [
    {
      id: 'rotor-a',
      geometryPrimitiveIds: ['circle-1'],
      role: 'rotor',
    },
  ],
  parameters: {},
  constraints: [],
}

describe('simulation model references', () => {
  it('accepts bindings that reference existing geometry', () => {
    expect(validateModelReferences(baseModel, geometry)).toEqual([])
  })

  it('reports missing geometry and model binding references', () => {
    const invalid: ModelDocument = {
      ...baseModel,
      bindings: [
        {
          id: 'rotor-a',
          geometryPrimitiveIds: ['missing-circle'],
          role: 'rotor',
        },
      ],
      constraints: [
        {
          id: 'constraint-1',
          kind: 'phase-lock',
          bindingIds: ['missing-binding'],
        },
      ],
    }

    expect(validateModelReferences(invalid, geometry).map((issue) => issue.code)).toEqual([
      'missing-geometry-primitive',
      'missing-model-binding',
    ])
  })
})
