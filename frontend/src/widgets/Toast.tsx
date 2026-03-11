import React from 'react'
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastEventDetail {
  message: string
  type?: ToastType
}

export function emitToast(message: string, type: ToastType = 'info') {
  window.dispatchEvent(
    new CustomEvent<ToastEventDetail>('psb-toast', {
      detail: { message, type },
    })
  )
}

export function ToastHost() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  React.useEffect(() => {
    const handleToast = (event: Event) => {
      const detail = (event as CustomEvent<ToastEventDetail>).detail
      if (!detail?.message) return

      const nextToast: ToastItem = {
        id: `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        message: detail.message,
        type: detail.type || 'info',
      }

      setToasts((current) => [...current, nextToast].slice(-5))

      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== nextToast.id))
      }, 3200)
    }

    window.addEventListener('psb-toast', handleToast)
    return () => window.removeEventListener('psb-toast', handleToast)
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed right-4 top-4 z-[70] space-y-2">
      {toasts.map((toast) => {
        const icon =
          toast.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="h-4 w-4 text-red-600" />
          ) : toast.type === 'warning' ? (
            <TriangleAlert className="h-4 w-4 text-amber-600" />
          ) : (
            <Info className="h-4 w-4 text-blue-600" />
          )

        const toneClass =
          toast.type === 'success'
            ? 'border-green-200 bg-green-50'
            : toast.type === 'error'
            ? 'border-red-200 bg-red-50'
            : toast.type === 'warning'
            ? 'border-amber-200 bg-amber-50'
            : 'border-blue-200 bg-blue-50'

        return (
          <div
            key={toast.id}
            className={`flex min-w-[280px] max-w-md items-start gap-2 rounded-lg border px-3 py-2 text-sm text-slate-800 shadow-lg transition ${toneClass}`}
          >
            {icon}
            <div className="flex-1">{toast.message}</div>
            <button
              type="button"
              onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
              className="rounded p-0.5 text-slate-500 transition hover:bg-white/70"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

