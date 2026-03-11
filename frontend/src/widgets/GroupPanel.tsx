import React from 'react'
import { Layers3, ChevronDown, ChevronRight, Eye, EyeOff, Trash2 } from 'lucide-react'
import { Node } from 'reactflow'
import { NodeGroup } from '@/shared/store/projectStore'

interface GroupPanelProps {
  groups: NodeGroup[]
  nodes: Node[]
  selectedNodeIds: string[]
  selectedGroupId: string | null
  onCreateGroup: () => void
  onToggleHidden: (groupId: string) => void
  onToggleCollapsed: (groupId: string) => void
  onRenameGroup: (groupId: string, name: string) => void
  onDeleteGroup: (groupId: string) => void
  onSelectGroup: (groupId: string | null) => void
}

export function GroupPanel({
  groups,
  nodes,
  selectedNodeIds,
  selectedGroupId,
  onCreateGroup,
  onToggleHidden,
  onToggleCollapsed,
  onRenameGroup,
  onDeleteGroup,
  onSelectGroup,
}: GroupPanelProps) {
  const searchRef = React.useRef<HTMLInputElement>(null)
  const [query, setQuery] = React.useState('')

  React.useEffect(() => {
    const handleFocusSearch = () => searchRef.current?.focus()
    window.addEventListener('psb-focus-group-search', handleFocusSearch)
    return () => window.removeEventListener('psb-focus-group-search', handleFocusSearch)
  }, [])

  const filteredGroups = React.useMemo(() => {
    if (!query.trim()) return groups
    const q = query.trim().toLowerCase()
    return groups.filter((group) => group.name.toLowerCase().includes(q))
  }, [groups, query])

  const nodeById = React.useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes]
  )

  return (
    <div className="flex h-full flex-col bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Layers3 className="h-5 w-5 text-brand-600" />
            <h3 className="font-bold text-gray-900">Groups / Zones</h3>
          </div>
          <button
            type="button"
            onClick={onCreateGroup}
            disabled={selectedNodeIds.length === 0}
            className="rounded-md bg-brand-500 px-2 py-1 text-xs font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:bg-gray-300"
            title="Create group from selected nodes (Ctrl+G)"
          >
            Ctrl+G
          </button>
        </div>
        <input
          ref={searchRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find group (Ctrl+F)"
          className="mt-3 w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-200"
        />
        <div className="mt-2 text-xs text-gray-500">
          Selected nodes: {selectedNodeIds.length}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-2 py-2">
        {filteredGroups.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-300 p-3 text-sm text-gray-500">
            No groups yet. Select several nodes and press Ctrl+G.
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div
              key={group.id}
              className={`rounded-md border p-2 ${
                selectedGroupId === group.id
                  ? 'border-brand-400 bg-brand-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onToggleCollapsed(group.id)}
                  className="rounded p-1 text-gray-600 transition hover:bg-gray-100"
                  title={group.collapsed ? 'Expand group' : 'Collapse group'}
                >
                  {group.collapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                <input
                  value={group.name}
                  onChange={(event) => onRenameGroup(group.id, event.target.value)}
                  onFocus={() => onSelectGroup(group.id)}
                  className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold text-gray-900 hover:border-gray-200 focus:border-brand-300 focus:bg-white focus:outline-none"
                />

                <button
                  type="button"
                  onClick={() => onToggleHidden(group.id)}
                  className="rounded p-1 text-gray-600 transition hover:bg-gray-100"
                  title={group.hidden ? 'Show group' : 'Hide group'}
                >
                  {group.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteGroup(group.id)}
                  className="rounded p-1 text-red-500 transition hover:bg-red-50"
                  title="Delete group"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-1 text-xs text-gray-500">{group.nodeIds.length} nodes</div>

              {!group.collapsed && !group.hidden && (
                <div className="mt-2 space-y-1 border-t border-gray-100 pt-2">
                  {group.nodeIds.map((nodeId) => (
                    <div key={nodeId} className="truncate text-xs text-gray-700">
                      • {nodeById.get(nodeId)?.data?.name || nodeId}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

