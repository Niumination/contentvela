/** Shared presentational primitives for contentvela. */

import type { ReactNode } from 'react'

const cardBase =
  'rounded-xl border border-ink-700/60 bg-ink-800/70 backdrop-blur-sm'

export function Card({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`${cardBase} p-5 ${className}`}>{children}</div>
}

export function CardTitle({
  children,
  hint,
}: {
  children: ReactNode
  hint?: string
}) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3">
      <h2 className="text-sm font-semibold tracking-wide text-ink-300 uppercase">
        {children}
      </h2>
      {hint ? <span className="text-xs text-ink-600">{hint}</span> : null}
    </div>
  )
}

type ButtonProps = {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'danger' | 'subtle'
  size?: 'sm' | 'md'
  disabled?: boolean
  type?: 'button' | 'submit'
  title?: string
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled,
  type = 'button',
  title,
}: ButtonProps) {
  const variants: Record<string, string> = {
    primary:
      'bg-vela-500 text-ink-900 hover:bg-vela-400 disabled:bg-ink-700 disabled:text-ink-600',
    ghost:
      'bg-transparent text-ink-400 border border-ink-700 hover:border-vela-600 hover:text-vela-300',
    danger:
      'bg-transparent text-red-400 border border-red-900/60 hover:bg-red-950/40',
    subtle: 'bg-ink-700/60 text-ink-300 hover:bg-ink-700',
  }
  const sizes: Record<string, string> = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3.5 py-1.5 text-sm',
  }
  return (
    <button
      type={type}
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg font-medium transition-colors disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]}`}
    >
      {children}
    </button>
  )
}

export function Input({
  value,
  onChange,
  placeholder,
  label,
  type = 'text',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  label?: string
  type?: string
}) {
  const field = (
    <input
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-ink-700 bg-ink-900/60 px-3 py-2 text-sm text-ink-300 outline-none placeholder:text-ink-600 focus:border-vela-600"
    />
  )
  if (!label) return field
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-400">{label}</span>
      {field}
    </label>
  )
}

export function Textarea({
  value,
  onChange,
  placeholder,
  label,
  rows = 6,
  mono = false,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  label?: string
  rows?: number
  mono?: boolean
}) {
  const el = (
    <textarea
      value={value}
      rows={rows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full rounded-lg border border-ink-700 bg-ink-900/60 px-3 py-2 text-sm text-ink-300 outline-none placeholder:text-ink-600 focus:border-vela-600 ${mono ? 'font-mono text-[13px]' : ''}`}
    />
  )
  if (!label) return el
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-400">{label}</span>
      {el}
    </label>
  )
}

export function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  label?: string
}) {
  const el = (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-ink-700 bg-ink-900/60 px-3 py-2 text-sm text-ink-300 outline-none focus:border-vela-600"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  )
  if (!label) return el
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-400">{label}</span>
      {el}
    </label>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'amber' | 'green' | 'red' | 'blue'
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-ink-700/60 text-ink-400 border-ink-600',
    amber: 'bg-vela-600/15 text-vela-300 border-vela-600/40',
    green: 'bg-emerald-950/60 text-emerald-300 border-emerald-800',
    red: 'bg-red-950/60 text-red-300 border-red-900',
    blue: 'bg-sky-950/60 text-sky-300 border-sky-800',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-ink-700 py-14 text-center">
      <div className="text-3xl opacity-40">◌</div>
      <p className="text-sm font-medium text-ink-400">{title}</p>
      {hint ? <p className="max-w-sm text-xs text-ink-600">{hint}</p> : null}
      {action}
    </div>
  )
}

export function Stat({
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  label: string
  value: string
  sub?: string
  tone?: 'neutral' | 'amber' | 'green'
}) {
  const valueTone =
    tone === 'amber'
      ? 'text-vela-300'
      : tone === 'green'
        ? 'text-emerald-300'
        : 'text-ink-300'
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-[11px] font-medium tracking-wide text-ink-600 uppercase">
        {label}
      </span>
      <span className={`text-2xl font-semibold ${valueTone}`}>{value}</span>
      {sub ? <span className="text-xs text-ink-600">{sub}</span> : null}
    </Card>
  )
}