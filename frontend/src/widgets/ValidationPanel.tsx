import React from 'react'
import { AlertCircle, AlertTriangle, CheckCircle, Info, Zap } from 'lucide-react'
import { ValidationIssue } from '@/shared/store/projectStore'

interface ValidationPanelProps {
  errors: ValidationIssue[]
  onSelectError?: (id: string) => void
  isValidating?: boolean
}

const severityOrder: ValidationIssue['type'][] = ['error', 'warning', 'info']

export function ValidationPanel({
  errors,
  onSelectError,
  isValidating = false,
}: ValidationPanelProps) {
  const errorsByType = errors.reduce(
    (acc, error) => {
      if (!acc[error.type]) {
        acc[error.type] = []
      }
      acc[error.type].push(error)
      return acc
    },
    {} as Record<string, typeof errors>
  )

  const severities = errors.reduce(
    (acc, error) => {
      if (error.type.includes('error')) {
        acc.errors++
      } else if (error.type.includes('warning')) {
        acc.warnings++
      } else {
        acc.info++
      }
      return acc
    },
    { errors: 0, warnings: 0, info: 0 }
  )

  const orderedEntries = severityOrder
    .filter((type) => errorsByType[type]?.length)
    .map((type) => [type, errorsByType[type]] as const)

  return (
    <div className="validation-panel h-full flex flex-col bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-brand-500" />
            <h3 className="font-bold text-gray-900">Validation</h3>
          </div>
          {isValidating && (
            <div className="text-xs font-medium text-brand-600">Checking...</div>
          )}
        </div>
        {isValidating && (
          <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-brand-100">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-brand-500" />
          </div>
        )}
      </div>

      {/* Summary stats */}
      <div className="px-4 py-3 border-b border-gray-200 grid grid-cols-3 gap-2 flex-shrink-0">
        {/* Errors */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-3 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <div className="text-2xl font-bold text-red-600">{severities.errors}</div>
          </div>
          <div className="text-xs font-medium text-red-700">Errors</div>
        </div>

        {/* Warnings */}
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg p-3 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <div className="text-2xl font-bold text-yellow-600">{severities.warnings}</div>
          </div>
          <div className="text-xs font-medium text-yellow-700">Warnings</div>
        </div>

        {/* Info */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-1">
            <Info className="w-4 h-4 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">{severities.info}</div>
          </div>
          <div className="text-xs font-medium text-blue-700">Info</div>
        </div>
      </div>

      {/* Issues list */}
      <div className="flex-1 overflow-y-auto space-y-1 px-2 py-2">
        {errors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-green-600">
            <div className="p-3 bg-green-100 rounded-full mb-2">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="text-sm font-medium">All checks passed!</div>
            <div className="text-xs text-green-600 mt-1">Your design is valid</div>
          </div>
        ) : (
          orderedEntries.map(([type, typeErrors]) => (
            <div key={type} className="space-y-1">
              {/* Type header */}
              <div className="px-2 py-1.5 flex items-center gap-2">
                {type.includes('error') && (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <h4 className="text-xs font-bold text-red-700 uppercase">Errors ({typeErrors.length})</h4>
                  </>
                )}
                {type.includes('warning') && (
                  <>
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <h4 className="text-xs font-bold text-yellow-700 uppercase">Warnings ({typeErrors.length})</h4>
                  </>
                )}
                {type.includes('info') && (
                  <>
                    <Info className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold text-blue-700 uppercase">Info ({typeErrors.length})</h4>
                  </>
                )}
              </div>

              {/* Error items */}
              {typeErrors.map((error) => (
                <button
                  key={error.id}
                  onClick={() => onSelectError?.(error.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    type.includes('error')
                      ? 'border-red-200 hover:bg-red-50 hover:border-red-300 hover:shadow-sm'
                      : type.includes('warning')
                      ? 'border-yellow-200 hover:bg-yellow-50 hover:border-yellow-300 hover:shadow-sm'
                      : 'border-blue-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {type.includes('error') && (
                      <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    {type.includes('warning') && (
                      <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    )}
                    {type.includes('info') && (
                      <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${
                        type.includes('error')
                          ? 'text-red-900'
                          : type.includes('warning')
                          ? 'text-yellow-900'
                          : 'text-blue-900'
                      }`}>
                        {error.message}
                      </p>
                      {error.targetId && (
                        <div className="mt-2 text-xs text-gray-500">
                          {error.targetType === 'edge' ? 'Edge' : 'Node'}: {error.targetId}
                          {error.source ? ` • ${error.source}` : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
