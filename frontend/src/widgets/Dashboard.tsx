import React, { useMemo } from 'react'
import { AlertTriangle, CheckCircle2, Server, ShieldAlert, Wrench, Zap } from 'lucide-react'
import { Node } from 'reactflow'
import { ValidationIssue } from '@/shared/store/projectStore'

interface DashboardProps {
  nodes: Node[]
  validationIssues: ValidationIssue[]
}

function estimateNodeCost(node: Node): number {
  const explicit = Number(node.data?.estimated_cost_usd || 0)
  if (explicit > 0) return explicit

  const type = String(node.data?.type || '').toLowerCase()
  if (type.includes('camera')) return 350
  if (type.includes('nvr')) return 2200
  if (type.includes('server')) return 3000
  if (type.includes('switch')) return 900
  if (type.includes('ups')) return 800
  if (type.includes('gateway')) return 600
  if (type.includes('controller')) return 700
  return 500
}

export function Dashboard({ nodes, validationIssues }: DashboardProps) {
  const metrics = useMemo(() => {
    const totalDevices = nodes.length
    const totalPower = nodes.reduce(
      (sum, node) => sum + Number(node.data?.power_consumption_watts || 0),
      0
    )
    const totalBandwidth = nodes.reduce(
      (sum, node) => sum + Number(node.data?.bandwidth_requires_mbps || 0),
      0
    )
    const totalStorage = nodes.reduce(
      (sum, node) => sum + Number(node.data?.storage_capacity_gb || 0),
      0
    )
    const totalCost = nodes.reduce((sum, node) => sum + estimateNodeCost(node), 0)

    return {
      totalDevices,
      totalPower,
      totalBandwidth,
      totalStorage,
      totalCost,
    }
  }, [nodes])

  const thresholdWarnings = useMemo(() => {
    const warnings: string[] = []
    if (metrics.totalPower > 1000) {
      warnings.push(
        `Power budget exceeded: ${metrics.totalPower}W > 1000W`
      )
    }
    if (metrics.totalBandwidth > 40) {
      warnings.push(
        `Bandwidth limit exceeded: ${metrics.totalBandwidth} Mbps > 40 Mbps`
      )
    }
    return warnings
  }, [metrics.totalBandwidth, metrics.totalPower])

  const errorsCount = validationIssues.filter((issue) => issue.type === 'error').length
  const warningsCount =
    validationIssues.filter((issue) => issue.type === 'warning').length + thresholdWarnings.length

  const readiness = errorsCount > 0 ? 'critical' : warningsCount > 0 ? 'needs-fixes' : 'ready'

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
        <Server className="h-4 w-4 text-brand-600" />
        Project Dashboard
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-5">
        <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Devices</div>
          <div className="mt-1 text-lg font-bold text-slate-900">{metrics.totalDevices}</div>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Power</div>
          <div className="mt-1 text-lg font-bold text-slate-900">{metrics.totalPower} W</div>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Bandwidth</div>
          <div className="mt-1 text-lg font-bold text-slate-900">{metrics.totalBandwidth} Mbps</div>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Storage</div>
          <div className="mt-1 text-lg font-bold text-slate-900">{metrics.totalStorage} GB</div>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-2">
          <div className="text-[11px] uppercase tracking-wide text-slate-500">Est. Cost</div>
          <div className="mt-1 text-lg font-bold text-slate-900">
            ${metrics.totalCost.toLocaleString()}
          </div>
        </div>
      </div>

      {thresholdWarnings.length > 0 && (
        <div className="mt-3 space-y-1 rounded-md border border-amber-200 bg-amber-50 p-3">
          {thresholdWarnings.map((warning) => (
            <div key={warning} className="flex items-start gap-2 text-xs text-amber-900">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 rounded-md border p-3 text-sm">
        {readiness === 'ready' && (
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            System is ready for deployment
          </div>
        )}
        {readiness === 'needs-fixes' && (
          <div className="flex items-center gap-2 text-amber-700">
            <Wrench className="h-4 w-4" />
            {warningsCount} fixes required before deployment
          </div>
        )}
        {readiness === 'critical' && (
          <div className="flex items-center gap-2 text-red-700">
            <ShieldAlert className="h-4 w-4" />
            Critical validation issues detected
          </div>
        )}
        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <Zap className="h-3.5 w-3.5" />
          Readiness updates in real time
        </div>
      </div>
    </div>
  )
}

