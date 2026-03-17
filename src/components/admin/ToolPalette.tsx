'use client';

import { useTranslation } from 'react-i18next';
import { MousePointer2, Pentagon, RectangleHorizontal, Video, Eraser } from 'lucide-react';

export type Tool = 'select' | 'zone' | 'store' | 'camera' | 'erase';

const TOOLS: { id: Tool; labelKey: string; icon: React.ElementType; hintKey: string }[] = [
  { id: 'select', labelKey: 'tools.select', icon: MousePointer2, hintKey: 'tools.selectHint' },
  { id: 'zone', labelKey: 'tools.zone', icon: Pentagon, hintKey: 'tools.zoneHint' },
  { id: 'store', labelKey: 'tools.store', icon: RectangleHorizontal, hintKey: 'tools.storeHint' },
  { id: 'camera', labelKey: 'tools.camera', icon: Video, hintKey: 'tools.cameraHint' },
  { id: 'erase', labelKey: 'tools.erase', icon: Eraser, hintKey: 'tools.eraseHint' },
];

interface ToolPaletteProps {
  tool: Tool;
  onToolChange: (t: Tool) => void;
}

export function ToolPalette({ tool, onToolChange }: ToolPaletteProps) {
  const { t } = useTranslation('admin');

  return (
    <div className="w-14 border-r border-bo-neutral-200 bg-bo-neutral-50 flex flex-col items-center py-3 gap-1">
      {TOOLS.map((item) => {
        const active = tool === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onToolChange(item.id)}
            title={`${t(item.labelKey)}: ${t(item.hintKey)}`}
            className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-300 ${
              active
                ? 'bg-bo-accent-600 text-white shadow-bo-sm'
                : 'text-bo-neutral-500 hover:bg-bo-neutral-100 hover:text-bo-neutral-950'
            }`}
          >
            <item.icon className="w-4.5 h-4.5" />
          </button>
        );
      })}
    </div>
  );
}
