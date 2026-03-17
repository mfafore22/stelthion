import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export function Switch({
  checked = false,
  onCheckedChange,
  disabled,
  className,
  ...props
}: SwitchProps) {
  const [internalChecked, setInternalChecked] = React.useState(checked);

  React.useEffect(() => {
    setInternalChecked(checked);
  }, [checked]);

  const toggle = () => {
    if (disabled) return;
    const next = !internalChecked;
    setInternalChecked(next);
    onCheckedChange?.(next);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={internalChecked}
      disabled={disabled}
      onClick={toggle}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full border border-slate-600 transition-colors',
        internalChecked ? 'bg-sky-500/80 border-sky-400' : 'bg-slate-800',
        disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-sky-300',
        className
      )}
      {...props}
    >
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
          internalChecked ? 'translate-x-5' : 'translate-x-1'
        )}
      />
    </button>
  );
}
