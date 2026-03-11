import React from 'react'
import { Sparkles } from 'lucide-react'

interface OnboardingTutorialProps {
  isOpen: boolean
  onClose: () => void
}

const ONBOARDING_KEY = 'psb-onboarding-complete'

export function useOnboardingState() {
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY)
    if (!done) {
      setIsOpen(true)
    }
  }, [])

  const close = React.useCallback(() => {
    localStorage.setItem(ONBOARDING_KEY, '1')
    setIsOpen(false)
  }, [])

  return { isOpen, close }
}

export function OnboardingTutorial({ isOpen, onClose }: OnboardingTutorialProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[66] flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-xl rounded-lg border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-600" />
            <h3 className="font-semibold text-slate-900">Welcome to PSS Builder</h3>
          </div>
        </div>
        <div className="space-y-3 px-4 py-4 text-sm text-slate-700">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            Drag devices from the left library to the center canvas.
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            Click a node or edge to edit its properties on the right.
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            Press Validate to get issues and click any issue to focus it.
          </div>
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            Use keyboard shortcuts (F1) for faster editing.
          </div>
        </div>
        <div className="flex justify-end border-t border-slate-200 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            Start Building
          </button>
        </div>
      </div>
    </div>
  )
}

