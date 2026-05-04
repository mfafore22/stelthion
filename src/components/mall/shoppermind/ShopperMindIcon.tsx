'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

export function ShopperMindIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn('relative inline-block h-7 w-7', className)}
      aria-hidden
    >
      <Image
        src="/assets/icons/shoppermind-brain-basket.png"
        alt=""
        fill
        sizes="32px"
        className="object-contain opacity-80 transition-opacity group-hover:opacity-100 group-aria-[current=page]:invert group-aria-[current=page]:opacity-100"
      />
    </span>
  );
}
