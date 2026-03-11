import React from 'react'
import { Keyboard, X } from 'lucide-react'

const SHORTCUTS = [
  { keys: 'Del', action: 'Delete selected' },
  { keys: 'Ctrl+D', action: 'Duplicate selected' },
  { keys: 'Ctrl+C / Ctrl+V', action: 'Copy / Paste' },
  { keys: 'Ctrl+Z / Ctrl+Y', action: 'Undo / Redo' },
  { keys: 'Ctrl+F', action: 'Focus group search' },
  { keys: 'Ctrl+G', action: 'Create group from selected nodes' },
  { keys: 'Space', action: 'Auto-layout nodes' },
  { keys: 'F1', action: 'Show/hide this shortcuts panel' },
]

const SEEN_KEY = 'psb-shortcuts-seen'

export function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [showHint, setShowHint] = React.useState(false)

  React.useEffect(() => {
    const hasSeen = localStorage.getItem(SEEN_KEY)
    if (!hasSeen) {
      setShowHint(true)
    }
  }, [])

  React.useEffect(() => {
    const toggle = () => {
      setIsOpen((current) => !current)
      setShowHint(false)
      localStorage.setItem(SEEN_KEY, '1')
    }

    const onToggle = () => toggle()
    window.addEventListener('psb-toggle-shortcuts', onToggle)
    return () => {
      window.removeEventListener('psb-toggle-shortcuts', onToggle)
    }
  }, [])

  if (!isOpen && !showHint) return null

  return (
    <>
      {showHint && !isOpen && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-lg border border-brand-200 bg-white p-3 shadow-xl">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-sm font-semibold text-slate-900">Keyboard Shortcuts</div>
              <div className="mt-1 text-xs text-slate-600">
                Open Help (F1) or click the Shortcuts button in the toolbar.
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setShowHint(false)
                localStorage.setItem(SEEN_KEY, '1')
              }}
              className="rounded p-1 text-slate-500 transition hover:bg-slate-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-xl rounded-lg border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div className="flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-brand-600" />
                <h3 className="font-semibold text-slate-900">Keyboard Shortcuts</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded p-1 text-slate-500 transition hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 px-4 py-4">
              {SHORTCUTS.map((shortcut) => (
                <div
                  key={shortcut.keys}
                  className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <span className="text-sm text-slate-700">{shortcut.action}</span>
                  <kbd className="rounded bg-slate-900 px-2 py-1 text-xs font-semibold text-white">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
