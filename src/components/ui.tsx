import type { ReactNode } from 'react';

export function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-emerald-500/10 py-1.5 last:border-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <span className="shrink-0 font-mono text-xs uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className={`text-sm text-slate-200 sm:text-right ${mono ? 'break-all font-mono' : ''}`}>
        {value}
      </span>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="panel">
      <p className="panel-title mb-3">{title}</p>
      {children}
    </div>
  );
}

type Tone = 'ok' | 'warn' | 'bad' | 'muted';

const TONE_CLASS: Record<Tone, string> = {
  ok: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300',
  warn: 'border-amber-400/40 bg-amber-400/10 text-amber-300',
  bad: 'border-red-400/40 bg-red-400/10 text-red-300',
  muted: 'border-slate-600/40 bg-slate-500/10 text-slate-400',
};

export function Badge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={`inline-block rounded-md border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${TONE_CLASS[tone]}`}
    >
      {children}
    </span>
  );
}

export function PemInput({
  value,
  onChange,
  placeholder,
  rows = 8,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      spellCheck={false}
      autoComplete="off"
      placeholder={placeholder}
      className="w-full resize-y rounded-lg border border-emerald-500/20 bg-black/50 px-3 py-2 font-mono text-xs text-emerald-200 outline-none focus:border-emerald-400/50"
    />
  );
}

export function ErrorBox({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
      {message}
    </div>
  );
}
