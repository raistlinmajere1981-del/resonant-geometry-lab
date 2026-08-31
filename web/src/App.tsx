import { useEffect, useState } from 'react'
import { emptyProject, type RglProject } from './core/model'
import { useProjectHistory } from './core/useProjectHistory'
import { type WorkspaceId, workspaces } from './core/workspaces'
import { GeometryWorkspace } from './geometry/GeometryWorkspace'
import { ProjectControls } from './ui/ProjectControls'

type SourceAttachment = {
  assetId: string
  objectUrl: string
}

export function App() {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>('geometry')
  const [initialProject] = useState(() => emptyProject())
  const history = useProjectHistory(initialProject)
  const [sourceAttachment, setSourceAttachment] = useState<SourceAttachment | null>(null)
  const project = history.project
  const workspace = workspaces.find((item) => item.id === activeWorkspace) ?? workspaces[0]
  const sourceUrl =
    project.sourceImage && sourceAttachment?.assetId === project.sourceImage.assetId
      ? sourceAttachment.objectUrl
      : undefined

  useEffect(() => {
    return () => {
      if (sourceAttachment) URL.revokeObjectURL(sourceAttachment.objectUrl)
    }
  }, [sourceAttachment])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, [contenteditable="true"]')) return

      const key = event.key.toLowerCase()
      if (key === 'z') {
        event.preventDefault()
        if (event.shiftKey) history.redo()
        else history.undo()
      } else if (key === 'y') {
        event.preventDefault()
        history.redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [history.redo, history.undo])

  const openProject = (nextProject: RglProject) => {
    history.reset(nextProject)
    setSourceAttachment(null)
    setActiveWorkspace('geometry')
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-block">
          <div className="brand-mark">RGL</div>
          <div>
            <h1>Resonant Geometry Lab</h1>
            <p>{project.name}</p>
          </div>
        </div>

        <ProjectControls
          canRedo={history.canRedo}
          canUndo={history.canUndo}
          onOpenProject={openProject}
          onRedo={history.redo}
          onUndo={history.undo}
          project={project}
        />

        <nav className="workspace-tabs" aria-label="Workspaces">
          {workspaces.map((item) => (
            <button
              className={item.id === activeWorkspace ? 'workspace-tab active' : 'workspace-tab'}
              key={item.id}
              onClick={() => setActiveWorkspace(item.id)}
              type="button"
            >
              <span>{item.label}</span>
              <small>{item.status}</small>
            </button>
          ))}
        </nav>
      </header>

      <section className="workspace-shell">
        {activeWorkspace === 'geometry' ? (
          <GeometryWorkspace
            beginProjectTransaction={history.beginTransaction}
            cancelProjectTransaction={history.cancelTransaction}
            commitProjectTransaction={history.commitTransaction}
            onSourceAttached={(assetId, objectUrl) => setSourceAttachment({ assetId, objectUrl })}
            project={project}
            replaceProject={history.replaceProject}
            setProject={history.setProject}
            sourceUrl={sourceUrl}
          />
        ) : (
          <>
            <section className="viewport" aria-label="Main viewport">
              <div className="viewport-placeholder">
                <span className="eyebrow">{workspace.label} workspace</span>
                <h2>{workspace.shortDescription}</h2>
                <p>
                  {activeWorkspace === 'resonance' &&
                    'A modal simulation view will plug into this same viewport without changing the shell.'}
                  {activeWorkspace === 'compare' &&
                    'Measured geometry and simulation output will share this viewport for alignment and comparison.'}
                </p>
              </div>
            </section>

            <aside className="context-panel">
              <div className="panel-heading">
                <span className="eyebrow">Context</span>
                <h2>{workspace.label}</h2>
              </div>

              <section className="context-section">
                <h3>Tools</h3>
                <p>Only tools relevant to the active workspace will appear here.</p>
              </section>

              <section className="context-section">
                <h3>Selection</h3>
                <p>No object selected.</p>
              </section>

              <section className="context-section muted-section">
                <h3>Foundation rule</h3>
                <p>The viewport stays stable while workspace-specific panels are swapped around it.</p>
              </section>
            </aside>
          </>
        )}
      </section>

      <footer className="statusbar">
        <span>Schema v{project.schemaVersion}</span>
        <span>{project.geometry.primitives.length} primitives</span>
        <span>{workspace.label}</span>
      </footer>
    </main>
  )
}
