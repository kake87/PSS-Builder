import React, { useState } from 'react'
import {
  Save,
  Settings,
  Check,
  AlertCircle,
  Zap,
  Undo2,
  Redo2,
  HelpCircle,
  Keyboard,
  Download,
  Upload,
  ScanSearch,
} from 'lucide-react'
import { SettingsModal } from '@/widgets/SettingsModal'
import { useProjectStore } from '@/shared/store/projectStore'

interface ToolbarProps {
  projectId: string | null
  onValidate: () => void
  isDirty: boolean
  onExportProject: () => void
  onImportProject: (file: File) => void
  onFitToContent: () => void
}

export function Toolbar({
  projectId,
  onValidate,
  isDirty,
  onExportProject,
  onImportProject,
  onFitToContent,
}: ToolbarProps) {
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const importInputRef = React.useRef<HTMLInputElement>(null)
  const canUndo = useProjectStore((state) => state.canUndo)
  const canRedo = useProjectStore((state) => state.canRedo)
  const undo = useProjectStore((state) => state.undo)
  const redo = useProjectStore((state) => state.redo)

  const handleSave = async () => {
    // Save logic here
    setLastSaved(new Date())
  }

  return (
    <div className="pss-topbar px-6 py-4 flex items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Logo/Title */}
        <div className="flex items-center gap-2">
          <div
            className="p-2 rounded-lg"
            style={{ background: 'color-mix(in srgb, var(--ui-accent) 88%, #000 12%)' }}
          >
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">PSS Builder</h1>
            <p className="text-xs text-slate-200">Power System Design</p>
          </div>
        </div>

        {/* Status indicator */}
        {isDirty && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-medium text-amber-700">Unsaved changes</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="pss-control inline-flex items-center gap-2 border border-white/30 bg-white/90 text-sm font-medium text-gray-700 transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          className="pss-control inline-flex items-center gap-2 border border-white/30 bg-white/90 text-sm font-medium text-gray-700 transition-all hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {/* Validate button */}
        <button
          onClick={onValidate}
          disabled={!projectId}
          className="pss-control inline-flex items-center gap-2 text-sm font-medium text-gray-700 bg-white/90 border border-white/30 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-sm"
          title="Validate current design"
        >
          <Check className="w-4 h-4 text-green-600" />
          Validate
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('psb-toggle-help'))}
          className="pss-control inline-flex items-center gap-2 border border-white/30 bg-white/90 text-sm font-medium text-gray-700 transition-all hover:bg-white hover:shadow-sm"
          title="Help (F1)"
        >
          <HelpCircle className="h-4 w-4 text-brand-600" />
          Help
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('psb-toggle-shortcuts'))}
          className="pss-control inline-flex items-center gap-2 border border-white/30 bg-white/90 text-sm font-medium text-gray-700 transition-all hover:bg-white hover:shadow-sm"
          title="Keyboard shortcuts"
        >
          <Keyboard className="h-4 w-4 text-brand-600" />
          Shortcuts
        </button>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!projectId || !isDirty}
          className="pss-control inline-flex items-center gap-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 transition-all hover:brightness-95"
          style={{
            background: 'linear-gradient(90deg, var(--ui-accent) 0%, color-mix(in srgb, var(--ui-accent) 78%, #000 22%) 100%)',
          }}
          title="Save changes"
        >
          <Save className="w-4 h-4" />
          Save
        </button>

        <button
          type="button"
          onClick={onExportProject}
          disabled={!projectId}
          className="pss-control inline-flex items-center gap-2 border border-white/30 bg-white/90 text-sm font-medium text-gray-700 transition-all hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          title="Export project to JSON"
        >
          <Download className="h-4 w-4 text-brand-600" />
          Export
        </button>

        <button
          type="button"
          onClick={onFitToContent}
          disabled={!projectId}
          className="pss-control inline-flex items-center gap-2 border border-white/30 bg-white/90 text-sm font-medium text-gray-700 transition-all hover:bg-white hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          title="Fit all nodes into view"
        >
          <ScanSearch className="h-4 w-4 text-brand-600" />
          Fit
        </button>

        <button
          type="button"
          onClick={() => importInputRef.current?.click()}
          className="pss-control inline-flex items-center gap-2 border border-white/30 bg-white/90 text-sm font-medium text-gray-700 transition-all hover:bg-white hover:shadow-sm"
          title="Import project JSON"
        >
          <Upload className="h-4 w-4 text-brand-600" />
          Import
        </button>

        {/* Last saved info */}
        {lastSaved && (
          <div className="pss-chip flex items-center gap-1 px-3 py-1.5 bg-green-50 border border-green-200">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-700">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* Settings button */}
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="pss-chip p-2.5 text-white hover:bg-white/20 transition-colors"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Modal */}
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (!file) return
          onImportProject(file)
          event.target.value = ''
        }}
      />
    </div>
  )
}
