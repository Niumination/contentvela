import { useEffect, useMemo } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useContentStore } from '../shared/store'
import { Badge, Button, Card, CardTitle, EmptyState, Stat } from '../shared/components'
import {
  ZERO_METRICS,
  TOTAL_ENGAGEMENT,
  engagementRate,
  type Metrics,
} from '../shared/types'
import { formatDate, formatNumber, formatPercent, platformLabel } from '../shared/utils'

const PIE_COLORS = [
  '#f59e0b',
  '#38bdf8',
  '#34d399',
  '#f472b6',
  '#a78bfa',
  '#fb923c',
]

export default function Analytics() {
  const posts = useContentStore((s) => s.posts)
  const drafts = useContentStore((s) => s.drafts)
  const syncPlatformMetrics = useContentStore((s) => s.syncPlatformMetrics)

  // Keep the roll-up in sync whenever posts change.
  useEffect(() => {
    syncPlatformMetrics()
  }, [posts, syncPlatformMetrics])

  const published = useMemo(
    () => posts.filter((p) => p.status === 'published'),
    [posts],
  )

  const totals = useMemo(() => {
    const t = published.reduce<Metrics>(
      (acc, p) => ({
        views: acc.views + p.metrics.views,
        likes: acc.likes + p.metrics.likes,
        comments: acc.comments + p.metrics.comments,
        shares: acc.shares + p.metrics.shares,
      }),
      { ...ZERO_METRICS },
    )
    return { ...t, engagement: TOTAL_ENGAGEMENT(t), rate: engagementRate(t) }
  }, [published])

  const byPlatform = useMemo(() => {
    const map = new Map<string, Metrics>()
    for (const p of published) {
      const cur = map.get(p.platform) ?? { ...ZERO_METRICS }
      map.set(p.platform, {
        views: cur.views + p.metrics.views,
        likes: cur.likes + p.metrics.likes,
        comments: cur.comments + p.metrics.comments,
        shares: cur.shares + p.metrics.shares,
      })
    }
    return [...map.entries()]
      .map(([platform, m]) => ({
        platform: platformLabel(platform as never),
        views: m.views,
        engagement: TOTAL_ENGAGEMENT(m),
        rate: engagementRate(m),
      }))
      .sort((a, b) => b.views - a.views)
  }, [published])

  const timeline = useMemo(() => {
    const rows = published
      .filter((p) => p.publishedAt)
      .slice()
      .sort((a, b) => (a.publishedAt ?? '').localeCompare(b.publishedAt ?? ''))
      .map((p) => ({
        date: formatDate(p.publishedAt),
        views: p.metrics.views,
        engagement: TOTAL_ENGAGEMENT(p.metrics),
        platform: platformLabel(p.platform as never),
      }))
    return rows
  }, [published])

  const topPosts = useMemo(
    () =>
      [...published]
        .sort((a, b) => b.metrics.views - a.metrics.views)
        .slice(0, 5),
    [published],
  )

  if (published.length === 0) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-2xl font-semibold text-ink-300">Analytics</h1>
          <p className="mt-1 text-sm text-ink-600">
            Performa konten per platform.
          </p>
        </header>
        <EmptyState
          title="Belum ada konten terbit"
          hint="Tandai konten sebagai terbit di halaman Publish, lalu isi metrics-nya untuk melihat grafik di sini."
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink-300">Analytics</h1>
        <p className="mt-1 text-sm text-ink-600">
          Performa konten per platform, dihitung dari data di halaman Publish.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Views" value={formatNumber(totals.views)} tone="amber" />
        <Stat label="Likes" value={formatNumber(totals.likes)} />
        <Stat label="Komentar" value={formatNumber(totals.comments)} />
        <Stat label="Share" value={formatNumber(totals.shares)} />
        <Stat
          label="Engagement rate"
          value={formatPercent(totals.rate)}
          tone="green"
          sub="interaksi / views"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardTitle hint="kumulasi per platform">Views per platform</CardTitle>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byPlatform}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="platform" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="views" radius={[6, 6, 0, 0]}>
                  {byPlatform.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardTitle>Komposisi engagement</CardTitle>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={byPlatform}
                  dataKey="engagement"
                  nameKey="platform"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {byPlatform.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <CardTitle>Timeline</CardTitle>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="views"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="engagement"
                stroke="#38bdf8"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <CardTitle hint="5 teratas">Konten teratas</CardTitle>
        <div className="divide-y divide-ink-700/60">
          {topPosts.map((p) => {
            const draft = drafts.find((d) => d.id === p.draftId)
            return (
              <div key={p.id} className="py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink-300">
                      {draft?.title ?? 'Draft terhapus'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-600">
                      {platformLabel(p.platform as never)} ·{' '}
                      {formatDate(p.publishedAt)} ·{' '}
                      {formatPercent(engagementRate(p.metrics))} rate
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge tone="amber">{formatNumber(p.metrics.views)} views</Badge>
                    {p.url ? (
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-vela-400 hover:underline"
                      >
                        buka ↗
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      <Card>
        <Button variant="subtle" size="sm" onClick={() => syncPlatformMetrics()}>
          Refresh roll-up metrik
        </Button>
        <p className="mt-2 text-[11px] text-ink-600">
          Roll-up dihitung ulang otomatis setiap kali halaman ini dibuka.
        </p>
      </Card>
    </div>
  )
}