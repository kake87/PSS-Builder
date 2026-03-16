import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactFlow, {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Connection,
  ConnectionLineType,
  Edge,
  MarkerType,
  Node,
  NodeChange,
  EdgeChange,
  NodeTypes,
  OnSelectionChangeParams,
  ReactFlowProvider,
  ReactFlowInstance,
  Viewport,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { DeviceNode } from '@/widgets/DeviceNode'
import { ContextMenu } from '@/widgets/ContextMenu'
import { useProjectStore } from '@/shared/store/projectStore'
import { emitToast } from '@/widgets/Toast'

const nodeTypes: NodeTypes = {
  device: DeviceNode,
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

interface StoredViewport extends Viewport {
  updatedAt: string
}

interface CanvasProps {
  initialNodes: Node[]
  initialEdges: Edge[]
  onNodesChange: (nodes: Node[]) => void
  onEdgesChange: (edges: Edge[]) => void
  onAddDeviceAtPosition: (
    equipmentKey: string,
    position?: { x: number; y: number }
  ) => Promise<void> | void
}

interface SelectionSnapshot {
  nodeIds: string[]
  edgeIds: string[]
}

interface ClipboardPayload {
  nodes: Node[]
  edges: Edge[]
}

type PortFamily = 'ethernet' | 'fiber' | 'serial' | 'power' | 'unknown'

interface CablePreset {
  id: string
  label: string
  cableType: string
  defaultLength: number
  bandwidthMbps: number
  compatibleFamilies: PortFamily[]
}

interface PendingConnection {
  connection: Connection
  sourcePortType?: string
  targetPortType?: string
  sourceFamily: PortFamily
  targetFamily: PortFamily
}

interface ConnectionFeedback {
  level: 'warning' | 'error'
  message: string
}

const CABLE_PRESETS: CablePreset[] = [
  {
    id: 'cat5e',
    label: 'CAT5e',
    cableType: 'CAT5e',
    defaultLength: 5,
    bandwidthMbps: 100,
    compatibleFamilies: ['ethernet', 'unknown'],
  },
  {
    id: 'cat6',
    label: 'CAT6',
    cableType: 'CAT6',
    defaultLength: 5,
    bandwidthMbps: 1000,
    compatibleFamilies: ['ethernet', 'unknown'],
  },
  {
    id: 'optical',
    label: 'Optical',
    cableType: 'OPTICAL',
    defaultLength: 20,
    bandwidthMbps: 10000,
    compatibleFamilies: ['fiber', 'unknown'],
  },
  {
    id: 'serial',
    label: 'Serial',
    cableType: 'SERIAL',
    defaultLength: 5,
    bandwidthMbps: 115,
    compatibleFamilies: ['serial', 'unknown'],
  },
  {
    id: 'power',
    label: 'Power',
    cableType: 'POWER',
    defaultLength: 3,
    bandwidthMbps: 0,
    compatibleFamilies: ['power', 'unknown'],
  },
]

function getViewportStorageKey(projectId: string): string {
  return `psb-viewport:${projectId}`
}

function getSelectionSnapshot(nodes: Node[], edges: Edge[], selectedNodeId: string | null, selectedEdgeId: string | null): SelectionSnapshot {
  const nodeIds = nodes.filter((node) => node.selected).map((node) => node.id)
  const edgeIds = edges.filter((edge) => edge.selected).map((edge) => edge.id)

  return {
    nodeIds: nodeIds.length > 0 ? nodeIds : selectedNodeId ? [selectedNodeId] : [],
    edgeIds: edgeIds.length > 0 ? edgeIds : selectedEdgeId ? [selectedEdgeId] : [],
  }
}

function cloneNodeForPaste(node: Node, suffix: string, offset: number): Node {
  return {
    ...structuredClone(node),
    id: `${node.id}-${suffix}`,
    selected: false,
    position: {
      x: node.position.x + offset,
      y: node.position.y + offset,
    },
  }
}

function normalizePortType(portType?: string): string {
  return String(portType || '')
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, '')
}

function detectPortFamily(portType?: string): PortFamily {
  const normalized = normalizePortType(portType)
  if (!normalized) return 'unknown'
  if (
    normalized.includes('ethernet') ||
    normalized.includes('lan') ||
    normalized.includes('rj45') ||
    normalized.includes('network') ||
    normalized.includes('poe')
  ) {
    return 'ethernet'
  }
  if (
    normalized.includes('fiber') ||
    normalized.includes('optical') ||
    normalized.includes('sfp')
  ) {
    return 'fiber'
  }
  if (
    normalized.includes('serial') ||
    normalized.includes('rs232') ||
    normalized.includes('rs485')
  ) {
    return 'serial'
  }
  if (
    normalized.includes('power') ||
    normalized.includes('ac') ||
    normalized.includes('dc') ||
    normalized.includes('pwr')
  ) {
    return 'power'
  }
  return 'unknown'
}

function arePortFamiliesCompatible(sourceFamily: PortFamily, targetFamily: PortFamily): boolean {
  if (sourceFamily === 'unknown' || targetFamily === 'unknown') return true
  if (sourceFamily === targetFamily) return true
  return false
}

function findPortTypeByHandle(
  nodes: Node[],
  nodeId?: string,
  handleId?: string
): string | undefined {
  if (!nodeId || !handleId) return undefined
  const node = nodes.find((item) => item.id === nodeId)
  const interfaces = node?.data?.interfaces
  if (Array.isArray(interfaces)) {
    const rawHandleId = String(handleId)
    const extractedInterfaceId = rawHandleId.replace(/^in-/, '').replace(/^out-/, '')
    if (extractedInterfaceId.startsWith('group-')) {
      return extractedInterfaceId.replace(/^group-/, '')
    }
    const interfaceMatch = interfaces.find((item: any) => String(item?.id ?? '') === extractedInterfaceId)
    if (interfaceMatch?.kind) {
      return interfaceMatch.kind
    }
  }
  const ports = node?.data?.ports
  if (!Array.isArray(ports)) return undefined

  const rawHandleId = String(handleId)
  const extractedPortId = rawHandleId.replace(/^in-/, '').replace(/^out-/, '')
  const match = ports.find((port: any) => {
    const portId = String(port?.id ?? '')
    return (
      portId === extractedPortId ||
      rawHandleId.endsWith(portId) ||
      rawHandleId === `in-${portId}` ||
      rawHandleId === `out-${portId}`
    )
  })
  return match?.type || match?.port_type
}

function getInterfaceByHandle(nodes: Node[], nodeId?: string, handleId?: string): any | undefined {
  if (!nodeId || !handleId) return undefined
  const node = nodes.find((item) => item.id === nodeId)
  const interfaces = node?.data?.interfaces
  if (!Array.isArray(interfaces)) return undefined

  const rawHandleId = String(handleId)
  const extractedInterfaceId = rawHandleId.replace(/^in-/, '').replace(/^out-/, '')
  if (extractedInterfaceId.startsWith('group-')) {
    const groupKind = extractedInterfaceId.replace(/^group-/, '')
    const members = interfaces.filter((item: any) => String(item?.kind || '') === groupKind)
    if (members.length === 0) return undefined
    return {
      ...members[0],
      id: extractedInterfaceId,
      capacity: {
        ...members[0].capacity,
        port_count: members.length,
        poe_budget_watts: members.reduce(
          (sum: number, item: any) => sum + Number(item?.capacity?.poe_budget_watts || 0),
          0
        ),
      },
      occupied_count: 0,
      members: members.map((item: any) => item.id),
    }
  }

  return interfaces.find((item: any) => String(item?.id || '') === extractedInterfaceId)
}

function getCompatiblePresets(sourceFamily: PortFamily, targetFamily: PortFamily): CablePreset[] {
  return CABLE_PRESETS.filter((preset) => {
    const sourceAllowed =
      sourceFamily === 'unknown' || preset.compatibleFamilies.includes(sourceFamily)
    const targetAllowed =
      targetFamily === 'unknown' || preset.compatibleFamilies.includes(targetFamily)
    return sourceAllowed && targetAllowed
  })
}

function exceedsInterfaceCapacity(
  nodes: Node[],
  edges: Edge[],
  nodeId?: string,
  handleId?: string
): boolean {
  const targetInterface = getInterfaceByHandle(nodes, nodeId, handleId)
  if (!targetInterface) return false

  const portCount = Number(targetInterface.capacity?.port_count || 0)
  if (portCount <= 0) return false

  const memberIds = Array.isArray(targetInterface.members)
    ? targetInterface.members
    : [String(targetInterface.id).replace(/^group-/, '')]

  const occupied = edges.filter((edge) => {
    const sourceHandle = String(edge.sourceHandle || '')
    const targetHandle = String(edge.targetHandle || '')
    return (
      memberIds.some((id) => sourceHandle === `out-${id}` || targetHandle === `in-${id}`) ||
      sourceHandle === `out-${targetInterface.id}` ||
      targetHandle === `in-${targetInterface.id}`
    )
  }).length

  return occupied >= portCount
}

function exceedsPoeBudget(
  nodes: Node[],
  edges: Edge[],
  nodeId?: string,
  handleId?: string,
  pendingPeerNodeId?: string
): boolean {
  const targetInterface = getInterfaceByHandle(nodes, nodeId, handleId)
  if (!targetInterface || String(targetInterface.kind || '') !== 'poe_ethernet') return false

  const budget = Number(targetInterface.capacity?.poe_budget_watts || 0)
  if (budget <= 0) return false

  const memberIds = Array.isArray(targetInterface.members)
    ? targetInterface.members
    : [String(targetInterface.id).replace(/^group-/, '')]

  const currentDraw = edges.reduce((sum, edge) => {
    const sourceHandle = String(edge.sourceHandle || '')
    const targetHandle = String(edge.targetHandle || '')
    const touchesTarget =
      memberIds.some((id) => sourceHandle === `out-${id}` || targetHandle === `in-${id}`) ||
      sourceHandle === `out-${targetInterface.id}` ||
      targetHandle === `in-${targetInterface.id}`

    if (!touchesTarget) return sum

    const peerNodeId = edge.source === nodeId ? edge.target : edge.source
    const peerNode = nodes.find((item) => item.id === peerNodeId)
    return sum + Number(peerNode?.data?.power_consumption_watts || 0)
  }, 0)

  const pendingDraw = pendingPeerNodeId
    ? Number(nodes.find((item) => item.id === pendingPeerNodeId)?.data?.power_consumption_watts || 0)
    : 0

  return currentDraw + pendingDraw > budget
}

function CanvasInner({
  initialNodes,
  initialEdges,
  onNodesChange,
  onEdgesChange,
  onAddDeviceAtPosition,
}: CanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const reactFlowRef = useRef<ReactFlowInstance | null>(null)
  const dragDepthRef = useRef(0)
  const viewportRestoreRef = useRef(false)
  const [settings, setSettings] = useState<CanvasSettings>({
    backgroundPattern: 'grid',
    backgroundColor: 'transparent',
    gridSize: 16,
    gridGap: 16,
  })
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null)
  const [isDropTargetActive, setIsDropTargetActive] = useState(false)
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null)
  const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null)
  const [connectionFeedback, setConnectionFeedback] = useState<ConnectionFeedback | null>(null)
  const [nodeVisualSettings, setNodeVisualSettings] = useState<NodeVisualSettings>({
    viewMode: 'hybrid',
  })

  const projectStore = useProjectStore()
  const selection = useMemo(
    () =>
      getSelectionSnapshot(
        projectStore.nodes,
        projectStore.edges,
        projectStore.selectedNodeId,
        projectStore.selectedEdgeId
      ),
    [
      projectStore.edges,
      projectStore.nodes,
      projectStore.selectedEdgeId,
      projectStore.selectedNodeId,
    ]
  )
  const hiddenNodeIdsByGroup = useMemo(() => {
    const hiddenIds = new Set<string>()
    for (const group of projectStore.groups) {
      if (group.hidden) {
        group.nodeIds.forEach((id) => hiddenIds.add(id))
      } else if (group.collapsed) {
        group.nodeIds.slice(1).forEach((id) => hiddenIds.add(id))
      }
    }
    return hiddenIds
  }, [projectStore.groups])

  useEffect(() => {
    const saved = localStorage.getItem('psb-canvas-settings')
    if (saved) {
      try {
        setSettings(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load canvas settings:', error)
      }
    }
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('psb-node-visual-settings')
    if (saved) {
      try {
        setNodeVisualSettings(JSON.parse(saved))
      } catch (error) {
        console.error('Failed to load node visual settings:', error)
      }
    }
  }, [])

  useEffect(() => {
    const handleSettingsChange = (event: Event) => {
      const customEvent = event as CustomEvent<CanvasSettings>
      setSettings(customEvent.detail)
    }

    window.addEventListener('psb-settings-changed', handleSettingsChange)
    return () => window.removeEventListener('psb-settings-changed', handleSettingsChange)
  }, [])

  useEffect(() => {
    const handleNodeVisualSettingsChange = (event: Event) => {
      const customEvent = event as CustomEvent<NodeVisualSettings>
      setNodeVisualSettings(customEvent.detail)
    }

    window.addEventListener('psb-node-visuals-changed', handleNodeVisualSettingsChange)
    return () =>
      window.removeEventListener('psb-node-visuals-changed', handleNodeVisualSettingsChange)
  }, [])

  useEffect(() => {
    viewportRestoreRef.current = false
  }, [projectStore.projectId])

  useEffect(() => {
    const projectId = projectStore.projectId
    const instance = reactFlowRef.current
    if (!projectId || !instance || viewportRestoreRef.current) return

    const raw = localStorage.getItem(getViewportStorageKey(projectId))
    if (!raw) {
      viewportRestoreRef.current = true
      return
    }

    try {
      const parsed = JSON.parse(raw) as StoredViewport
      instance.setViewport(
        {
          x: parsed.x,
          y: parsed.y,
          zoom: parsed.zoom,
        },
        { duration: 0 }
      )
      projectStore.setZoom(parsed.zoom)
      viewportRestoreRef.current = true
    } catch (error) {
      console.error('Failed to restore project viewport:', error)
      viewportRestoreRef.current = true
    }
  }, [projectStore, projectStore.nodes.length, projectStore.projectId])

  useEffect(() => {
    const handleFitCanvas = () => {
      if (!reactFlowRef.current) return
      reactFlowRef.current.fitView({
        padding: 0.18,
        includeHiddenNodes: false,
        duration: 240,
      })
      const viewport = reactFlowRef.current.getViewport()
      if (projectStore.projectId) {
        localStorage.setItem(
          getViewportStorageKey(projectStore.projectId),
          JSON.stringify({
            ...viewport,
            updatedAt: new Date().toISOString(),
          } satisfies StoredViewport)
        )
      }
      projectStore.setZoom(viewport.zoom)
    }

    window.addEventListener('psb-fit-canvas', handleFitCanvas)
    return () => window.removeEventListener('psb-fit-canvas', handleFitCanvas)
  }, [projectStore])

  useEffect(() => {
    if (!connectionFeedback) return
    const timer = window.setTimeout(() => setConnectionFeedback(null), 2600)
    return () => window.clearTimeout(timer)
  }, [connectionFeedback])

  const validationMap = useMemo(() => {
    const next = new Map<string, 'error' | 'warning' | 'info'>()
    for (const issue of projectStore.validationErrors) {
      if (!issue.targetId) continue
      if (issue.type === 'error') {
        next.set(issue.targetId, 'error')
        continue
      }
      if (issue.type === 'warning' && next.get(issue.targetId) !== 'error') {
        next.set(issue.targetId, 'warning')
        continue
      }
      if (!next.has(issue.targetId)) {
        next.set(issue.targetId, 'info')
      }
    }
    return next
  }, [projectStore.validationErrors])

  const nodes = useMemo(
    () =>
      projectStore.nodes.map((node) => {
        const interfaces = Array.isArray(node.data?.interfaces) ? node.data.interfaces : []
        const groupUsageByKind = interfaces.reduce((acc: Record<string, number>, item: any) => {
          const count = projectStore.edges.filter((edge) => {
            const sourceHandle = String(edge.sourceHandle || '')
            const targetHandle = String(edge.targetHandle || '')
            return (
              sourceHandle === `out-group-${item.kind}` ||
              targetHandle === `in-group-${item.kind}`
            )
          }).length
          acc[item.kind] = count
          return acc
        }, {})
        const groupPoeDrawByKind = interfaces.reduce((acc: Record<string, number>, item: any) => {
          if (String(item?.kind || '') !== 'poe_ethernet' || String(node.data?.type || '').toLowerCase() !== 'switch') {
            acc[item.kind] = acc[item.kind] || 0
            return acc
          }

          const draw = projectStore.edges.reduce((sum, edge) => {
            const sourceHandle = String(edge.sourceHandle || '')
            const targetHandle = String(edge.targetHandle || '')
            const touchesGroup =
              sourceHandle === `out-group-${item.kind}` || targetHandle === `in-group-${item.kind}`
            if (!touchesGroup) return sum

            const peerNodeId = edge.source === node.id ? edge.target : edge.source
            const peerNode = projectStore.nodes.find((candidate) => candidate.id === peerNodeId)
            return sum + Number(peerNode?.data?.power_consumption_watts || 0)
          }, 0)

          acc[item.kind] = draw
          return acc
        }, {})
        const interfacesWithUsage = interfaces.map((item: any) => {
          const occupiedCount = projectStore.edges.filter((edge) => {
            const sourceHandle = String(edge.sourceHandle || '')
            const targetHandle = String(edge.targetHandle || '')
            return (
              sourceHandle === `out-${item.id}` ||
              targetHandle === `in-${item.id}`
            )
          }).length
          const poeDrawWatts =
            String(item?.kind || '') === 'poe_ethernet' && String(node.data?.type || '').toLowerCase() === 'switch'
              ? projectStore.edges.reduce((sum, edge) => {
                  const sourceHandle = String(edge.sourceHandle || '')
                  const targetHandle = String(edge.targetHandle || '')
                  const touchesInterface =
                    sourceHandle === `out-${item.id}` ||
                    targetHandle === `in-${item.id}`
                  if (!touchesInterface) return sum

                  const peerNodeId = edge.source === node.id ? edge.target : edge.source
                  const peerNode = projectStore.nodes.find((candidate) => candidate.id === peerNodeId)
                  return sum + Number(peerNode?.data?.power_consumption_watts || 0)
                }, 0)
              : 0

          return {
            ...item,
            occupied_count: occupiedCount,
            group_usage_count: groupUsageByKind[item.kind] || 0,
            poe_draw_watts: poeDrawWatts,
            group_poe_draw_watts: groupPoeDrawByKind[item.kind] || 0,
          }
        })

        return {
          ...node,
          selected: selection.nodeIds.includes(node.id),
          hidden: hiddenNodeIdsByGroup.has(node.id),
          data: {
            ...node.data,
            status: validationMap.get(node.id) ?? node.data?.status ?? 'active',
            viewMode: nodeVisualSettings.viewMode,
            interfaces: interfacesWithUsage,
          },
        }
      }),
    [hiddenNodeIdsByGroup, nodeVisualSettings.viewMode, projectStore.nodes, selection.nodeIds, validationMap]
  )

  const edges = useMemo(
    () =>
      projectStore.edges.map((edge) => {
        const status = validationMap.get(edge.id)
        const edgeBandwidth =
          Number(edge.data?.bandwidth_mbps || edge.data?.speed_mbps || 0) || undefined
        const labelParts = [
          edge.data?.cable_type ? String(edge.data.cable_type) : null,
          edge.data?.length_meters ? `${edge.data.length_meters}m` : null,
          edgeBandwidth ? `${edgeBandwidth} Mbps` : null,
        ].filter(Boolean)
        return {
          ...edge,
          selected: selection.edgeIds.includes(edge.id),
          type: 'smoothstep',
          hidden:
            hiddenNodeIdsByGroup.has(edge.source) || hiddenNodeIdsByGroup.has(edge.target),
          markerEnd: { type: MarkerType.ArrowClosed },
          animated: selection.edgeIds.includes(edge.id),
          label: hoveredEdgeId === edge.id ? labelParts.join(' • ') || edge.label : undefined,
          labelShowBg: true,
          labelBgPadding: [6, 2] as [number, number],
          labelBgBorderRadius: 5,
          labelStyle: { fontSize: 11, fill: '#0f172a', fontWeight: 600 },
          style:
            status === 'error'
              ? { stroke: '#dc2626', strokeWidth: 2.6 }
              : status === 'warning'
              ? { stroke: '#d97706', strokeWidth: 2.6 }
              : { stroke: '#0ea5e9', strokeWidth: selection.edgeIds.includes(edge.id) ? 2.8 : 2.2 },
        }
      }),
    [hiddenNodeIdsByGroup, hoveredEdgeId, projectStore.edges, selection.edgeIds, validationMap]
  )

  const deleteSelection = useCallback(() => {
    if (selection.nodeIds.length === 0 && selection.edgeIds.length === 0) return

    const selectedNodes = new Set(selection.nodeIds)
    const selectedEdges = new Set(selection.edgeIds)
    const nextNodes = projectStore.nodes.filter((node) => !selectedNodes.has(node.id))
    const nextEdges = projectStore.edges.filter(
      (edge) =>
        !selectedEdges.has(edge.id) &&
        !selectedNodes.has(edge.source) &&
        !selectedNodes.has(edge.target)
    )

    projectStore.setGraph(nextNodes, nextEdges)
    projectStore.setSelectedNodeId(null)
    projectStore.setSelectedEdgeId(null)
    emitToast('Selection deleted', 'success')
  }, [projectStore, selection.edgeIds, selection.nodeIds])

  const buildClipboardFromSelection = useCallback((): ClipboardPayload | null => {
    if (selection.nodeIds.length === 0 && selection.edgeIds.length === 0) return null

    const selectedNodes = projectStore.nodes.filter((node) => selection.nodeIds.includes(node.id))
    const selectedNodeIds = new Set(selectedNodes.map((node) => node.id))
    const relatedEdges = projectStore.edges.filter(
      (edge) =>
        selection.edgeIds.includes(edge.id) ||
        (selectedNodeIds.has(edge.source) && selectedNodeIds.has(edge.target))
    )

    return {
      nodes: structuredClone(selectedNodes),
      edges: structuredClone(relatedEdges),
    }
  }, [projectStore.edges, projectStore.nodes, selection.edgeIds, selection.nodeIds])

  const copySelection = useCallback(() => {
    const clipboard = buildClipboardFromSelection()
    if (!clipboard) return null
    projectStore.setClipboard(clipboard)
    return clipboard
  }, [buildClipboardFromSelection, projectStore])

  const pasteClipboard = useCallback((clipboardOverride?: ClipboardPayload | null) => {
    const clipboard = clipboardOverride ?? projectStore.clipboard
    if (!clipboard) return

    const suffix = `${Date.now()}`
    const idMap = new Map<string, string>()
    const nextNodes = clipboard.nodes.map((node, index) => {
      const cloned = cloneNodeForPaste(node, suffix, 36 + index * 12)
      idMap.set(node.id, cloned.id)
      return cloned
    })
    const nextEdges = clipboard.edges
      .filter((edge) => idMap.has(edge.source) && idMap.has(edge.target))
      .map((edge) => ({
        ...structuredClone(edge),
        id: `${edge.id}-${suffix}`,
        source: idMap.get(edge.source)!,
        target: idMap.get(edge.target)!,
        selected: false,
      }))

    if (nextNodes.length === 0 && nextEdges.length === 0) return

    projectStore.setGraph(
      [...projectStore.nodes, ...nextNodes],
      [...projectStore.edges, ...nextEdges]
    )
    projectStore.setSelectedNodeId(nextNodes[0]?.id ?? null)
    projectStore.setSelectedEdgeId(nextEdges[0]?.id ?? null)
    emitToast('Selection pasted', 'success')
  }, [projectStore])

  const duplicateSelection = useCallback(() => {
    const clipboard = buildClipboardFromSelection()
    if (!clipboard) return
    projectStore.setClipboard(clipboard)
    pasteClipboard(clipboard)
    emitToast('Selection duplicated', 'success')
  }, [buildClipboardFromSelection, pasteClipboard, projectStore])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isInput =
        target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable
      if (isInput) return

      if (event.key === 'Delete') {
        event.preventDefault()
        deleteSelection()
        return
      }

      const isMeta = event.ctrlKey || event.metaKey
      if (!isMeta) return

      if (event.key.toLowerCase() === 'd') {
        event.preventDefault()
        duplicateSelection()
      }
      if (event.key.toLowerCase() === 'c') {
        event.preventDefault()
        copySelection()
      }
      if (event.key.toLowerCase() === 'v') {
        event.preventDefault()
        pasteClipboard()
      }
      if (event.key.toLowerCase() === 'z' && !event.shiftKey) {
        event.preventDefault()
        projectStore.undo()
      }
      if (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey)) {
        event.preventDefault()
        projectStore.redo()
      }
      if (event.key.toLowerCase() === 'g') {
        event.preventDefault()
        if (selection.nodeIds.length > 0) {
          projectStore.createGroup(selection.nodeIds)
          emitToast('Group created from selection', 'success')
        }
      }
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault()
        window.dispatchEvent(new CustomEvent('psb-focus-group-search'))
      }

      if (event.code === 'Space' && !event.shiftKey && !event.altKey) {
        event.preventDefault()
        const ordered = [...projectStore.nodes].sort((a, b) => a.id.localeCompare(b.id))
        const nextNodes = ordered.map((node, index) => ({
          ...node,
          position: {
            x: 120 + (index % 4) * 260,
            y: 120 + Math.floor(index / 4) * 180,
          },
        }))
        projectStore.setNodes(nextNodes)
        emitToast('Auto-layout applied', 'info')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    copySelection,
    deleteSelection,
    duplicateSelection,
    pasteClipboard,
    projectStore,
    selection.nodeIds,
  ])

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    dragDepthRef.current += 1
    setIsDropTargetActive(true)
    window.dispatchEvent(
      new CustomEvent('psb-status-action', { detail: { action: 'Dragging over canvas' } })
    )
    console.log('[Canvas] drag enter', { depth: dragDepthRef.current })
  }, [])

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    event.dataTransfer.dropEffect = 'move'
    console.log('[Canvas] drag over', { x: event.clientX, y: event.clientY })
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.stopPropagation()
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1)
    if (dragDepthRef.current === 0) {
      setIsDropTargetActive(false)
      window.dispatchEvent(new CustomEvent('psb-status-action', { detail: { action: 'Idle' } }))
    }
    console.log('[Canvas] drag leave', { depth: dragDepthRef.current })
  }, [])

  const handleDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()
      dragDepthRef.current = 0
      setIsDropTargetActive(false)
      window.dispatchEvent(new CustomEvent('psb-status-action', { detail: { action: 'Dropping item' } }))

      const rawData =
        event.dataTransfer.getData('application/json') ||
        event.dataTransfer.getData('text/plain')
      console.log('[Canvas] drop received', { hasData: Boolean(rawData) })
      if (!rawData) return

      try {
        const equipment = rawData.startsWith('{') ? JSON.parse(rawData) : { key: rawData }
        const wrapperBounds = wrapperRef.current?.getBoundingClientRect()
        const fallbackPosition = wrapperBounds
          ? {
              x: event.clientX - wrapperBounds.left,
              y: event.clientY - wrapperBounds.top,
            }
          : undefined
        const position =
          reactFlowRef.current?.screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
          }) || fallbackPosition

        console.log('[Canvas] adding device from drop', {
          equipmentKey: equipment.key,
          position,
          usedReactFlowProjection: Boolean(reactFlowRef.current),
        })

        await onAddDeviceAtPosition(equipment.key, position)
        window.dispatchEvent(new CustomEvent('psb-status-action', { detail: { action: 'Device added' } }))
      } catch (error) {
        console.error('Failed to process canvas drop:', error)
        window.dispatchEvent(new CustomEvent('psb-status-action', { detail: { action: 'Drop failed' } }))
      }
    },
    [onAddDeviceAtPosition]
  )

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (changes.length === 0) return
      const nextNodes = applyNodeChanges(changes, projectStore.nodes)
      onNodesChange(nextNodes)
    },
    [onNodesChange, projectStore.nodes]
  )

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      if (changes.length === 0) return
      const nextEdges = applyEdgeChanges(changes, projectStore.edges)
      onEdgesChange(nextEdges)
    },
    [onEdgesChange, projectStore.edges]
  )

  const handleConnect = useCallback(
    (connection: Connection) => {
      if (
        exceedsInterfaceCapacity(
          projectStore.nodes,
          projectStore.edges,
          connection.target,
          connection.targetHandle
        )
      ) {
        setConnectionFeedback({
          level: 'error',
          message: 'Connection blocked: target interface group has no free capacity.',
        })
        emitToast('Target interface group is full', 'error')
        return
      }
      if (
        exceedsPoeBudget(
          projectStore.nodes,
          projectStore.edges,
          connection.target,
          connection.targetHandle,
          connection.source
        )
      ) {
        setConnectionFeedback({
          level: 'error',
          message: 'Connection blocked: target PoE budget would be exceeded.',
        })
        emitToast('Target PoE budget would be exceeded', 'error')
        return
      }

      const sourcePortType = findPortTypeByHandle(
        projectStore.nodes,
        connection.source,
        connection.sourceHandle
      )
      const targetPortType = findPortTypeByHandle(
        projectStore.nodes,
        connection.target,
        connection.targetHandle
      )
      const sourceFamily = detectPortFamily(sourcePortType)
      const targetFamily = detectPortFamily(targetPortType)

      if (!arePortFamiliesCompatible(sourceFamily, targetFamily)) {
        setConnectionFeedback({
          level: 'error',
          message: `Connection blocked: ${sourcePortType || sourceFamily} is incompatible with ${
            targetPortType || targetFamily
          }.`,
        })
        emitToast(
          `Incompatible ports: ${sourcePortType || sourceFamily} -> ${
            targetPortType || targetFamily
          }`,
          'error'
        )
        window.dispatchEvent(
          new CustomEvent('psb-status-action', { detail: { action: 'Connection rejected' } })
        )
        return
      }

      setPendingConnection({
        connection,
        sourcePortType,
        targetPortType,
        sourceFamily,
        targetFamily,
      })
      setConnectionFeedback({
        level: 'warning',
        message: `Select cable for ${sourcePortType || sourceFamily} -> ${
          targetPortType || targetFamily
        }.`,
      })
    },
    [projectStore.nodes]
  )

  const finalizeConnection = useCallback(
    (preset: CablePreset) => {
      if (!pendingConnection) return
      const nextEdges = addEdge(
        {
          ...pendingConnection.connection,
          id: `edge-${Date.now()}`,
          label: preset.cableType,
          data: {
            cable_type: preset.cableType,
            length_meters: preset.defaultLength,
            bandwidth_mbps: preset.bandwidthMbps,
          },
        },
        projectStore.edges
      )
      onEdgesChange(nextEdges)
      setPendingConnection(null)
      setConnectionFeedback(null)
      emitToast(`Connection created (${preset.cableType})`, 'success')
      window.dispatchEvent(
        new CustomEvent('psb-status-action', { detail: { action: 'Connection created' } })
      )
    },
    [onEdgesChange, pendingConnection, projectStore.edges]
  )

  const handleIsValidConnection = useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return false
      if (connection.source === connection.target) return false
      if (
        exceedsInterfaceCapacity(
          projectStore.nodes,
          projectStore.edges,
          connection.target,
          connection.targetHandle
        )
      ) {
        return false
      }
      if (
        exceedsPoeBudget(
          projectStore.nodes,
          projectStore.edges,
          connection.target,
          connection.targetHandle,
          connection.source
        )
      ) {
        return false
      }

      const sourcePortType = findPortTypeByHandle(
        projectStore.nodes,
        connection.source,
        connection.sourceHandle
      )
      const targetPortType = findPortTypeByHandle(
        projectStore.nodes,
        connection.target,
        connection.targetHandle
      )

      return arePortFamiliesCompatible(
        detectPortFamily(sourcePortType),
        detectPortFamily(targetPortType)
      )
    },
    [projectStore.edges, projectStore.nodes]
  )

  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes, edges: selectedEdges }: OnSelectionChangeParams) => {
      projectStore.setSelectedNodeId(selectedNodes[0]?.id ?? null)
      projectStore.setSelectedEdgeId(selectedEdges[0]?.id ?? null)
    },
    [projectStore]
  )

  const openContextMenu = useCallback((x: number, y: number) => {
    setContextMenu({ x, y })
  }, [])

  const handlePaneContextMenu = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      event.preventDefault()
      projectStore.setSelectedNodeId(null)
      projectStore.setSelectedEdgeId(null)
      openContextMenu(event.clientX, event.clientY)
    },
    [openContextMenu, projectStore]
  )

  const handleNodeContextMenu = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.preventDefault()
      projectStore.setSelectedNodeId(node.id)
      projectStore.setSelectedEdgeId(null)
      projectStore.setNodes(
        projectStore.nodes.map((item) => ({
          ...item,
          selected: item.id === node.id,
        })),
        { pushHistory: false, markDirty: false }
      )
      projectStore.setEdges(
        projectStore.edges.map((edge) => ({
          ...edge,
          selected: false,
        })),
        { pushHistory: false, markDirty: false }
      )
      openContextMenu(event.clientX, event.clientY)
    },
    [openContextMenu, projectStore]
  )

  const handleEdgeContextMenu = useCallback(
    (event: React.MouseEvent, edge: Edge) => {
      event.preventDefault()
      projectStore.setSelectedNodeId(null)
      projectStore.setSelectedEdgeId(edge.id)
      projectStore.setNodes(
        projectStore.nodes.map((node) => ({
          ...node,
          selected: false,
        })),
        { pushHistory: false, markDirty: false }
      )
      projectStore.setEdges(
        projectStore.edges.map((item) => ({
          ...item,
          selected: item.id === edge.id,
        })),
        { pushHistory: false, markDirty: false }
      )
      openContextMenu(event.clientX, event.clientY)
    },
    [openContextMenu, projectStore]
  )

  const contextActions = useMemo(
    () => [
      { key: 'delete', label: 'Delete', disabled: selection.nodeIds.length === 0 && selection.edgeIds.length === 0, onClick: deleteSelection },
      { key: 'duplicate', label: 'Duplicate', disabled: selection.nodeIds.length === 0, onClick: duplicateSelection },
      { key: 'copy', label: 'Copy', disabled: selection.nodeIds.length === 0 && selection.edgeIds.length === 0, onClick: () => { copySelection() } },
      { key: 'paste', label: 'Paste', disabled: !projectStore.clipboard, onClick: pasteClipboard },
      { key: 'rename', label: 'Rename', disabled: !projectStore.selectedNodeId, onClick: () => window.dispatchEvent(new CustomEvent('psb-focus-node-name')) },
      { key: 'properties', label: 'View Properties', disabled: !projectStore.selectedNodeId, onClick: () => undefined },
      {
        key: 'group',
        label: 'Add to Group',
        disabled: selection.nodeIds.length === 0,
        onClick: () => projectStore.createGroup(selection.nodeIds),
      },
    ],
    [
      copySelection,
      deleteSelection,
      duplicateSelection,
      pasteClipboard,
      projectStore.clipboard,
      projectStore.selectedEdgeId,
      projectStore.selectedNodeId,
      selection.edgeIds.length,
      selection.nodeIds.length,
    ]
  )

  return (
    <div
      ref={wrapperRef}
      className="relative h-full w-full overflow-hidden"
      style={{ backgroundColor: settings.backgroundColor || 'rgb(248, 250, 252)' }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseMove={(event) => {
        const bounds = wrapperRef.current?.getBoundingClientRect()
        if (!bounds) return
        const x = Math.max(0, Math.round(event.clientX - bounds.left))
        const y = Math.max(0, Math.round(event.clientY - bounds.top))
        window.dispatchEvent(new CustomEvent('psb-cursor-move', { detail: { x, y } }))
      }}
    >
      {isDropTargetActive && (
        <div className="pointer-events-none absolute inset-0 z-10 border-2 border-dashed border-brand-400 bg-brand-100/30" />
      )}

      {connectionFeedback && (
        <div className="pointer-events-none absolute left-1/2 top-4 z-20 -translate-x-1/2">
          <div
            className={`rounded-full px-4 py-2 text-sm font-medium shadow-lg ${
              connectionFeedback.level === 'error'
                ? 'bg-red-50 text-red-700 ring-1 ring-red-200'
                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
            }`}
          >
            {connectionFeedback.message}
          </div>
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onInit={(instance) => {
          reactFlowRef.current = instance
        }}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        isValidConnection={handleIsValidConnection}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#0ea5e9', strokeWidth: 2.2 },
          markerEnd: { type: MarkerType.ArrowClosed },
        }}
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: '#0ea5e9', strokeWidth: 2.2, strokeDasharray: '5 3' }}
        onSelectionChange={handleSelectionChange}
        onPaneContextMenu={handlePaneContextMenu}
        onNodeContextMenu={handleNodeContextMenu}
        onEdgeContextMenu={handleEdgeContextMenu}
        onEdgeMouseEnter={(_, edge) => setHoveredEdgeId(edge.id)}
        onEdgeMouseLeave={() => setHoveredEdgeId(null)}
        onEdgeClick={(_, edge) => {
          projectStore.setSelectedNodeId(null)
          projectStore.setSelectedEdgeId(edge.id)
        }}
        onMoveEnd={(_, viewport) => {
          projectStore.setZoom(viewport.zoom)
          if (!projectStore.projectId) return
          localStorage.setItem(
            getViewportStorageKey(projectStore.projectId),
            JSON.stringify({
              ...viewport,
              updatedAt: new Date().toISOString(),
            } satisfies StoredViewport)
          )
        }}
        selectionOnDrag
        multiSelectionKeyCode={['Shift', 'Control', 'Meta']}
        connectionRadius={36}
        nodeTypes={nodeTypes}
      >
        {settings.backgroundPattern !== 'none' && (
          <Background
            color="#cbd5e1"
            size={settings.gridSize}
            gap={[settings.gridGap, settings.gridGap]}
            variant={
              settings.backgroundPattern === 'cross'
                ? 'cross'
                : (settings.backgroundPattern as 'dots' | 'grid')
            }
          />
        )}
      </ReactFlow>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          actions={contextActions}
          onClose={() => setContextMenu(null)}
        />
      )}

      {pendingConnection && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/30 px-4">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-4 shadow-xl">
            <div className="text-sm font-semibold text-slate-900">Select cable type</div>
            <div className="mt-1 text-xs text-slate-600">
              {pendingConnection.sourcePortType || pendingConnection.sourceFamily}
              {' -> '}
              {pendingConnection.targetPortType || pendingConnection.targetFamily}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {getCompatiblePresets(
                pendingConnection.sourceFamily,
                pendingConnection.targetFamily
              ).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => finalizeConnection(preset)}
                  className="rounded-md border border-slate-300 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-brand-500 hover:bg-brand-50"
                >
                  <div>{preset.label}</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {preset.defaultLength}m, {preset.bandwidthMbps} Mbps
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setPendingConnection(null)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function Canvas(props: CanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  )
}
