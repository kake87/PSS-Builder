import React from 'react'
import { MousePointer2, Sparkle, TerminalSquare } from 'lucide-react'

interface StatusBarProps {
  selectedNodeId: string | null
  selectedEdgeId: string | null
}

interface CursorDetail {
  x: number
  y: number
}

interface ActionDetail {
  action: string
}

const TIPS = [
  'Tip: Ctrl+D duplicates selection',
  'Tip: Ctrl+G creates a group',
  'Tip: Space runs auto-layout',
  'Tip: Right click opens context menu',
]

export function StatusBar({ selectedNodeId, selectedEdgeId }: StatusBarProps) {
  const [cursor, setCursor] = React.useState<CursorDetail | null>(null)
  const [action, setAction] = React.useState('Idle')
  const [tipIndex, setTipIndex] = React.useState(0)

  React.useEffect(() => {
    const cursorHandler = (event: Event) => {
      const detail = (event as CustomEvent<CursorDetail>).detail
      if (!detail) return
      setCursor(detail)
    }
    const actionHandler = (event: Event) => {
      const detail = (event as CustomEvent<ActionDetail>).detail
      if (!detail?.action) return
      setAction(detail.action)
    }

    window.addEventListener('psb-cursor-move', cursorHandler)
    window.addEventListener('psb-status-action', actionHandler)
    return () => {
      window.removeEventListener('psb-cursor-move', cursorHandler)
      window.removeEventListener('psb-status-action', actionHandler)
    }
  }, [])

  React.useEffect(() => {
    const id = window.setInterval(() => {
      setTipIndex((current) => (current + 1) % TIPS.length)
    }, 4500)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-2 text-xs text-slate-600">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <div className="flex items-center gap-1">
          <MousePointer2 className="h-3.5 w-3.5 text-slate-500" />
          {cursor ? `X:${cursor.x} Y:${cursor.y}` : 'X:- Y:-'}
        </div>
        <div>
          Selected:{' '}
          {selectedNodeId
            ? `Node ${selectedNodeId}`
            : selectedEdgeId
            ? `Edge ${selectedEdgeId}`
            : 'None'}
        </div>
        <div className="flex items-center gap-1">
          <TerminalSquare className="h-3.5 w-3.5 text-slate-500" />
          Action: {action}
        </div>
        <div className="ml-auto flex items-center gap-1 text-brand-600">
          <Sparkle className="h-3.5 w-3.5" />
          {TIPS[tipIndex]}
        </div>
      </div>
    </div>
  )
}

