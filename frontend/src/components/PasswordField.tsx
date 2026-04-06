import { useMemo, useState } from 'react';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

function scorePassword(value: string): { label: string; width: string; tone: string } {
  const checks = [
    value.length >= 10,
    /[a-z]/.test(value) && /[A-Z]/.test(value),
    /\d/.test(value),
    /[^A-Za-z0-9]/.test(value),
  ].filter(Boolean).length;

  if (value.length === 0) {
    return { label: 'Not set', width: '0%', tone: 'bg-slate-700' };
  }
  if (checks <= 1) {
    return { label: 'Weak', width: '33%', tone: 'bg-danger' };
  }
  if (checks <= 3) {
    return { label: 'Fair', width: '66%', tone: 'bg-amber' };
  }
  return { label: 'Strong', width: '100%', tone: 'bg-success' };
}

export default function PasswordField({ value, onChange }: Props) {
  const [visible, setVisible] = useState(false);
  const strength = useMemo(() => scorePassword(value), [value]);

  return (
    <div className="space-y-3 rounded-[24px] border border-panelLine bg-panel p-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.32em] text-slate-500">Encryption Key</p>
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="rounded-full border border-panelLine px-3 py-1 text-xs text-slate-300 transition hover:border-cyan hover:text-cyan"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      <input
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Optional AES-256-GCM password"
        className="w-full rounded-2xl border border-panelLine bg-panelElevated px-4 py-3 font-mono text-sm text-slate-100 outline-none transition focus:border-cyan"
      />
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Password strength</span>
          <span className="font-mono">{strength.label}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-900">
          <div className={`h-full ${strength.tone} transition-all`} style={{ width: strength.width }} />
        </div>
      </div>
    </div>
  );
}
