import { type Dispatch, type SetStateAction, useCallback, useState } from 'react'
import type { RglProject } from './model'
import {
  beginProjectTransaction,
  cancelProjectTransaction,
  commitProject,
  commitProjectTransaction,
  createProjectHistory,
  redoProject,
  replaceProject,
  resetProjectHistory,
  undoProject,
} from './projectHistory'

export type ProjectHistoryController = {
  project: RglProject
  setProject: Dispatch<SetStateAction<RglProject>>
  replaceProject: Dispatch<SetStateAction<RglProject>>
  beginTransaction: () => void
  commitTransaction: () => void
  cancelTransaction: () => void
  undo: () => void
  redo: () => void
  reset: (project: RglProject) => void
  canUndo: boolean
  canRedo: boolean
}

export function useProjectHistory(initialProject: RglProject): ProjectHistoryController {
  const [history, setHistory] = useState(() => createProjectHistory(initialProject))

  const setProject: Dispatch<SetStateAction<RglProject>> = useCallback((updater: SetStateAction<RglProject>) => {
    setHistory((current) => commitProject(current, updater))
  }, [])

  const replaceProjectState: Dispatch<SetStateAction<RglProject>> = useCallback(
    (updater: SetStateAction<RglProject>) => {
      setHistory((current) => replaceProject(current, updater))
    },
    [],
  )

  const beginTransaction = useCallback(() => {
    setHistory((current) => beginProjectTransaction(current))
  }, [])

  const commitTransaction = useCallback(() => {
    setHistory((current) => commitProjectTransaction(current))
  }, [])

  const cancelTransaction = useCallback(() => {
    setHistory((current) => cancelProjectTransaction(current))
  }, [])

  const undo = useCallback(() => {
    setHistory((current) => undoProject(current))
  }, [])

  const redo = useCallback(() => {
    setHistory((current) => redoProject(current))
  }, [])

  const reset = useCallback((project: RglProject) => {
    setHistory((current) => resetProjectHistory(current, project))
  }, [])

  const transactionActive = Boolean(history.transactionStart)

  return {
    project: history.present,
    setProject,
    replaceProject: replaceProjectState,
    beginTransaction,
    commitTransaction,
    cancelTransaction,
    undo,
    redo,
    reset,
    canUndo: history.past.length > 0 && !transactionActive,
    canRedo: history.future.length > 0 && !transactionActive,
  }
}
