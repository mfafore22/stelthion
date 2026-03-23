/**
 * SwirlLoader
 *
 * Stelthion swirl logo spinning counter-clockwise.
 * Used as the universal loading indicator across all dashboards.
 *
 * Sizes:
 *   sm  — 16px  (inline, e.g. buttons)
 *   md  — 24px  (panel / card loading)
 *   lg  — 48px  (section loading)
 *   xl  — 72px  (full-page loading)
 */

import Image from 'next/image';
import { cn } from '@/lib/utils';

type SwirlSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_PX: Record<SwirlSize, number> = {
  sm: 16,
  md: 24,
  lg: 48,
  xl: 72,
};

export interface SwirlLoaderProps {
  size?: SwirlSize;
  className?: string;
}

export function SwirlLoader({ size = 'md', className }: SwirlLoaderProps) {
  const px = SIZE_PX[size];

  return (
    <Image
      src="/stelthion-swirl-v2.png"
      alt="Loading…"
      width={px}
      height={px}
      className={cn('animate-spin-ccw object-contain', className)}
      priority
    />
  );
}
