import { Lock } from 'lucide-react';

const inputClass = [
  'w-full rounded-lg border border-gray-200 bg-gray-50/50 px-4 py-2.5',
  'text-sm text-gray-900 placeholder:text-gray-400 transition-all',
  'focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10',
].join(' ');

export function PasswordField({
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-sm text-gray-600">
        <Lock size={14} className="text-gray-400" />
        {label}
      </label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        minLength={8}
        autoComplete={autoComplete}
        className={inputClass}
      />
    </div>
  );
}
