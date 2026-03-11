import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { devicesApi } from '@/shared/api/client'
import { Search, Plus, Camera, Server, Wifi, Zap, Lock, Cpu } from 'lucide-react'
import { emitToast } from '@/widgets/Toast'

interface EquipmentLibraryProps {
  projectId: string | null
  onAddDevice: (equipmentKey: string) => Promise<void> | void
}

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

export function EquipmentLibrary({ projectId, onAddDevice }: EquipmentLibraryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { data: catalog, isLoading } = useQuery({
    queryKey: ['equipment-catalog'],
    queryFn: async () => {
      const res = await devicesApi.getEquipmentCatalog()
      return res.data || {}
    },
  })

  if (!catalog) return null

  const equipmentList = Object.entries(catalog).map(([key, value]: any) => ({
    key,
    ...value,
  }))

  const filteredEquipment = equipmentList
    .filter((item) => {
      const matchesSearch =
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory =
        selectedCategory === null || item.device_type === selectedCategory

      return matchesSearch && matchesCategory
    })
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))

  const categories = [...new Set(equipmentList.map((item) => item.device_type))].sort()

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

  return (
    <div className="equipment-library flex h-full flex-col bg-white">
      <div className="shrink-0 border-b border-gray-200 px-4 py-3">
        <h3 className="font-bold text-gray-900">Equipment Library</h3>
        <p className="mt-1 text-xs text-gray-500">Drag to add, or click the + button</p>
      </div>

      {actionError && (
        <div className="mx-4 mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {actionError}
        </div>
      )}

      <div className="shrink-0 border-b border-gray-200 px-4 py-3">
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
      </div>

      <div className="shrink-0 space-y-2 border-b border-gray-200 px-4 py-2">
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
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto px-2 py-2">
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
          filteredEquipment.map((item) => (
            <div
              key={item.key}
              className="group cursor-move rounded-lg border border-gray-200 p-3 transition-all hover:border-brand-400 hover:bg-brand-50 hover:shadow-md"
              draggable
              onDragStart={(event) => {
                setActionError(null)
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('application/json', JSON.stringify(item))
                event.dataTransfer.setData('text/plain', item.key)
              }}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 rounded-md bg-gray-100 p-2 transition group-hover:bg-white">
                  {getEquipmentIcon(item.device_type)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-gray-900">{item.name}</div>
                  <div className="truncate text-xs text-gray-600">{item.manufacturer}</div>
                  <div className="mt-1 inline-flex rounded border border-slate-300 bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                    {String(item.device_type || 'device').replace(/_/g, ' ')}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-500">
                    <span>{item.model}</span>
                    {item.ports?.length ? (
                      <span className="text-gray-400">• {item.ports.length} ports</span>
                    ) : null}
                  </div>
                </div>

                <button
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    void handleAddDeviceClick(item.key)
                  }}
                  disabled={!projectId}
                  className="shrink-0 rounded-md bg-brand-500 p-1.5 text-white opacity-0 transition hover:bg-brand-600 group-hover:opacity-100 disabled:cursor-not-allowed disabled:bg-gray-300"
                  title="Add device"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
