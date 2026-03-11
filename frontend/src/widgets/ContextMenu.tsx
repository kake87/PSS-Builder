import React from 'react'

interface ContextMenuAction {
  key: string
  label: string
  disabled?: boolean
  onClick: () => void
}

interface ContextMenuProps {
  x: number
  y: number
  actions: ContextMenuAction[]
  onClose: () => void
}

export function ContextMenu({ x, y, actions, onClose }: ContextMenuProps) {
  React.useEffect(() => {
    const handleClose = () => onClose()
    window.addEventListener('click', handleClose)
    window.addEventListener('contextmenu', handleClose)
    return () => {
      window.removeEventListener('click', handleClose)
      window.removeEventListener('contextmenu', handleClose)
    }
  }, [onClose])

  return (
    <div
      className="absolute z-50 min-w-[180px] rounded-lg border border-gray-200 bg-white p-1 shadow-xl"
      style={{ left: x, top: y }}
      onClick={(event) => event.stopPropagation()}
    >
      {actions.map((action) => (
        <button
          key={action.key}
          type="button"
          onClick={() => {
            if (action.disabled) return
            action.onClick()
            onClose()
          }}
          disabled={action.disabled}
          className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {action.label}
        </button>
      ))}
    </div>
  )
}
