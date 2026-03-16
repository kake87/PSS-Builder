import React, { useMemo } from 'react'
import { Node } from 'reactflow'
import { Download, FileSpreadsheet, Package2 } from 'lucide-react'
import { emitToast } from '@/widgets/Toast'

interface SpecificationRow {
  key: string
  type: string
  manufacturer: string
  model: string
  quantity: number
  totalPower: number
  totalBandwidth: number
}

interface SpecificationPanelProps {
  nodes: Node[]
  projectName?: string
}

function escapeCsv(value: string | number): string {
  const text = String(value ?? '')
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function SpecificationPanel({ nodes, projectName }: SpecificationPanelProps) {
  const rows = useMemo<SpecificationRow[]>(() => {
    const grouped = new Map<string, SpecificationRow>()

    for (const node of nodes) {
      const type = String(node.data?.type || 'device')
      const manufacturer = String(node.data?.manufacturer || 'Unknown')
      const model = String(node.data?.model || 'Unknown')
      const key = `${type}::${manufacturer}::${model}`
      const existing = grouped.get(key)

      if (existing) {
        existing.quantity += 1
        existing.totalPower += Number(node.data?.power_consumption_watts || 0)
        existing.totalBandwidth += Number(node.data?.bandwidth_requires_mbps || 0)
        continue
      }

      grouped.set(key, {
        key,
        type,
        manufacturer,
        model,
        quantity: 1,
        totalPower: Number(node.data?.power_consumption_watts || 0),
        totalBandwidth: Number(node.data?.bandwidth_requires_mbps || 0),
      })
    }

    return Array.from(grouped.values()).sort((a, b) =>
      `${a.type} ${a.manufacturer} ${a.model}`.localeCompare(
        `${b.type} ${b.manufacturer} ${b.model}`
      )
    )
  }, [nodes])

  const totals = useMemo(
    () => ({
      quantity: rows.reduce((sum, row) => sum + row.quantity, 0),
      power: rows.reduce((sum, row) => sum + row.totalPower, 0),
      bandwidth: rows.reduce((sum, row) => sum + row.totalBandwidth, 0),
    }),
    [rows]
  )

  const handleExportCsv = () => {
    const header = [
      'Type',
      'Manufacturer',
      'Model',
      'Quantity',
      'Total Power (W)',
      'Total Bandwidth (Mbps)',
    ]
    const lines = [
      header.join(','),
      ...rows.map((row) =>
        [
          row.type,
          row.manufacturer,
          row.model,
          row.quantity,
          row.totalPower,
          row.totalBandwidth,
        ]
          .map(escapeCsv)
          .join(',')
      ),
    ]

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const date = new Date().toISOString().slice(0, 10)
    link.href = url
    link.download = `${(projectName || 'pss-project').replace(/\s+/g, '-').toLowerCase()}-spec-${date}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    emitToast('Specification exported as CSV', 'success')
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="pss-panel flex items-center justify-between rounded-[24px] px-6 py-5">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <FileSpreadsheet className="h-4 w-4 text-brand-600" />
            Equipment Specification
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Aggregated bill of materials for export to Excel-compatible CSV.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExportCsv}
          disabled={rows.length === 0}
          className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="pss-panel rounded-[20px] px-5 py-4">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Unique items</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{rows.length}</div>
        </div>
        <div className="pss-panel rounded-[20px] px-5 py-4">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Total units</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{totals.quantity}</div>
        </div>
        <div className="pss-panel rounded-[20px] px-5 py-4">
          <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Total power</div>
          <div className="mt-2 text-3xl font-semibold text-slate-950">{totals.power} W</div>
        </div>
      </div>

      <div className="pss-panel min-h-0 flex-1 overflow-hidden rounded-[24px]">
        {rows.length === 0 ? (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center px-6 text-center text-slate-500">
            <Package2 className="h-12 w-12 text-slate-300" />
            <div className="mt-3 text-base font-medium text-slate-700">No specification yet</div>
            <p className="mt-2 max-w-md text-sm leading-6">
              Add devices to the project in Design or Catalog mode, then return here to export the specification.
            </p>
          </div>
        ) : (
          <div className="h-full overflow-auto">
            <table className="min-w-full border-separate border-spacing-0 text-sm">
              <thead className="sticky top-0 bg-slate-950 text-left text-slate-100">
                <tr>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Manufacturer</th>
                  <th className="px-4 py-3 font-medium">Model</th>
                  <th className="px-4 py-3 font-medium">Qty</th>
                  <th className="px-4 py-3 font-medium">Power</th>
                  <th className="px-4 py-3 font-medium">Bandwidth</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={row.key}
                    className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}
                  >
                    <td className="border-b border-slate-200 px-4 py-3 capitalize text-slate-700">
                      {row.type.replace(/_/g, ' ')}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-3 text-slate-700">
                      {row.manufacturer}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-3 font-medium text-slate-900">
                      {row.model}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-3 text-slate-700">
                      {row.quantity}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-3 text-slate-700">
                      {row.totalPower}
                    </td>
                    <td className="border-b border-slate-200 px-4 py-3 text-slate-700">
                      {row.totalBandwidth}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
