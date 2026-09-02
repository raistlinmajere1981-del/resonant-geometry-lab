import type { GeometryDocument } from './model'
import type { JsonValue, ModelDocument, ModelFamily, ModelParameters } from './modelDocuments'

export type ModelValidationIssue = {
  severity: 'error' | 'warning'
  code: string
  message: string
  bindingId?: string
  constraintId?: string
}

export type SimulationRequest = {
  model: ModelDocument
  geometry: GeometryDocument
  options?: ModelParameters
}

export type ModelStateFrame = {
  index: number
  time?: number
  values: Record<string, JsonValue>
}

export type SimulationResult = {
  modelId: string
  family: ModelFamily
  states: ModelStateFrame[]
  summary: Record<string, JsonValue>
  diagnostics?: ModelValidationIssue[]
}

export type ModelAdapter = {
  family: ModelFamily
  supports: (model: ModelDocument) => boolean
  validate: (model: ModelDocument, geometry: GeometryDocument) => ModelValidationIssue[]
  simulate: (request: SimulationRequest) => Promise<SimulationResult>
}

export function validateModelReferences(
  model: ModelDocument,
  geometry: GeometryDocument,
): ModelValidationIssue[] {
  const issues: ModelValidationIssue[] = []
  const primitiveIds = new Set(geometry.primitives.map((primitive) => primitive.id))
  const bindingIds = new Set<string>()

  for (const binding of model.bindings) {
    if (bindingIds.has(binding.id)) {
      issues.push({
        severity: 'error',
        code: 'duplicate-binding-id',
        message: `Duplicate model binding id: ${binding.id}`,
        bindingId: binding.id,
      })
    }
    bindingIds.add(binding.id)

    for (const primitiveId of binding.geometryPrimitiveIds) {
      if (!primitiveIds.has(primitiveId)) {
        issues.push({
          severity: 'error',
          code: 'missing-geometry-primitive',
          message: `Binding ${binding.id} references missing geometry primitive ${primitiveId}.`,
          bindingId: binding.id,
        })
      }
    }
  }

  for (const constraint of model.constraints) {
    for (const bindingId of constraint.bindingIds ?? []) {
      if (!bindingIds.has(bindingId)) {
        issues.push({
          severity: 'error',
          code: 'missing-model-binding',
          message: `Constraint ${constraint.id} references missing model binding ${bindingId}.`,
          constraintId: constraint.id,
        })
      }
    }
  }

  return issues
}
