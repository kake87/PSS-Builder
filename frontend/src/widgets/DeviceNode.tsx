import React from 'react'
import { Handle, NodeProps, Position } from 'reactflow'
import {
  AlertCircle,
  AlertTriangle,
  Camera,
  CheckCircle,
  Cpu,
  Lock,
  Server,
  Wifi,
  Zap,
} from 'lucide-react'

interface DevicePort {
  id: string
  name: string
  type?: string
  port_type?: string
  speed_mbps?: number
  power_watts?: number
}

interface DeviceData {
  name: string
  type: string
  model: string
  manufacturer?: string
  status?: 'valid' | 'warning' | 'error' | 'draft' | 'active' | 'info'
  ports?: DevicePort[]
  power_consumption_watts?: number
  resolution?: string
  viewMode?: 'icon' | 'hybrid' | 'text'
}

type DeviceNodeProps = NodeProps<DeviceData>
type PortSide = 'top' | 'left' | 'right'

function getDeviceIcon(type: string) {
  const iconProps = 'h-5 w-5'
  const typeMap: Record<string, [React.ReactNode, string]> = {
    camera: [<Camera className={`${iconProps} text-red-500`} />, 'bg-red-100'],
    server: [<Server className={`${iconProps} text-blue-500`} />, 'bg-blue-100'],
    switch: [<Cpu className={`${iconProps} text-purple-500`} />, 'bg-purple-100'],
    nvr: [<Server className={`${iconProps} text-indigo-500`} />, 'bg-indigo-100'],
    ups: [<Zap className={`${iconProps} text-yellow-500`} />, 'bg-yellow-100'],
    gateway: [<Wifi className={`${iconProps} text-cyan-500`} />, 'bg-cyan-100'],
    access_controller: [<Lock className={`${iconProps} text-green-500`} />, 'bg-green-100'],
  }

  return typeMap[type.toLowerCase()] || [<Cpu className={`${iconProps} text-gray-500`} />, 'bg-gray-100']
}

function getPortColor(portType: string | undefined) {
  const value = (portType || '').toLowerCase()
  if (value.includes('power')) return 'bg-red-500'
  if (value.includes('poe')) return 'bg-orange-500'
  if (value.includes('serial')) return 'bg-green-500'
  if (value.includes('fiber') || value.includes('optical') || value.includes('sfp')) return 'bg-violet-500'
  return 'bg-blue-500'
}

function resolvePortSide(port: DevicePort): PortSide {
  const value = String(port.type || port.port_type || '').toLowerCase()
  if (value.includes('power')) return 'top'
  if (value.includes('serial')) return 'left'
  return 'right'
}

export function DeviceNode({ data, selected }: DeviceNodeProps) {
  const statusColors = {
    valid: 'border-green-500 shadow-green-200',
    warning: 'border-yellow-500 shadow-yellow-200',
    error: 'border-red-500 shadow-red-200',
    draft: 'border-gray-300 shadow-gray-200',
    active: 'border-slate-700 shadow-slate-300',
    info: 'border-blue-500 shadow-blue-200',
  }

  const statusIcons = {
    valid: <CheckCircle className="h-4 w-4 text-green-600" />,
    warning: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
    error: <AlertCircle className="h-4 w-4 text-red-600" />,
    draft: null,
    active: <CheckCircle className="h-4 w-4 text-slate-700" />,
    info: <AlertCircle className="h-4 w-4 text-blue-600" />,
  }

  const [icon, iconBg] = getDeviceIcon(data.type)
  const viewMode = data.viewMode || 'hybrid'
  const typeBadge = String(data.type || 'device')
    .replace(/_/g, ' ')
    .toUpperCase()
  const status = (data.status || 'draft') as keyof typeof statusColors
  const ports = data.ports || []
  const topPorts = ports.filter((port) => resolvePortSide(port) === 'top')
  const leftPorts = ports.filter((port) => resolvePortSide(port) === 'left')
  const rightPorts = ports.filter((port) => resolvePortSide(port) === 'right')
  const handleClassBase =
    'h-4 w-4 rounded-full border-2 border-white shadow-md ring-2 ring-white/70 transition duration-150 hover:scale-125'

  return (
    <div
      className={`device-node relative min-w-[290px] rounded-xl border-2 bg-gradient-to-b from-slate-100 via-slate-50 to-white px-4 py-3 shadow-xl transition-all hover:shadow-2xl ${
        statusColors[status]
      } ${selected ? 'ring-2 ring-brand-500 ring-offset-2' : ''}`}
    >
      <div className="pointer-events-none absolute bottom-12 left-[-6px] top-16 w-2 rounded-full bg-slate-300/70" />
      <div className="pointer-events-none absolute bottom-12 right-[-6px] top-16 w-2 rounded-full bg-slate-300/70" />
      <div className="pointer-events-none absolute left-12 right-12 top-[-6px] h-2 rounded-full bg-slate-300/70" />

      {topPorts.map((port, index) => (
        <React.Fragment key={`${port.id}-top`}>
          <Handle
            type="target"
            position={Position.Top}
            id={`in-${port.id}`}
            style={{ left: `${16 + index * 20}%`, top: -13 }}
            className={`${handleClassBase} ${getPortColor(port.type || port.port_type)}`}
          />
          <Handle
            type="source"
            position={Position.Top}
            id={`out-${port.id}`}
            style={{ left: `${16 + index * 20}%`, top: -3 }}
            className={`${handleClassBase} ${getPortColor(port.type || port.port_type)}`}
          />
        </React.Fragment>
      ))}

      {leftPorts.map((port, index) => (
        <React.Fragment key={`${port.id}-left`}>
          <Handle
            type="target"
            position={Position.Left}
            id={`in-${port.id}`}
            style={{ top: `${90 + index * 24}px`, left: -13 }}
            className={`${handleClassBase} ${getPortColor(port.type || port.port_type)}`}
          />
          <Handle
            type="source"
            position={Position.Left}
            id={`out-${port.id}`}
            style={{ top: `${90 + index * 24}px`, left: -3 }}
            className={`${handleClassBase} ${getPortColor(port.type || port.port_type)}`}
          />
        </React.Fragment>
      ))}

      {rightPorts.map((port, index) => (
        <React.Fragment key={`${port.id}-right`}>
          <Handle
            type="target"
            position={Position.Right}
            id={`in-${port.id}`}
            style={{ top: `${90 + index * 24}px`, right: -13 }}
            className={`${handleClassBase} ${getPortColor(port.type || port.port_type)}`}
          />
          <Handle
            type="source"
            position={Position.Right}
            id={`out-${port.id}`}
            style={{ top: `${90 + index * 24}px`, right: -3 }}
            className={`${handleClassBase} ${getPortColor(port.type || port.port_type)}`}
          />
        </React.Fragment>
      ))}

      <div className="mb-3 flex items-start gap-3 border-b border-slate-200 pb-3">
        {viewMode !== 'text' ? (
          <div className={`rounded-lg p-2 ${iconBg}`}>{icon}</div>
        ) : (
          <div className="rounded-lg border border-slate-300 bg-slate-100 px-2 py-1 text-[10px] font-semibold tracking-wide text-slate-700">
            {typeBadge}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold uppercase tracking-wide text-slate-900">
            {data.name}
          </div>
          <div className="truncate text-xs text-slate-600">
            {(data.manufacturer || 'Unknown vendor') + ' - ' + data.model}
          </div>
          {viewMode !== 'icon' && (
            <div className="mt-1 inline-flex rounded-md border border-slate-300 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600">
              {typeBadge}
            </div>
          )}
        </div>
        {statusIcons[status]}
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
        <div className="rounded-md bg-slate-100 px-2 py-1">
          Power: {data.power_consumption_watts || 0}W
        </div>
        <div className="rounded-md bg-slate-100 px-2 py-1">Ports: {ports.length}</div>
        {data.resolution ? (
          <div className="col-span-2 rounded-md bg-slate-100 px-2 py-1">
            Resolution: {data.resolution}
          </div>
        ) : null}
      </div>

      {ports.length > 0 && (
        <div className="mt-3 border-t border-slate-200 pt-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Interfaces
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            {ports.slice(0, 8).map((port) => (
              <div
                key={port.id}
                className="flex items-center gap-1.5 rounded bg-slate-100 px-2 py-1 text-slate-700"
              >
                <div className={`h-2.5 w-2.5 rounded-full ${getPortColor(port.type || port.port_type)}`} />
                <span className="truncate">{port.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
