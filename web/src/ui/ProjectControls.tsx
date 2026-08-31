import { useState } from 'react'
import type { RglProject } from '../core/model'
import { parseProjectJson, projectFileName, serializeProject } from '../core/persistence'
import { Icon } from './Icon'
import './ProjectControls.css'

type ProjectControlsProps = {
  project: RglProject
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
  onOpenProject: (project: RglProject) => void
}

export function ProjectControls({
  project,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onOpenProject,
}: ProjectControlsProps) {
  const [error, setError] = useState<string | null>(null)

  const saveProject = () => {
    const blob = new Blob([serializeProject(project)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = projectFileName(project)
    anchor.click()
    URL.revokeObjectURL(url)
    setError(null)
  }

  const openProject = async (file: File | undefined) => {
    if (!file) return

    try {
      const nextProject = parseProjectJson(await file.text())
      onOpenProject(nextProject)
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not open project file.')
    }
  }

  return (
    <div className="project-controls-shell">
      <div className="project-controls" aria-label="Project controls">
        <label className="icon-button" aria-label="Open project" title="Open project">
          <Icon name="open" />
          <input
            accept=".json,.rgl.json,application/json"
            onChange={(event) => {
              void openProject(event.target.files?.[0])
              event.currentTarget.value = ''
            }}
            type="file"
          />
        </label>
        <button aria-label="Save project" className="icon-button" onClick={saveProject} title="Save project" type="button">
          <Icon name="save" />
        </button>
        <span className="toolbar-separator" />
        <button
          aria-label="Undo"
          className="icon-button"
          disabled={!canUndo}
          onClick={onUndo}
          title="Undo (Ctrl/Cmd+Z)"
          type="button"
        >
          <Icon name="undo" />
        </button>
        <button
          aria-label="Redo"
          className="icon-button"
          disabled={!canRedo}
          onClick={onRedo}
          title="Redo (Ctrl/Cmd+Shift+Z or Ctrl/Cmd+Y)"
          type="button"
        >
          <Icon name="redo" />
        </button>
      </div>
      {error && <div className="project-control-error" role="alert">{error}</div>}
    </div>
  )
}
