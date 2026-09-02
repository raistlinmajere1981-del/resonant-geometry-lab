export type JsonPrimitive = string | number | boolean | null

export type JsonValue = JsonPrimitive | JsonValue[] | { [key: string]: JsonValue }

export type ModelParameters = Record<string, JsonValue>

export type KnownModelFamily = 'resonance' | 'kinematics' | 'projection'

export type ModelFamily = KnownModelFamily | (string & {})

export type ModelBinding = {
  id: string
  geometryPrimitiveIds: string[]
  role: string
  parameters?: ModelParameters
}

export type ModelConstraint = {
  id: string
  kind: string
  bindingIds?: string[]
  parameters?: ModelParameters
}

export type ModelDocument = {
  id: string
  family: ModelFamily
  modelType: string
  name?: string
  bindings: ModelBinding[]
  parameters: ModelParameters
  constraints: ModelConstraint[]
}
