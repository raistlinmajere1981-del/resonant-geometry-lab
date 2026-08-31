import {
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type SetStateAction,
  type WheelEvent as ReactWheelEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { planeDistance, pixelToPlane, planeToPixel } from '../core/coordinates'
import type { CirclePrimitive, PlanePoint, RglProject } from '../core/model'
import { Icon } from '../ui/Icon'
import { PanelHelp } from '../ui/PanelHelp'

type GeometryTool = 'select' | 'circle' | 'pan'

type DraftCircle = {
  center: PlanePoint
  radius: number
}

type CircleDrag =
  | {
      mode: 'move'
      pointerId: number
      circleId: string
      pointerStart: PlanePoint
      centerStart: PlanePoint
    }
  | {
      mode: 'radius'
      pointerId: number
      circleId: string
    }

type PanDrag = {
  pointerId: number
  x: number
  y: number
  startX: number
  startY: number
}

type GeometryWorkspaceProps = {
  project: RglProject
  setProject: Dispatch<SetStateAction<RglProject>>
  replaceProject: Dispatch<SetStateAction<RglProject>>
  beginProjectTransaction: () => void
  commitProjectTransaction: () => void
  cancelProjectTransaction: () => void
  sourceUrl?: string
  onSourceAttached: (assetId: string, objectUrl: string) => void
}

const clampZoom = (value: number) => Math.min(8, Math.max(0.25, value))

export function GeometryWorkspace({
  project,
  setProject,
  replaceProject,
  beginProjectTransaction,
  commitProjectTransaction,
  cancelProjectTransaction,
  sourceUrl,
  onSourceAttached,
}: GeometryWorkspaceProps) {
  const [tool, setTool] = useState<GeometryTool>('select')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [draftCircle, setDraftCircle] = useState<DraftCircle | null>(null)
  const [circleDrag, setCircleDrag] = useState<CircleDrag | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [panDrag, setPanDrag] = useState<PanDrag | null>(null)
  const [sourceInfoOpen, setSourceInfoOpen] = useState(false)
  const [sourceError, setSourceError] = useState<string | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const source = project.sourceImage
  const circles = useMemo(
    () => project.geometry.primitives.filter((primitive): primitive is CirclePrimitive => primitive.kind === 'circle'),
    [project.geometry.primitives],
  )
  const selectedCircle = circles.find((circle) => circle.id === selectedId) ?? null

  useEffect(() => {
    setTool('select')
    setSelectedId(null)
    setDraftCircle(null)
    setCircleDrag(null)
    setPanDrag(null)
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setSourceInfoOpen(false)
    setSourceError(null)
  }, [project.id])

  const updateCircle = (circleId: string, updater: (circle: CirclePrimitive) => CirclePrimitive) => {
    replaceProject((current) => ({
      ...current,
      geometry: {
        ...current.geometry,
        primitives: current.geometry.primitives.map((primitive) =>
          primitive.kind === 'circle' && primitive.id === circleId ? updater(primitive) : primitive,
        ),
      },
    }))
  }

  const removeSelected = () => {
    if (!selectedId) return
    setProject((current) => ({
      ...current,
      geometry: {
        ...current.geometry,
        primitives: current.geometry.primitives.filter((primitive) => primitive.id !== selectedId),
      },
    }))
    setSelectedId(null)
  }

  const eventToPlane = (event: ReactPointerEvent<SVGSVGElement>): PlanePoint | null => {
    if (!source || !sourceUrl || !svgRef.current) return null
    const matrix = svgRef.current.getScreenCTM()
    if (!matrix) return null

    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    if (point.x < 0 || point.y < 0 || point.x > source.width || point.y > source.height) {
      return null
    }
    return pixelToPlane({ x: point.x, y: point.y }, source.width)
  }

  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleImage = (file: File | undefined) => {
    if (!file) return

    const reconnecting = Boolean(source && !sourceUrl)
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      if (reconnecting && source) {
        if (image.naturalWidth !== source.width || image.naturalHeight !== source.height) {
          URL.revokeObjectURL(objectUrl)
          setSourceError(`Expected ${source.width} × ${source.height}px; selected image is ${image.naturalWidth} × ${image.naturalHeight}px.`)
          return
        }

        onSourceAttached(source.assetId, objectUrl)
        setSourceError(null)
        resetView()
        return
      }

      const assetId = crypto.randomUUID()
      setProject((current) => ({
        ...current,
        name: file.name,
        sourceImage: {
          assetId,
          name: file.name,
          width: image.naturalWidth,
          height: image.naturalHeight,
        },
        geometry: {
          ...current.geometry,
          primitives: [],
        },
      }))
      onSourceAttached(assetId, objectUrl)
      setSelectedId(null)
      setDraftCircle(null)
      setSourceError(null)
      resetView()
      setSourceInfoOpen(false)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      setSourceError('The selected image could not be opened.')
    }
    image.src = objectUrl
  }

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!source || !sourceUrl) return

    if (tool === 'pan') {
      svgRef.current?.setPointerCapture(event.pointerId)
      setPanDrag({
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        startX: pan.x,
        startY: pan.y,
      })
      return
    }

    const point = eventToPlane(event)
    if (!point) return

    if (tool === 'circle') {
      svgRef.current?.setPointerCapture(event.pointerId)
      setDraftCircle({ center: point, radius: 0 })
      setSelectedId(null)
      return
    }

    setSelectedId(null)
  }

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (!source || !sourceUrl) return

    if (panDrag && panDrag.pointerId === event.pointerId) {
      setPan({
        x: panDrag.startX + event.clientX - panDrag.x,
        y: panDrag.startY + event.clientY - panDrag.y,
      })
      return
    }

    const point = eventToPlane(event)
    if (!point) return

    if (draftCircle) {
      setDraftCircle({ ...draftCircle, radius: planeDistance(draftCircle.center, point) })
      return
    }

    if (!circleDrag || circleDrag.pointerId !== event.pointerId) return
    if (circleDrag.mode === 'move') {
      const dx = point.x - circleDrag.pointerStart.x
      const dy = point.y - circleDrag.pointerStart.y
      updateCircle(circleDrag.circleId, (circle) => ({
        ...circle,
        center: {
          x: circleDrag.centerStart.x + dx,
          y: circleDrag.centerStart.y + dy,
        },
      }))
    } else {
      updateCircle(circleDrag.circleId, (circle) => ({
        ...circle,
        radius: Math.max(0.0005, planeDistance(circle.center, point)),
      }))
    }
  }

  const handlePointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (panDrag?.pointerId === event.pointerId) {
      setPanDrag(null)
      svgRef.current?.releasePointerCapture(event.pointerId)
      return
    }

    if (draftCircle) {
      if (draftCircle.radius >= 0.001) {
        const circle: CirclePrimitive = {
          id: crypto.randomUUID(),
          kind: 'circle',
          center: draftCircle.center,
          radius: draftCircle.radius,
        }
        setProject((current) => ({
          ...current,
          geometry: {
            ...current.geometry,
            primitives: [...current.geometry.primitives, circle],
          },
        }))
        setSelectedId(circle.id)
        setTool('select')
      }
      setDraftCircle(null)
    }

    if (circleDrag?.pointerId === event.pointerId) {
      setCircleDrag(null)
      commitProjectTransaction()
    }
    if (svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId)
    }
  }

  const handlePointerCancel = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (panDrag?.pointerId === event.pointerId) setPanDrag(null)
    if (draftCircle) setDraftCircle(null)
    if (circleDrag?.pointerId === event.pointerId) {
      setCircleDrag(null)
      cancelProjectTransaction()
    }
    if (svgRef.current?.hasPointerCapture(event.pointerId)) {
      svgRef.current.releasePointerCapture(event.pointerId)
    }
  }

  const beginCircleMove = (event: ReactPointerEvent<SVGCircleElement>, circle: CirclePrimitive) => {
    if (tool !== 'select' || circle.locked || !source || !sourceUrl || !svgRef.current) return
    event.stopPropagation()
    setSelectedId(circle.id)
    const matrix = svgRef.current.getScreenCTM()
    if (!matrix) return
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse())
    svgRef.current.setPointerCapture(event.pointerId)
    beginProjectTransaction()
    setCircleDrag({
      mode: 'move',
      pointerId: event.pointerId,
      circleId: circle.id,
      pointerStart: pixelToPlane({ x: point.x, y: point.y }, source.width),
      centerStart: circle.center,
    })
  }

  const beginRadiusDrag = (event: ReactPointerEvent<SVGCircleElement>, circle: CirclePrimitive) => {
    if (tool !== 'select' || circle.locked || !sourceUrl || !svgRef.current) return
    event.stopPropagation()
    setSelectedId(circle.id)
    svgRef.current.setPointerCapture(event.pointerId)
    beginProjectTransaction()
    setCircleDrag({ mode: 'radius', pointerId: event.pointerId, circleId: circle.id })
  }

  const handleWheel = (event: ReactWheelEvent<SVGSVGElement>) => {
    if (!source || !sourceUrl) return
    event.preventDefault()
    const factor = event.deltaY < 0 ? 1.12 : 1 / 1.12
    setZoom((value) => clampZoom(value * factor))
  }

  const sourcePlane = source ? { width: 1, height: source.height / source.width } : null
  const selectedCenterPixels = source && selectedCircle ? planeToPixel(selectedCircle.center, source.width) : null

  const toolHelp =
    tool === 'select'
      ? 'Select a circle, drag it to move, or drag its radius handle.'
      : tool === 'circle'
        ? 'Drag from a circle center outward. Creation returns to Select.'
        : 'Drag the viewport. Mouse wheel controls zoom.'

  const imageInput = (label: string) => (
    <label className="primary-action">
      <Icon name="open" size={17} />
      <span>{label}</span>
      <input
        accept="image/png,image/jpeg,image/webp"
        onChange={(event) => {
          handleImage(event.target.files?.[0])
          event.currentTarget.value = ''
        }}
        type="file"
      />
    </label>
  )

  return (
    <>
      <section className="viewport geometry-viewport" aria-label="Geometry viewport">
        {!source ? (
          <div className="viewport-placeholder geometry-empty-state">
            <span className="eyebrow">Geometry workspace</span>
            <h2>Start with a source image</h2>
            <p>The image is only a visual source. Geometry is stored in a resolution-independent source plane.</p>
            {imageInput('Load image')}
            {sourceError && <p className="source-attach-error" role="alert">{sourceError}</p>}
          </div>
        ) : !sourceUrl ? (
          <div className="viewport-placeholder geometry-empty-state">
            <span className="eyebrow">Source disconnected</span>
            <h2>Reconnect source image</h2>
            <p>
              Expected {source.name} · {source.width} × {source.height}px. Project geometry is loaded; attach the matching image to continue editing.
            </p>
            {imageInput('Attach image')}
            {sourceError && <p className="source-attach-error" role="alert">{sourceError}</p>}
          </div>
        ) : (
          <div className="geometry-stage-shell">
            <svg
              className={`geometry-stage tool-${tool}`}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onWheel={handleWheel}
              preserveAspectRatio="xMidYMid meet"
              ref={svgRef}
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
              viewBox={`0 0 ${source.width} ${source.height}`}
            >
              <image href={sourceUrl} height={source.height} width={source.width} x={0} y={0} />

              {circles.map((circle) => {
                if (circle.hidden) return null
                const center = planeToPixel(circle.center, source.width)
                const radius = circle.radius * source.width
                const selected = circle.id === selectedId
                return (
                  <g className={selected ? 'annotation selected' : 'annotation'} key={circle.id}>
                    <circle
                      className="annotation-circle"
                      cx={center.x}
                      cy={center.y}
                      onPointerDown={(event) => beginCircleMove(event, circle)}
                      r={radius}
                    />
                    {selected && (
                      <>
                        <circle className="center-handle" cx={center.x} cy={center.y} r={Math.max(4, source.width * 0.003)} />
                        <line className="radius-guide" x1={center.x} x2={center.x + radius} y1={center.y} y2={center.y} />
                        <circle
                          className="radius-handle"
                          cx={center.x + radius}
                          cy={center.y}
                          onPointerDown={(event) => beginRadiusDrag(event, circle)}
                          r={Math.max(6, source.width * 0.004)}
                        />
                      </>
                    )}
                  </g>
                )
              })}

              {draftCircle && (
                <circle
                  className="annotation-circle draft"
                  cx={draftCircle.center.x * source.width}
                  cy={draftCircle.center.y * source.width}
                  r={draftCircle.radius * source.width}
                />
              )}
            </svg>

            <div className="viewport-toolbar" aria-label="Source and view controls">
              <label className="icon-button" aria-label="Replace source image" title="Replace source image">
                <Icon name="open" />
                <input
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => {
                    handleImage(event.target.files?.[0])
                    event.currentTarget.value = ''
                  }}
                  type="file"
                />
              </label>
              <button
                aria-label="Source information"
                className={sourceInfoOpen ? 'icon-button active' : 'icon-button'}
                onClick={() => setSourceInfoOpen((value) => !value)}
                title="Source information"
                type="button"
              >
                <Icon name="info" />
              </button>
              <span className="toolbar-separator" />
              <button aria-label="Fit image" className="icon-button" onClick={resetView} title="Fit image" type="button">
                <Icon name="fit" />
              </button>

              {sourceInfoOpen && (
                <div className="source-popover">
                  <strong>{source.name}</strong>
                  <span>{source.width} × {source.height}px</span>
                  <span>Plane 1.0000 × {sourcePlane?.height.toFixed(4)}</span>
                </div>
              )}
            </div>

            <div className="viewport-hud" aria-label="Viewport zoom">
              <span>{Math.round(zoom * 100)}%</span>
            </div>
          </div>
        )}
      </section>

      <aside className="context-panel">
        <div className="panel-heading">
          <span className="eyebrow">Context</span>
          <div className="panel-title-row">
            <h2>Geometry</h2>
            <PanelHelp label="Geometry panel help">
              {toolHelp} Selection measurements appear below.
            </PanelHelp>
          </div>
        </div>

        <section className="context-section">
          <h3>Tools</h3>
          <div className="tool-groups">
            <div className="tool-group">
              <span className="tool-group-label">Navigate</span>
              <div className="icon-button-row" role="group" aria-label="Navigation tools">
                <button
                  aria-label="Select"
                  className={tool === 'select' ? 'icon-button active' : 'icon-button'}
                  disabled={!sourceUrl}
                  onClick={() => setTool('select')}
                  title="Select"
                  type="button"
                >
                  <Icon name="select" />
                </button>
                <button
                  aria-label="Pan"
                  className={tool === 'pan' ? 'icon-button active' : 'icon-button'}
                  disabled={!sourceUrl}
                  onClick={() => setTool('pan')}
                  title="Pan"
                  type="button"
                >
                  <Icon name="pan" />
                </button>
              </div>
            </div>

            <div className="tool-group">
              <span className="tool-group-label">Create</span>
              <div className="icon-button-row" role="group" aria-label="Creation tools">
                <button
                  aria-label="Circle"
                  className={tool === 'circle' ? 'icon-button active' : 'icon-button'}
                  disabled={!sourceUrl}
                  onClick={() => setTool('circle')}
                  title="Circle"
                  type="button"
                >
                  <Icon name="circle" />
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="context-section">
          <h3>Selection</h3>
          {selectedCircle && source && selectedCenterPixels ? (
            <div className="measurement-list">
              <div><span>ID</span><strong>{selectedCircle.id.slice(0, 8)}</strong></div>
              <div><span>Center x</span><strong>{selectedCircle.center.x.toFixed(5)}</strong></div>
              <div><span>Center y</span><strong>{selectedCircle.center.y.toFixed(5)}</strong></div>
              <div><span>Radius</span><strong>{selectedCircle.radius.toFixed(5)}</strong></div>
              <div><span>Diameter</span><strong>{(selectedCircle.radius * 2).toFixed(5)}</strong></div>
              <div><span>Center px</span><strong>{selectedCenterPixels.x.toFixed(1)}, {selectedCenterPixels.y.toFixed(1)}</strong></div>
              <div><span>Radius px</span><strong>{(selectedCircle.radius * source.width).toFixed(1)}</strong></div>
              <div className="selection-actions">
                <button
                  aria-label="Delete circle"
                  className="icon-button danger"
                  onClick={removeSelected}
                  title="Delete circle"
                  type="button"
                >
                  <Icon name="trash" />
                </button>
              </div>
            </div>
          ) : (
            <p>No circle selected.</p>
          )}
        </section>
      </aside>
    </>
  )
}
