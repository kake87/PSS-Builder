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
import { SpecificationPanel } from '@/widgets/SpecificationPanel'

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

interface ImportReport {
  fileName: string
  importedVersion: string
  migratedFromVersion?: string
  importedNodes: number
  importedEdges: number
  importedGroups: number
  warnings: string[]
}

type WorkspaceView = 'design' | 'catalog' | 'specification'

interface DeviceInterfaceData {
  id: string
  label: string
  kind: string
  role?: 'primary' | 'secondary' | 'advanced'
  direction?: 'input' | 'output' | 'bidirectional'
  connection_mode?: 'combined' | 'data' | 'power'
  visible_by_default?: boolean
  capacity?: {
    speed_mbps?: number
    power_watts?: number
    port_count?: number
    poe_budget_watts?: number
  }
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
      interfaces: Array.isArray(device.interfaces) && device.interfaces.length > 0
        ? device.interfaces
        : deriveInterfacesFromPorts(device.ports || [], {
            deviceType: device.type || device.device_type,
            name: device.name,
            model: device.model,
            key: device.id || device.key,
            powerConsumptionWatts: device.power_consumption_watts,
          }),
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
    const sourceInterfaceExists = source?.data?.interfaces?.some(
      (item: any) => `out-${item.id}` === edge.sourceHandle
    ) || String(edge.sourceHandle || '').startsWith('out-group-')
    const targetInterfaceExists = target?.data?.interfaces?.some(
      (item: any) => `in-${item.id}` === edge.targetHandle
    ) || String(edge.targetHandle || '').startsWith('in-group-')

    if (source && edge.sourceHandle && !sourcePortExists && !sourceInterfaceExists) {
      issues.push({
        id: `missing-source-port-${edge.id}`,
        type: 'warning',
        message: `У устройства "${source.data?.name}" не найден порт ${edge.sourceHandle}.`,
        targetId: source.id,
        targetType: 'node',
      })
    }

    if (target && edge.targetHandle && !targetPortExists && !targetInterfaceExists) {
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

    const interfaces = Array.isArray(node.data?.interfaces) ? node.data.interfaces : []
    const groupedByKind = interfaces.reduce((acc: Record<string, any[]>, item: any) => {
      const key = String(item?.kind || 'unknown')
      acc[key] = acc[key] || []
      acc[key].push(item)
      return acc
    }, {})

    Object.entries(groupedByKind).forEach(([kind, items]) => {
      const capacity = items.length
      if (capacity <= 0) return

      const groupEdges = edges.filter((edge) => {
        const sourceHandle = String(edge.sourceHandle || '')
        const targetHandle = String(edge.targetHandle || '')
        return (
          items.some(
            (item: any) =>
              sourceHandle === `out-${item.id}` || targetHandle === `in-${item.id}`
          ) ||
          sourceHandle === `out-group-${kind}` ||
          targetHandle === `in-group-${kind}`
        )
      })
      const occupied = groupEdges.length

      if (occupied > capacity) {
        issues.push({
          id: `capacity-${node.id}-${kind}`,
          type: 'error',
          message: `Interface group "${kind}" on "${node.data?.name}" is over capacity (${occupied}/${capacity}).`,
          targetId: node.id,
          targetType: 'node',
        })
      }

      const poeBudget = items.reduce(
        (sum: number, item: any) => sum + Number(item?.capacity?.poe_budget_watts || 0),
        0
      )
      if (kind === 'poe_ethernet' && poeBudget > 0) {
        const poeDraw = groupEdges.reduce((sum, edge) => {
          const peerNodeId = edge.source === node.id ? edge.target : edge.source
          const peerNode = nodes.find((candidate) => candidate.id === peerNodeId)
          return sum + Number(peerNode?.data?.power_consumption_watts || 0)
        }, 0)

        if (poeDraw > poeBudget) {
          issues.push({
            id: `poe-budget-${node.id}-${kind}`,
            type: 'error',
            message: `PoE budget on "${node.data?.name}" is exceeded (${poeDraw.toFixed(1)}W/${poeBudget.toFixed(1)}W).`,
            targetId: node.id,
            targetType: 'node',
          })
        }
      }
    })
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

function deriveInterfacesFromPorts(
  ports: any[] = [],
  options?: {
    deviceType?: string
    name?: string
    model?: string
    key?: string
    powerConsumptionWatts?: number
  }
): DeviceInterfaceData[] {
  const poeHint = [
    options?.deviceType,
    options?.name,
    options?.model,
    options?.key,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  const inferredPoeSwitch = String(options?.deviceType || '').toLowerCase() === 'switch' && poeHint.includes('poe')
  const hasPoeLikeInterface =
    inferredPoeSwitch ||
    ports.some((port) => String(port?.port_type || port?.type || '').toLowerCase().includes('poe'))
  return ports.map((port, index) => {
    const portType = String(port?.port_type || port?.type || '').toLowerCase()
    let kind = 'ethernet'
    let label = port?.name || `Port ${index + 1}`
    let role: DeviceInterfaceData['role'] = 'secondary'
    let connectionMode: DeviceInterfaceData['connection_mode'] = 'data'
    let poeBudgetWatts = port?.power_watts

    if (portType.includes('poe') || (inferredPoeSwitch && portType.includes('ethernet'))) {
      kind = 'poe_ethernet'
      label = inferredPoeSwitch ? 'PoE Access' : 'PoE / LAN'
      role = 'primary'
      connectionMode = 'combined'
      poeBudgetWatts =
        port?.power_watts ??
        (inferredPoeSwitch && options?.powerConsumptionWatts
          ? options.powerConsumptionWatts / Math.max(ports.length, 1)
          : undefined)
    } else if (portType.includes('ethernet') || portType.includes('network') || portType.includes('rj45')) {
      kind = 'ethernet'
      label = index === 0 ? 'LAN' : label
      role = index === 0 ? 'primary' : 'secondary'
    } else if (portType.includes('power')) {
      kind = 'power_input'
      label = 'Power In'
      role = 'secondary'
      connectionMode = 'power'
    } else if (portType.includes('fiber') || portType.includes('optical') || portType.includes('sfp')) {
      kind = 'fiber'
      label = 'Fiber'
      role = 'primary'
    } else if (portType.includes('serial')) {
      kind = 'serial'
      role = 'advanced'
    }

    return {
      id: String(port?.id || `if-${index}`),
      label,
      kind,
      role,
      connection_mode: connectionMode,
      direction: 'bidirectional',
      visible_by_default: role !== 'advanced' && !(hasPoeLikeInterface && kind === 'power_input'),
      capacity: {
        speed_mbps: port?.speed_mbps,
        power_watts: port?.power_watts,
        poe_budget_watts: kind === 'poe_ethernet' ? poeBudgetWatts : undefined,
      },
    }
  })
}

function normalizeImportedNode(rawNode: any, index: number): Node {
  const fallbackId = `imported-node-${index + 1}`
  const rawPorts = Array.isArray(rawNode?.data?.ports) ? rawNode.data.ports : []

  return {
    id: String(rawNode?.id || fallbackId),
    type: rawNode?.type || 'device',
    position: {
      x: Number(rawNode?.position?.x ?? 0),
      y: Number(rawNode?.position?.y ?? 0),
    },
    data: {
      ...(rawNode?.data || {}),
      name: String(rawNode?.data?.name || rawNode?.label || `Imported device ${index + 1}`),
      type: String(rawNode?.data?.type || rawNode?.device_type || 'device'),
      model: String(rawNode?.data?.model || rawNode?.model || 'Unknown'),
      ports: rawPorts.map((port: any, portIndex: number) => ({
        ...port,
        id: String(port?.id || `${rawNode?.id || fallbackId}-port-${portIndex}`),
        name: String(port?.name || `Port ${portIndex + 1}`),
        type: port?.type || port?.port_type || 'unknown',
      })),
    },
  } as Node
}

function normalizeImportedEdge(rawEdge: any, index: number): Edge {
  return {
    id: String(rawEdge?.id || `imported-edge-${index + 1}`),
    source: String(rawEdge?.source || rawEdge?.from_device_id || ''),
    target: String(rawEdge?.target || rawEdge?.to_device_id || ''),
    sourceHandle:
      rawEdge?.sourceHandle ||
      (rawEdge?.from_port_id ? `out-${rawEdge.from_port_id}` : undefined),
    targetHandle:
      rawEdge?.targetHandle ||
      (rawEdge?.to_port_id ? `in-${rawEdge.to_port_id}` : undefined),
    label: rawEdge?.label,
    data: rawEdge?.data || {
      cable_type: rawEdge?.cable_type,
      length_meters: rawEdge?.length_meters,
      bandwidth_mbps: rawEdge?.bandwidth_mbps,
    },
  } as Edge
}

function normalizeImportedGroup(rawGroup: any, index: number): NodeGroup {
  return {
    id: String(rawGroup?.id || `group-${Date.now()}-${index}`),
    name: String(rawGroup?.name || `Group ${index + 1}`),
    nodeIds: Array.isArray(rawGroup?.nodeIds) ? rawGroup.nodeIds.map(String) : [],
    hidden: Boolean(rawGroup?.hidden),
    collapsed: Boolean(rawGroup?.collapsed),
  }
}

function migrateAndValidateImportPayload(raw: unknown): {
  payload: ExportedProjectPayload
  report: ImportReport
} {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Import file must contain a JSON object.')
  }

  const parsed = raw as Record<string, any>
  const warnings: string[] = []
  const importedVersion = String(parsed.version || 'legacy')

  let migratedFromVersion: string | undefined
  if (!parsed.version || parsed.version !== '1.0') {
    migratedFromVersion = importedVersion
    warnings.push(`Project file version "${importedVersion}" was migrated to 1.0.`)
  }

  if (!Array.isArray(parsed.nodes)) {
    throw new Error('Import failed: "nodes" array is missing.')
  }
  if (!Array.isArray(parsed.edges)) {
    throw new Error('Import failed: "edges" array is missing.')
  }

  const nodes = parsed.nodes.map(normalizeImportedNode)
  const edges = parsed.edges.map(normalizeImportedEdge)
  const groups = Array.isArray(parsed.groups) ? parsed.groups.map(normalizeImportedGroup) : []
  if (!Array.isArray(parsed.groups)) {
    warnings.push('Groups were missing and were replaced with an empty list.')
  }

  const nodeIds = new Set<string>()
  nodes.forEach((node, index) => {
    if (nodeIds.has(node.id)) {
      throw new Error(`Import failed: duplicate node id "${node.id}" at item ${index + 1}.`)
    }
    nodeIds.add(node.id)
  })

  const edgeIds = new Set<string>()
  edges.forEach((edge, index) => {
    if (!edge.source || !edge.target) {
      throw new Error(`Import failed: edge ${edge.id || index + 1} has no source or target.`)
    }
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      throw new Error(
        `Import failed: edge "${edge.id}" references missing node "${edge.source}" or "${edge.target}".`
      )
    }
    if (edgeIds.has(edge.id)) {
      throw new Error(`Import failed: duplicate edge id "${edge.id}" at item ${index + 1}.`)
    }
    edgeIds.add(edge.id)
  })

  const sanitizedGroups = groups
    .map((group) => ({
      ...group,
      nodeIds: group.nodeIds.filter((id) => nodeIds.has(id)),
    }))
    .filter((group) => group.nodeIds.length > 0)

  if (groups.length !== sanitizedGroups.length) {
    warnings.push('Some groups referenced missing nodes and were removed during import.')
  }

  return {
    payload: {
      version: '1.0',
      exportedAt: String(parsed.exportedAt || new Date().toISOString()),
      projectId: parsed.projectId ? String(parsed.projectId) : null,
      nodes,
      edges,
      groups: sanitizedGroups,
    },
    report: {
      fileName: '',
      importedVersion: '1.0',
      migratedFromVersion,
      importedNodes: nodes.length,
      importedEdges: edges.length,
      importedGroups: sanitizedGroups.length,
      warnings,
    },
  }
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

function ImportReportModal({
  report,
  onClose,
}: {
  report: ImportReport | null
  onClose: () => void
}) {
  if (!report) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Import Report</h2>
            <p className="mt-1 text-sm text-slate-600">{report.fileName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 transition hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-slate-100 px-3 py-3">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Nodes</div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{report.importedNodes}</div>
          </div>
          <div className="rounded-lg bg-slate-100 px-3 py-3">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Edges</div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{report.importedEdges}</div>
          </div>
          <div className="rounded-lg bg-slate-100 px-3 py-3">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Groups</div>
            <div className="mt-1 text-xl font-semibold text-slate-900">{report.importedGroups}</div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Imported as version <span className="font-semibold">{report.importedVersion}</span>
          {report.migratedFromVersion ? (
            <span> from <span className="font-semibold">{report.migratedFromVersion}</span>.</span>
          ) : (
            '.'
          )}
        </div>

        <div className="mt-4">
          <div className="text-sm font-semibold text-slate-900">Warnings</div>
          {report.warnings.length === 0 ? (
            <div className="mt-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              No warnings. Import completed cleanly.
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              {report.warnings.map((warning) => (
                <div
                  key={warning}
                  className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
                >
                  {warning}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-brand-500 px-4 py-2 text-white transition hover:bg-brand-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export function PSSBuilder() {
  const [projects, setProjects] = useState<any[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createProjectError, setCreateProjectError] = useState<string | null>(null)
  const [importReport, setImportReport] = useState<ImportReport | null>(null)
  const [workspaceView, setWorkspaceView] = useState<WorkspaceView>('design')
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
            interfaces:
              Array.isArray(createdDevice.interfaces) && createdDevice.interfaces.length > 0
                ? createdDevice.interfaces
                : deriveInterfacesFromPorts(createdDevice.ports || equipment.ports || [], {
                    deviceType: createdDevice.type || createdDevice.device_type || equipment.type_key,
                    name: createdDevice.name || equipment.name,
                    model: createdDevice.model || equipment.model,
                    key: createdDevice.key || equipment.key,
                    powerConsumptionWatts:
                      createdDevice.power_consumption_watts || equipment.power_consumption_watts,
                  }),
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

  const handleFitToContent = useCallback(() => {
    window.dispatchEvent(new CustomEvent('psb-fit-canvas'))
  }, [])

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
        const parsed = JSON.parse(raw)
        const migrated = migrateAndValidateImportPayload(parsed)
        const importedNodes = migrated.payload.nodes
        const importedEdges = migrated.payload.edges
        const importedGroups = migrated.payload.groups

        projectStore.setGraph(importedNodes, importedEdges, {
          markDirty: true,
          pushHistory: true,
        })
        projectStore.setGroups(importedGroups)
        projectStore.setSelectedNodeId(null)
        projectStore.setSelectedEdgeId(null)
        setImportReport({
          ...migrated.report,
          fileName: file.name,
        })
        emitToast(
          migrated.report.warnings.length > 0
            ? `Project imported with ${migrated.report.warnings.length} warning(s)`
            : 'Project imported',
          migrated.report.warnings.length > 0 ? 'warning' : 'success'
        )
        window.dispatchEvent(
          new CustomEvent('psb-status-action', { detail: { action: 'Project imported' } })
        )
      } catch (error) {
        console.error('Failed to import project JSON:', error)
        emitToast(
          error instanceof Error ? error.message : 'Import failed: invalid project file.',
          'error'
        )
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

  const activeProject = useMemo(
    () => projects.find((project) => project.id === projectStore.projectId) || null,
    [projectStore.projectId, projects]
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
          onFitToContent={handleFitToContent}
        />

        <div className="border-b border-slate-200/80 px-4 pt-4">
          <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4">
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'design', label: 'Design', description: 'Canvas, properties, validation' },
                { key: 'catalog', label: 'Catalog', description: 'Browse and place equipment' },
                { key: 'specification', label: 'Specification', description: 'BOM and export' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setWorkspaceView(tab.key as WorkspaceView)}
                  className={`rounded-2xl px-4 py-3 text-left transition ${
                    workspaceView === tab.key
                      ? 'bg-slate-950 text-white shadow-lg'
                      : 'bg-white/80 text-slate-700 ring-1 ring-slate-200 hover:bg-white'
                  }`}
                >
                  <div className="text-sm font-semibold">{tab.label}</div>
                  <div
                    className={`mt-1 text-xs ${
                      workspaceView === tab.key ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {tab.description}
                  </div>
                </button>
              ))}
            </div>

            <div className="hidden rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-600 ring-1 ring-slate-200 lg:block">
              {activeProject?.name || 'Current project'}: {projectStore.nodes.length} devices,{' '}
              {projectStore.edges.length} links
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-4">
          {workspaceView === 'design' && (
            <div className="grid h-full grid-cols-[22rem_minmax(0,1fr)_20rem] gap-4 overflow-hidden">
              <div className="pss-panel flex min-h-0 flex-col overflow-hidden">
                <EquipmentLibrary
                  projectId={projectStore.projectId}
                  onAddDevice={handleAddDevice}
                  mode="picker"
                />
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
          )}

          {workspaceView === 'catalog' && (
            <div className="grid h-full grid-cols-[25rem_minmax(0,1fr)] gap-4 overflow-hidden">
              <div className="pss-panel flex min-h-0 flex-col overflow-hidden">
                <EquipmentLibrary
                  projectId={projectStore.projectId}
                  onAddDevice={handleAddDevice}
                  mode="catalog"
                />
              </div>

              <div className="grid min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-4 overflow-hidden">
                <div className="pss-panel rounded-[24px] px-6 py-5">
                  <div className="text-sm font-semibold text-slate-900">Catalog Placement Workspace</div>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    Browse models in a dedicated catalog view, then drag them into the canvas or add them directly. This keeps equipment selection separate from detailed validation and properties work.
                  </p>
                </div>

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
            </div>
          )}

          {workspaceView === 'specification' && (
            <SpecificationPanel
              nodes={projectStore.nodes}
              projectName={activeProject?.name || 'pss-project'}
            />
          )}
        </div>
        <StatusBar
          selectedNodeId={projectStore.selectedNodeId}
          selectedEdgeId={projectStore.selectedEdgeId}
        />
        </div>

        <KeyboardShortcuts />
        <HelpPanel isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
        <OnboardingTutorial isOpen={onboarding.isOpen} onClose={onboarding.close} />
        <ImportReportModal report={importReport} onClose={() => setImportReport(null)} />

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
