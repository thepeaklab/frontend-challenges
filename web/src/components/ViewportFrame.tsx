import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

export type ViewportId = 'fill' | 'desktop' | 'tablet' | 'mobile'

interface Viewport {
  id: ViewportId
  label: string
  width?: number
  /** Without a height the frame fills the available height (desktop pages scroll anyway). */
  height?: number
}

export const VIEWPORTS: Viewport[] = [
  { id: 'fill', label: 'Füllen' },
  { id: 'desktop', label: 'Desktop', width: 1280 },
  { id: 'tablet', label: 'Tablet', width: 768, height: 1024 },
  { id: 'mobile', label: 'Mobil', width: 390, height: 844 },
]

const STORAGE_KEY = 'fc:viewport'
const STAGE_PADDING = 16

function storedViewport(): ViewportId {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (VIEWPORTS.some((v) => v.id === value)) return value as ViewportId
  } catch {
    // storage unavailable
  }
  return 'fill'
}

/** The selected preview viewport, remembered per browser. */
export function useViewport(): [ViewportId, (id: ViewportId) => void] {
  const [viewport, setViewport] = useState<ViewportId>(storedViewport)
  const select = (id: ViewportId) => {
    setViewport(id)
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      // storage unavailable
    }
  }
  return [viewport, select]
}

interface Size {
  width: number
  height: number
  scale: number
}

function useStageSize(): [React.RefObject<HTMLDivElement | null>, { width: number; height: number }] {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height }),
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return [ref, size]
}

/** Size of the emulated device and the scale needed to fit it into the stage. */
function fit(viewport: Viewport, stage: { width: number; height: number }): Size | undefined {
  if (!viewport.width || stage.width === 0) return undefined
  const availableWidth = stage.width - STAGE_PADDING * 2
  const availableHeight = stage.height - STAGE_PADDING * 2
  const widthScale = Math.min(1, availableWidth / viewport.width)
  if (!viewport.height) {
    return { width: viewport.width, height: availableHeight / widthScale, scale: widthScale }
  }
  const scale = Math.min(widthScale, availableHeight / viewport.height)
  return { width: viewport.width, height: viewport.height, scale }
}

interface BarProps {
  viewport: ViewportId
  onChange: (id: ViewportId) => void
  /** Rendered at the end of the bar, e.g. a reload button. */
  children?: ReactNode
}

export function ViewportBar({ viewport, onChange, children }: BarProps) {
  const current = VIEWPORTS.find((v) => v.id === viewport)!
  return (
    <div className="viewport-bar">
      <div className="segmented" role="group" aria-label="Viewport">
        {VIEWPORTS.map((v) => (
          <button key={v.id} aria-pressed={v.id === viewport} onClick={() => onChange(v.id)} title={v.width ? `${v.width}${v.height ? ` × ${v.height}` : ''} px` : 'Ganze Fläche nutzen'}>
            {v.label}
          </button>
        ))}
      </div>
      <span className="viewport-size">
        {current.width ? `${current.width}${current.height ? ` × ${current.height}` : ''} px` : ''}
      </span>
      {children}
    </div>
  )
}

interface FrameProps {
  viewport: ViewportId
  children: ReactNode
}

/**
 * Renders its child (an iframe filling 100%) at the size of the selected device
 * and scales it down to fit. The frame keeps its real width, so media queries
 * inside behave like on the device.
 */
export function ViewportFrame({ viewport, children }: FrameProps) {
  const [stageRef, stage] = useStageSize()
  const size = fit(VIEWPORTS.find((v) => v.id === viewport)!, stage)

  return (
    <div ref={stageRef} className={`viewport-stage ${size ? 'is-device' : ''}`} data-viewport={viewport}>
      {size ? (
        <div className="viewport-device" style={{ width: size.width * size.scale, height: size.height * size.scale }}>
          <div
            className="viewport-scaler"
            style={{ width: size.width, height: size.height, transform: `scale(${size.scale})` }}
          >
            {children}
          </div>
          {size.scale < 1 && <span className="viewport-zoom">{Math.round(size.scale * 100)} %</span>}
        </div>
      ) : (
        children
      )}
    </div>
  )
}
