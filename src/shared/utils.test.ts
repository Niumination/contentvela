import { describe, expect, it } from 'vitest'
import {
  PLATFORM_META,
  ZERO_METRICS,
  TOTAL_ENGAGEMENT,
  engagementRate,
} from '../shared/types'
import {
  charUsage,
  formatNumber,
  formatPercent,
  parseTags,
  renderMarkdown,
  slugify,
} from '../shared/utils'

describe('number formatting', () => {
  it('abbreviates thousands and millions', () => {
    expect(formatNumber(999)).toBe('999')
    expect(formatNumber(1500)).toBe('1.5k')
    expect(formatNumber(2_400_000)).toBe('2.4M')
  })

  it('returns a dash for non-finite input', () => {
    expect(formatNumber(Number.NaN)).toBe('—')
  })

  it('formats percentages to one decimal', () => {
    expect(formatPercent(0)).toBe('0.0%')
    expect(formatPercent(0.1234)).toBe('12.3%')
    expect(formatPercent(1)).toBe('100.0%')
  })
})

describe('engagement math', () => {
  it('sums likes, comments and shares', () => {
    expect(
      TOTAL_ENGAGEMENT({ views: 100, likes: 5, comments: 2, shares: 3 }),
    ).toBe(10)
  })

  it('returns a zero rate when there are no views', () => {
    expect(engagementRate({ ...ZERO_METRICS, likes: 5 })).toBe(0)
  })

  it('computes engagement rate as interactions over views', () => {
    expect(
      engagementRate({ views: 200, likes: 10, comments: 5, shares: 5 }),
    ).toBe(0.1)
  })
})

describe('charUsage', () => {
  it('flags content over the platform limit', () => {
    const over = charUsage('x'.repeat(PLATFORM_META.x.limit + 1), 'x')
    expect(over.over).toBe(true)
    expect(over.pct).toBe(100)
  })

  it('reports usage below the limit without flagging', () => {
    const under = charUsage('hello', 'x')
    expect(under.over).toBe(false)
    expect(under.used).toBe(5)
  })
})

describe('parseTags', () => {
  it('lowercases, strips hash, dedupes and drops empties', () => {
    expect(parseTags('#Kopi, Movies, kopi, ,  hibrida ')).toEqual([
      'kopi',
      'movies',
      'hibrida',
    ])
  })

  it('accepts newline separated tags', () => {
    expect(parseTags('a\nb\na')).toEqual(['a', 'b'])
  })

  it('caps at 12 tags', () => {
    const many = Array.from({ length: 20 }, (_, i) => `t${i}`).join(',')
    expect(parseTags(many)).toHaveLength(12)
  })
})

describe('slugify', () => {
  it('produces a url-safe slug', () => {
    expect(slugify('Karat Daun Kopi: 3 Tanda!')).toBe(
      'karat-daun-kopi-3-tanda',
    )
  })
})

describe('renderMarkdown', () => {
  it('renders headings, bold, italic, code and lists', () => {
    const html = renderMarkdown(
      '## Judul\n\nTeks **tebal** dan *miring* dengan `kode`.\n\n- satu\n- dua',
    )
    expect(html).toContain('<h2>Judul</h2>')
    expect(html).toContain('<strong>tebal</strong>')
    expect(html).toContain('<em>miring</em>')
    expect(html).toContain('<code>kode</code>')
    expect(html).toContain('<ul>')
    expect(html).toContain('<li>satu</li>')
  })

  it('escapes HTML to avoid injection', () => {
    const html = renderMarkdown('<script>alert(1)</script>')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
  })

  it('renders safe links with rel=noopener', () => {
    const html = renderMarkdown('[situs](https://example.com)')
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('rel="noreferrer"')
  })

  it('closes an open list at the end of input', () => {
    expect(renderMarkdown('- a\n- b')).toContain('</ul>')
  })
})