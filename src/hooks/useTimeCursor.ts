// src/hooks/useTimeCursor.ts
// Centralized time cursor: past/now/future + helper for RainViewer historic frame URLs

import { useCallback, useEffect, useMemo, useState } from "react";

export type TimeMode = "past" | "now" | "future";

export function useTimeCursor() {
  // default: now
  const [timeCursor, setTimeCursor] = useState<number>(Date.now());
  const [mode, setMode] = useState<TimeMode>("now");
  const [playing, setPlaying] = useState(false);

  // keep mode in sync with cursor
  useEffect(() => {
    const now = Date.now();
    if (Math.abs(timeCursor - now) < 60_000) setMode("now");
    else if (timeCursor < now) setMode("past");
    else setMode("future");
  }, [timeCursor]);

  // playback engine (10x)
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setTimeCursor((t) => t + 30_000); // +30s per tick
    }, 100);
    return () => clearInterval(id);
  }, [playing]);

  const jumpBack12h = useCallback(() => {
    setTimeCursor(Date.now() - 12 * 3600 * 1000);
  }, []);
  const jumpFwd6h = useCallback(() => {
    setTimeCursor(Date.now() + 6 * 3600 * 1000);
  }, []);

  // RainViewer historic frame (nearest 10-min step)
  const rainviewerFrame = useMemo(() => {
    // step size 10min
    const step = 10 * 60 * 1000;
    const snap = Math.round(timeCursor / step) * step;
    // When future → fall back to latest "nowcast"
    const isFuture = snap > Date.now();
    return {
      isFuture,
      // Docs: https://www.rainviewer.com/api.html (we're using tile cache pattern already)
      // Example we use elsewhere: /v2/radar/nowcast/256/{z}/{x}/{y}/2/1_1.png
      // Historic frames: /v2/radar/2024/08/22/12/50/256/{z}/{x}/{y}/2/1_1.png (yyyy/mm/dd/hh/mm)
      pathDate: new Date(snap),
    };
  }, [timeCursor]);

  return {
    timeCursor,
    setTimeCursor,
    mode,
    playing,
    setPlaying,
    jumpBack12h,
    jumpFwd6h,
    rainviewerFrame,
  };
}
