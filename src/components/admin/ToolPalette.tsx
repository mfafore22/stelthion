'use client';

import { useTranslation } from 'react-i18next';
import { MousePointer2, Pentagon, RectangleHorizontal, Video, Footprints, Eraser } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export type Tool = 'select' | 'zone' | 'rect' | 'camera' | 'counter' | 'erase';

const TOOLS: { id: Tool; labelKey: string; icon: React.ElementType; hintKey: string }[] = [
  { id: 'select', labelKey: 'tools.select', icon: MousePointer2, hintKey: 'tools.selectHint' },
  { id: 'zone', labelKey: 'tools.zone', icon: Pentagon, hintKey: 'tools.zoneHint' },
  { id: 'rect', labelKey: 'tools.rect', icon: RectangleHorizontal, hintKey: 'tools.rectHint' },
  { id: 'camera', labelKey: 'tools.camera', icon: Video, hintKey: 'tools.cameraHint' },
  { id: 'counter', labelKey: 'tools.counter', icon: Footprints, hintKey: 'tools.counterHint' },
  { id: 'erase', labelKey: 'tools.erase', icon: Eraser, hintKey: 'tools.eraseHint' },
];

interface ToolPaletteProps {
  tool: Tool;
  onToolChange: (t: Tool) => void;
}

export function ToolPalette({ tool, onToolChange }: ToolPaletteProps) {
  const { t } = useTranslation('admin');

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1 border-r border-bo-neutral-300 pr-3 mr-1">
        {TOOLS.map((item) => {
          const active = tool === item.id;
          return (
            <Tooltip key={item.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onToolChange(item.id)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bo-primary-600 focus-visible:ring-opacity-20
                    ${active
                      ? 'bg-bo-neutral-950 text-bo-neutral-50 shadow-bo-md -translate-y-0.5'
                      : 'text-bo-neutral-500 hover:bg-bo-neutral-100 hover:text-bo-neutral-950'
                    }`}
                  aria-label={t(item.labelKey)}
                >
                  <item.icon className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="nav-tooltip rounded-lg px-3 py-2"
              >
                <div className="text-sm font-semibold text-white tracking-tight">
                  {t(item.labelKey)}
                </div>
                <div className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                  {t(item.hintKey)}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
