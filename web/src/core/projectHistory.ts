import type { RglProject } from './model'

export type ProjectUpdater = RglProject | ((current: RglProject) => RglProject)

export type ProjectHistoryState = {
  past: RglProject[]
  present: RglProject
  future: RglProject[]
  transactionStart?: RglProject
}

const HISTORY_LIMIT = 100

const resolveProject = (current: RglProject, updater: ProjectUpdater) =>
  typeof updater === 'function' ? updater(current) : updater

const pushPast = (past: RglProject[], project: RglProject) => {
  const next = [...past, project]
  return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next
}

export const createProjectHistory = (project: RglProject): ProjectHistoryState => ({
  past: [],
  present: project,
  future: [],
})

export const commitProject = (state: ProjectHistoryState, updater: ProjectUpdater): ProjectHistoryState => {
  const nextProject = resolveProject(state.present, updater)
  if (nextProject === state.present) return state

  return {
    past: pushPast(state.past, state.present),
    present: nextProject,
    future: [],
  }
}

export const replaceProject = (state: ProjectHistoryState, updater: ProjectUpdater): ProjectHistoryState => {
  const nextProject = resolveProject(state.present, updater)
  if (nextProject === state.present) return state

  return {
    ...state,
    present: nextProject,
  }
}

export const beginProjectTransaction = (state: ProjectHistoryState): ProjectHistoryState =>
  state.transactionStart ? state : { ...state, transactionStart: state.present }

export const commitProjectTransaction = (state: ProjectHistoryState): ProjectHistoryState => {
  if (!state.transactionStart) return state
  if (state.present === state.transactionStart) {
    const { transactionStart: _transactionStart, ...rest } = state
    return rest
  }

  return {
    past: pushPast(state.past, state.transactionStart),
    present: state.present,
    future: [],
  }
}

export const cancelProjectTransaction = (state: ProjectHistoryState): ProjectHistoryState => {
  if (!state.transactionStart) return state

  return {
    past: state.past,
    present: state.transactionStart,
    future: state.future,
  }
}

export const undoProject = (state: ProjectHistoryState): ProjectHistoryState => {
  if (state.transactionStart || state.past.length === 0) return state

  const previous = state.past[state.past.length - 1]
  return {
    past: state.past.slice(0, -1),
    present: previous,
    future: [state.present, ...state.future],
  }
}

export const redoProject = (state: ProjectHistoryState): ProjectHistoryState => {
  if (state.transactionStart || state.future.length === 0) return state

  const next = state.future[0]
  return {
    past: pushPast(state.past, state.present),
    present: next,
    future: state.future.slice(1),
  }
}

export const resetProjectHistory = (_state: ProjectHistoryState, project: RglProject): ProjectHistoryState =>
  createProjectHistory(project)
