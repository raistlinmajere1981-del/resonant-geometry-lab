import { describe, expect, it } from 'vitest'
import type { RglProject } from './model'
import {
  beginProjectTransaction,
  commitProject,
  commitProjectTransaction,
  createProjectHistory,
  redoProject,
  replaceProject,
  resetProjectHistory,
  undoProject,
} from './projectHistory'

const makeProject = (name: string, radius = 0.1): RglProject => ({
  schemaVersion: 1,
  id: 'project-1',
  name,
  geometry: {
    primitives: [
      {
        id: 'circle-1',
        kind: 'circle',
        center: { x: 0.5, y: 0.25 },
        radius,
      },
    ],
  },
})

describe('project history', () => {
  it('undoes and redoes discrete commits', () => {
    let history = createProjectHistory(makeProject('A'))
    history = commitProject(history, makeProject('B'))

    expect(history.present.name).toBe('B')
    history = undoProject(history)
    expect(history.present.name).toBe('A')
    history = redoProject(history)
    expect(history.present.name).toBe('B')
  })

  it('coalesces a drag transaction into one undo step', () => {
    let history = createProjectHistory(makeProject('A', 0.1))
    history = beginProjectTransaction(history)
    history = replaceProject(history, makeProject('A', 0.2))
    history = replaceProject(history, makeProject('A', 0.3))
    history = replaceProject(history, makeProject('A', 0.4))
    history = commitProjectTransaction(history)

    expect(history.past).toHaveLength(1)
    expect(history.present.geometry.primitives[0]).toMatchObject({ radius: 0.4 })

    history = undoProject(history)
    expect(history.present.geometry.primitives[0]).toMatchObject({ radius: 0.1 })
  })

  it('clears undo and redo state when a project is opened', () => {
    let history = createProjectHistory(makeProject('A'))
    history = commitProject(history, makeProject('B'))
    history = undoProject(history)
    history = resetProjectHistory(history, makeProject('Loaded'))

    expect(history.present.name).toBe('Loaded')
    expect(history.past).toHaveLength(0)
    expect(history.future).toHaveLength(0)
  })
})
