import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Node, Edge } from 'reactflow'
import { Plus, X } from 'lucide-react'
import { AxiosError } from 'axios'
import { projectsApi, devicesApi } from '@/shared/api/client'
import { useProjectStore, ValidationIssue, NodeGroup } from '@/shared/store/projectStore'
import { Canvas } from '@/widgets/Canvas'
import { EquipmentLibrary } from '@/widgets/EquipmentLibrary'
import { PropertiesPanel } from '@/widgets/PropertiesPanel'
import { ValidationPanel } from '@/widgets/ValidationPanel'
import { Toolbar } from '@/widgets/Toolbar'
import { Dashboard } from '@/widgets/Dashboard'
import { GroupPanel } from '@/widgets/GroupPanel'
import { KeyboardShortcuts } from '@/widgets/KeyboardShortcuts'
import { HelpPanel } from '@/widgets/HelpPanel'
import { OnboardingTutorial, useOnboardingState } from '@/widgets/OnboardingTutorial'
import { StatusBar } from '@/widgets/StatusBar'
import { emitToast } from '@/widgets/Toast'
import { applyUISettings, readUISettings } from '@/shared/uiSettings'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string, description: string) => void
  isSubmitting: boolean
  errorMessage?: string | null
}

interface EditorErrorBoundaryProps {
  children: React.ReactNode
  onReset: () => void
}

interface EditorErrorBoundaryState {
  error: Error | null
}

interface ExportedProjectPayload {
  version: '1.0'
  exportedAt: string
  projectId: string | null
  nodes: Node[]
  edges: Edge[]
  groups: NodeGroup[]
}

class EditorErrorBoundary extends React.Component<
  EditorErrorBoundaryProps,
  EditorErrorBoundaryState
> {
  state: EditorErrorBoundaryState = {
    error: null,
  }

  static getDerivedStateFromError(error: Error): EditorErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Editor view crashed:', error, errorInfo)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-50 px-4">
          <div className="max-w-2xl rounded-lg border border-red-200 bg-white p-6 shadow-sm">
            <div className="text-lg font-semibold text-slate-900">Editor crashed</div>
            <div className="mt-2 text-sm text-slate-600">
              {this.state.error.message || 'Unknown runtime error'}
            </div>
            <pre className="mt-4 overflow-auto rounded-md bg-slate-950 p-4 text-xs text-slate-100">
              {this.state.error.stack}
            </pre>
            <div className="mt-4 flex gap-3">
              <button
                onClick={this.props.onReset}
                className="rounded-md bg-brand-500 px-4 py-2 text-white transition hover:bg-brand-600"
              >
                Back to projects
              </button>
              <button
                onClick={() => window.location.reload()}
                className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 transition hover:bg-gray-300"
              >
                Reload page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function mapProjectToCanvas(project: any): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = (project.devices || []).map((device: any, index: number) => ({
    id: device.id,
    type: 'device',
    position: {
      x: 180 + (index % 4) * 250,
      y: 120 + Math.floor(index / 4) * 180,
    },
    data: {
      name: device.name,
      type: device.device_type,
      model: device.model,
      manufacturer: device.manufacturer,
      status: 'active',
      power_consumption_watts: device.power_consumption_watts,
      resolution: device.resolution,
      storage_capacity_gb: device.storage_capacity_gb,
      bandwidth_requires_mbps: device.bandwidth_requires_mbps,
      ports: (device.ports || []).map((port: any, portIndex: number) => ({
        id: port.id || `${device.id}-port-${portIndex}`,
        name: port.name,
        type: port.port_type || port.type,
        speed_mbps: port.speed_mbps,
        power_watts: port.power_watts,
      })),
    },
  }))

  const edges: Edge[] = (project.links || []).map((link: any) => ({
    id: link.id,
    source: link.from_device_id,
    target: link.to_device_id,
    sourceHandle: `out-${link.from_port_id}`,
    targetHandle: `in-${link.to_port_id}`,
    label:
      [link.cable_type, link.length_meters ? `${link.length_meters}m` : null]
        .filter(Boolean)
        .join(' • ') || undefined,
    data: {
      cable_type: link.cable_type,
      length_meters: link.length_meters,
      bandwidth_mbps: link.bandwidth_mbps,
    },
  }))

  return { nodes, edges }
}

function getValidationMessages(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.flatMap((item) => getValidationMessages(item))
  }
  if (typeof value === 'string') {
    return [value]
  }
  if (typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.message === 'string') {
      return [record.message]
    }
    if (typeof record.detail === 'string') {
      return [record.detail]
    }
  }
  return [String(value)]
}

function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const responseData = error.response?.data
    const detail = responseData?.detail
    const responseText =
      typeof responseData === 'string'
        ? responseData
        : typeof detail === 'string'
        ? detail
        : ''
    const normalizedText = responseText.toLowerCase()
    const backendUnavailableViaProxy =
      normalizedText.includes('econnrefused') ||
      normalizedText.includes('connect error') ||
      normalizedText.includes('proxy error') ||
      normalizedText.includes('failed to fetch') ||
      normalizedText.includes('target machine actively refused') ||
      normalizedText.includes('upstream')

    if (typeof detail === 'string' && detail.trim()) {
      if (backendUnavailableViaProxy) {
        return 'Backend API is unavailable. Start backend on http://127.0.0.1:8000 and retry.'
      }
      return detail
    }

    if (Array.isArray(detail)) {
      const formatted = detail
        .map((item: any) => item?.msg || item?.message || String(item))
        .filter(Boolean)
        .join('; ')
      if (formatted) return formatted
    }

    if (!error.response) {
      return 'Backend API is unavailable. Start backend on http://127.0.0.1:8000 and retry.'
    }

    if (backendUnavailableViaProxy) {
      return 'Backend API is unavailable. Start backend on http://127.0.0.1:8000 and retry.'
    }

    if (error.response.status >= 500) {
      return 'Server error while creating project. Check backend logs and retry.'
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Failed to create project.'
}

function buildLocalValidation(nodes: Node[], edges: Edge[]): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const nodeById = new Map(nodes.map((node) => [node.id, node]))

  if (nodes.length === 0) {
    issues.push({
      id: 'info-empty-project',
      type: 'info',
      message: 'Проект пуст. Добавьте хотя бы одно устройство на canvas.',
    })
  }

  edges.forEach((edge) => {
    const source = nodeById.get(edge.source)
    const target = nodeById.get(edge.target)

    if (!source) {
      issues.push({
        id: `edge-source-${edge.id}`,
        type: 'error',
        message: `Связь ${edge.id} ссылается на отсутствующий источник ${edge.source}.`,
        targetId: edge.id,
        targetType: 'edge',
      })
    }

    if (!target) {
      issues.push({
        id: `edge-target-${edge.id}`,
        type: 'error',
        message: `Связь ${edge.id} ссылается на отсутствующий приёмник ${edge.target}.`,
        targetId: edge.id,
        targetType: 'edge',
      })
    }

    const sourcePortExists = source?.data?.ports?.some(
      (port: any) => `out-${port.id}` === edge.sourceHandle
    )
    const targetPortExists = target?.data?.ports?.some(
      (port: any) => `in-${port.id}` === edge.targetHandle
    )

    if (source && edge.sourceHandle && !sourcePortExists) {
      issues.push({
        id: `missing-source-port-${edge.id}`,
        type: 'warning',
        message: `У устройства "${source.data?.name}" не найден порт ${edge.sourceHandle}.`,
        targetId: source.id,
        targetType: 'node',
      })
    }

    if (target && edge.targetHandle && !targetPortExists) {
      issues.push({
        id: `missing-target-port-${edge.id}`,
        type: 'warning',
        message: `У устройства "${target.data?.name}" не найден порт ${edge.targetHandle}.`,
        targetId: target.id,
        targetType: 'node',
      })
    }
  })

  nodes.forEach((node) => {
    const hasConnection = edges.some((edge) => edge.source === node.id || edge.target === node.id)
    if (!hasConnection) {
      issues.push({
        id: `isolated-${node.id}`,
        type: 'warning',
        message: `Устройство "${node.data?.name}" не подключено ни к одной связи.`,
        targetId: node.id,
        targetType: 'node',
      })
    }
  })

  return issues
}

function normalizeServerIssue(
  message: string,
  type: 'error' | 'warning',
  index: number,
  nodes: Node[],
  edges: Edge[]
): ValidationIssue {
  const targetNode = nodes.find((node) => message.includes(node.id) || message.includes(node.data?.name))
  const targetEdge = edges.find((edge) => message.includes(edge.id))

  return {
    id: `${type}-${index}`,
    type,
    message,
    targetId: targetNode?.id || targetEdge?.id,
    targetType: targetNode ? 'node' : targetEdge ? 'edge' : undefined,
    source: 'server',
  }
}

function buildRealtimeValidation(nodes: Node[], edges: Edge[]): ValidationIssue[] {
  return buildLocalValidation(nodes, edges).map((issue) => ({
    ...issue,
    source: 'local',
  }))
}

function CreateProjectModal({
  isOpen,
  onClose,
  onCreate,
  isSubmitting,
  errorMessage,
}: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (isOpen) return
    setName('')
    setDescription('')
  }, [isOpen])

  if (!isOpen) return null

  const handleSubmit = () => {
    if (name.trim() && !isSubmitting) {
      onCreate(name, description)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-96 rounded-lg bg-white p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">New Project</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Office Security"
              disabled={isSubmitting}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your security system..."
              rows={3}
              disabled={isSubmitting}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          {errorMessage && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {errorMessage}
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 transition hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !name.trim()}
              className="rounded-md bg-brand-500 px-4 py-2 text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PSSBuilder() {
  const [projects, setProjects] = useState<any[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createProjectError, setCreateProjectError] = useState<string | null>(null)
  const [equipmentCatalog, setEquipmentCatalog] = useState<Record<string, any>>({})
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const projectStore = useProjectStore()
  const onboarding = useOnboardingState()

  useEffect(() => {
    applyUISettings(readUISettings())
    const handleUISettingsChanged = (event: Event) => {
      const customEvent = event as CustomEvent
      if (customEvent.detail) {
        applyUISettings(customEvent.detail)
      }
    }
    window.addEventListener('psb-ui-settings-changed', handleUISettingsChanged)
    return () => window.removeEventListener('psb-ui-settings-changed', handleUISettingsChanged)
  }, [])

  useEffect(() => {
    const openHelp = () => setIsHelpOpen(true)
    const handleF1 = (event: KeyboardEvent) => {
      if (event.key !== 'F1') return
      event.preventDefault()
      setIsHelpOpen((current) => !current)
    }
    window.addEventListener('psb-toggle-help', openHelp)
    window.addEventListener('keydown', handleF1)
    return () => {
      window.removeEventListener('psb-toggle-help', openHelp)
      window.removeEventListener('keydown', handleF1)
    }
  }, [])

  useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await projectsApi.listProjects()
      setProjects(Array.isArray(res.data) ? res.data : [])
      return res.data
    },
  })

  useQuery({
    queryKey: ['equipment-catalog'],
    queryFn: async () => {
      try {
        const normalized = await devicesApi.getNormalizedEquipmentCatalog()
        const models = normalized.data?.equipment_models || []
        const catalogData = models.reduce((acc, model) => {
          acc[model.key] = {
            name: model.name,
            manufacturer: model.manufacturer,
            model: model.model,
            device_type: model.type_key,
            lifecycle_status: model.lifecycle_status,
            power_consumption_watts: model.power_consumption_watts,
            resolution: model.resolution,
            storage_capacity_gb: model.storage_capacity_gb,
            bandwidth_requires_mbps: model.bandwidth_requires_mbps,
            ports: model.ports || [],
          }
          return acc
        }, {} as Record<string, any>)
        setEquipmentCatalog(catalogData)
        return catalogData
      } catch (error) {
        console.warn('Normalized catalog failed, fallback to legacy:', error)
        const res = await devicesApi.getEquipmentCatalog()
        const catalogData = res.data || {}
        setEquipmentCatalog(catalogData)
        return catalogData
      }
    },
  })

  const projectQuery = useQuery({
    queryKey: ['project', projectStore.projectId],
    enabled: Boolean(projectStore.projectId),
    queryFn: async () => {
      const res = await projectsApi.getProject(projectStore.projectId!)
      const graph = mapProjectToCanvas(res.data)
      projectStore.setGraph(graph.nodes, graph.edges, {
        markDirty: false,
        pushHistory: false,
      })
      const serverValidation = res.data?.validation || {}
      const initialErrors = getValidationMessages(serverValidation.errors).map(
        (message: string, index: number) =>
          normalizeServerIssue(message, 'error', index, graph.nodes, graph.edges)
      )
      const initialWarnings = getValidationMessages(serverValidation.warnings).map(
        (message: string, index: number) =>
          normalizeServerIssue(message, 'warning', index, graph.nodes, graph.edges)
      )
      projectStore.setValidationErrors([
        ...initialErrors,
        ...initialWarnings,
        ...buildRealtimeValidation(graph.nodes, graph.edges),
      ])
      return res.data
    },
  })

  useEffect(() => {
    const realtimeIssues = buildRealtimeValidation(projectStore.nodes, projectStore.edges)
    const preservedServerIssues = projectStore.validationErrors.filter(
      (issue) => issue.source === 'server'
    )
    projectStore.setValidationErrors([...preservedServerIssues, ...realtimeIssues])
  }, [projectStore.edges, projectStore.nodes])

  const createProjectMutation = useMutation({
    mutationFn: (data: { name: string; description: string }) => projectsApi.createProject(data),
    onSuccess: (res) => {
      setCreateProjectError(null)
      projectStore.reset()
      projectStore.setGraph([], [], {
        markDirty: false,
        pushHistory: false,
      })
      projectStore.setValidationErrors([])
      projectStore.setProjectId(res.data.id)
      setProjects((current) => {
        const nextProject = {
          id: res.data.id,
          name: res.data.name,
          description: res.data.description || '',
          device_count: 0,
          link_count: 0,
        }
        const rest = current.filter((project) => project.id !== res.data.id)
        return [nextProject, ...rest]
      })
      setIsCreateModalOpen(false)
    },
    onError: (error) => {
      const message = getApiErrorMessage(error)
      setCreateProjectError(message)
      console.error('Project creation failed:', error)
      emitToast(message, 'error')
    },
  })

  const addDeviceMutation = useMutation({
    mutationFn: async ({
      projectId,
      equipmentKey,
    }: {
      projectId: string
      equipmentKey: string
    }) => {
      const result = await devicesApi.addDeviceFromTemplate(projectId, equipmentKey)
      const details = await devicesApi.getDevice(projectId, result.data.id)
      return details.data
    },
  })

  const validateMutation = useMutation({
    mutationFn: (projectId: string) => projectsApi.validateProject(projectId),
    onSuccess: (res) => {
      const serverErrors = getValidationMessages(res.data?.errors).map((message: string, index: number) =>
        normalizeServerIssue(message, 'error', index, projectStore.nodes, projectStore.edges)
      )
      const serverWarnings = getValidationMessages(res.data?.warnings).map((message: string, index: number) =>
        normalizeServerIssue(message, 'warning', index, projectStore.nodes, projectStore.edges)
      )
      const localIssues = buildRealtimeValidation(projectStore.nodes, projectStore.edges)
      projectStore.setValidationErrors([...serverErrors, ...serverWarnings, ...localIssues])
      emitToast(
        `Validation complete: ${serverErrors.length} errors, ${serverWarnings.length} warnings`,
        serverErrors.length > 0 ? 'warning' : 'success'
      )
      window.dispatchEvent(
        new CustomEvent('psb-status-action', { detail: { action: 'Validation complete' } })
      )
    },
    onError: (error) => {
      console.error('Project validation failed:', error)
      projectStore.setValidationErrors([
        {
          id: `validation-request-failed-${Date.now()}`,
          type: 'error',
          message:
            error instanceof Error
              ? error.message
              : 'Validation request failed. Check API availability.',
          source: 'server',
        },
        ...buildRealtimeValidation(projectStore.nodes, projectStore.edges),
      ])
      emitToast('Validation request failed', 'error')
      window.dispatchEvent(
        new CustomEvent('psb-status-action', { detail: { action: 'Validation failed' } })
      )
    },
  })

  const handleCreateProject = (name: string, description: string) => {
    setCreateProjectError(null)
    createProjectMutation.mutate({ name, description })
  }

  const handleAddDevice = useCallback(
    async (equipmentKey: string, position?: { x: number; y: number }) => {
      if (!projectStore.projectId) {
        window.alert('Сначала создайте или откройте проект.')
        return
      }

      const equipment = equipmentCatalog[equipmentKey] || {}

      try {
        const createdDevice = await addDeviceMutation.mutateAsync({
          projectId: projectStore.projectId,
          equipmentKey,
        })

        const newNode: Node = {
          id: createdDevice.id,
          type: 'device',
          position: position || {
            x: 200 + (projectStore.nodes.length % 4) * 240,
            y: 160 + Math.floor(projectStore.nodes.length / 4) * 170,
          },
          data: {
            name: createdDevice.name || equipment.name || `${equipmentKey} ${projectStore.nodes.length + 1}`,
            type: createdDevice.device_type || equipment.device_type || equipmentKey,
            model: createdDevice.model || equipment.model || 'Unknown',
            status: 'active',
            manufacturer: createdDevice.manufacturer || equipment.manufacturer,
            power_consumption_watts:
              createdDevice.power_consumption_watts || equipment.power_consumption_watts,
            resolution: createdDevice.resolution || equipment.resolution,
            storage_capacity_gb:
              createdDevice.storage_capacity_gb || equipment.storage_capacity_gb,
            bandwidth_requires_mbps:
              createdDevice.bandwidth_requires_mbps || equipment.bandwidth_requires_mbps,
            ports: (createdDevice.ports || equipment.ports || []).map((port: any, index: number) => ({
              id: port.id || `${createdDevice.id}-port-${index}`,
              name: port.name,
              type: port.port_type || port.type,
              speed_mbps: port.speed_mbps,
              power_watts: port.power_watts,
            })),
          },
        }

        projectStore.setNodes([...projectStore.nodes, newNode])
        emitToast('Device added to canvas', 'success')
      } catch (error) {
        console.error('Failed to add device:', error)
        emitToast('Failed to add device', 'error')
        window.alert('Не удалось добавить устройство. Проверьте консоль и состояние API.')
      }
    },
    [addDeviceMutation, equipmentCatalog, projectStore]
  )

  const handleValidate = () => {
    if (projectStore.projectId) {
      window.dispatchEvent(
        new CustomEvent('psb-status-action', { detail: { action: 'Running validation' } })
      )
      validateMutation.mutate(projectStore.projectId)
    }
  }

  const handleExportProject = useCallback(() => {
    const payload: ExportedProjectPayload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      projectId: projectStore.projectId,
      nodes: projectStore.nodes,
      edges: projectStore.edges,
      groups: projectStore.groups,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    link.href = url
    link.download = `pss-project-${date}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    emitToast('Project exported', 'success')
  }, [projectStore.edges, projectStore.groups, projectStore.nodes, projectStore.projectId])

  const handleImportProject = useCallback(
    async (file: File) => {
      try {
        const raw = await file.text()
        const parsed = JSON.parse(raw) as Partial<ExportedProjectPayload>
        if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
          throw new Error('Invalid file: nodes/edges are missing.')
        }

        const importedNodes = parsed.nodes as Node[]
        const importedEdges = parsed.edges as Edge[]
        const importedGroups = Array.isArray(parsed.groups) ? (parsed.groups as NodeGroup[]) : []

        projectStore.setGraph(importedNodes, importedEdges, {
          markDirty: true,
          pushHistory: true,
        })
        projectStore.setGroups(importedGroups)
        projectStore.setSelectedNodeId(null)
        projectStore.setSelectedEdgeId(null)
        emitToast('Project imported', 'success')
        window.dispatchEvent(
          new CustomEvent('psb-status-action', { detail: { action: 'Project imported' } })
        )
      } catch (error) {
        console.error('Failed to import project JSON:', error)
        emitToast('Import failed: invalid JSON', 'error')
      }
    },
    [projectStore]
  )

  const handleSelectValidationIssue = (id: string) => {
    const issue = projectStore.validationErrors.find((item) => item.id === id)
    if (!issue?.targetId) return

    if (issue.targetType === 'edge') {
      projectStore.setSelectedEdgeId(issue.targetId)
      projectStore.setSelectedNodeId(null)
      return
    }

    projectStore.setSelectedNodeId(issue.targetId)
    projectStore.setSelectedEdgeId(null)
  }

  const selectedNodeIds = useMemo(
    () => projectStore.nodes.filter((node) => node.selected).map((node) => node.id),
    [projectStore.nodes]
  )

  const handleCreateGroup = useCallback(() => {
    if (selectedNodeIds.length === 0) return
    projectStore.createGroup(selectedNodeIds)
  }, [projectStore, selectedNodeIds])

  const handleSelectGroup = useCallback(
    (groupId: string | null) => {
      projectStore.setSelectedZone(groupId)
      if (!groupId) return

      const group = projectStore.groups.find((item) => item.id === groupId)
      if (!group) return

      projectStore.setNodes(
        projectStore.nodes.map((node) => ({
          ...node,
          selected: group.nodeIds.includes(node.id),
        })),
        { markDirty: false, pushHistory: false }
      )
      projectStore.setSelectedNodeId(group.nodeIds[0] || null)
      projectStore.setSelectedEdgeId(null)
    },
    [projectStore]
  )

  if (!projectStore.projectId) {
    const overviewStats = [
      { label: 'Equipment models', value: String(Object.keys(equipmentCatalog).length || 0) },
      { label: 'Saved projects', value: String(projects.length) },
      { label: 'Workspace mode', value: 'Visual builder' },
    ]

    const overviewHighlights = [
      {
        title: 'Visual topology editor',
        description: 'Build CCTV and security system layouts on canvas with nodes, links and grouped zones.',
      },
      {
        title: 'Equipment-aware modeling',
        description: 'Add devices from the catalog with ports, bandwidth, storage and power metadata.',
      },
      {
        title: 'Validation workflow',
        description: 'Check structure quality, detect isolated devices and review connection problems early.',
      },
    ]
    return (
      <>
        <div className="pss-app-shell min-h-screen w-full">
          <div className="pss-topbar p-6 text-white">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold">PSS Builder</h1>
                <p className="text-slate-200">Security Systems Architecture Constructor</p>
              </div>
              <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-slate-100 backdrop-blur">
                Overview mode
              </div>
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[minmax(0,1.3fr)_24rem]">
            <section className="pss-overview space-y-8 rounded-[28px] border border-white/50 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
              <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
                <div className="space-y-5">
                  <div className="inline-flex items-center rounded-full border border-sky-200/80 bg-sky-50 px-4 py-1 text-sm font-medium text-sky-800">
                    Project overview
                  </div>
                  <div className="space-y-4">
                    <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-slate-950">
                      Design, validate and review physical security systems in one workspace.
                    </h2>
                    <p className="max-w-2xl text-base leading-7 text-slate-600">
                      The builder combines equipment catalog data, topology editing and validation so
                      you can move from concept to structured project faster.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3">
                  {overviewStats.map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-slate-200/80 bg-white/85 p-4 backdrop-blur"
                    >
                      <div className="text-xs uppercase tracking-[0.18em] text-slate-500">
                        {item.label}
                      </div>
                      <div className="mt-2 text-2xl font-semibold text-slate-950">{item.value}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {overviewHighlights.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-3xl border border-slate-200/80 bg-white/78 p-5"
                  >
                    <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{item.description}</p>
                  </article>
                ))}
              </div>

              <div className="grid gap-4 rounded-3xl border border-slate-200/10 bg-slate-950 p-6 text-slate-50 md:grid-cols-3">
                <div>
                  <div className="text-sm uppercase tracking-[0.18em] text-slate-400">Step 1</div>
                  <div className="mt-2 text-lg font-semibold">Create a project</div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Start a new system scheme with project metadata and a clean canvas.
                  </p>
                </div>
                <div>
                  <div className="text-sm uppercase tracking-[0.18em] text-slate-400">Step 2</div>
                  <div className="mt-2 text-lg font-semibold">Assemble topology</div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Add devices from the library, connect ports and organize logical groups.
                  </p>
                </div>
                <div>
                  <div className="text-sm uppercase tracking-[0.18em] text-slate-400">Step 3</div>
                  <div className="mt-2 text-lg font-semibold">Run validation</div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Review warnings and errors before exporting or continuing project work.
                  </p>
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <div className="pss-panel rounded-[24px] p-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Get Started</h2>
                  <p className="mt-2 text-sm leading-6 text-gray-600">
                    Create a new project or continue from an existing one.
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    disabled={createProjectMutation.isPending}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-3 text-white disabled:opacity-50"
                    style={{ backgroundColor: 'var(--ui-accent)' }}
                  >
                    <Plus className="h-5 w-5" />
                    New Project
                  </button>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Use the overview on the left as a quick introduction to the workspace.
                  </div>
                </div>
              </div>

              {projects.length > 0 && (
                <div className="pss-panel rounded-[24px] p-6">
                  <h3 className="mb-4 font-semibold text-gray-900">Recent Projects</h3>
                  <div className="space-y-2">
                      {projects.map((project) => (
                        <button
                          key={project.id}
                          onClick={() => projectStore.setProjectId(project.id)}
                          className="w-full rounded-2xl border border-gray-300 p-3 text-left transition-colors hover:border-brand-500 hover:bg-brand-50"
                        >
                          <div className="font-medium text-gray-900">{project.name}</div>
                          <div className="text-sm text-gray-600">
                            {project.device_count} devices • {project.link_count} links
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
            </aside>
          </div>
        </div>

        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setCreateProjectError(null)
            setIsCreateModalOpen(false)
          }}
          onCreate={handleCreateProject}
          isSubmitting={createProjectMutation.isPending}
          errorMessage={createProjectError}
        />
      </>
    )
  }

  if (projectQuery.isPending) {
    return (
      <div className="pss-app-shell flex h-screen w-full items-center justify-center">
        <div className="pss-panel px-6 py-5 text-center">
          <div className="text-lg font-semibold text-slate-900">Loading project...</div>
          <div className="mt-1 text-sm text-slate-600">
            Project is being opened after creation.
          </div>
        </div>
      </div>
    )
  }

  if (projectQuery.isError) {
    return (
      <div className="pss-app-shell flex h-screen w-full items-center justify-center px-4">
        <div className="max-w-md rounded-lg border border-red-200 bg-white p-6 text-center shadow-sm">
          <div className="text-lg font-semibold text-slate-900">Project failed to load</div>
          <div className="mt-2 text-sm text-slate-600">
            {projectQuery.error instanceof Error
              ? projectQuery.error.message
              : 'Unknown error while opening the project.'}
          </div>
          <div className="mt-4 flex justify-center gap-3">
            <button
              onClick={() => projectQuery.refetch()}
              className="rounded-md bg-brand-500 px-4 py-2 text-white transition hover:bg-brand-600"
            >
              Retry
            </button>
            <button
              onClick={() => projectStore.setProjectId(null)}
              className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 transition hover:bg-gray-300"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <EditorErrorBoundary onReset={() => projectStore.setProjectId(null)}>
      <>
        <div className="pss-app-shell flex h-screen w-full flex-col">
        <Toolbar
          projectId={projectStore.projectId}
          onValidate={handleValidate}
          isDirty={projectStore.isDirty}
          onExportProject={handleExportProject}
          onImportProject={handleImportProject}
        />

        <div className="grid flex-1 grid-cols-[18rem_minmax(0,1fr)_20rem] gap-4 overflow-hidden p-4">
          <div className="pss-panel flex flex-col overflow-hidden">
            <EquipmentLibrary projectId={projectStore.projectId} onAddDevice={handleAddDevice} />
          </div>

          <div className="grid min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden">
            <Dashboard nodes={projectStore.nodes} validationIssues={projectStore.validationErrors} />

            <div className="pss-panel min-w-0 overflow-hidden">
              <Canvas
                initialNodes={projectStore.nodes}
                initialEdges={projectStore.edges}
                onNodesChange={(nodes) => projectStore.setNodes(nodes)}
                onEdgesChange={(edges) => projectStore.setEdges(edges)}
                onAddDeviceAtPosition={handleAddDevice}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4 overflow-hidden">
            <div className="pss-panel min-h-0 flex-1 overflow-hidden">
              <PropertiesPanel
                selectedNodeId={projectStore.selectedNodeId}
                selectedEdgeId={projectStore.selectedEdgeId}
                nodes={projectStore.nodes}
                edges={projectStore.edges}
                onUpdateNode={(id, updates) => projectStore.updateNode(id, updates)}
              />
            </div>

            <div className="pss-panel min-h-0 flex-1 overflow-hidden">
              <ValidationPanel
                errors={projectStore.validationErrors}
                onSelectError={handleSelectValidationIssue}
                isValidating={validateMutation.isPending}
              />
            </div>

            <div className="pss-panel min-h-0 flex-1 overflow-hidden">
              <GroupPanel
                groups={projectStore.groups}
                nodes={projectStore.nodes}
                selectedNodeIds={selectedNodeIds}
                selectedGroupId={projectStore.selectedZone}
                onCreateGroup={handleCreateGroup}
                onToggleHidden={projectStore.toggleGroupHidden}
                onToggleCollapsed={projectStore.toggleGroupCollapsed}
                onRenameGroup={projectStore.renameGroup}
                onDeleteGroup={projectStore.deleteGroup}
                onSelectGroup={handleSelectGroup}
              />
            </div>
          </div>
        </div>
        <StatusBar
          selectedNodeId={projectStore.selectedNodeId}
          selectedEdgeId={projectStore.selectedEdgeId}
        />
        </div>

        <KeyboardShortcuts />
        <HelpPanel isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        <OnboardingTutorial isOpen={onboarding.isOpen} onClose={onboarding.close} />

        <CreateProjectModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setCreateProjectError(null)
            setIsCreateModalOpen(false)
          }}
          onCreate={handleCreateProject}
          isSubmitting={createProjectMutation.isPending}
          errorMessage={createProjectError}
        />
      </>
    </EditorErrorBoundary>
  )
}
