/**
 * Tool Execution Panel Component
 *
 * Displays tool execution progress and results
 */

'use client';

import React, { useState } from 'react';
import { ToolExecution } from '@/services/concierge/types';
import { Wrench, Check, X, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface ToolExecutionPanelProps {
  executions: ToolExecution[];
  collapsible?: boolean;
}

export function ToolExecutionPanel({ executions, collapsible = true }: ToolExecutionPanelProps) {
  const [expanded, setExpanded] = useState(true);

  if (executions.length === 0) return null;

  const allComplete = executions.every((e) => e.status === 'complete');
  const hasErrors = executions.some((e) => e.status === 'error');

  return (
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className={`flex items-center justify-between px-3 py-2 ${
          collapsible ? 'cursor-pointer hover:bg-gray-900/70' : ''
        }`}
        onClick={() => collapsible && setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Wrench className="w-4 h-4" />
          <span>
            Tool Execution {executions.length > 1 && `(${executions.length} tools)`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!allComplete && !hasErrors && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
          {allComplete && <Check className="w-4 h-4 text-green-400" />}
          {hasErrors && <X className="w-4 h-4 text-red-400" />}

          {collapsible && (
            expanded ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )
          )}
        </div>
      </div>

      {/* Tool list */}
      {expanded && (
        <div className="px-3 py-2 space-y-2 border-t border-gray-700">
          {executions.map((execution, index) => (
            <ToolExecutionItem key={execution.id} execution={execution} index={index + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Individual tool execution item
 */
function ToolExecutionItem({ execution, index }: { execution: ToolExecution; index: number }) {
  const [showDetails, setShowDetails] = useState(false);

  const statusIcon = {
    pending: <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />,
    running: <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />,
    complete: <Check className="w-4 h-4 text-green-400" />,
    error: <X className="w-4 h-4 text-red-400" />,
  }[execution.status];

  const statusText = {
    pending: 'Pending',
    running: 'Running',
    complete: 'Complete',
    error: 'Error',
  }[execution.status];

  return (
    <div className="text-sm">
      {/* Tool header */}
      <div className="flex items-start gap-2">
        <span className="text-gray-500 flex-shrink-0">{index}.</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <code className="text-blue-300 font-mono text-xs">{execution.toolName}()</code>
            {statusIcon}
            <span className="text-xs text-gray-500">{statusText}</span>
          </div>

          {/* Parameters (collapsed by default) */}
          {execution.params && Object.keys(execution.params).length > 0 && (
            <div className="mt-1 text-xs text-gray-400">
              ├─ {Object.keys(execution.params).length} parameter
              {Object.keys(execution.params).length > 1 ? 's' : ''}
            </div>
          )}

          {/* Progress bar */}
          {execution.status === 'running' && execution.progress !== undefined && (
            <div className="mt-2">
              <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-full transition-all duration-300"
                  style={{ width: `${execution.progress}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-gray-500 text-right">{execution.progress}%</div>
            </div>
          )}

          {/* Result summary */}
          {execution.status === 'complete' && execution.result && (
            <div className="mt-1 text-xs text-green-400">
              └─ {getResultSummary(execution.result)}
            </div>
          )}

          {/* Error message */}
          {execution.status === 'error' && execution.error && (
            <div className="mt-1 text-xs text-red-400">└─ Error: {execution.error}</div>
          )}

          {/* Duration */}
          {execution.durationMs && (
            <div className="mt-1 text-xs text-gray-500">
              Completed in {(execution.durationMs / 1000).toFixed(2)}s
            </div>
          )}

          {/* Details toggle */}
          {(execution.params || execution.result) && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              {showDetails ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Show Details
                </>
              )}
            </button>
          )}

          {/* Expanded details */}
          {showDetails && (
            <div className="mt-2 space-y-2">
              {execution.params && (
                <div className="bg-gray-950/50 rounded p-2">
                  <div className="text-xs text-gray-400 mb-1">Parameters:</div>
                  <pre className="text-xs text-gray-300 overflow-x-auto">
                    {JSON.stringify(execution.params, null, 2)}
                  </pre>
                </div>
              )}

              {execution.result && (
                <div className="bg-gray-950/50 rounded p-2">
                  <div className="text-xs text-gray-400 mb-1">Result:</div>
                  <pre className="text-xs text-gray-300 overflow-x-auto max-h-40">
                    {JSON.stringify(execution.result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Generate a human-readable summary from result data
 */
function getResultSummary(result: unknown): string {
  if (!result) return 'No data';

  if (Array.isArray(result)) {
    return `Retrieved ${result.length} record${result.length !== 1 ? 's' : ''}`;
  }

  if (typeof result === 'object') {
    const obj = result as Record<string, unknown>;

    if ('count' in obj) {
      return `Retrieved ${obj.count} records`;
    }

    if ('success' in obj && obj.success) {
      return 'Success';
    }

    const keys = Object.keys(obj).length;
    return `${keys} field${keys !== 1 ? 's' : ''}`;
  }

  return String(result);
}
