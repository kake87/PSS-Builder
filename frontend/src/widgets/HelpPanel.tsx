import React from 'react'
import { HelpCircle, X } from 'lucide-react'

interface HelpPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function HelpPanel({ isOpen, onClose }: HelpPanelProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-3xl rounded-lg border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-brand-600" />
            <h3 className="font-semibold text-slate-900">Help & Guidelines</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-slate-500 transition hover:bg-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 px-4 py-4 text-sm text-slate-700 md:grid-cols-2">
          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="font-semibold text-slate-900">Quick Start</div>
            <div className="mt-2 space-y-1 text-xs">
              <div>1. Create/open project</div>
              <div>2. Drag devices from library to canvas</div>
              <div>3. Connect ports between devices</div>
              <div>4. Run Validate and resolve warnings/errors</div>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="font-semibold text-slate-900">Context Tips</div>
            <div className="mt-2 space-y-1 text-xs">
              <div>• Right click on canvas/node/edge for quick actions</div>
              <div>• Click validation issue to focus related object</div>
              <div>• Hover connection to inspect cable metadata</div>
              <div>• Open shortcuts reference with F1</div>
            </div>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 p-3 md:col-span-2">
            <div className="font-semibold text-slate-900">Common Scenarios</div>
            <div className="mt-2 space-y-1 text-xs">
              <div>• Office CCTV: cameras + PoE switches + NVR + UPS</div>
              <div>• Access control: controller + readers + lock power + uplink switch</div>
              <div>• Validate early to catch missing ports and isolated devices</div>
            </div>
          </div>

          <div className="md:col-span-2">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('psb-toggle-shortcuts'))}
              className="rounded-md border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:bg-brand-100"
            >
              Open Keyboard Shortcuts
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
