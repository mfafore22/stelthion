'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tone = 'primary' | 'teal' | 'amber' | 'violet' | 'neutral';

const tones: Record<Tone, string> = {
  primary: 'bg-bo-primary-500 border-bo-primary-600 text-white shadow-bo-primary-500/20',
  teal: 'bg-teal-500 border-teal-600 text-white shadow-teal-500/20',
  amber: 'bg-amber-500 border-amber-600 text-white shadow-amber-500/20',
  violet: 'bg-violet-500 border-violet-600 text-white shadow-violet-500/20',
  neutral: 'bg-white/70 border-bo-neutral-200 text-bo-neutral-700 shadow-bo-neutral-900/5',
};

const tails: Record<Tone, string> = {
  primary: 'border-t-bo-primary-500',
  teal: 'border-t-teal-500',
  amber: 'border-t-amber-500',
  violet: 'border-t-violet-500',
  neutral: 'border-t-white/70',
};

export function ChatBubbleIcon({ tone = 'primary' }: { tone?: Tone }) {
  return (
    <span className={cn(
      'relative inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border shadow-sm',
      tones[tone],
    )}>
      <MessageCircle className="h-3.5 w-3.5" />
      <span className={cn(
        'absolute -bottom-1 left-1/2 h-0 w-0 -translate-x-1/2 border-l-[4px] border-r-[4px]',
        'border-t-[4px] border-l-transparent border-r-transparent',
        tails[tone],
      )} />
    </span>
  );
}

export function ChatBubbleButton({
  children,
  tone = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode; tone?: Tone }) {
  return (
    <button
      {...props}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-bo-neutral-200 bg-white/70 px-3 py-2',
        'text-xs font-semibold text-bo-neutral-800 shadow-bo-sm backdrop-blur-md',
        'transition-all duration-200 ease-bo-out-expo hover:-translate-y-0.5 hover:border-bo-primary-200 hover:bg-white',
        'disabled:pointer-events-none disabled:opacity-50',
        className,
      )}
    >
      <ChatBubbleIcon tone={tone} />
      <span>{children}</span>
    </button>
  );
}
