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
} from 'lucide-react'
import { SettingsModal } from '@/widgets/SettingsModal'
import { useProjectStore } from '@/shared/store/projectStore'

interface ToolbarProps {
  projectId: string | null
  onValidate: () => void
  isDirty: boolean
  onExportProject: () => void
  onImportProject: (file: File) => void
}

export function Toolbar({
  projectId,
  onValidate,
  isDirty,
  onExportProject,
  onImportProject,
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
    <div className="bg-gradient-to-r from-white to-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between gap-4 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Logo/Title */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-brand-500 to-brand-600 rounded-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">PSS Builder</h1>
            <p className="text-xs text-gray-500">Power System Design</p>
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
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        <button
          onClick={redo}
          disabled={!canRedo}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {/* Validate button */}
        <button
          onClick={onValidate}
          disabled={!projectId}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-sm"
          title="Validate current design"
        >
          <Check className="w-4 h-4 text-green-600" />
          Validate
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('psb-toggle-help'))}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 hover:shadow-sm"
          title="Help (F1)"
        >
          <HelpCircle className="h-4 w-4 text-brand-600" />
          Help
        </button>

        <button
          type="button"
          onClick={() => window.dispatchEvent(new CustomEvent('psb-toggle-shortcuts'))}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 hover:shadow-sm"
          title="Keyboard shortcuts"
        >
          <Keyboard className="h-4 w-4 text-brand-600" />
          Shortcuts
        </button>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!projectId || !isDirty}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-brand-500 to-brand-600 rounded-lg hover:from-brand-600 hover:to-brand-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all hover:shadow-md disabled:shadow-none"
          title="Save changes"
        >
          <Save className="w-4 h-4" />
          Save
        </button>

        <button
          type="button"
          onClick={onExportProject}
          disabled={!projectId}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
          title="Export project to JSON"
        >
          <Download className="h-4 w-4 text-brand-600" />
          Export
        </button>

        <button
          type="button"
          onClick={() => importInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-50 hover:shadow-sm"
          title="Import project JSON"
        >
          <Upload className="h-4 w-4 text-brand-600" />
          Import
        </button>

        {/* Last saved info */}
        {lastSaved && (
          <div className="flex items-center gap-1 px-3 py-1.5 bg-green-50 rounded-lg border border-green-200">
            <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-700">
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          </div>
        )}

        {/* Settings button */}
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-2.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors hover:text-brand-600"
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
