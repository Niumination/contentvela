/** Small formatting/validation helpers shared across pages. */

import { PLATFORM_META, type Platform } from './types'

export function formatNumber(n: number): string {
  if (!Number.isFinite(n)) return '—'
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}k`
  return String(n)
}

export function formatPercent(fraction: number): string {
  if (!Number.isFinite(fraction)) return '—'
  return `${(fraction * 100).toFixed(1)}%`
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Human "3 hari lalu" style label. */
export function relativeTime(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const diff = Date.now() - d.getTime()
  const mins = Math.round(diff / 60_000)
  if (mins < 1) return 'baru saja'
  if (mins < 60) return `${mins} menit lalu`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} hari lalu`
  const months = Math.round(days / 30)
  if (months < 12) return `${months} bulan lalu`
  return `${Math.round(months / 12)} tahun lalu`
}

export function platformLabel(p: Platform): string {
  return PLATFORM_META[p].label
}

/** Character budget usage for a body against a platform limit. */
export function charUsage(body: string, platform: Platform): {
  used: number
  limit: number
  over: boolean
  pct: number
} {
  const limit = PLATFORM_META[platform].limit
  const used = body.length
  return {
    used,
    limit,
    over: used > limit,
    pct: limit > 0 ? Math.min(100, (used / limit) * 100) : 0,
  }
}

/** Parse comma/newline separated tag input into a clean tag list. */
export function parseTags(raw: string): string[] {
  return [
    ...new Set(
      raw
        .split(/[,\n]/)
        .map((t) => t.trim().replace(/^#/, '').toLowerCase())
        .filter(Boolean),
    ),
  ].slice(0, 12)
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

/** Very small markdown renderer: headings, bold, italic, code, lists, links. */
export function renderMarkdown(md: string): string {
  const escape = (s: string) =>
    s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')

  const lines = escape(md).split('\n')
  const out: string[] = []
  let inList = false

  const inline = (s: string) =>
    s
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noreferrer">$1</a>',
      )

  for (const raw of lines) {
    const line = raw.trimEnd()
    const h = line.match(/^(#{1,4})\s+(.*)$/)
    if (h) {
      if (inList) {
        out.push('</ul>')
        inList = false
      }
      const level = h[1].length
      out.push(`<h${level}>${inline(h[2])}</h${level}>`)
      continue
    }
    const li = line.match(/^[-*]\s+(.*)$/)
    if (li) {
      if (!inList) {
        out.push('<ul>')
        inList = true
      }
      out.push(`<li>${inline(li[1])}</li>`)
      continue
    }
    if (inList) {
      out.push('</ul>')
      inList = false
    }
    if (line.trim() === '') continue
    out.push(`<p>${inline(line)}</p>`)
  }
  if (inList) out.push('</ul>')
  return out.join('\n')
}