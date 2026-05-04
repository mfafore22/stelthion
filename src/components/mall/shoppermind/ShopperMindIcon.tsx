'use client';

import Image from 'next/image';
import { cn } from '@/lib/utils';

export function ShopperMindIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn('relative inline-block h-8 w-8', className)}
      aria-hidden
    >
      <Image
        src="/assets/icons/shoppermind-basket-chat.png"
        alt=""
        fill
        sizes="36px"
        className="object-contain opacity-80 transition-opacity group-hover:opacity-100 group-aria-[current=page]:invert group-aria-[current=page]:opacity-100"
      />
    </span>
  );
}
