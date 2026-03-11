import { create } from 'zustand'
import { Edge, Node } from 'reactflow'

export interface ValidationIssue {
  id: string
  type: 'error' | 'warning' | 'info'
  message: string
  targetId?: string
  targetType?: 'node' | 'edge'
  source?: 'server' | 'local'
}

interface GraphSnapshot {
  nodes: Node[]
  edges: Edge[]
}

interface ClipboardState {
  nodes: Node[]
  edges: Edge[]
}

export interface NodeGroup {
  id: string
  name: string
  nodeIds: string[]
  hidden: boolean
  collapsed: boolean
}

export interface ProjectStore {
  projectId: string | null
  setProjectId: (id: string | null) => void

  nodes: Node[]
  edges: Edge[]
  setGraph: (nodes: Node[], edges: Edge[], options?: { markDirty?: boolean; pushHistory?: boolean }) => void
  setNodes: (nodes: Node[], options?: { markDirty?: boolean; pushHistory?: boolean }) => void
  addNode: (node: Node, options?: { markDirty?: boolean; pushHistory?: boolean }) => void
  removeNode: (id: string, options?: { markDirty?: boolean; pushHistory?: boolean }) => void
  updateNode: (id: string, updates: Partial<Node>, options?: { markDirty?: boolean; pushHistory?: boolean }) => void
  setEdges: (edges: Edge[], options?: { markDirty?: boolean; pushHistory?: boolean }) => void
  addEdge: (edge: Edge, options?: { markDirty?: boolean; pushHistory?: boolean }) => void
  removeEdge: (id: string, options?: { markDirty?: boolean; pushHistory?: boolean }) => void

  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void
  selectedEdgeId: string | null
  setSelectedEdgeId: (id: string | null) => void

  selectedZone: string | null
  setSelectedZone: (zone: string | null) => void
  groups: NodeGroup[]
  setGroups: (groups: NodeGroup[]) => void
  createGroup: (nodeIds: string[], name?: string) => void
  deleteGroup: (groupId: string) => void
  renameGroup: (groupId: string, name: string) => void
  toggleGroupHidden: (groupId: string) => void
  toggleGroupCollapsed: (groupId: string) => void

  clipboard: ClipboardState | null
  setClipboard: (clipboard: ClipboardState | null) => void

  history: {
    past: GraphSnapshot[]
    future: GraphSnapshot[]
  }
  canUndo: boolean
  canRedo: boolean
  undo: () => void
  redo: () => void

  isDirty: boolean
  setIsDirty: (dirty: boolean) => void

  validationErrors: ValidationIssue[]
  setValidationErrors: (errors: ValidationIssue[]) => void

  aiProposal: any | null
  setAIProposal: (proposal: any | null) => void

  zoom: number
  setZoom: (zoom: number) => void

  reset: () => void
}

const HISTORY_LIMIT = 50

const initialState = {
  projectId: null,
  nodes: [] as Node[],
  edges: [] as Edge[],
  selectedNodeId: null,
  selectedEdgeId: null,
  selectedZone: null,
  groups: [] as NodeGroup[],
  clipboard: null as ClipboardState | null,
  history: {
    past: [] as GraphSnapshot[],
    future: [] as GraphSnapshot[],
  },
  canUndo: false,
  canRedo: false,
  isDirty: false,
  validationErrors: [] as ValidationIssue[],
  aiProposal: null,
  zoom: 1,
}

function cloneGraph(nodes: Node[], edges: Edge[]): GraphSnapshot {
  return {
    nodes: structuredClone(nodes),
    edges: structuredClone(edges),
  }
}

function sanitizeGroups(groups: NodeGroup[], nodes: Node[]): NodeGroup[] {
  const nodeIds = new Set(nodes.map((node) => node.id))
  return groups
    .map((group) => ({
      ...group,
      nodeIds: group.nodeIds.filter((id) => nodeIds.has(id)),
    }))
    .filter((group) => group.nodeIds.length > 0)
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
  ...initialState,

  setProjectId: (id) => set({ projectId: id }),

  setGraph: (nodes, edges, options) =>
    set((state) => {
      if (nodes === state.nodes && edges === state.edges) {
        return state
      }
      const pushHistory = options?.pushHistory ?? true
      const markDirty = options?.markDirty ?? true
      const past = pushHistory
        ? [...state.history.past, cloneGraph(state.nodes, state.edges)].slice(-HISTORY_LIMIT)
        : state.history.past

      return {
        nodes,
        edges,
        groups: sanitizeGroups(state.groups, nodes),
        isDirty: markDirty ? true : state.isDirty,
        history: {
          past,
          future: pushHistory ? [] : state.history.future,
        },
        canUndo: past.length > 0,
        canRedo: pushHistory ? false : state.history.future.length > 0,
      }
    }),

  setNodes: (nodes, options) => {
    const state = get()
    state.setGraph(nodes, state.edges, options)
  },

  addNode: (node, options) => {
    const state = get()
    state.setGraph([...state.nodes, node], state.edges, options)
  },

  removeNode: (id, options) => {
    const state = get()
    state.setGraph(
      state.nodes.filter((n) => n.id !== id),
      state.edges.filter((e) => e.source !== id && e.target !== id),
      options
    )
  },

  updateNode: (id, updates, options) => {
    const state = get()
    state.setGraph(
      state.nodes.map((n) => (n.id === id ? { ...n, ...updates } : n)),
      state.edges,
      options
    )
  },

  setEdges: (edges, options) => {
    const state = get()
    state.setGraph(state.nodes, edges, options)
  },

  addEdge: (edge, options) => {
    const state = get()
    state.setGraph(state.nodes, [...state.edges, edge], options)
  },

  removeEdge: (id, options) => {
    const state = get()
    state.setGraph(
      state.nodes,
      state.edges.filter((e) => e.id !== id),
      options
    )
  },

  setSelectedNodeId: (id) =>
    set((state) => (state.selectedNodeId === id ? state : { selectedNodeId: id })),
  setSelectedEdgeId: (id) =>
    set((state) => (state.selectedEdgeId === id ? state : { selectedEdgeId: id })),
  setSelectedZone: (zone) =>
    set((state) => (state.selectedZone === zone ? state : { selectedZone: zone })),
  setGroups: (groups) =>
    set((state) => {
      const sanitizedGroups = sanitizeGroups(groups, state.nodes)
      return {
        groups: sanitizedGroups,
        selectedZone:
          state.selectedZone && sanitizedGroups.some((group) => group.id === state.selectedZone)
            ? state.selectedZone
            : null,
      }
    }),
  createGroup: (nodeIds, name) =>
    set((state) => {
      const uniqueNodeIds = Array.from(new Set(nodeIds)).filter((id) =>
        state.nodes.some((node) => node.id === id)
      )
      if (uniqueNodeIds.length === 0) return state

      const nextGroup: NodeGroup = {
        id: `group-${Date.now()}`,
        name: name?.trim() || `Group ${state.groups.length + 1}`,
        nodeIds: uniqueNodeIds,
        hidden: false,
        collapsed: false,
      }

      return {
        groups: [...state.groups, nextGroup],
        selectedZone: nextGroup.id,
      }
    }),
  deleteGroup: (groupId) =>
    set((state) => ({
      groups: state.groups.filter((group) => group.id !== groupId),
      selectedZone: state.selectedZone === groupId ? null : state.selectedZone,
    })),
  renameGroup: (groupId, name) =>
    set((state) => ({
      groups: state.groups.map((group) =>
        group.id === groupId ? { ...group, name: name.trim() || group.name } : group
      ),
    })),
  toggleGroupHidden: (groupId) =>
    set((state) => ({
      groups: state.groups.map((group) =>
        group.id === groupId ? { ...group, hidden: !group.hidden } : group
      ),
    })),
  toggleGroupCollapsed: (groupId) =>
    set((state) => ({
      groups: state.groups.map((group) =>
        group.id === groupId ? { ...group, collapsed: !group.collapsed } : group
      ),
    })),
  setClipboard: (clipboard) => set((state) => (state.clipboard === clipboard ? state : { clipboard })),

  undo: () =>
    set((state) => {
      const previous = state.history.past[state.history.past.length - 1]
      if (!previous) {
        return state
      }

      const future = [cloneGraph(state.nodes, state.edges), ...state.history.future].slice(
        0,
        HISTORY_LIMIT
      )
      const past = state.history.past.slice(0, -1)

      return {
        nodes: previous.nodes,
        edges: previous.edges,
        groups: sanitizeGroups(state.groups, previous.nodes),
        history: { past, future },
        canUndo: past.length > 0,
        canRedo: future.length > 0,
        isDirty: true,
      }
    }),

  redo: () =>
    set((state) => {
      const next = state.history.future[0]
      if (!next) {
        return state
      }

      const past = [...state.history.past, cloneGraph(state.nodes, state.edges)].slice(
        -HISTORY_LIMIT
      )
      const future = state.history.future.slice(1)

      return {
        nodes: next.nodes,
        edges: next.edges,
        groups: sanitizeGroups(state.groups, next.nodes),
        history: { past, future },
        canUndo: past.length > 0,
        canRedo: future.length > 0,
        isDirty: true,
      }
    }),

  setIsDirty: (dirty) => set({ isDirty: dirty }),
  setValidationErrors: (errors) => set({ validationErrors: errors }),
  setAIProposal: (proposal) => set({ aiProposal: proposal }),
  setZoom: (zoom) => set({ zoom }),

  reset: () => set(initialState),
}))
