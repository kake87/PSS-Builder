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

interface DeviceInterface {
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
  occupied_count?: number
  group_usage_count?: number
  poe_draw_watts?: number
  group_poe_draw_watts?: number
  members?: string[]
}

interface DeviceData {
  name: string
  type: string
  model: string
  manufacturer?: string
  status?: 'valid' | 'warning' | 'error' | 'draft' | 'active' | 'info'
  ports?: DevicePort[]
  interfaces?: DeviceInterface[]
  power_consumption_watts?: number
  resolution?: string
  viewMode?: 'icon' | 'hybrid' | 'text'
}

type DeviceNodeProps = NodeProps<DeviceData>
type PortSide = 'top' | 'left' | 'right'
type InterfaceSide = 'top' | 'left' | 'right'

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

function getInterfaceColor(kind: string) {
  const value = String(kind || '').toLowerCase()
  if (value.includes('poe')) return 'bg-cyan-500 text-cyan-50'
  if (value.includes('fiber')) return 'bg-violet-500 text-violet-50'
  if (value.includes('power')) return 'bg-amber-500 text-amber-50'
  if (value.includes('serial') || value.includes('alarm')) return 'bg-emerald-500 text-emerald-50'
  return 'bg-blue-500 text-blue-50'
}

function getInterfaceState(item: DeviceInterface) {
  const capacity = item.capacity?.port_count || 1
  const occupied = item.occupied_count || 0
  const poeBudget = Number(item.capacity?.poe_budget_watts || 0)
  const poeDraw = Number(item.poe_draw_watts || 0)

  if (poeBudget > 0 && poeDraw > poeBudget) {
    return 'overflow'
  }
  if (poeBudget > 0 && poeDraw >= poeBudget && poeDraw > 0) {
    return 'full'
  }

  if (occupied > capacity) {
    return 'overflow'
  }
  if (occupied === capacity && occupied > 0) {
    return 'full'
  }
  if (occupied > 0) {
    return 'used'
  }
  return 'idle'
}

function getInterfaceTabTone(kind: string, state: ReturnType<typeof getInterfaceState>) {
  const kindValue = String(kind || '').toLowerCase()
  const baseTone = kindValue.includes('poe')
    ? 'border-cyan-200 bg-cyan-50 text-cyan-700 shadow-cyan-100'
    : kindValue.includes('fiber')
    ? 'border-violet-200 bg-violet-50 text-violet-700 shadow-violet-100'
    : kindValue.includes('power')
    ? 'border-amber-200 bg-amber-50 text-amber-700 shadow-amber-100'
    : kindValue.includes('serial') || kindValue.includes('alarm')
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 shadow-emerald-100'
    : 'border-blue-200 bg-blue-50 text-blue-700 shadow-blue-100'

  if (state === 'overflow') {
    return 'border-red-300 bg-red-50 text-red-700 shadow-red-100 ring-2 ring-red-200/80'
  }
  if (state === 'full') {
    return 'border-slate-300 bg-slate-100 text-slate-700 shadow-slate-200'
  }
  if (state === 'used') {
    return baseTone.replace('50', '100')
  }
  return baseTone
}

function resolveInterfaceSide(item: DeviceInterface): InterfaceSide {
  const kind = String(item.kind || '').toLowerCase()
  if (kind.includes('power')) return 'top'
  if (kind.includes('serial') || kind.includes('alarm')) return 'left'
  return 'right'
}

function buildDisplayedInterfaces(deviceType: string, interfaces: DeviceInterface[]): DeviceInterface[] {
  if (String(deviceType).toLowerCase() !== 'switch') {
    return interfaces
  }

  const groups = new Map<string, DeviceInterface>()
  for (const item of interfaces) {
    const key = item.kind
    const existing = groups.get(key)
    if (existing) {
      existing.capacity = {
        ...existing.capacity,
        port_count: (existing.capacity?.port_count || 1) + 1,
        poe_budget_watts:
          (existing.capacity?.poe_budget_watts || 0) + (item.capacity?.poe_budget_watts || 0),
      }
      existing.occupied_count = (existing.occupied_count || 0) + (item.occupied_count || 0)
      existing.poe_draw_watts = item.group_poe_draw_watts || existing.poe_draw_watts || 0
      existing.members = [...(existing.members || []), item.id]
      continue
    }

    groups.set(key, {
      ...item,
      id: `group-${item.kind}`,
      label:
        item.kind === 'poe_ethernet'
          ? 'PoE Access'
          : item.kind === 'ethernet'
          ? 'LAN'
          : item.kind === 'fiber'
          ? 'Fiber'
          : item.label,
      capacity: {
        ...item.capacity,
        port_count: 1,
      },
      occupied_count: (item.occupied_count || 0) + (item.group_usage_count || 0),
      poe_draw_watts: item.group_poe_draw_watts || item.poe_draw_watts || 0,
      members: [item.id],
    })
  }

  return Array.from(groups.values())
}

export function DeviceNode({ data, selected }: DeviceNodeProps) {
  const [hoveredPortId, setHoveredPortId] = React.useState<string | null>(null)
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
  const interfaces = buildDisplayedInterfaces(
    data.type,
    (data.interfaces || []).filter((item) => item.visible_by_default !== false)
  )
  const primaryInterfaces = interfaces.filter((item) => item.role === 'primary')
  const secondaryInterfaces = interfaces.filter((item) => item.role !== 'primary')
  const topPorts = ports.filter((port) => resolvePortSide(port) === 'top')
  const leftPorts = ports.filter((port) => resolvePortSide(port) === 'left')
  const rightPorts = ports.filter((port) => resolvePortSide(port) === 'right')
  const topInterfaces = primaryInterfaces.concat(secondaryInterfaces).filter((item) => resolveInterfaceSide(item) === 'top')
  const leftInterfaces = primaryInterfaces.concat(secondaryInterfaces).filter((item) => resolveInterfaceSide(item) === 'left')
  const rightInterfaces = primaryInterfaces.concat(secondaryInterfaces).filter((item) => resolveInterfaceSide(item) === 'right')
  const hoveredPort = ports.find((port) => port.id === hoveredPortId) || null
  const getUsageText = (item: DeviceInterface) => {
    const poeBudget = Number(item.capacity?.poe_budget_watts || 0)
    const poeDraw = Number(item.poe_draw_watts || 0)
    if (poeBudget > 0) {
      return `${poeDraw.toFixed(0)}/${poeBudget.toFixed(0)}W`
    }
    const capacity = item.capacity?.port_count || 1
    const occupied = item.occupied_count || 0
    if (capacity <= 1 && occupied === 0) {
      return null
    }
    return `${occupied}/${capacity}`
  }
  const renderInterfaceLabel = (item: DeviceInterface) =>
    `${item.label}${
      item.capacity?.port_count && item.capacity.port_count > 1 ? ` x${item.capacity.port_count}` : ''
    }`
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

      {interfaces.length > 0
        ? topInterfaces.map((item, index) => (
            <React.Fragment key={`${item.id}-top`}>
              <Handle
                type="target"
                position={Position.Top}
                id={`in-${item.id}`}
                style={{ left: `${18 + index * 24}%`, top: -14 }}
                className="!h-7 !w-14 !rounded-full !border-2 !border-white !bg-transparent !shadow-none"
              />
              <Handle
                type="source"
                position={Position.Top}
                id={`out-${item.id}`}
                style={{ left: `${18 + index * 24}%`, top: -14 }}
                className="!h-7 !w-14 !rounded-full !border-2 !border-white !bg-transparent !shadow-none"
              />
              <div
                className={`pointer-events-none absolute top-[-14px] z-10 flex h-7 min-w-[68px] -translate-x-1/2 items-center gap-1 rounded-full border px-2.5 text-[10px] font-semibold shadow-sm ${getInterfaceTabTone(
                  item.kind,
                  getInterfaceState(item)
                )}`}
                style={{ left: `${18 + index * 24}%` }}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${getPortColor(item.kind)}`} />
                <span>{renderInterfaceLabel(item)}</span>
                {getUsageText(item) ? (
                  <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] font-bold text-slate-700">
                    {getUsageText(item)}
                  </span>
                ) : null}
              </div>
            </React.Fragment>
          ))
        : topPorts.map((port, index) => (
        <React.Fragment key={`${port.id}-top`}>
          <Handle
            type="target"
            position={Position.Top}
            id={`in-${port.id}`}
            style={{ left: `${16 + index * 20}%`, top: -13 }}
            className={`${handleClassBase} ${getPortColor(port.type || port.port_type)}`}
            onMouseEnter={() => setHoveredPortId(port.id)}
            onMouseLeave={() => setHoveredPortId((current) => (current === port.id ? null : current))}
          />
          <Handle
            type="source"
            position={Position.Top}
            id={`out-${port.id}`}
            style={{ left: `${16 + index * 20}%`, top: -3 }}
            className={`${handleClassBase} ${getPortColor(port.type || port.port_type)}`}
            onMouseEnter={() => setHoveredPortId(port.id)}
            onMouseLeave={() => setHoveredPortId((current) => (current === port.id ? null : current))}
          />
        </React.Fragment>
      ))}

      {interfaces.length > 0
        ? leftInterfaces.map((item, index) => (
            <React.Fragment key={`${item.id}-left`}>
              <Handle
                type="target"
                position={Position.Left}
                id={`in-${item.id}`}
                style={{ top: `${92 + index * 28}px`, left: -22 }}
                className="!h-7 !w-16 !rounded-full !border-2 !border-white !bg-transparent !shadow-none"
              />
              <Handle
                type="source"
                position={Position.Left}
                id={`out-${item.id}`}
                style={{ top: `${92 + index * 28}px`, left: -22 }}
                className="!h-7 !w-16 !rounded-full !border-2 !border-white !bg-transparent !shadow-none"
              />
              <div
                className={`pointer-events-none absolute left-[-22px] z-10 flex h-7 min-w-[74px] -translate-x-full items-center gap-1 rounded-full border px-2.5 text-[10px] font-semibold shadow-sm ${getInterfaceTabTone(
                  item.kind,
                  getInterfaceState(item)
                )}`}
                style={{ top: `${92 + index * 28}px`, transform: 'translateY(-50%)' }}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${getPortColor(item.kind)}`} />
                <span>{renderInterfaceLabel(item)}</span>
                {getUsageText(item) ? (
                  <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] font-bold text-slate-700">
                    {getUsageText(item)}
                  </span>
                ) : null}
              </div>
            </React.Fragment>
          ))
        : leftPorts.map((port, index) => (
        <React.Fragment key={`${port.id}-left`}>
          <Handle
            type="target"
            position={Position.Left}
            id={`in-${port.id}`}
            style={{ top: `${90 + index * 24}px`, left: -13 }}
            className={`${handleClassBase} ${getPortColor(port.type || port.port_type)}`}
            onMouseEnter={() => setHoveredPortId(port.id)}
            onMouseLeave={() => setHoveredPortId((current) => (current === port.id ? null : current))}
          />
          <Handle
            type="source"
            position={Position.Left}
            id={`out-${port.id}`}
            style={{ top: `${90 + index * 24}px`, left: -3 }}
            className={`${handleClassBase} ${getPortColor(port.type || port.port_type)}`}
            onMouseEnter={() => setHoveredPortId(port.id)}
            onMouseLeave={() => setHoveredPortId((current) => (current === port.id ? null : current))}
          />
        </React.Fragment>
      ))}

      {interfaces.length > 0
        ? rightInterfaces.map((item, index) => (
            <React.Fragment key={`${item.id}-right`}>
              <Handle
                type="target"
                position={Position.Right}
                id={`in-${item.id}`}
                style={{ top: `${92 + index * 28}px`, right: -22 }}
                className="!h-7 !w-16 !rounded-full !border-2 !border-white !bg-transparent !shadow-none"
              />
              <Handle
                type="source"
                position={Position.Right}
                id={`out-${item.id}`}
                style={{ top: `${92 + index * 28}px`, right: -22 }}
                className="!h-7 !w-16 !rounded-full !border-2 !border-white !bg-transparent !shadow-none"
              />
              <div
                className={`pointer-events-none absolute right-[-22px] z-10 flex h-7 min-w-[74px] translate-x-full items-center gap-1 rounded-full border px-2.5 text-[10px] font-semibold shadow-sm ${getInterfaceTabTone(
                  item.kind,
                  getInterfaceState(item)
                )}`}
                style={{ top: `${92 + index * 28}px`, transform: 'translateY(-50%)' }}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${getPortColor(item.kind)}`} />
                <span>{renderInterfaceLabel(item)}</span>
                {getUsageText(item) ? (
                  <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] font-bold text-slate-700">
                    {getUsageText(item)}
                  </span>
                ) : null}
              </div>
            </React.Fragment>
          ))
        : rightPorts.map((port, index) => (
        <React.Fragment key={`${port.id}-right`}>
          <Handle
            type="target"
            position={Position.Right}
            id={`in-${port.id}`}
            style={{ top: `${90 + index * 24}px`, right: -13 }}
            className={`${handleClassBase} ${getPortColor(port.type || port.port_type)}`}
            onMouseEnter={() => setHoveredPortId(port.id)}
            onMouseLeave={() => setHoveredPortId((current) => (current === port.id ? null : current))}
          />
          <Handle
            type="source"
            position={Position.Right}
            id={`out-${port.id}`}
            style={{ top: `${90 + index * 24}px`, right: -3 }}
            className={`${handleClassBase} ${getPortColor(port.type || port.port_type)}`}
            onMouseEnter={() => setHoveredPortId(port.id)}
            onMouseLeave={() => setHoveredPortId((current) => (current === port.id ? null : current))}
          />
        </React.Fragment>
      ))}

      {hoveredPort && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-20 min-w-[180px] -translate-x-1/2 rounded-lg border border-slate-200 bg-white/96 px-3 py-2 text-[11px] shadow-xl backdrop-blur">
          <div className="font-semibold text-slate-900">{hoveredPort.name}</div>
          <div className="mt-1 text-slate-600">
            Type: {hoveredPort.type || hoveredPort.port_type || 'Unknown'}
          </div>
          <div className="text-slate-600">
            Speed: {hoveredPort.speed_mbps ? `${hoveredPort.speed_mbps} Mbps` : 'n/a'}
          </div>
          <div className="text-slate-600">
            Power: {hoveredPort.power_watts ? `${hoveredPort.power_watts} W` : 'n/a'}
          </div>
        </div>
      )}

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
        <div className="rounded-md bg-slate-100 px-2 py-1">
          {interfaces.length > 0 ? `Interfaces: ${interfaces.length}` : `Ports: ${ports.length}`}
        </div>
        {data.resolution ? (
          <div className="col-span-2 rounded-md bg-slate-100 px-2 py-1">
            Resolution: {data.resolution}
          </div>
        ) : null}
      </div>

      {interfaces.length > 0 && (
        <div className="mt-3 border-t border-slate-200 pt-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Connectivity
          </div>
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            {interfaces.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium shadow-sm ${getInterfaceTabTone(
                  item.kind,
                  getInterfaceState(item)
                )}`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${getPortColor(item.kind)}`} />
                <span>{renderInterfaceLabel(item)}</span>
                {getUsageText(item) ? (
                  <span className="rounded-full bg-white/80 px-1.5 py-0.5 text-[9px] font-bold text-slate-700">
                    {getUsageText(item)}
                  </span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {interfaces.length === 0 && ports.length > 0 && (
        <div className="mt-3 border-t border-slate-200 pt-3">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">
            Interfaces
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            {ports.slice(0, 8).map((port) => (
              <div
                key={port.id}
                className="flex items-center gap-1.5 rounded bg-slate-100 px-2 py-1 text-slate-700"
                onMouseEnter={() => setHoveredPortId(port.id)}
                onMouseLeave={() => setHoveredPortId((current) => (current === port.id ? null : current))}
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
