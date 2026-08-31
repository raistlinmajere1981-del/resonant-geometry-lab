export type WorkspaceId = 'geometry' | 'resonance' | 'compare'

export type WorkspaceDefinition = {
  id: WorkspaceId
  label: string
  shortDescription: string
  status: 'foundation' | 'planned' | 'active'
}

export const workspaces: WorkspaceDefinition[] = [
  {
    id: 'geometry',
    label: 'Geometry',
    shortDescription: 'Image, annotation and measurement',
    status: 'foundation',
  },
  {
    id: 'resonance',
    label: 'Resonance',
    shortDescription: 'Modal and frequency models',
    status: 'planned',
  },
  {
    id: 'compare',
    label: 'Compare',
    shortDescription: 'Geometry ↔ simulation comparison',
    status: 'planned',
  },
]
