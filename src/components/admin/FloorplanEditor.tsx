'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ToolPalette, type Tool } from './ToolPalette';
import { PropertiesPanel } from './PropertiesPanel';
import { Save, Undo2, Download, ZoomIn, ZoomOut, Maximize, Eye, EyeOff, Globe, RotateCcw } from 'lucide-react';
import { getPolygonBbox, estimateTextWidth } from '@/lib/utils/labelDecollision';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ZoneData {
  id?: string;
  zoneId: string;
  name: string;
  nameFi: string;
  category: string;
  subcategory?: string;
  drawShape?: 'polygon' | 'rect';
  svgPoints: string;
  labelX: number;
  labelY: number;
  capacity: number;
  areaSqm: number;
  baseVisitors: number;
  publishedAt?: string | null;
}

export interface CameraData {
  id?: string;
  deviceType?: 'camera' | 'counter';
  label: string;
  x: number;
  y: number;
  model?: string;
  resolution?: string;
  lensInfo?: string;
  cameraRole?: string;
  angleDeg?: number;
  fovDeg?: number;
  rangeM?: number;
  streamUrl?: string;
  dataSourceUrl?: string;
  zoneDbId?: string;
  active: boolean;
}

type SelectedElement =
  | { type: 'zone'; index: number }
  | { type: 'camera'; index: number }
  | null;

interface FloorplanEditorProps {
  mallId: string;
  floor: string;
  viewBox: string;
  floorplanSrc: string;
  initialZones: ZoneData[];
  initialCameras: CameraData[];
}

// ─── Component ──────────────────────────────────────────────────────────────

export function FloorplanEditor({
  mallId,
  floor,
  viewBox,
  floorplanSrc,
  initialZones,
  initialCameras,
}: FloorplanEditorProps) {
  const { t } = useTranslation('admin');
  const [zones, setZones] = useState<ZoneData[]>(initialZones);
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
  const [draggingCamera, setDraggingCamera] = useState<number | null>(null);

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

  // Mouse wheel + trackpad pinch + Safari gesture zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = -e.deltaY * 0.005;
      setZoom((z) => {
        const next = Math.max(Math.min(z + delta, 8), 1);
        if (next === 1) setPanOffset({ x: 0, y: 0 });
        return next;
      });
    };

    // Safari trackpad pinch fires gesture events
    const onGesture = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const ge = e as Event & { scale: number };
      if (e.type === 'gesturechange' && ge.scale != null) {
        setZoom((z) => {
          const next = Math.max(Math.min(z * ge.scale, 8), 1);
          if (next === 1) setPanOffset({ x: 0, y: 0 });
          return next;
        });
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('gesturestart', onGesture, { passive: false } as EventListenerOptions);
    el.addEventListener('gesturechange', onGesture, { passive: false } as EventListenerOptions);
    el.addEventListener('gestureend', onGesture, { passive: false } as EventListenerOptions);

    return () => {
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('gesturestart', onGesture);
      el.removeEventListener('gesturechange', onGesture);
      el.removeEventListener('gestureend', onGesture);
    };
  }, []);

  // Undo history
  type UndoAction =
    | { type: 'add-zone' }
    | { type: 'add-camera' }
    | { type: 'delete-zone'; data: ZoneData; index: number }
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
    } else if (last.type === 'add-camera') {
      setCameras((prev) => prev.slice(0, -1));
    } else if (last.type === 'delete-zone') {
      setZones((prev) => { const next = [...prev]; next.splice(last.index, 0, last.data); return next; });
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
      } else if (tool === 'camera' || tool === 'counter') {
        const isCounter = tool === 'counter';
        const typeLabel = isCounter ? 'Counter' : 'Camera';
        const count = cameras.filter((c) => (c.deviceType ?? 'camera') === (isCounter ? 'counter' : 'camera')).length;
        const newCamera: CameraData = {
          deviceType: isCounter ? 'counter' : 'camera',
          label: `${typeLabel} ${count + 1}`,
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
      if (tool === 'rect') {
        const pt = toSvg(e);
        setDragStart(pt);
        setDragCurrent(pt);
      }
    },
    [tool, toSvg],
  );

  const handleSvgMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (tool === 'rect' && dragStart) {
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
    if (tool === 'rect' && dragStart && dragCurrent) {
      const x = Math.min(dragStart.x, dragCurrent.x);
      const y = Math.min(dragStart.y, dragCurrent.y);
      const w = Math.abs(dragCurrent.x - dragStart.x);
      const h = Math.abs(dragCurrent.y - dragStart.y);
      const minSize = 5 / zoom;
      if (w > minSize && h > minSize) {
        const svgPoints = `${x},${y} ${x + w},${y} ${x + w},${y + h} ${x},${y + h}`;
        const newZone: ZoneData = {
          zoneId: `zone-${Date.now()}`,
          name: 'New Zone',
          nameFi: 'Uusi alue',
          category: 'Store',
          drawShape: 'rect',
          svgPoints,
          labelX: Math.round(x + w / 2),
          labelY: Math.round(y + h / 2),
          capacity: 0,
          areaSqm: 0,
          baseVisitors: 0,
        };
        setZones((prev) => [...prev, newZone]);
        setSelected({ type: 'zone', index: zones.length });
        pushUndo({ type: 'add-zone' });
        markDirty();
      }
      setDragStart(null);
      setDragCurrent(null);
    }
  }, [tool, dragStart, dragCurrent, zones.length, markDirty]);

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
    } else if (deleteConfirm.type === 'camera') {
      pushUndo({ type: 'delete-camera', data: cameras[deleteConfirm.index], index: deleteConfirm.index });
      setCameras((prev) => prev.filter((_, i) => i !== deleteConfirm.index));
    }
    setSelected(null);
    setDeleteConfirm(null);
    markDirty();
  }, [deleteConfirm, zones, cameras, markDirty, pushUndo]);

  const handleDeleteCancel = useCallback(() => setDeleteConfirm(null), []);

  const deleteItemName = deleteConfirm
    ? deleteConfirm.type === 'zone'
      ? zones[deleteConfirm.index]?.name ?? ''
      : cameras[deleteConfirm.index]?.label ?? ''
    : '';

  // ── Save ────────────────────────────────────────────────────────────
  const handleSave = useCallback(async (confirmBulkDelete = false) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/floorplan/${mallId}/save`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ floor, zones, cameras, confirmBulkDelete }),
      });
      const data = await res.json();

      // Server asks for confirmation on bulk deletes
      if (res.status === 409 && data.needsConfirmation) {
        if (window.confirm(data.error)) {
          // Retry with confirmation flag
          await handleSave(true);
        }
        return;
      }

      if (!res.ok || !data.ok) {
        const msg = data?.error ?? `Save failed (${res.status})`;
        alert(msg);
        console.error('Save refused:', msg);
        return;
      }
      setDirty(false);
      setPublishedAt(data.publishedAt ?? null);
      setSavedSincePublish(true);
    } catch (err) {
      console.error('Save failed:', err);
      alert('Save failed — check console for details.');
    } finally {
      setSaving(false);
    }
  }, [mallId, floor, zones, cameras]);

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

  // ── Zone number badge positions (de-collided) ───────────────────────
  // Ensures zone number badges don't overlap each other and aren't hidden
  // under other zones' polygons.

  interface BadgePos { cx: number; cy: number }

  const badgePositions = useMemo((): BadgePos[] => {
    const BADGE_R = 8;
    const MIN_GAP = 4; // minimum px gap between badge edges
    const spacing = BADGE_R * 2 + MIN_GAP;

    // Helper: check if a point is inside a polygon (ray-casting)
    function pointInPolygon(px: number, py: number, svgPoints: string): boolean {
      const pts = svgPoints.trim().split(/\s+/).map((p) => {
        const [x, y] = p.split(',').map(Number);
        return { x, y };
      });
      let inside = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const xi = pts[i].x, yi = pts[i].y;
        const xj = pts[j].x, yj = pts[j].y;
        if (((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi)) {
          inside = !inside;
        }
      }
      return inside;
    }

    // Start with centroids
    const positions: BadgePos[] = zones.map((zone) => {
      const bbox = getPolygonBbox(zone.svgPoints);
      return { cx: bbox.minX + bbox.w / 2, cy: bbox.minY + bbox.h / 2 };
    });

    // Move badges that are inside another zone's polygon
    for (let i = 0; i < positions.length; i++) {
      const pos = positions[i];
      const ownBbox = getPolygonBbox(zones[i].svgPoints);
      for (let j = 0; j < zones.length; j++) {
        if (j === i) continue;
        if (pointInPolygon(pos.cx, pos.cy, zones[j].svgPoints)) {
          // Badge is hidden under zone j — move to the top edge of own zone
          pos.cx = ownBbox.minX + ownBbox.w / 2;
          pos.cy = ownBbox.minY + BADGE_R + 2;
          // If still inside zone j, try bottom edge
          if (pointInPolygon(pos.cx, pos.cy, zones[j].svgPoints)) {
            pos.cy = ownBbox.minY + ownBbox.h - BADGE_R - 2;
          }
          // If still inside, try left edge
          if (pointInPolygon(pos.cx, pos.cy, zones[j].svgPoints)) {
            pos.cx = ownBbox.minX + BADGE_R + 2;
            pos.cy = ownBbox.minY + ownBbox.h / 2;
          }
          break;
        }
      }
    }

    // Push apart overlapping badges
    for (let pass = 0; pass < 20; pass++) {
      let moved = false;
      for (let a = 0; a < positions.length; a++) {
        for (let b = a + 1; b < positions.length; b++) {
          const dx = positions[b].cx - positions[a].cx;
          const dy = positions[b].cy - positions[a].cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < spacing) {
            moved = true;
            const overlap = (spacing - dist) / 2 + 0.5;
            // Normalize direction (or default to horizontal if same point)
            const nx = dist > 0.1 ? dx / dist : 1;
            const ny = dist > 0.1 ? dy / dist : 0;
            positions[a].cx -= nx * overlap;
            positions[a].cy -= ny * overlap;
            positions[b].cx += nx * overlap;
            positions[b].cy += ny * overlap;
          }
        }
      }
      if (!moved) break;
    }

    return positions;
  }, [zones]);

  // ── Margin callout labels for zones ─────────────────────────────────
  // Places zone labels along top/bottom margins with leader lines to centroids.

  interface MarginLabel {
    zoneIndex: number;
    text: string;
    anchorX: number;
    anchorY: number;
    x: number;
    y: number;
    w: number;
    h: number;
  }


  const marginLabels = useMemo((): MarginLabel[] => {
    if (!showLabels) return [];

    const margin = 10;
    const labelH = 16;
    const labelGap = 6;
    const rowGap = 4;
    const fontSize = 10;
    const padding = 24;
    const midY = baseH / 2;
    const maxRowW = baseW - margin * 2;

    // Build label list with centroid info
    const raw = zones.map((zone, i) => {
      const bbox = getPolygonBbox(zone.svgPoints);
      const cx = bbox.minX + bbox.w / 2;
      const cy = bbox.minY + bbox.h / 2;
      const text = zone.nameFi || zone.name;
      const tw = estimateTextWidth(text, fontSize) + padding;
      return { zoneIndex: i, text, anchorX: cx, anchorY: cy, w: tw, h: labelH, x: 0, y: 0, isTop: cy < midY };
    });

    // Split into top-margin and bottom-margin groups
    const topLabels = raw.filter((l) => l.isTop).sort((a, b) => a.anchorX - b.anchorX);
    const bottomLabels = raw.filter((l) => !l.isTop).sort((a, b) => a.anchorX - b.anchorX);

    // Flow-layout helper: wraps labels into rows, returns row assignments
    function flowLayout(labels: typeof raw, startY: number, direction: 1 | -1) {
      // Break into rows that fit within maxRowW
      const rows: (typeof raw)[] = [[]];
      let rowW = 0;
      for (const l of labels) {
        if (rowW > 0 && rowW + labelGap + l.w > maxRowW) {
          rows.push([]);
          rowW = 0;
        }
        rows[rows.length - 1].push(l);
        rowW += (rowW > 0 ? labelGap : 0) + l.w;
      }

      // Position each row — center horizontally, stack vertically
      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const totalW = row.reduce((s, l) => s + l.w, 0) + (row.length - 1) * labelGap;
        let x = Math.max(margin, (baseW - totalW) / 2);
        const y = startY + direction * r * (labelH + rowGap);
        for (const l of row) {
          l.x = x;
          l.y = y;
          x += l.w + labelGap;
        }
      }
    }

    // Top labels: first row at y=margin, additional rows go downward
    flowLayout(topLabels, margin, 1);

    // Bottom labels: first row at bottom edge, additional rows go upward
    flowLayout(bottomLabels, baseH - margin - labelH, -1);

    return raw;
  }, [zones, showLabels, baseW, baseH]);

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full">
      {/* Top toolbar ribbon — tools + actions */}
      <div className="flex items-center gap-2 p-2 bg-bo-neutral-50 border-b border-bo-neutral-200 shadow-bo-sm shrink-0">
        {/* Drawing tools */}
        <ToolPalette tool={tool} onToolChange={setTool} />
          <button
            onClick={() => handleSave()}
            disabled={!dirty || saving}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-bo-neutral-950 text-bo-neutral-50 disabled:opacity-60 hover:bg-bo-neutral-900 hover:shadow-bo-lg hover:-translate-y-0.5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? t('editor.saving') : t('editor.save')}
          </button>
          <button
            onClick={handleUndo}
            disabled={drawingPoints.length === 0 && undoStack.length === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-bo-neutral-100 text-bo-neutral-700 hover:bg-bo-neutral-200 disabled:opacity-60 transition-all duration-300"
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
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-bo-neutral-950 text-bo-neutral-50 disabled:opacity-60 hover:bg-bo-neutral-900 hover:shadow-bo-lg hover:-translate-y-0.5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
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
                      className="w-full text-left px-3 py-2 text-xs hover:bg-bo-neutral-100 border-b border-bo-neutral-100 last:border-0 transition-colors disabled:opacity-60"
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

          {/* Spacer to push delete button right */}
          <div className="ml-auto" />

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

      {/* Canvas + Properties Panel row */}
      <div className="flex flex-1 min-h-0 bg-bo-neutral-200 overflow-hidden">
        {/* Floor plan SVG */}
        <div ref={containerRef} className="flex-1 overflow-hidden min-h-0 relative">

          {/* Floating zoom controls — bottom-right of canvas */}
          <div className="absolute bottom-4 right-4 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1.5 shadow-bo-md border border-bo-neutral-200">
            <button
              onClick={handleZoomIn}
              className="w-7 h-7 flex items-center justify-center rounded-md text-bo-neutral-700 hover:bg-bo-neutral-100 transition-all duration-200"
              title="Zoom in (Ctrl+scroll)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <span className="text-xs text-bo-neutral-500 w-10 text-center font-mono">{Math.round(zoom * 100)}%</span>
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 1}
              className="w-7 h-7 flex items-center justify-center rounded-md text-bo-neutral-700 hover:bg-bo-neutral-100 disabled:opacity-40 transition-all duration-200"
              title="Zoom out (Ctrl+scroll)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomReset}
              disabled={zoom === 1}
              className="w-7 h-7 flex items-center justify-center rounded-md text-bo-neutral-700 hover:bg-bo-neutral-100 disabled:opacity-40 transition-all duration-200"
              title="Reset zoom"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        <svg
          ref={svgRef}
          viewBox={zoomedViewBox}
          preserveAspectRatio="xMidYMin meet"
          className="w-full h-full"
          style={{
            cursor: isPanning ? 'grabbing' : tool === 'zone' ? 'crosshair' : tool === 'rect' ? 'crosshair' : (tool === 'camera' || tool === 'counter') ? 'cell' : zoom > 1 ? 'grab' : 'default',
            touchAction: 'none',
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
            if (draggingCamera !== null) {
              const pt = toSvg(e);
              setCameras((prev) =>
                prev.map((c, i) => (i === draggingCamera ? { ...c, x: pt.x, y: pt.y } : c)),
              );
              return;
            }
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
            if (draggingCamera !== null) {
              setDraggingCamera(null);
              markDirty();
              return;
            }
            if (isPanning) {
              setIsPanning(false);
              return;
            }
            handleSvgMouseUp();
          }}
          onMouseLeave={() => {
            if (draggingCamera !== null) {
              setDraggingCamera(null);
              markDirty();
            }
          }}
        >
          {/* Floor plan background */}
          <image href={floorplanSrc} x="0" y="0" width={baseW} height={baseH} />

          {/* Zone polygons */}
          {zones.map((zone, i) => {
            const isSelected = selected?.type === 'zone' && selected.index === i;
            const badge = badgePositions[i];
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
                    setSelected({ type: 'zone', index: i });
                  }}
                />
                {/* Zone number badge (small circled number — de-collided position) */}
                {showLabels && badge && (
                  <>
                    <circle
                      cx={badge.cx} cy={badge.cy} r={8}
                      fill={isSelected ? 'var(--color-bo-accent-600)' : 'var(--color-bo-neutral-800)'}
                      fillOpacity={isSelected ? 0.95 : 0.7}
                      stroke="white" strokeWidth={1.5}
                      style={{ pointerEvents: 'none' }}
                    />
                    <text
                      x={badge.cx} y={badge.cy + 3.5}
                      textAnchor="middle"
                      fontSize="8" fontWeight="700"
                      fill="white"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {i + 1}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Camera & counter pins */}
          {cameras.map((cam, i) => {
            const isSelected = selected?.type === 'camera' && selected.index === i;
            const isCounter = (cam.deviceType ?? 'camera') === 'counter';
            const pinColor = !cam.active
              ? 'var(--color-bo-neutral-400)'
              : isCounter
                ? 'var(--color-bo-primary-600)'
                : 'var(--color-bo-error-dark)';
            const pinLetter = isCounter ? 'V' : 'C';
            return (
              <g
                key={`cam-${i}`}
                style={{ cursor: draggingCamera === i ? 'grabbing' : 'pointer' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelected({ type: 'camera', index: i });
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDraggingCamera(i);
                  setSelected({ type: 'camera', index: i });
                }}
              >
                {isCounter ? (
                  // Rounded square for visitor counters
                  <rect
                    x={cam.x - (isSelected ? 10 : 7)}
                    y={cam.y - (isSelected ? 10 : 7)}
                    width={(isSelected ? 10 : 7) * 2}
                    height={(isSelected ? 10 : 7) * 2}
                    rx={3}
                    fill={pinColor}
                    fillOpacity={0.85}
                    stroke="white"
                    strokeWidth={2}
                  />
                ) : (
                  // Circle for cameras
                  <circle
                    cx={cam.x}
                    cy={cam.y}
                    r={isSelected ? 10 : 7}
                    fill={pinColor}
                    fillOpacity={0.85}
                    stroke="white"
                    strokeWidth={2}
                  />
                )}
                <text
                  x={cam.x}
                  y={cam.y + 3}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="700"
                  fill="white"
                  style={{ pointerEvents: 'none' }}
                >
                  {pinLetter}
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

          {/* Drawing in progress: rectangle zone */}
          {tool === 'rect' && dragStart && dragCurrent && (
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

          {/* ── Margin callout labels for zones (top layer) ─────────── */}
          {marginLabels.map((ml) => {
            const zone = zones[ml.zoneIndex];
            if (!zone) return null;
            const isSelected = selected?.type === 'zone' && selected.index === ml.zoneIndex;
            const pillCx = ml.x + ml.w / 2;
            const pillCy = ml.y + ml.h / 2;
            return (
              <g key={`margin-label-${ml.zoneIndex}`}>
                {/* Leader line from margin label to zone centroid */}
                <line
                  x1={pillCx}
                  y1={ml.y < baseH / 2 ? ml.y + ml.h : ml.y}
                  x2={ml.anchorX}
                  y2={ml.anchorY}
                  stroke={isSelected ? 'var(--color-bo-accent-600)' : 'var(--color-bo-neutral-500)'}
                  strokeWidth={isSelected ? 1.2 : 0.8}
                  strokeOpacity={isSelected ? 0.85 : 0.45}
                  strokeDasharray="4,3"
                  style={{ pointerEvents: 'none' }}
                />
                {/* Small dot at zone centroid end */}
                <circle
                  cx={ml.anchorX} cy={ml.anchorY} r={2}
                  fill={isSelected ? 'var(--color-bo-accent-600)' : 'var(--color-bo-neutral-500)'}
                  fillOpacity={isSelected ? 0.85 : 0.5}
                  style={{ pointerEvents: 'none' }}
                />
                {/* Label pill background */}
                <rect
                  x={ml.x}
                  y={ml.y}
                  width={ml.w}
                  height={ml.h}
                  rx={4}
                  fill={isSelected ? 'var(--color-bo-accent-600)' : 'white'}
                  fillOpacity={0.95}
                  stroke={isSelected ? 'var(--color-bo-accent-600)' : 'var(--color-bo-neutral-400)'}
                  strokeWidth={isSelected ? 1.2 : 0.7}
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected({ type: 'zone', index: ml.zoneIndex });
                  }}
                />
                {/* Zone number + name text */}
                <text
                  x={ml.x + ml.w / 2}
                  y={ml.y + ml.h / 2 + 3.5}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill={isSelected ? 'white' : 'var(--color-bo-neutral-800)'}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected({ type: 'zone', index: ml.zoneIndex });
                  }}
                >
                  {ml.zoneIndex + 1}. {ml.text}
                </text>
              </g>
            );
          })}
        </svg>
        </div>

        {/* Right properties panel */}
        <PropertiesPanel
          selected={selected}
          zones={zones}
          cameras={cameras}
          onUpdateZone={updateZone}
          onUpdateCamera={updateCamera}
        />
      </div>
    </div>
  );
}
