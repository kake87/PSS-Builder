import React, { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Camera,
  Cpu,
  Lock,
  Pencil,
  Plus,
  Search,
  Server,
  Trash2,
  Wifi,
  X,
  Zap,
} from 'lucide-react'
import {
  devicesApi,
  EquipmentModelDefinition,
  ModelStatusHistoryEntry,
} from '@/shared/api/client'
import { emitToast } from '@/widgets/Toast'

interface EquipmentLibraryProps {
  projectId: string | null
  onAddDevice: (equipmentKey: string) => Promise<void> | void
  mode?: 'picker' | 'catalog'
}

interface EquipmentLibraryItem extends EquipmentModelDefinition {
  device_type?: string
}

interface CatalogPayload {
  models: EquipmentLibraryItem[]
  requiredFieldsByType: Record<string, string[]>
}

interface EditModelForm {
  id: string
  key: string
  type_key: string
  name: string
  manufacturer: string
  model: string
  lifecycle_status: string
  schema_version: string
  power_consumption_watts: string
  resolution: string
  storage_capacity_gb: string
  bandwidth_requires_mbps: string
  portsText: string
}

const FILTERS_STORAGE_KEY = 'psb-equipment-library-filters'
type PickerDensity = 'compact' | 'detailed'
type SortMode = 'model' | 'manufacturer' | 'type'

function getEquipmentIcon(type: string) {
  const typeMap: Record<string, React.ReactNode> = {
    camera: <Camera className="h-5 w-5 text-red-500" />,
    server: <Server className="h-5 w-5 text-blue-500" />,
    switch: <Cpu className="h-5 w-5 text-purple-500" />,
    nvr: <Server className="h-5 w-5 text-indigo-500" />,
    ups: <Zap className="h-5 w-5 text-yellow-500" />,
    gateway: <Wifi className="h-5 w-5 text-cyan-500" />,
    access_controller: <Lock className="h-5 w-5 text-green-500" />,
  }
  return typeMap[type.toLowerCase()] || <Cpu className="h-5 w-5 text-gray-500" />
}

function getMissingRequiredFields(item: EquipmentLibraryItem, requiredFields: string[]): string[] {
  return requiredFields.filter((field) => {
    if (field === 'ports') return !Array.isArray(item.ports) || item.ports.length === 0
    if (field === 'device_type') return !item.type_key
    const value = (item as unknown as Record<string, unknown>)[field]
    return value === undefined || value === null || value === ''
  })
}

function toStringValue(value: number | string | undefined | null): string {
  if (value === undefined || value === null) return ''
  return String(value)
}

function parseOptionalFloat(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  return Number.isFinite(parsed) ? parsed : undefined
}

function parseOptionalInt(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number.parseInt(trimmed, 10)
  return Number.isFinite(parsed) ? parsed : undefined
}

function portsToText(model: EquipmentLibraryItem): string {
  return (model.ports || [])
    .map((port) => `${port.name}:${port.port_type}:${port.speed_mbps || ''}:${port.power_watts || ''}`)
    .join('\n')
}

function parsePorts(portsText: string): EquipmentModelDefinition['ports'] {
  const lines = portsText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length === 0) return []
  return lines.map((line) => {
    const [nameRaw, typeRaw, speedRaw, powerRaw] = line.split(':')
    return {
      name: (nameRaw || 'PORT').trim(),
      port_type: (typeRaw || 'ethernet').trim(),
      speed_mbps: parseOptionalInt(speedRaw || ''),
      power_watts: parseOptionalFloat(powerRaw || ''),
    }
  })
}

function createEditForm(model: EquipmentLibraryItem): EditModelForm {
  return {
    id: model.id,
    key: model.key,
    type_key: model.type_key,
    name: model.name,
    manufacturer: model.manufacturer,
    model: model.model,
    lifecycle_status: model.lifecycle_status || 'verified',
    schema_version: model.schema_version || '1.0',
    power_consumption_watts: toStringValue(model.power_consumption_watts),
    resolution: model.resolution || '',
    storage_capacity_gb: toStringValue(model.storage_capacity_gb),
    bandwidth_requires_mbps: toStringValue(model.bandwidth_requires_mbps),
    portsText: portsToText(model),
  }
}

function getStatusActionLabel(status: string): string {
  if (status === 'draft') return 'Set Draft'
  if (status === 'verified') return 'Verify'
  return 'Deprecate'
}

export function EquipmentLibrary({
  projectId,
  onAddDevice,
  mode = 'picker',
}: EquipmentLibraryProps) {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedLifecycle, setSelectedLifecycle] = useState<string>('verified')
  const [selectedManufacturer, setSelectedManufacturer] = useState<string>('all')
  const [pickerDensity, setPickerDensity] = useState<PickerDensity>('compact')
  const [sortMode, setSortMode] = useState<SortMode>('model')
  const [actionError, setActionError] = useState<string | null>(null)
  const [importUrl, setImportUrl] = useState('')
  const [importCategoryUrl, setImportCategoryUrl] = useState('')
  const [importTypeKey, setImportTypeKey] = useState('camera')
  const [editingModelKey, setEditingModelKey] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditModelForm | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(FILTERS_STORAGE_KEY)
    if (!saved) return
    try {
      const parsed = JSON.parse(saved) as {
        selectedCategory?: string | null
        selectedLifecycle?: string
        selectedManufacturer?: string
        pickerDensity?: PickerDensity
        sortMode?: SortMode
      }
      setSelectedCategory(parsed.selectedCategory ?? null)
      setSelectedLifecycle(parsed.selectedLifecycle || 'verified')
      setSelectedManufacturer(parsed.selectedManufacturer || 'all')
      setPickerDensity(parsed.pickerDensity || 'compact')
      setSortMode(parsed.sortMode || 'model')
    } catch (error) {
      console.error('Failed to load equipment library filters:', error)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(
      FILTERS_STORAGE_KEY,
      JSON.stringify({
        selectedCategory,
        selectedLifecycle,
        selectedManufacturer,
        pickerDensity,
        sortMode,
      })
    )
  }, [selectedCategory, selectedLifecycle, selectedManufacturer, pickerDensity, sortMode])

  const { data: payload, isLoading } = useQuery({
    queryKey: ['equipment-catalog-library'],
    queryFn: async (): Promise<CatalogPayload> => {
      const normalized = await devicesApi.getNormalizedEquipmentCatalog()
      const models = (normalized.data?.equipment_models || []).map((model) => ({
        ...model,
        device_type: model.type_key,
      }))
      const typeDefs = normalized.data?.equipment_types || []

      const requiredFieldsByType = typeDefs.reduce((acc, typeDef) => {
        acc[typeDef.key] = typeDef.required_fields || []
        return acc
      }, {} as Record<string, string[]>)

      return { models, requiredFieldsByType }
    },
  })

  const invalidateCatalog = () => {
    queryClient.invalidateQueries({ queryKey: ['equipment-catalog-library'] })
    queryClient.invalidateQueries({ queryKey: ['equipment-catalog'] })
  }

  const importByUrlMutation = useMutation({
    mutationFn: async () => {
      if (!importUrl.trim()) {
        throw new Error('Enter a product URL first.')
      }
      return devicesApi.importEquipmentModelFromUrl({
        url: importUrl.trim(),
        type_key: importTypeKey,
        lifecycle_status: 'verified',
      })
    },
    onSuccess: (response) => {
      emitToast(`Imported: ${response.data.name}`, 'success')
      setImportUrl('')
      setSelectedLifecycle('verified')
      invalidateCatalog()
    },
    onError: (error) => {
      console.error('Import by URL failed:', error)
      emitToast('Import failed. Check URL and try again.', 'error')
    },
  })

  const importByCategoryMutation = useMutation({
    mutationFn: async () => {
      if (!importCategoryUrl.trim()) {
        throw new Error('Enter a category URL first.')
      }
      return devicesApi.importEquipmentModelsFromCategory({
        category_url: importCategoryUrl.trim(),
        type_key: importTypeKey,
        lifecycle_status: 'verified',
        max_items: 120,
      })
    },
    onSuccess: (response) => {
      const imported = response.data.imported_models || 0
      const failed = response.data.failed_models || 0
      emitToast(`Category import: ${imported} imported, ${failed} failed`, 'success')
      setImportCategoryUrl('')
      setSelectedLifecycle('verified')
      invalidateCatalog()
    },
    onError: (error) => {
      console.error('Import by category failed:', error)
      emitToast('Category import failed. Check URL and try again.', 'error')
    },
  })

  const updateModelMutation = useMutation({
    mutationFn: (item: EquipmentModelDefinition) => devicesApi.upsertEquipmentModel(item),
    onSuccess: () => {
      emitToast('Model updated', 'success')
      setEditingModelKey(null)
      setEditForm(null)
      invalidateCatalog()
    },
    onError: (error) => {
      console.error('Failed to update model:', error)
      emitToast('Failed to update model', 'error')
    },
  })

  const deleteModelMutation = useMutation({
    mutationFn: (modelKey: string) => devicesApi.deleteEquipmentModel(modelKey),
    onSuccess: () => {
      emitToast('Model deleted', 'success')
      invalidateCatalog()
    },
    onError: (error) => {
      console.error('Failed to delete model:', error)
      emitToast('Failed to delete model', 'error')
    },
  })

  const changeStatusMutation = useMutation({
    mutationFn: ({ modelKey, status }: { modelKey: string; status: 'draft' | 'verified' | 'deprecated' }) =>
      devicesApi.updateEquipmentModelStatus(modelKey, {
        status,
        actor: 'catalog-reviewer',
      }),
    onSuccess: (_, vars) => {
      emitToast(`Status updated: ${getStatusActionLabel(vars.status)}`, 'success')
      invalidateCatalog()
    },
    onError: (error) => {
      console.error('Failed to update model status:', error)
      emitToast('Failed to change lifecycle status', 'error')
    },
  })

  const equipmentList = payload?.models || []
  const selectedModel = useMemo(
    () => equipmentList.find((item) => item.key === editingModelKey) || null,
    [editingModelKey, equipmentList]
  )

  const filteredEquipment = useMemo(
    () =>
      equipmentList
        .filter((item) => {
          const matchesSearch =
            item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
          const matchesCategory = selectedCategory === null || item.type_key === selectedCategory
          const matchesManufacturer =
            selectedManufacturer === 'all' || item.manufacturer === selectedManufacturer
          const matchesLifecycle =
            selectedLifecycle === 'all' || (item.lifecycle_status || 'verified') === selectedLifecycle
          return matchesSearch && matchesCategory && matchesManufacturer && matchesLifecycle
        })
        .sort((a, b) => {
          if (sortMode === 'manufacturer') {
            return `${a.manufacturer || ''} ${a.model || ''}`.localeCompare(
              `${b.manufacturer || ''} ${b.model || ''}`
            )
          }
          if (sortMode === 'type') {
            return `${a.type_key || ''} ${a.model || ''}`.localeCompare(
              `${b.type_key || ''} ${b.model || ''}`
            )
          }
          return `${a.model || ''} ${a.name || ''}`.localeCompare(
            `${b.model || ''} ${b.name || ''}`
          )
        }),
    [equipmentList, searchTerm, selectedCategory, selectedLifecycle, selectedManufacturer, sortMode]
  )

  const categories = useMemo(
    () => [...new Set(equipmentList.map((item) => item.type_key))].filter(Boolean).sort(),
    [equipmentList]
  )
  const manufacturers = useMemo(
    () => [...new Set(equipmentList.map((item) => item.manufacturer).filter(Boolean))].sort(),
    [equipmentList]
  )

  const handleAddDeviceClick = async (equipmentKey: string) => {
    if (!projectId) {
      setActionError('Create or open a project before adding devices.')
      emitToast('Create or open a project before adding devices', 'warning')
      return
    }
    setActionError(null)
    try {
      await onAddDevice(equipmentKey)
      emitToast('Device added to canvas', 'success')
    } catch (error) {
      console.error('Failed to add device from library:', error)
      setActionError('Failed to add the selected device.')
      emitToast('Failed to add selected device', 'error')
    }
  }

  const openEditModal = (item: EquipmentLibraryItem) => {
    setEditingModelKey(item.key)
    setEditForm(createEditForm(item))
  }

  const saveEditedModel = () => {
    if (!editForm) return
    const payloadToSave: EquipmentModelDefinition = {
      id: editForm.id,
      key: editForm.key,
      type_key: editForm.type_key,
      name: editForm.name.trim(),
      manufacturer: editForm.manufacturer.trim(),
      model: editForm.model.trim(),
      lifecycle_status: editForm.lifecycle_status,
      schema_version: editForm.schema_version || '1.0',
      power_consumption_watts: parseOptionalFloat(editForm.power_consumption_watts),
      resolution: editForm.resolution.trim() || undefined,
      storage_capacity_gb: parseOptionalInt(editForm.storage_capacity_gb),
      bandwidth_requires_mbps: parseOptionalInt(editForm.bandwidth_requires_mbps),
      ports: parsePorts(editForm.portsText),
    }
    updateModelMutation.mutate(payloadToSave)
  }

  return (
    <div className="equipment-library flex h-full flex-col bg-white">
      <div className="shrink-0 border-b border-gray-200 px-4 py-3">
        <h3 className="font-bold text-gray-900">
          {mode === 'catalog' ? 'Catalog Database' : 'Equipment Picker'}
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          {mode === 'catalog'
            ? 'Browse imported models, manage lifecycle, edit and delete catalog records'
            : 'Search and place equipment on the canvas without catalog management noise'}
        </p>
      </div>

      {actionError && (
        <div className="mx-4 mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {actionError}
        </div>
      )}

      <div className="sticky top-0 z-20 shrink-0 border-b border-gray-200 bg-white px-4 py-3">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search devices..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        {mode === 'picker' && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="rounded-md border border-gray-300 px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="model">Sort: Model</option>
              <option value="manufacturer">Sort: Manufacturer</option>
              <option value="type">Sort: Type</option>
            </select>
            <div className="flex rounded-md border border-gray-300 bg-gray-50 p-0.5">
              {(['compact', 'detailed'] as const).map((density) => (
                <button
                  key={density}
                  type="button"
                  onClick={() => setPickerDensity(density)}
                  className={`rounded px-2 py-1 text-[11px] font-medium transition ${
                    pickerDensity === density
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-600 hover:bg-white'
                  }`}
                >
                  {density === 'compact' ? 'Compact' : 'Detailed'}
                </button>
              ))}
            </div>
            <div className="ml-auto text-[11px] text-slate-500">{filteredEquipment.length} items</div>
          </div>
        )}
        {mode === 'catalog' && (
          <>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="url"
                placeholder="Paste model URL"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <select
                value={importTypeKey}
                onChange={(e) => setImportTypeKey(e.target.value)}
                className="rounded-md border border-gray-300 px-2 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="camera">Camera</option>
                <option value="nvr">NVR</option>
                <option value="switch">Switch</option>
                <option value="server">Server</option>
                <option value="ups">UPS</option>
                <option value="gateway">Gateway</option>
                <option value="access_controller">Access</option>
              </select>
              <button
                type="button"
                onClick={() => importByUrlMutation.mutate()}
                disabled={importByUrlMutation.isPending}
                className="rounded-md bg-slate-700 px-3 py-2 text-xs font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {importByUrlMutation.isPending ? 'Importing...' : 'Import URL'}
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="url"
                placeholder="Category URL (e.g. AcuSense-Series)"
                value={importCategoryUrl}
                onChange={(e) => setImportCategoryUrl(e.target.value)}
                className="min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={() => importByCategoryMutation.mutate()}
                disabled={importByCategoryMutation.isPending}
                className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-medium text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-emerald-400"
              >
                {importByCategoryMutation.isPending ? 'Importing...' : 'Import Category'}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="sticky top-[94px] z-10 shrink-0 space-y-2 border-b border-gray-200 bg-white px-4 py-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`w-full rounded-md px-3 py-1 text-xs font-medium transition ${
            selectedCategory === null
              ? 'bg-brand-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All Types
        </button>
        <div className="flex flex-wrap gap-1">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`min-w-fit flex-1 rounded-md px-2 py-1 text-xs font-medium capitalize transition ${
                selectedCategory === category
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="pt-1">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Manufacturer
          </div>
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setSelectedManufacturer('all')}
              className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                selectedManufacturer === 'all'
                  ? 'bg-slate-700 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {manufacturers.slice(0, 12).map((manufacturer) => (
              <button
                key={manufacturer}
                onClick={() => setSelectedManufacturer(manufacturer)}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                  selectedManufacturer === manufacturer
                    ? 'bg-slate-700 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {manufacturer}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-1">
          <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
            Catalog status
          </div>
          <div className="flex flex-wrap gap-1">
            {[
              { value: 'verified', label: 'Verified' },
              { value: 'draft', label: 'Draft' },
              { value: 'deprecated', label: 'Deprecated' },
              { value: 'all', label: 'All' },
            ].map((status) => (
              <button
                key={status.value}
                onClick={() => setSelectedLifecycle(status.value)}
                className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                  selectedLifecycle === status.value
                    ? 'bg-slate-700 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {isLoading ? (
          <div className="py-8 text-center text-gray-500">
            <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-2 border-brand-300 border-t-brand-600" />
            <div className="text-sm">Loading equipment...</div>
          </div>
        ) : filteredEquipment.length === 0 ? (
          <div className="py-8 text-center text-gray-500">
            <div className="text-sm">No devices found</div>
          </div>
        ) : (
          <div className={mode === 'picker' ? 'space-y-1' : 'space-y-2'}>
            {filteredEquipment.map((item) => {
              const requiredFields = payload?.requiredFieldsByType?.[item.type_key || ''] || []
              const missingFields = getMissingRequiredFields(item, requiredFields)
              const isComplete = requiredFields.length === 0 || missingFields.length === 0

              if (mode === 'picker') {
                return (
                  <div
                    key={item.key}
                    className={`group cursor-move rounded-xl border border-slate-200 bg-white transition hover:border-brand-400 hover:bg-brand-50/50 ${
                      pickerDensity === 'compact' ? 'px-3 py-2' : 'px-3 py-3'
                    }`}
                    draggable
                    onDragStart={(event) => {
                      setActionError(null)
                      event.dataTransfer.effectAllowed = 'move'
                      event.dataTransfer.setData('application/json', JSON.stringify(item))
                      event.dataTransfer.setData('text/plain', item.key)
                    }}
                  >
                    <div
                      className={`grid items-center gap-3 ${
                        pickerDensity === 'compact'
                          ? 'grid-cols-[1.8rem_minmax(0,1fr)_auto]'
                          : 'grid-cols-[2.25rem_minmax(0,1.1fr)_minmax(0,0.9fr)_auto]'
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center rounded-lg bg-slate-100 ${
                          pickerDensity === 'compact' ? 'h-7 w-7' : 'h-9 w-9'
                        }`}
                      >
                        {getEquipmentIcon(item.type_key || 'device')}
                      </div>

                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-slate-900">
                          {item.model}
                        </div>
                        <div className="truncate text-[11px] text-slate-500">
                          {item.manufacturer} | {item.name}
                        </div>
                      </div>

                      {pickerDensity === 'detailed' && (
                        <div className="min-w-0 text-[11px] text-slate-500">
                          <div className="truncate capitalize">
                            {String(item.type_key || 'device').replace(/_/g, ' ')}
                          </div>
                          <div className="truncate">
                            {item.ports?.length || 0} ports | {item.lifecycle_status || 'verified'}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-1">
                        <div className="hidden rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 md:block">
                          {item.ports?.length || 0}p
                        </div>
                        {!isComplete && (
                          <div
                            className="hidden rounded-full bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-700 md:block"
                            title={`Missing required fields: ${missingFields.join(', ')}`}
                          >
                            Missing
                          </div>
                        )}
                        <button
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            void handleAddDeviceClick(item.key)
                          }}
                          disabled={!projectId}
                          className="rounded-lg bg-brand-500 p-1.5 text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                          title="Add device"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              }

              return (
                <div
                  key={item.key}
                  className="group cursor-move rounded-2xl border border-slate-200 bg-white px-3 py-3 transition-all hover:border-brand-400 hover:shadow-md"
                  draggable
                  onDragStart={(event) => {
                    setActionError(null)
                    event.dataTransfer.effectAllowed = 'move'
                    event.dataTransfer.setData('application/json', JSON.stringify(item))
                    event.dataTransfer.setData('text/plain', item.key)
                  }}
                >
                  <div className="grid gap-3 lg:grid-cols-[2.2rem_minmax(0,1.6fr)_minmax(0,1fr)_auto] lg:items-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100">
                      {getEquipmentIcon(item.type_key || 'device')}
                    </div>

                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">{item.name}</div>
                      <div className="truncate text-xs text-slate-500">
                        {item.manufacturer} - {item.model}
                      </div>
                    </div>

                    <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                      <div className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
                        {String(item.type_key || 'device').replace(/_/g, ' ')}
                      </div>
                      <div className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-500">
                        {item.lifecycle_status || 'verified'}
                      </div>
                      <div
                        className={`rounded-full border px-2 py-1 text-[10px] font-medium uppercase tracking-[0.14em] ${
                          isComplete
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                            : 'border-amber-300 bg-amber-50 text-amber-700'
                        }`}
                        title={
                          isComplete
                            ? 'All required fields are present.'
                            : `Missing required fields: ${missingFields.join(', ')}`
                        }
                      >
                        {isComplete ? 'Complete' : `Missing ${missingFields.length}`}
                      </div>
                      <div className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600">
                        {item.ports?.length || 0} ports
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-1 self-start lg:self-center">
                      {mode === 'catalog' && (
                        <>
                          <button
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              openEditModal(item)
                            }}
                            className="rounded-xl bg-slate-200 p-2 text-slate-700 hover:bg-slate-300"
                            title="Edit model"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(event) => {
                              event.preventDefault()
                              event.stopPropagation()
                              if (!window.confirm(`Delete model "${item.name}"?`)) return
                              deleteModelMutation.mutate(item.key)
                            }}
                            className="rounded-xl bg-red-100 p-2 text-red-700 hover:bg-red-200"
                            title="Delete model"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          void handleAddDeviceClick(item.key)
                        }}
                        disabled={!projectId}
                        className="rounded-xl bg-brand-500 p-2 text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                        title="Add device"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {mode === 'catalog' && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {(['draft', 'verified', 'deprecated'] as const).map((statusOption) => (
                        <button
                          key={statusOption}
                          type="button"
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            if ((item.lifecycle_status || 'verified') === statusOption) return
                            changeStatusMutation.mutate({
                              modelKey: item.key,
                              status: statusOption,
                            })
                          }}
                          className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.14em] transition ${
                            (item.lifecycle_status || 'verified') === statusOption
                              ? 'bg-slate-700 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {statusOption}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {editingModelKey && editForm && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-slate-900">Edit model</h4>
              <button
                onClick={() => {
                  setEditingModelKey(null)
                  setEditForm(null)
                }}
                className="rounded p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <label className="col-span-1">
                <div className="mb-1 text-xs font-semibold text-slate-600">Name</div>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded border border-slate-300 px-2 py-2"
                />
              </label>
              <label className="col-span-1">
                <div className="mb-1 text-xs font-semibold text-slate-600">Model</div>
                <input
                  value={editForm.model}
                  onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                  className="w-full rounded border border-slate-300 px-2 py-2"
                />
              </label>
              <label className="col-span-1">
                <div className="mb-1 text-xs font-semibold text-slate-600">Manufacturer</div>
                <input
                  value={editForm.manufacturer}
                  onChange={(e) => setEditForm({ ...editForm, manufacturer: e.target.value })}
                  className="w-full rounded border border-slate-300 px-2 py-2"
                />
              </label>
              <label className="col-span-1">
                <div className="mb-1 text-xs font-semibold text-slate-600">Type</div>
                <input
                  value={editForm.type_key}
                  onChange={(e) => setEditForm({ ...editForm, type_key: e.target.value })}
                  className="w-full rounded border border-slate-300 px-2 py-2"
                />
              </label>
              <label className="col-span-1">
                <div className="mb-1 text-xs font-semibold text-slate-600">Lifecycle</div>
                <select
                  value={editForm.lifecycle_status}
                  onChange={(e) => setEditForm({ ...editForm, lifecycle_status: e.target.value })}
                  className="w-full rounded border border-slate-300 px-2 py-2"
                >
                  <option value="verified">verified</option>
                  <option value="draft">draft</option>
                  <option value="deprecated">deprecated</option>
                </select>
              </label>
              <label className="col-span-1">
                <div className="mb-1 text-xs font-semibold text-slate-600">Power (W)</div>
                <input
                  value={editForm.power_consumption_watts}
                  onChange={(e) =>
                    setEditForm({ ...editForm, power_consumption_watts: e.target.value })
                  }
                  className="w-full rounded border border-slate-300 px-2 py-2"
                />
              </label>
              <label className="col-span-1">
                <div className="mb-1 text-xs font-semibold text-slate-600">Resolution</div>
                <input
                  value={editForm.resolution}
                  onChange={(e) => setEditForm({ ...editForm, resolution: e.target.value })}
                  className="w-full rounded border border-slate-300 px-2 py-2"
                />
              </label>
              <label className="col-span-1">
                <div className="mb-1 text-xs font-semibold text-slate-600">Storage (GB)</div>
                <input
                  value={editForm.storage_capacity_gb}
                  onChange={(e) => setEditForm({ ...editForm, storage_capacity_gb: e.target.value })}
                  className="w-full rounded border border-slate-300 px-2 py-2"
                />
              </label>
              <label className="col-span-2">
                <div className="mb-1 text-xs font-semibold text-slate-600">Bandwidth (Mbps)</div>
                <input
                  value={editForm.bandwidth_requires_mbps}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bandwidth_requires_mbps: e.target.value })
                  }
                  className="w-full rounded border border-slate-300 px-2 py-2"
                />
              </label>
              <label className="col-span-2">
                <div className="mb-1 text-xs font-semibold text-slate-600">
                  Ports (one per line: name:port_type:speed:power)
                </div>
                <textarea
                  rows={6}
                  value={editForm.portsText}
                  onChange={(e) => setEditForm({ ...editForm, portsText: e.target.value })}
                  className="w-full rounded border border-slate-300 px-2 py-2 font-mono text-xs"
                />
              </label>
            </div>

            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
                Status history
              </div>
              {selectedModel?.status_history && selectedModel.status_history.length > 0 ? (
                <div className="space-y-1">
                  {[...selectedModel.status_history]
                    .reverse()
                    .slice(0, 10)
                    .map((entry: ModelStatusHistoryEntry, index: number) => (
                      <div
                        key={`${entry.changed_at}-${index}`}
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700"
                      >
                        <div>
                          {entry.from_status}
                          {' -> '}
                          {entry.to_status}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {entry.changed_by} • {new Date(entry.changed_at).toLocaleString()}
                        </div>
                        {entry.note ? (
                          <div className="text-[11px] text-slate-500">{entry.note}</div>
                        ) : null}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500">No status transitions yet.</div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditingModelKey(null)
                  setEditForm(null)
                }}
                className="rounded bg-gray-200 px-3 py-2 text-sm text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={saveEditedModel}
                disabled={updateModelMutation.isPending}
                className="rounded bg-brand-600 px-3 py-2 text-sm text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {updateModelMutation.isPending ? 'Saving...' : 'Save model'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
