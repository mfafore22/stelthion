'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import { Upload, Download, FileSpreadsheet, AlertTriangle, Check, Trash2 } from 'lucide-react';
import { useAdminMall } from '@/lib/hooks/useAdminMall';

interface UploadEntry {
  id: string | null;
  year: number;
  week: number;
  granularity: string;
  totalVisitors: number | null;
  counterCount: number;
  readingCount: number | null;
  uploadedAt: string;
  fileName: string | null;
  type: 'upload' | 'legacy';
}

interface UploadResult {
  ok: boolean;
  imported?: number;
  week?: number;
  year?: number;
  granularity?: string;
  countersFound?: number;
  warnings?: string[];
  error?: string;
}

export function CounterDataClient() {
  const { t } = useTranslation('admin');
  const [entries, setEntries] = useState<UploadEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteInProgress, setDeleteInProgress] = useState(false);

  const { activeMallId } = useAdminMall();
  const mallId = activeMallId;

  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/counters/weeks?mallId=${mallId}`);
      const data = await res.json();
      setEntries(Array.isArray(data) ? data : []);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [mallId]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setResult(null);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mallId', mallId);

      const res = await fetch('/api/admin/counters/upload', {
        method: 'POST',
        body: formData,
      });
      const data: UploadResult = await res.json();
      setResult(data);
      if (data.ok) {
        fetchEntries();
      }
    } catch (err) {
      setResult({ ok: false, error: String(err) });
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const handleExport = (week: number, year: number) => {
    window.open(`/api/counters/${mallId}/export?week=${week}&year=${year}&format=csv&counter=all`);
  };

  const handleDelete = async (entry: UploadEntry) => {
    setDeleteInProgress(true);
    try {
      const params = new URLSearchParams({ mallId });
      if (entry.id) {
        params.set('uploadId', entry.id);
      } else {
        params.set('week', String(entry.week));
        params.set('year', String(entry.year));
      }
      const res = await fetch(`/api/admin/counters/weeks?${params}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        fetchEntries();
        setResult({
          ok: true,
          imported: 0,
          week: entry.week,
          year: entry.year,
          warnings: [`Deleted ${data.deleted} readings${entry.fileName ? ` from ${entry.fileName}` : ''}`],
        });
      }
    } catch (err) {
      setResult({ ok: false, error: String(err) });
    } finally {
      setDeleting(null);
      setDeleteInProgress(false);
    }
  };

  const entryKey = (e: UploadEntry) => e.id ?? `legacy-${e.year}-${e.week}`;

  return (
    <div className="p-6 max-w-4xl">
      <h2 className="text-xl font-bold text-bo-neutral-950 tracking-wide mb-6">
        {t('counters.title', 'Counter Data Management')}
      </h2>

      {/* Upload area */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 mb-6 ${
          dragOver
            ? 'border-bo-accent-500 bg-bo-accent-50'
            : 'border-bo-neutral-300 bg-bo-neutral-50 hover:border-bo-neutral-400'
        }`}
      >
        <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-bo-neutral-400" />
        <p className="text-sm text-bo-neutral-600 mb-3">
          {t('counters.dropHint', 'Drag & drop an Excel file here, or click to browse')}
        </p>
        <label className="inline-flex items-center gap-2 px-4 py-2 bg-bo-neutral-950 text-bo-neutral-50 text-sm font-medium rounded-lg cursor-pointer hover:bg-bo-neutral-800 transition-colors">
          <Upload className="w-4 h-4" />
          {uploading ? t('counters.uploading', 'Uploading...') : t('counters.selectFile', 'Select .xlsx file')}
          <input
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Upload result */}
      {result && (
        <div
          className={`rounded-xl p-4 mb-6 border ${
            result.ok
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {result.ok ? (
            <div className="flex items-start gap-2">
              <Check className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">
                  {t('counters.uploadSuccess', 'Imported {{count}} readings for week {{week}}/{{year}} ({{granularity}})', {
                    count: result.imported,
                    week: result.week,
                    year: result.year,
                    granularity: result.granularity,
                  })}
                </p>
                <p className="text-sm mt-1">
                  {t('counters.countersFound', '{{count}} counters matched', { count: result.countersFound })}
                </p>
                {result.warnings && result.warnings.length > 0 && (
                  <div className="mt-2 text-sm text-amber-700">
                    <p className="font-medium flex items-center gap-1">
                      <AlertTriangle className="w-4 h-4" />
                      {t('counters.warnings', 'Warnings')}:
                    </p>
                    <ul className="list-disc ml-5 mt-1">
                      {result.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {result.error}
            </p>
          )}
        </div>
      )}

      {/* Uploaded documents table */}
      <h3 className="text-sm font-semibold text-bo-neutral-700 mb-3">
        {t('counters.uploadedDocuments', 'Uploaded Documents')}
      </h3>
      {loading ? (
        <p className="text-sm text-bo-neutral-400">{t('counters.loading', 'Loading...')}</p>
      ) : entries.length === 0 ? (
        <p className="text-sm text-bo-neutral-400">{t('counters.noData', 'No counter data uploaded yet')}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-bo-neutral-200">
          <table className="w-full text-sm">
            <thead className="bg-bo-neutral-100">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-bo-neutral-600">
                  {t('counters.fileName', 'File')}
                </th>
                <th className="text-left px-4 py-2 font-medium text-bo-neutral-600">
                  {t('counters.week', 'Week')}
                </th>
                <th className="text-left px-4 py-2 font-medium text-bo-neutral-600">
                  {t('counters.granularity', 'Type')}
                </th>
                <th className="text-right px-4 py-2 font-medium text-bo-neutral-600">
                  {t('counters.counterCount', 'Counters')}
                </th>
                <th className="text-right px-4 py-2 font-medium text-bo-neutral-600">
                  {t('counters.readings', 'Readings')}
                </th>
                <th className="text-right px-4 py-2 font-medium text-bo-neutral-600">
                  {t('counters.uploadedAt', 'Uploaded')}
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => {
                const key = entryKey(entry);
                return (
                  <tr key={key} className="border-t border-bo-neutral-100 hover:bg-bo-neutral-50">
                    <td className="px-4 py-2 font-medium text-bo-neutral-950 max-w-[200px] truncate" title={entry.fileName ?? undefined}>
                      {entry.fileName ?? `wk.${entry.week} ${entry.year} (legacy)`}
                    </td>
                    <td className="px-4 py-2 text-bo-neutral-600">wk.{entry.week} / {entry.year}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                        entry.granularity === 'hourly'
                          ? 'bg-blue-100 text-blue-700'
                          : entry.granularity === 'daily'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                      }`}>
                        {entry.granularity}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-bo-neutral-600">{entry.counterCount}</td>
                    <td className="px-4 py-2 text-right text-bo-neutral-600">
                      {entry.readingCount ?? (entry.totalVisitors?.toLocaleString() ?? '–')}
                    </td>
                    <td className="px-4 py-2 text-right text-bo-neutral-400 text-xs">
                      {entry.uploadedAt ? new Date(entry.uploadedAt).toLocaleString() : '–'}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleExport(entry.week, entry.year)}
                          className="p-1.5 rounded-lg hover:bg-bo-neutral-100 text-bo-neutral-500 hover:text-bo-neutral-700 transition-colors"
                          title={t('counters.export', 'Export CSV')}
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {deleting === key ? (
                          <div className="flex items-center gap-1 ml-1">
                            <button
                              onClick={() => handleDelete(entry)}
                              disabled={deleteInProgress}
                              className="px-2 py-1 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                            >
                              {deleteInProgress
                                ? t('counters.deleting', 'Deleting...')
                                : t('counters.confirmDelete', 'Confirm')}
                            </button>
                            <button
                              onClick={() => setDeleting(null)}
                              className="px-2 py-1 text-xs font-medium text-bo-neutral-600 bg-bo-neutral-100 rounded-md hover:bg-bo-neutral-200 transition-colors"
                            >
                              {t('counters.cancelDelete', 'Cancel')}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleting(key)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-bo-neutral-400 hover:text-red-600 transition-colors"
                            title={t('counters.delete', 'Delete data')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
