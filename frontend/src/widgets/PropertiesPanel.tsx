import React from 'react'
import { Edge, Node } from 'reactflow'
import { Settings, Plug, Radio, Lock } from 'lucide-react'

interface PropertiesPanelProps {
  selectedNodeId: string | null
  selectedEdgeId: string | null
  nodes: Node[]
  edges: Edge[]
  onUpdateNode: (id: string, updates: any) => void
}

export function PropertiesPanel({
  selectedNodeId,
  selectedEdgeId,
  nodes,
  edges,
  onUpdateNode,
}: PropertiesPanelProps) {
  const nameInputRef = React.useRef<HTMLInputElement>(null)
  const selectedNode = nodes.find((node) => node.id === selectedNodeId)
  const selectedEdge = edges.find((edge) => edge.id === selectedEdgeId)
  const connectedEdges = edges.filter(
    (edge) => edge.source === selectedNodeId || edge.target === selectedNodeId
  )
  const sourceNode = nodes.find((node) => node.id === selectedEdge?.source)
  const targetNode = nodes.find((node) => node.id === selectedEdge?.target)

  React.useEffect(() => {
    const handleFocusName = () => nameInputRef.current?.focus()
    window.addEventListener('psb-focus-node-name', handleFocusName)
    return () => window.removeEventListener('psb-focus-node-name', handleFocusName)
  }, [])

  if (!selectedNode && !selectedEdge) {
    return (
      <div className="properties-panel flex h-full flex-col bg-white">
        <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 px-4 py-3">
          <Settings className="h-5 w-5 text-brand-500" />
          <h3 className="font-bold text-gray-900">Properties</h3>
        </div>
        <div className="flex flex-1 items-center justify-center text-gray-500">
          <div className="text-center">
            <Lock className="mx-auto mb-2 h-12 w-12 text-gray-300" />
            <p className="text-sm font-medium">Select a device or link to view properties</p>
          </div>
        </div>
      </div>
    )
  }

  if (!selectedNode && selectedEdge) {
    return (
      <div className="properties-panel flex h-full flex-col overflow-hidden bg-white">
        <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 px-4 py-3">
          <Settings className="h-5 w-5 text-brand-500" />
          <h3 className="font-bold text-gray-900">Connection Properties</h3>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Connection</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">
              {sourceNode?.data?.name || selectedEdge.source} → {targetNode?.data?.name || selectedEdge.target}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Cable Type</div>
            <div className="mt-1 text-sm font-medium text-slate-900">
              {selectedEdge.data?.cable_type || 'N/A'}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Length</div>
            <div className="mt-1 text-sm font-medium text-slate-900">
              {selectedEdge.data?.length_meters ? `${selectedEdge.data.length_meters} m` : 'N/A'}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500">Bandwidth</div>
            <div className="mt-1 text-sm font-medium text-slate-900">
              {selectedEdge.data?.bandwidth_mbps
                ? `${selectedEdge.data.bandwidth_mbps} Mbps`
                : selectedEdge.data?.speed_mbps
                ? `${selectedEdge.data.speed_mbps} Mbps`
                : 'N/A'}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const device = selectedNode.data

  return (
    <div className="properties-panel flex h-full flex-col overflow-hidden bg-white">
      <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 px-4 py-3">
        <Settings className="h-5 w-5 text-brand-500" />
        <h3 className="font-bold text-gray-900">Device Properties</h3>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div className="space-y-3 border-b border-gray-200 pb-4">
          <div>
            <label className="text-xs font-semibold uppercase text-gray-700">Device Name</label>
            <input
              ref={nameInputRef}
              type="text"
              value={device.name}
              onChange={(event) =>
                onUpdateNode(selectedNodeId, {
                  data: { ...device, name: event.target.value },
                })
              }
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition focus:border-transparent focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold uppercase text-gray-700">Type</label>
              <div className="mt-2 rounded-lg border border-brand-200 bg-gradient-to-br from-brand-50 to-brand-100 px-3 py-2 text-sm font-medium text-brand-900">
                {device.type}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase text-gray-700">Status</label>
              <div
                className={`mt-2 rounded-lg px-3 py-2 text-sm font-medium capitalize text-white ${
                  device.status === 'active'
                    ? 'bg-gradient-to-br from-green-500 to-green-600'
                    : device.status === 'error'
                    ? 'bg-gradient-to-br from-red-500 to-red-600'
                    : device.status === 'warning'
                    ? 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                    : 'bg-gradient-to-br from-gray-400 to-gray-500'
                }`}
              >
                {device.status}
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase text-gray-700">Model</label>
            <div className="mt-2 rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700">
              {device.model}
            </div>
          </div>

          {device.manufacturer && (
            <div>
              <label className="text-xs font-semibold uppercase text-gray-700">Manufacturer</label>
              <div className="mt-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                {device.manufacturer}
              </div>
            </div>
          )}
        </div>

        {device.ports && device.ports.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Plug className="h-4 w-4 text-blue-600" />
              <h4 className="text-sm font-bold text-gray-900">Ports ({device.ports.length})</h4>
            </div>
            <div className="space-y-2">
              {device.ports.map((port: any) => {
                const portEdges = connectedEdges.filter(
                  (edge) =>
                    edge.sourceHandle?.includes(port.id) || edge.targetHandle?.includes(port.id)
                )

                return (
                  <div
                    key={port.id}
                    className={`rounded-lg border border-gray-200 border-l-4 p-3 transition-all ${
                      portEdges.length > 0
                        ? 'border-l-green-500 bg-green-50'
                        : 'border-l-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900">{port.name}</div>
                        <div className="mt-1 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <Radio className="h-3 w-3" />
                            {port.type || port.port_type}
                          </div>
                        </div>
                        {port.speed_mbps && (
                          <div className="mt-1 text-xs text-gray-600">
                            Speed: {port.speed_mbps} Mbps
                          </div>
                        )}
                      </div>
                      {portEdges.length > 0 && (
                        <div className="rounded bg-green-200 px-2 py-1 text-xs font-medium text-green-700">
                          {portEdges.length} linked
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {connectedEdges.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Radio className="h-4 w-4 text-purple-600" />
              <h4 className="text-sm font-bold text-gray-900">
                Connections ({connectedEdges.length})
              </h4>
            </div>
            <div className="space-y-2">
              {connectedEdges.map((edge) => (
                <div
                  key={edge.id}
                  className="rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 p-3 transition-all hover:shadow-md"
                >
                  <div className="mb-1 flex items-start justify-between">
                    <div className="text-sm font-medium text-gray-900">
                      {edge.label || 'Connection'}
                    </div>
                    <span className="rounded bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-600">
                      Connected
                    </span>
                  </div>
                  {edge.data?.cable_type && (
                    <div className="text-xs text-gray-600">Cable: {edge.data.cable_type}</div>
                  )}
                  {edge.data?.length_meters && (
                    <div className="mt-1 text-xs text-gray-600">
                      Length: {edge.data.length_meters}m
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
