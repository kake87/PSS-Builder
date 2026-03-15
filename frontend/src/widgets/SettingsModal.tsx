import React, { useState, useEffect } from 'react'
import { X, Grid3x3, Minimize2, Palette } from 'lucide-react'
import {
  applyUISettings,
  DEFAULT_UI_SETTINGS,
  readUISettings,
  UISettings,
} from '@/shared/uiSettings'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

interface CanvasSettings {
  backgroundPattern: 'dots' | 'grid' | 'cross' | 'none'
  backgroundColor: string
  gridSize: number
  gridGap: number
}

interface NodeVisualSettings {
  viewMode: 'icon' | 'hybrid' | 'text'
}

const DEFAULT_SETTINGS: CanvasSettings = {
  backgroundPattern: 'grid',
  backgroundColor: 'transparent',
  gridSize: 16,
  gridGap: 16,
}

const DEFAULT_NODE_VISUAL_SETTINGS: NodeVisualSettings = {
  viewMode: 'hybrid',
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const [settings, setSettings] = useState<CanvasSettings>(DEFAULT_SETTINGS)
  const [nodeVisualSettings, setNodeVisualSettings] = useState<NodeVisualSettings>(
    DEFAULT_NODE_VISUAL_SETTINGS
  )
  const [uiSettings, setUISettings] = useState<UISettings>(DEFAULT_UI_SETTINGS)

  // Load settings from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('psb-canvas-settings')
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to load settings:', e)
      }
    }

    const savedNodeVisuals = localStorage.getItem('psb-node-visual-settings')
    if (savedNodeVisuals) {
      try {
        setNodeVisualSettings(JSON.parse(savedNodeVisuals))
      } catch (e) {
        console.error('Failed to load node visual settings:', e)
      }
    }

    const currentUISettings = readUISettings()
    setUISettings(currentUISettings)
    applyUISettings(currentUISettings)
  }, [])

  // Save settings to localStorage when they change
  const updateSetting = (key: keyof CanvasSettings, value: any) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    localStorage.setItem('psb-canvas-settings', JSON.stringify(newSettings))
    // Dispatch custom event so Canvas can update
    window.dispatchEvent(new CustomEvent('psb-settings-changed', { detail: newSettings }))
  }

  const updateNodeVisualSetting = (key: keyof NodeVisualSettings, value: any) => {
    const nextSettings = { ...nodeVisualSettings, [key]: value }
    setNodeVisualSettings(nextSettings)
    localStorage.setItem('psb-node-visual-settings', JSON.stringify(nextSettings))
    window.dispatchEvent(new CustomEvent('psb-node-visuals-changed', { detail: nextSettings }))
  }

  const updateUISetting = (key: keyof UISettings, value: UISettings[keyof UISettings]) => {
    const nextSettings = { ...uiSettings, [key]: value }
    setUISettings(nextSettings)
    localStorage.setItem('psb-ui-settings', JSON.stringify(nextSettings))
    applyUISettings(nextSettings)
    window.dispatchEvent(new CustomEvent('psb-ui-settings-changed', { detail: nextSettings }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl p-6 w-96 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Grid3x3 className="w-5 h-5" />
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Settings Tabs */}
        <div className="space-y-6">
          {/* Canvas Settings Section */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Canvas Background
            </h3>

            {/* Background Pattern */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pattern Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'none', label: 'None', desc: 'Plain background' },
                  { value: 'dots', label: 'Dots', desc: 'Dot pattern' },
                  { value: 'grid', label: 'Grid', desc: 'Grid lines' },
                  { value: 'cross', label: 'Cross', desc: 'Cross pattern' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() =>
                      updateSetting(
                        'backgroundPattern',
                        option.value as CanvasSettings['backgroundPattern']
                      )
                    }
                    className={`p-3 rounded-lg border-2 text-left transition ${
                      settings.backgroundPattern === option.value
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {option.label}
                    </div>
                    <div className="text-xs text-gray-500">{option.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Size */}
            {settings.backgroundPattern !== 'none' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grid Size: {settings.gridSize}px
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="64"
                    step="8"
                    value={settings.gridSize}
                    onChange={(e) =>
                      updateSetting('gridSize', parseInt(e.target.value))
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    Adjust the size of each grid cell
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gap Between Elements: {settings.gridGap}px
                  </label>
                  <input
                    type="range"
                    min="4"
                    max="32"
                    step="4"
                    value={settings.gridGap}
                    onChange={(e) =>
                      updateSetting('gridGap', parseInt(e.target.value))
                    }
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </>
            )}

            {/* Background Color */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Background Color
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Light', value: 'rgb(248, 250, 252)' },
                  { label: 'White', value: 'rgb(255, 255, 255)' },
                  { label: 'Gray', value: 'rgb(243, 244, 246)' },
                  { label: 'Navy', value: 'rgb(15, 23, 42)' },
                ].map((color) => (
                  <button
                    key={color.value}
                    onClick={() => updateSetting('backgroundColor', color.value)}
                    className={`p-3 rounded-lg border-2 transition ${
                      settings.backgroundColor === color.value
                        ? 'border-brand-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    title={color.label}
                  >
                    <div
                      className="w-full h-6 rounded"
                      style={{ backgroundColor: color.value }}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-b border-gray-200 pb-6">
            <h3 className="mb-4 font-semibold text-gray-900">Node Visuals</h3>
            <label className="mb-2 block text-sm font-medium text-gray-700">Display Mode</label>
            <div className="grid grid-cols-1 gap-2">
              {[
                { value: 'hybrid', label: 'Icon + Type', desc: 'Best readability' },
                { value: 'icon', label: 'Icon only', desc: 'Compact mode' },
                { value: 'text', label: 'Type only', desc: 'No icons' },
              ].map((mode) => (
                <button
                  key={mode.value}
                  onClick={() =>
                    updateNodeVisualSetting(
                      'viewMode',
                      mode.value as NodeVisualSettings['viewMode']
                    )
                  }
                  className={`rounded-lg border-2 p-3 text-left transition ${
                    nodeVisualSettings.viewMode === mode.value
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">{mode.label}</div>
                  <div className="text-xs text-gray-500">{mode.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="border-b border-gray-200 pb-6">
            <h3 className="mb-4 font-semibold text-gray-900 flex items-center gap-2">
              <Minimize2 className="w-4 h-4" />
              Interface Design
            </h3>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">Theme Preset</label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { value: 'steel', label: 'Steel', desc: 'Cool enterprise look' },
                  { value: 'sand', label: 'Sand', desc: 'Warm neutral look' },
                  { value: 'forest', label: 'Forest', desc: 'Calm green look' },
                ].map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() =>
                      updateUISetting('themePreset', preset.value as UISettings['themePreset'])
                    }
                    className={`rounded-lg border-2 p-3 text-left transition ${
                      uiSettings.themePreset === preset.value
                        ? 'border-brand-500 bg-brand-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-sm font-medium text-gray-900">{preset.label}</div>
                    <div className="text-xs text-gray-500">{preset.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">Density</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'comfortable', label: 'Comfortable' },
                  { value: 'compact', label: 'Compact' },
                ].map((density) => (
                  <button
                    key={density.value}
                    onClick={() => updateUISetting('density', density.value as UISettings['density'])}
                    className={`rounded-lg border-2 p-3 text-sm font-medium transition ${
                      uiSettings.density === density.value
                        ? 'border-brand-500 bg-brand-50 text-gray-900'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {density.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">Panel Shape</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'rounded', label: 'Rounded' },
                  { value: 'sharp', label: 'Sharp' },
                ].map((radius) => (
                  <button
                    key={radius.value}
                    onClick={() => updateUISetting('radius', radius.value as UISettings['radius'])}
                    className={`rounded-lg border-2 p-3 text-sm font-medium transition ${
                      uiSettings.radius === radius.value
                        ? 'border-brand-500 bg-brand-50 text-gray-900'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {radius.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">Panel Depth</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'soft', label: 'Soft shadow' },
                  { value: 'flat', label: 'Flat border' },
                ].map((shadow) => (
                  <button
                    key={shadow.value}
                    onClick={() => updateUISetting('shadow', shadow.value as UISettings['shadow'])}
                    className={`rounded-lg border-2 p-3 text-sm font-medium transition ${
                      uiSettings.shadow === shadow.value
                        ? 'border-brand-500 bg-brand-50 text-gray-900'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {shadow.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
              <span className="text-sm font-medium text-gray-700">Accent header glow</span>
              <input
                type="checkbox"
                checked={uiSettings.accentHeader}
                onChange={(event) => updateUISetting('accentHeader', event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
              />
            </label>
          </div>

          {/* Preview */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Preview</h3>
            <div
              className="w-full h-32 rounded-lg border border-gray-200 overflow-hidden"
              style={{ backgroundColor: settings.backgroundColor || 'transparent' }}
            >
              {/* Simple preview of pattern */}
              {settings.backgroundPattern === 'dots' && (
                <div className="w-full h-full bg-[radial-gradient(circle,#cbd5e1_1px,transparent_1px)]"
                  style={{ backgroundSize: `${settings.gridSize}px ${settings.gridSize}px` }}
                />
              )}
              {settings.backgroundPattern === 'grid' && (
                <div className="w-full h-full"
                  style={{
                    backgroundImage: `linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)`,
                    backgroundSize: `${settings.gridSize}px ${settings.gridSize}px`,
                  }}
                />
              )}
              {settings.backgroundPattern === 'cross' && (
                <div className="w-full h-full"
                  style={{
                    backgroundImage: `
                      linear-gradient(45deg, #cbd5e1 1px, transparent 1px),
                      linear-gradient(-45deg, #cbd5e1 1px, transparent 1px)
                    `,
                    backgroundSize: `${settings.gridSize}px ${settings.gridSize}px`,
                  }}
                />
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <button
              onClick={() => {
                setSettings(DEFAULT_SETTINGS)
                localStorage.removeItem('psb-canvas-settings')
                setNodeVisualSettings(DEFAULT_NODE_VISUAL_SETTINGS)
                localStorage.removeItem('psb-node-visual-settings')
                setUISettings(DEFAULT_UI_SETTINGS)
                localStorage.removeItem('psb-ui-settings')
                applyUISettings(DEFAULT_UI_SETTINGS)
                window.dispatchEvent(
                  new CustomEvent('psb-settings-changed', { detail: DEFAULT_SETTINGS })
                )
                window.dispatchEvent(
                  new CustomEvent('psb-node-visuals-changed', {
                    detail: DEFAULT_NODE_VISUAL_SETTINGS,
                  })
                )
                window.dispatchEvent(
                  new CustomEvent('psb-ui-settings-changed', { detail: DEFAULT_UI_SETTINGS })
                )
              }}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              Reset to Defaults
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
