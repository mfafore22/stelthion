'use client';

import type { ActivityRow } from './types';

export function ActivityTable({ rows, labels }: { rows: ActivityRow[]; labels: Record<string, string> }) {
  if (rows.length === 0) {
    return <div className="rounded-xl border border-bo-neutral-200 bg-white p-6 text-sm text-bo-neutral-400">{labels.empty}</div>;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-bo-neutral-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-bo-neutral-100">
          <tr>
            <Th>{labels.time}</Th>
            <Th>{labels.event}</Th>
            <Th>{labels.entity}</Th>
            <Th>{labels.mall}</Th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 80).map((row, index) => (
            <tr key={row.id ?? index} className="border-t border-bo-neutral-100">
              <td className="whitespace-nowrap px-4 py-2 text-xs text-bo-neutral-500">
                {row.createdAt ? new Date(row.createdAt).toLocaleString() : ''}
              </td>
              <td className="px-4 py-2 font-medium text-bo-neutral-900">{row.eventName}</td>
              <td className="max-w-[320px] px-4 py-2 text-bo-neutral-700">
                <span className="block truncate">{row.entityLabel ?? row.entityType ?? row.tab ?? ''}</span>
              </td>
              <td className="px-4 py-2 text-xs text-bo-neutral-500">{row.mallId}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-2 text-left font-medium text-bo-neutral-600">{children}</th>;
}
