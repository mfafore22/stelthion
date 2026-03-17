'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ToolPalette, type Tool } from './ToolPalette';
import { PropertiesPanel } from './PropertiesPanel';
import { Save, Undo2, Download, ZoomIn, ZoomOut, Maximize, Eye, EyeOff, Globe, RotateCcw } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ZoneData {
  id?: string;
  zoneId: string;
  name: string;
  nameFi: string;
  category: string;
  svgPoints: string;
  labelX: number;
  labelY: number;
  capacity: number;
  areaSqm: number;
  baseVisitors: number;
  publishedAt?: string | null;
}

export interface StoreData {
  id?: string;
  name: string;
  slug: string;
  zoneId: string; // FK to zone's zoneId
  zoneDbId?: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CameraData {
  id?: string;
  label: string;
  x: number;
  y: number;
  angleDeg?: number;
  fovDeg?: number;
  rangeM?: number;
  streamUrl?: string;
  zoneDbId?: string;
  active: boolean;
}

type SelectedElement =
  | { type: 'zone'; index: number }
  | { type: 'store'; index: number }
  | { type: 'camera'; index: number }
  | null;

interface FloorplanEditorProps {
  mallId: string;
  floor: string;
  viewBox: string;
  floorplanSrc: string;
  initialZones: ZoneData[];
  initialStores: StoreData[];
  initialCameras: CameraData[];
}

// ─── Component ──────────────────────────────────────────────────────────────

export function FloorplanEditor({
  mallId,
  floor,
  viewBox,
  floorplanSrc,
  initialZones,
  initialStores,
  initialCameras,
}: FloorplanEditorProps) {
  const { t } = useTranslation('admin');
  const [zones, setZones] = useState<ZoneData[]>(initialZones);
  const [stores, setStores] = useState<StoreData[]>(initialStores);
  const [cameras, setCameras] = useState<CameraData[]>(initialCameras);
  const [tool, setTool] = useState<Tool>('select');
  const [selected, setSelected] = useState<SelectedElement>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedAt, setPublishedAt] = useState<string | null>(
    initialZones[0]?.publishedAt ?? null,
  );
  const [savedSincePublish, setSavedSincePublish] = useState(!initialZones[0]?.publishedAt);
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragCurrent, setDragCurrent] = useState<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom & pan via viewBox
  const [vbParts] = useState(() => viewBox.split(' ').map(Number)); // [x, y, w, h]
  const baseW = vbParts[2];
  const baseH = vbParts[3];
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [cursorSvg, setCursorSvg] = useState<{ x: number; y: number } | null>(null);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const zoomedViewBox = `${panOffset.x} ${panOffset.y} ${baseW / zoom} ${baseH / zoom}`;

  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z * 1.3, 8)), []);
  const handleZoomOut = useCallback(() => {
    setZoom((z) => {
      const next = Math.max(z / 1.3, 1);
      if (next === 1) setPanOffset({ x: 0, y: 0 });
      return next;
    });
  }, []);
  const handleZoomReset = useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  // Mouse wheel zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        if (e.deltaY < 0) {
          setZoom((z) => Math.min(z * 1.15, 8));
        } else {
          setZoom((z) => {
            const next = Math.max(z / 1.15, 1);
            if (next === 1) setPanOffset({ x: 0, y: 0 });
            return next;
          });
        }
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  // Undo history
  type UndoAction =
    | { type: 'add-zone' }
    | { type: 'add-store' }
    | { type: 'add-camera' }
    | { type: 'delete-zone'; data: ZoneData; index: number }
    | { type: 'delete-store'; data: StoreData; index: number }
    | { type: 'delete-camera'; data: CameraData; index: number };
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);

  const pushUndo = useCallback((action: UndoAction) => {
    setUndoStack((prev) => [...prev, action]);
  }, []);

  const handleUndo = useCallback(() => {
    // If drawing a zone polygon, remove the last vertex first
    if (drawingPoints.length > 0) {
      setDrawingPoints((prev) => prev.slice(0, -1));
      return;
    }

    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));

    if (last.type === 'add-zone') {
      setZones((prev) => prev.slice(0, -1));
    } else if (last.type === 'add-store') {
      setStores((prev) => prev.slice(0, -1));
    } else if (last.type === 'add-camera') {
      setCameras((prev) => prev.slice(0, -1));
    } else if (last.type === 'delete-zone') {
      setZones((prev) => { const next = [...prev]; next.splice(last.index, 0, last.data); return next; });
    } else if (last.type === 'delete-store') {
      setStores((prev) => { const next = [...prev]; next.splice(last.index, 0, last.data); return next; });
    } else if (last.type === 'delete-camera') {
      setCameras((prev) => { const next = [...prev]; next.splice(last.index, 0, last.data); return next; });
    }
    setSelected(null);
  }, [drawingPoints, undoStack]);

  const markDirty = useCallback(() => setDirty(true), []);

  // Convert mouse event to SVG coordinates
  const toSvg = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const ctm = svg.getScreenCTM();
      if (!ctm) return { x: 0, y: 0 };
      const svgPt = pt.matrixTransform(ctm.inverse());
      return { x: Math.round(svgPt.x), y: Math.round(svgPt.y) };
    },
    [],
  );

  // ── Snap-to-axis helper (for 90° drawing aid) ──────────────────────────
  const SNAP_THRESHOLD = 12; // px in SVG space — snap when within this distance of axis

  const snapToAxis = useCallback(
    (raw: { x: number; y: number }): { x: number; y: number; snappedAxis: 'x' | 'y' | null } => {
      if (drawingPoints.length === 0) return { ...raw, snappedAxis: null };
      const last = drawingPoints[drawingPoints.length - 1];
      const threshold = SNAP_THRESHOLD / zoom;
      const dx = Math.abs(raw.x - last[0]);
      const dy = Math.abs(raw.y - last[1]);
      // Snap to whichever axis is closer (prioritise the one that's nearly aligned)
      if (dx < threshold && dy < threshold) {
        // Very close to the last point — snap to the axis with smaller delta
        return dx < dy
          ? { x: last[0], y: raw.y, snappedAxis: 'x' }
          : { x: raw.x, y: last[1], snappedAxis: 'y' };
      }
      if (dx < threshold) return { x: last[0], y: raw.y, snappedAxis: 'x' };
      if (dy < threshold) return { x: raw.x, y: last[1], snappedAxis: 'y' };
      return { ...raw, snappedAxis: null };
    },
    [drawingPoints, zoom],
  );

  // ── Drawing handlers ────────────────────────────────────────────────────

  const handleSvgClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const raw = toSvg(e);
      // Apply axis snap when drawing zones
      const { x, y } = tool === 'zone' && drawingPoints.length > 0 ? snapToAxis(raw) : raw;

      if (tool === 'zone') {
        if (drawingPoints.length > 2) {
          // Check if clicking near first point to close (scale threshold with zoom)
          const [fx, fy] = drawingPoints[0];
          const snapDist = 15 / zoom;
          if (Math.abs(x - fx) < snapDist && Math.abs(y - fy) < snapDist) {
            const pts = drawingPoints.map(([px, py]) => `${px},${py}`).join(' ');
            const cx = Math.round(drawingPoints.reduce((s, [px]) => s + px, 0) / drawingPoints.length);
            const cy = Math.round(drawingPoints.reduce((s, [, py]) => s + py, 0) / drawingPoints.length);
            const newZone: ZoneData = {
              zoneId: `zone-${Date.now()}`,
              name: 'New Zone',
              nameFi: 'Uusi alue',
              category: 'Mixed',
              svgPoints: pts,
              labelX: cx,
              labelY: cy,
              capacity: 1000,
              areaSqm: 500,
              baseVisitors: 0,
            };
            setZones((prev) => [...prev, newZone]);
            setDrawingPoints([]); setCursorSvg(null);
            setSelected({ type: 'zone', index: zones.length });
            pushUndo({ type: 'add-zone' });
            markDirty();
            return;
          }
        }
        setDrawingPoints((prev) => [...prev, [x, y]]);
      } else if (tool === 'camera') {
        const newCamera: CameraData = {
          label: `Camera ${cameras.length + 1}`,
          x,
          y,
          active: true,
        };
        setCameras((prev) => [...prev, newCamera]);
        setSelected({ type: 'camera', index: cameras.length });
        pushUndo({ type: 'add-camera' });
        markDirty();
      } else if (tool === 'select') {
        setSelected(null);
      }
    },
    [tool, drawingPoints, toSvg, snapToAxis, zones.length, cameras.length, markDirty],
  );

  const handleSvgMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (tool === 'store') {
        const pt = toSvg(e);
        setDragStart(pt);
        setDragCurrent(pt);
      }
    },
    [tool, toSvg],
  );

  const handleSvgMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (tool === 'store' && dragStart) {
        setDragCurrent(toSvg(e));
      }
      // Track cursor for drawing guides
      if (tool === 'zone' && drawingPoints.length > 0) {
        const raw = toSvg(e);
        const snapped = snapToAxis(raw);
        setCursorSvg({ x: snapped.x, y: snapped.y });
      }
    },
    [tool, dragStart, drawingPoints.length, toSvg, snapToAxis],
  );

  const handleSvgMouseUp = useCallback(() => {
    if (tool === 'store' && dragStart && dragCurrent) {
      const x = Math.min(dragStart.x, dragCurrent.x);
      const y = Math.min(dragStart.y, dragCurrent.y);
      const w = Math.abs(dragCurrent.x - dragStart.x);
      const h = Math.abs(dragCurrent.y - dragStart.y);
      const minSize = 5 / zoom;
      if (w > minSize && h > minSize) {
        const newStore: StoreData = {
          name: 'New Store',
          slug: `store-${Date.now()}`,
          zoneId: zones[0]?.zoneId ?? '',
          x,
          y,
          w,
          h,
        };
        setStores((prev) => [...prev, newStore]);
        setSelected({ type: 'store', index: stores.length });
        pushUndo({ type: 'add-store' });
        markDirty();
      }
      setDragStart(null);
      setDragCurrent(null);
    }
  }, [tool, dragStart, dragCurrent, zones, stores.length, markDirty]);

  // ── Keyboard: Enter to close polygon, Escape to cancel ──────────────
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Enter' && tool === 'zone' && drawingPoints.length > 2) {
        const pts = drawingPoints.map(([px, py]) => `${px},${py}`).join(' ');
        const cx = Math.round(drawingPoints.reduce((s, [px]) => s + px, 0) / drawingPoints.length);
        const cy = Math.round(drawingPoints.reduce((s, [, py]) => s + py, 0) / drawingPoints.length);
        const newZone: ZoneData = {
          zoneId: `zone-${Date.now()}`,
          name: 'New Zone',
          nameFi: 'Uusi alue',
          category: 'Mixed',
          svgPoints: pts,
          labelX: cx,
          labelY: cy,
          capacity: 1000,
          areaSqm: 500,
          baseVisitors: 0,
        };
        setZones((prev) => [...prev, newZone]);
        setDrawingPoints([]); setCursorSvg(null);
        setSelected({ type: 'zone', index: zones.length });
        pushUndo({ type: 'add-zone' });
        markDirty();
      }
      if (e.key === 'Escape') {
        setDrawingPoints([]); setCursorSvg(null);
        setSelected(null);
      }
      // Ctrl+Z / Cmd+Z to undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [tool, drawingPoints, zones.length, markDirty, pushUndo, handleUndo]);

  // ── Delete selected (with confirmation) ────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState<SelectedElement>(null);

  const handleDeleteRequest = useCallback(() => {
    if (!selected) return;
    setDeleteConfirm(selected);
  }, [selected]);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'zone') {
      pushUndo({ type: 'delete-zone', data: zones[deleteConfirm.index], index: deleteConfirm.index });
      setZones((prev) => prev.filter((_, i) => i !== deleteConfirm.index));
    } else if (deleteConfirm.type === 'store') {
      pushUndo({ type: 'delete-store', data: stores[deleteConfirm.index], index: deleteConfirm.index });
      setStores((prev) => prev.filter((_, i) => i !== deleteConfirm.index));
    } else if (deleteConfirm.type === 'camera') {
      pushUndo({ type: 'delete-camera', data: cameras[deleteConfirm.index], index: deleteConfirm.index });
      setCameras((prev) => prev.filter((_, i) => i !== deleteConfirm.index));
    }
    setSelected(null);
    setDeleteConfirm(null);
    markDirty();
  }, [deleteConfirm, zones, stores, cameras, markDirty, pushUndo]);

  const handleDeleteCancel = useCallback(() => setDeleteConfirm(null), []);

  const deleteItemName = deleteConfirm
    ? deleteConfirm.type === 'zone'
      ? zones[deleteConfirm.index]?.name ?? ''
      : deleteConfirm.type === 'store'
        ? stores[deleteConfirm.index]?.name ?? ''
        : cameras[deleteConfirm.index]?.label ?? ''
    : '';

  // ── Save ────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/floorplan/${mallId}/save`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ floor, zones, stores, cameras }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error('Save failed');
      setDirty(false);
      setPublishedAt(data.publishedAt ?? null); // preserve live status if server kept it
      setSavedSincePublish(true);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }, [mallId, floor, zones, stores, cameras]);

  // ── Publish (make live) ───────────────────────────────────────────────
  const handlePublish = useCallback(async () => {
    setPublishing(true);
    try {
      const res = await fetch(`/api/admin/floorplan/${mallId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ floor }),
      });
      const data = await res.json();
      if (data.ok) {
        setPublishedAt(data.publishedAt);
        setSavedSincePublish(false);
      }
    } catch (err) {
      console.error('Publish failed:', err);
    } finally {
      setPublishing(false);
    }
  }, [mallId, floor]);

  // ── Restore from snapshot ─────────────────────────────────────────────
  const [showRestore, setShowRestore] = useState(false);
  const [snapshots, setSnapshots] = useState<{ id: string; reason: string; createdAt: string }[]>([]);
  const [restoring, setRestoring] = useState(false);

  const loadSnapshots = useCallback(async () => {
    const res = await fetch(`/api/admin/floorplan/${mallId}/snapshots?floor=${floor}`);
    const data = await res.json();
    setSnapshots(data);
    setShowRestore(true);
  }, [mallId, floor]);

  const handleRestore = useCallback(async (snapshotId: string) => {
    if (!confirm(t('editor.restoreConfirm'))) return;
    setRestoring(true);
    try {
      const res = await fetch(`/api/admin/floorplan/${mallId}/snapshots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ snapshotId }),
      });
      const data = await res.json();
      if (data.ok) {
        // Reload page to pick up restored data
        window.location.reload();
      }
    } catch (err) {
      console.error('Restore failed:', err);
    } finally {
      setRestoring(false);
    }
  }, [mallId]);

  // ── Update handlers for properties panel ────────────────────────────
  const updateZone = useCallback(
    (index: number, patch: Partial<ZoneData>) => {
      setZones((prev) => prev.map((z, i) => (i === index ? { ...z, ...patch } : z)));
      markDirty();
    },
    [markDirty],
  );

  const updateStore = useCallback(
    (index: number, patch: Partial<StoreData>) => {
      setStores((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
      markDirty();
    },
    [markDirty],
  );

  const updateCamera = useCallback(
    (index: number, patch: Partial<CameraData>) => {
      setCameras((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
      markDirty();
    },
    [markDirty],
  );

  // ── Export to TypeScript ────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const zoneTs = zones
      .map(
        (z) =>
          `  { id: '${z.zoneId}', name: '${z.name}', nameFi: '${z.nameFi}', category: '${z.category}', area_sqm: ${z.areaSqm}, svgPoints: '${z.svgPoints}', capacity: ${z.capacity}, baseVisitors: ${z.baseVisitors}, labelX: ${z.labelX}, labelY: ${z.labelY}, locationPrefixes: [] },`,
      )
      .join('\n');
    const blob = new Blob([`export const ZONES = [\n${zoneTs}\n];\n`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zones-${floor}.ts`;
    a.click();
    URL.revokeObjectURL(url);
  }, [zones, floor]);

  // ── Label placement helper ─────────────────────────────────────────
  // Estimate if text fits inside a polygon's bounding box.
  // Returns { fits, bbox } where bbox is { minX, minY, maxX, maxY }.
  const getZoneBbox = useCallback((svgPoints: string) => {
    const coords = svgPoints
      .trim()
      .split(/\s+/)
      .map((p) => {
        const [x, y] = p.split(',').map(Number);
        return { x, y };
      });
    if (coords.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0, w: 0, h: 0 };
    const minX = Math.min(...coords.map((c) => c.x));
    const maxX = Math.max(...coords.map((c) => c.x));
    const minY = Math.min(...coords.map((c) => c.y));
    const maxY = Math.max(...coords.map((c) => c.y));
    return { minX, minY, maxX, maxY, w: maxX - minX, h: maxY - minY };
  }, []);

  // Approximate text width: ~6.5px per character at fontSize 11
  const CHAR_WIDTH = 6.5;
  const LABEL_HEIGHT = 14;

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="flex h-full">
      {/* Left toolbar */}
      <ToolPalette tool={tool} onToolChange={setTool} />

      {/* SVG canvas */}
      <div className="flex-1 flex flex-col bg-bo-neutral-200 overflow-hidden">
        {/* Toolbar ribbon */}
        <div className="flex items-center gap-2 p-2 bg-bo-neutral-50 border-b border-bo-neutral-200 shadow-bo-sm shrink-0">
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-bo-accent-600 text-white disabled:opacity-40 hover:bg-bo-accent-700 hover:shadow-bo-md hover:-translate-y-0.5 transition-all duration-300"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? t('editor.saving') : t('editor.save')}
          </button>
          <button
            onClick={handleUndo}
            disabled={drawingPoints.length === 0 && undoStack.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-bo-neutral-100 text-bo-neutral-700 hover:bg-bo-neutral-200 disabled:opacity-40 transition-all duration-300"
            title={t('editor.undoHint')}
          >
            <Undo2 className="w-3.5 h-3.5" />
            {t('editor.undo')}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-bo-neutral-100 text-bo-neutral-700 hover:bg-bo-neutral-200 transition-all duration-300"
          >
            <Download className="w-3.5 h-3.5" />
            {t('editor.exportTs')}
          </button>
          <button
            onClick={handlePublish}
            disabled={dirty || publishing || !savedSincePublish}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-bo-accent-600 text-white disabled:opacity-40 hover:bg-bo-accent-700 hover:shadow-bo-md hover:-translate-y-0.5 transition-all duration-300"
            title={t('editor.publishHint')}
          >
            <Globe className="w-3.5 h-3.5" />
            {publishing ? t('editor.publishing') : t('editor.makeLive')}
          </button>
          {publishedAt && !dirty && (
            <span className="flex items-center gap-1 text-xs text-bo-success-dark">
              <span className="w-1.5 h-1.5 rounded-full bg-bo-success-dark inline-block" />
              {t('editor.live')}
            </span>
          )}
          <button
            onClick={() => setShowLabels((v) => !v)}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-300 ${
              showLabels
                ? 'bg-bo-neutral-100 text-bo-neutral-700 hover:bg-bo-neutral-200'
                : 'bg-bo-warning-light text-bo-warning-dark hover:opacity-90'
            }`}
            title={showLabels ? t('editor.hideNamesHint') : t('editor.showNamesHint')}
          >
            {showLabels ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showLabels ? t('editor.hideNames') : t('editor.showNames')}
          </button>
          {dirty && <span className="text-xs text-bo-warning-dark ml-2">{t('editor.unsavedChanges')}</span>}

          {/* Restore from snapshot */}
          <div className="relative">
            <button
              onClick={showRestore ? () => setShowRestore(false) : loadSnapshots}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-bo-neutral-100 text-bo-neutral-700 hover:bg-bo-neutral-200 transition-all duration-300"
              title={t('editor.restoreHint')}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t('editor.restore')}
            </button>
            {showRestore && (
              <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-bo-neutral-200 rounded-lg shadow-bo-md z-50 max-h-64 overflow-y-auto">
                {snapshots.length === 0 ? (
                  <p className="text-xs text-bo-neutral-400 p-3">{t('editor.noSnapshots')}</p>
                ) : (
                  snapshots.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleRestore(s.id)}
                      disabled={restoring}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-bo-neutral-100 border-b border-bo-neutral-100 last:border-0 transition-colors disabled:opacity-40"
                    >
                      <span className="font-medium text-bo-neutral-950">
                        {new Date(s.createdAt).toLocaleString('fi-FI')}
                      </span>
                      <span className="ml-2 text-bo-neutral-500">{s.reason}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 ml-auto border-l border-bo-neutral-200 pl-2">
            <button
              onClick={handleZoomIn}
              className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg bg-bo-neutral-100 text-bo-neutral-700 hover:bg-bo-neutral-200 transition-all duration-300"
              title="Zoom in (Ctrl+scroll)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-bo-neutral-500 w-10 text-center font-mono">{Math.round(zoom * 100)}%</span>
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg bg-bo-neutral-100 text-bo-neutral-700 hover:bg-bo-neutral-200 disabled:opacity-40 transition-all duration-300"
              title="Zoom out (Ctrl+scroll)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleZoomReset}
              disabled={zoom === 1}
              className="flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg bg-bo-neutral-100 text-bo-neutral-700 hover:bg-bo-neutral-200 disabled:opacity-40 transition-all duration-300"
              title="Reset zoom"
            >
              <Maximize className="w-3.5 h-3.5" />
            </button>
          </div>

          {selected && (
            <button
              onClick={handleDeleteRequest}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-bo-error-light text-bo-error-dark hover:opacity-90 transition-all duration-300"
            >
              {t('editor.deleteSelected')}
            </button>
          )}
        </div>

        {/* ── Delete confirmation dialog ─────────────────────────────── */}
        {deleteConfirm && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-white rounded-xl shadow-bo-lg p-5 max-w-sm w-full mx-4 border border-bo-neutral-200">
              <h3 className="text-sm font-bold text-bo-neutral-950 mb-2">{t('editor.deleteConfirmTitle')}</h3>
              <p className="text-sm text-bo-neutral-600 mb-4">
                {t('editor.deleteConfirmMessage', { type: t(`editor.deleteType_${deleteConfirm.type}`), name: deleteItemName })}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleDeleteCancel}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-bo-neutral-100 text-bo-neutral-700 hover:bg-bo-neutral-200 transition-all duration-300"
                >
                  {t('editor.cancel')}
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-bo-error-light text-bo-error-dark hover:opacity-90 transition-all duration-300"
                >
                  {t('editor.confirmDelete')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floor plan SVG */}
        <div ref={containerRef} className="flex-1 overflow-hidden min-h-0">
        <svg
          ref={svgRef}
          viewBox={zoomedViewBox}
          preserveAspectRatio="xMidYMin meet"
          className="w-full h-full"
          style={{
            cursor: isPanning ? 'grabbing' : tool === 'zone' ? 'crosshair' : tool === 'store' ? 'crosshair' : tool === 'camera' ? 'cell' : zoom > 1 ? 'grab' : 'default',
          }}
          onClick={handleSvgClick}
          onMouseDown={(e) => {
            // Middle mouse button or space+click for panning
            if (e.button === 1 || (e.button === 0 && tool === 'select' && zoom > 1 && !e.shiftKey)) {
              if (e.button === 1 || (zoom > 1 && tool === 'select')) {
                e.preventDefault();
                setIsPanning(true);
                setPanStart({ x: e.clientX, y: e.clientY });
                return;
              }
            }
            handleSvgMouseDown(e);
          }}
          onMouseMove={(e) => {
            if (isPanning) {
              const svg = svgRef.current;
              if (!svg) return;
              const rect = svg.getBoundingClientRect();
              const scaleX = (baseW / zoom) / rect.width;
              const scaleY = (baseH / zoom) / rect.height;
              const dx = (panStart.x - e.clientX) * scaleX;
              const dy = (panStart.y - e.clientY) * scaleY;
              setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
              setPanStart({ x: e.clientX, y: e.clientY });
              return;
            }
            handleSvgMouseMove(e);
          }}
          onMouseUp={() => {
            if (isPanning) {
              setIsPanning(false);
              return;
            }
            handleSvgMouseUp();
          }}
        >
          {/* Floor plan background */}
          <image href={floorplanSrc} x="0" y="0" width={baseW} height={baseH} />

          {/* Zone polygons */}
          {zones.map((zone, i) => {
            const isSelected = selected?.type === 'zone' && selected.index === i;
            const bbox = getZoneBbox(zone.svgPoints);
            const labelText = zone.nameFi || zone.name;
            const textWidth = labelText.length * CHAR_WIDTH;
            const fitsInside = textWidth < bbox.w - 8 && LABEL_HEIGHT < bbox.h - 4;
            // If label doesn't fit, place it above the zone with a leader line
            const labelX = fitsInside ? zone.labelX : bbox.minX + bbox.w / 2;
            const labelY = fitsInside ? zone.labelY : bbox.minY - 18;
            const cx = bbox.minX + bbox.w / 2;
            const cy = bbox.minY + bbox.h / 2;
            return (
              <g key={`zone-${i}`}>
                <polygon
                  points={zone.svgPoints}
                  fill={isSelected ? 'var(--color-bo-accent-600)' : 'var(--color-bo-neutral-500)'}
                  fillOpacity={isSelected ? 0.4 : 0.2}
                  stroke={isSelected ? 'var(--color-bo-neutral-950)' : 'var(--color-bo-neutral-600)'}
                  strokeWidth={isSelected ? 2 : 1}
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (tool === 'select' || tool === 'erase') {
                      setSelected({ type: 'zone', index: i });
                    }
                  }}
                />
                {/* Zone label (hidden when showLabels is off) */}
                {showLabels && (
                  <>
                    {/* Leader line from label to zone centroid when label is outside */}
                    {!fitsInside && (
                      <line
                        x1={labelX}
                        y1={labelY + 4}
                        x2={cx}
                        y2={cy}
                        stroke="var(--color-bo-neutral-600)"
                        strokeWidth={0.8}
                        strokeDasharray="3,2"
                        strokeOpacity={0.6}
                        style={{ pointerEvents: 'none' }}
                      />
                    )}
                    {/* Label background for readability when outside */}
                    {!fitsInside && (
                      <rect
                        x={labelX - textWidth / 2 - 4}
                        y={labelY - 10}
                        width={textWidth + 8}
                        height={16}
                        rx={3}
                        fill="white"
                        fillOpacity={0.9}
                        stroke="var(--color-bo-neutral-600)"
                        strokeWidth={0.5}
                        strokeOpacity={0.4}
                        style={{ pointerEvents: 'none' }}
                      />
                    )}
                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill="var(--color-bo-neutral-950)"
                      fillOpacity={0.85}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {labelText}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Store rectangles */}
          {stores.map((store, i) => {
            const isSelected = selected?.type === 'store' && selected.index === i;
            const storeTextWidth = store.name.length * 4.5; // ~4.5px per char at fontSize 7
            const storeFits = storeTextWidth < store.w - 4 && 10 < store.h - 2;
            const storeLabelX = storeFits ? store.x + store.w / 2 : store.x + store.w / 2;
            const storeLabelY = storeFits ? store.y + store.h / 2 + 3 : store.y - 10;
            const storeCx = store.x + store.w / 2;
            const storeCy = store.y + store.h / 2;
            return (
              <g key={`store-${i}`}>
                <rect
                  x={store.x}
                  y={store.y}
                  width={store.w}
                  height={store.h}
                  fill={isSelected ? 'var(--color-bo-accent-600)' : 'var(--color-bo-neutral-400)'}
                  fillOpacity={isSelected ? 0.35 : 0.15}
                  stroke={isSelected ? 'var(--color-bo-accent-600)' : 'var(--color-bo-neutral-400)'}
                  strokeWidth={isSelected ? 2 : 0.5}
                  strokeDasharray={isSelected ? '' : '3,2'}
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (tool === 'select' || tool === 'erase') {
                      setSelected({ type: 'store', index: i });
                    }
                  }}
                />
                {/* Store label (hidden when showLabels is off) */}
                {showLabels && (
                  <>
                    {/* Leader line when store label is outside */}
                    {!storeFits && (
                      <line
                        x1={storeLabelX}
                        y1={storeLabelY + 3}
                        x2={storeCx}
                        y2={storeCy}
                        stroke="var(--color-bo-neutral-500)"
                        strokeWidth={0.6}
                        strokeDasharray="2,2"
                        strokeOpacity={0.5}
                        style={{ pointerEvents: 'none' }}
                      />
                    )}
                    {/* Label background when outside */}
                    {!storeFits && (
                      <rect
                        x={storeLabelX - storeTextWidth / 2 - 3}
                        y={storeLabelY - 7}
                        width={storeTextWidth + 6}
                        height={11}
                        rx={2}
                        fill="white"
                        fillOpacity={0.9}
                        stroke="var(--color-bo-neutral-400)"
                        strokeWidth={0.4}
                        strokeOpacity={0.4}
                        style={{ pointerEvents: 'none' }}
                      />
                    )}
                    <text
                      x={storeLabelX}
                      y={storeLabelY}
                      textAnchor="middle"
                      fontSize="7"
                      fontWeight="500"
                      fill="var(--color-bo-neutral-950)"
                      fillOpacity={0.7}
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {store.name}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Camera pins */}
          {cameras.map((cam, i) => {
            const isSelected = selected?.type === 'camera' && selected.index === i;
            return (
              <g
                key={`cam-${i}`}
                style={{ cursor: 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (tool === 'select' || tool === 'erase') {
                    setSelected({ type: 'camera', index: i });
                  }
                }}
              >
                <circle
                  cx={cam.x}
                  cy={cam.y}
                  r={isSelected ? 10 : 7}
                  fill={cam.active ? 'var(--color-bo-error-dark)' : 'var(--color-bo-neutral-400)'}
                  fillOpacity={0.85}
                  stroke="white"
                  strokeWidth={2}
                />
                <text
                  x={cam.x}
                  y={cam.y + 3}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="700"
                  fill="white"
                  style={{ pointerEvents: 'none' }}
                >
                  C
                </text>
                {showLabels && (
                  <text
                    x={cam.x}
                    y={cam.y + 18}
                    textAnchor="middle"
                    fontSize="7"
                    fontWeight="500"
                    fill="var(--color-bo-neutral-950)"
                    fillOpacity={0.8}
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {cam.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Drawing in progress: zone polygon vertices */}
          {drawingPoints.length > 0 && (
            <g>
              <polyline
                points={drawingPoints.map(([x, y]) => `${x},${y}`).join(' ')}
                fill="none"
                stroke="var(--color-bo-accent-600)"
                strokeWidth={2}
                strokeDasharray="5,3"
              />
              {drawingPoints.map(([x, y], i) => (
                <circle key={i} cx={x} cy={y} r={4} fill="var(--color-bo-accent-600)" stroke="white" strokeWidth={1.5} />
              ))}

              {/* Axis-snap guide lines while drawing */}
              {cursorSvg && (() => {
                const last = drawingPoints[drawingPoints.length - 1];
                const isSnappedX = Math.abs(cursorSvg.x - last[0]) < 1; // snapped to vertical axis
                const isSnappedY = Math.abs(cursorSvg.y - last[1]) < 1; // snapped to horizontal axis
                return (
                  <>
                    {/* Dashed line from last point to snapped cursor */}
                    <line
                      x1={last[0]} y1={last[1]}
                      x2={cursorSvg.x} y2={cursorSvg.y}
                      stroke={isSnappedX || isSnappedY ? 'var(--color-bo-info-dark)' : 'var(--color-bo-accent-600)'}
                      strokeWidth={1}
                      strokeDasharray="4,3"
                      strokeOpacity={0.7}
                      style={{ pointerEvents: 'none' }}
                    />
                    {/* Vertical guide line when snapped to same X */}
                    {isSnappedX && (
                      <line
                        x1={last[0]} y1={Math.min(last[1], cursorSvg.y) - 40}
                        x2={last[0]} y2={Math.max(last[1], cursorSvg.y) + 40}
                        stroke="var(--color-bo-info-dark)"
                        strokeWidth={0.5}
                        strokeDasharray="6,4"
                        strokeOpacity={0.5}
                        style={{ pointerEvents: 'none' }}
                      />
                    )}
                    {/* Horizontal guide line when snapped to same Y */}
                    {isSnappedY && (
                      <line
                        x1={Math.min(last[0], cursorSvg.x) - 40} y1={last[1]}
                        x2={Math.max(last[0], cursorSvg.x) + 40} y2={last[1]}
                        stroke="var(--color-bo-info-dark)"
                        strokeWidth={0.5}
                        strokeDasharray="6,4"
                        strokeOpacity={0.5}
                        style={{ pointerEvents: 'none' }}
                      />
                    )}
                    {/* Snap cursor indicator */}
                    <circle
                      cx={cursorSvg.x} cy={cursorSvg.y}
                      r={isSnappedX || isSnappedY ? 5 : 3}
                      fill={isSnappedX || isSnappedY ? 'var(--color-bo-info-dark)' : 'var(--color-bo-accent-600)'}
                      fillOpacity={0.6}
                      stroke="white"
                      strokeWidth={1}
                      style={{ pointerEvents: 'none' }}
                    />
                  </>
                );
              })()}
            </g>
          )}

          {/* Drawing in progress: store rectangle */}
          {tool === 'store' && dragStart && dragCurrent && (
            <rect
              x={Math.min(dragStart.x, dragCurrent.x)}
              y={Math.min(dragStart.y, dragCurrent.y)}
              width={Math.abs(dragCurrent.x - dragStart.x)}
              height={Math.abs(dragCurrent.y - dragStart.y)}
              fill="var(--color-bo-accent-600)"
              fillOpacity={0.2}
              stroke="var(--color-bo-accent-600)"
              strokeWidth={2}
              strokeDasharray="5,3"
            />
          )}
        </svg>
        </div>
      </div>

      {/* Right properties panel */}
      <PropertiesPanel
        selected={selected}
        zones={zones}
        stores={stores}
        cameras={cameras}
        onUpdateZone={updateZone}
        onUpdateStore={updateStore}
        onUpdateCamera={updateCamera}
      />
    </div>
  );
}
