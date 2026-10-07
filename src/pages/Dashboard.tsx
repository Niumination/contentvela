import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useContentStore } from '../shared/store'
import { Badge, Card, CardTitle, EmptyState, Stat } from '../shared/components'
import {
  IDEA_STATUSES,
  PLATFORM_META,
  TOTAL_ENGAGEMENT,
  engagementRate,
  type IdeaStatus,
} from '../shared/types'
import { formatNumber, formatPercent, relativeTime } from '../shared/utils'

const STATUS_LABEL: Record<IdeaStatus, string> = {
  inbox: 'Inbox',
  backlog: 'Backlog',
  drafting: 'Drafting',
  ready: 'Ready',
  dropped: 'Dropped',
}

export default function Dashboard() {
  const ideas = useContentStore((s) => s.ideas)
  const drafts = useContentStore((s) => s.drafts)
  const posts = useContentStore((s) => s.posts)

  const stats = useMemo(() => {
    const published = posts.filter((p) => p.status === 'published')
    const totals = published.reduce(
      (acc, p) => ({
        views: acc.views + p.metrics.views,
        engagement:
          acc.engagement + TOTAL_ENGAGEMENT(p.metrics),
      }),
      { views: 0, engagement: 0 },
    )
    const approved = drafts.filter((d) => d.status === 'approved').length
    return {
      ideas: ideas.length,
      activeIdeas: ideas.filter((i) => i.status !== 'dropped').length,
      drafts: drafts.length,
      approved,
      scheduled: posts.filter((p) => p.status === 'scheduled').length,
      published: published.length,
      views: totals.views,
      engagement: totals.engagement,
      rate: engagementRate({
        views: totals.views,
        likes: totals.engagement,
        comments: 0,
        shares: 0,
      }),
    }
  }, [ideas, drafts, posts])

  const byStatus = useMemo(() => {
    const map = new Map<IdeaStatus, number>()
    for (const s of IDEA_STATUSES) map.set(s, 0)
    for (const i of ideas) map.set(i.status, (map.get(i.status) ?? 0) + 1)
    return map
  }, [ideas])

  const recentDrafts = useMemo(
    () =>
      [...drafts]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 4),
    [drafts],
  )

  const upcoming = useMemo(
    () =>
      drafts
        .filter((d) => d.scheduledAt)
        .sort((a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? ''))
        .slice(0, 5),
    [drafts],
  )

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink-300">Dashboard</h1>
        <p className="mt-1 text-sm text-ink-600">
          Ringkasan pipeline konten: idea → draft → publish → performa.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat
          label="Ide aktif"
          value={String(stats.activeIdeas)}
          sub={`${stats.ideas} total ide`}
          tone="amber"
        />
        <Stat label="Draft" value={String(stats.drafts)} sub={`${stats.approved} disetujui`} />
        <Stat
          label="Terjadwal"
          value={String(stats.scheduled)}
          sub={`${stats.published} terbit`}
        />
        <Stat
          label="Total views"
          value={formatNumber(stats.views)}
          sub={`${formatNumber(stats.engagement)} interaksi`}
          tone="green"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardTitle hint="klik untuk buka board">Pipeline idea</CardTitle>
          {ideas.length === 0 ? (
            <EmptyState
              title="Belum ada ide"
              hint="Mulai dari halaman Ideas — capture ide dari mana saja."
              action={
                <Link to="/ideas">
                  <span className="text-sm text-vela-300 underline">Buka Ideas →</span>
                </Link>
              }
            />
          ) : (
            <div className="space-y-2.5">
              {IDEA_STATUSES.filter((s) => s !== 'dropped').map((s) => {
                const count = byStatus.get(s) ?? 0
                const max = Math.max(...[...byStatus.values()], 1)
                return (
                  <div key={s} className="flex items-center gap-3">
                    <span className="w-20 shrink-0 text-xs text-ink-400">
                      {STATUS_LABEL[s]}
                    </span>
                    <div className="h-6 flex-1 overflow-hidden rounded-md bg-ink-900/60">
                      <div
                        className="flex h-full items-center rounded-md bg-vela-600/40 px-2 transition-all"
                        style={{ width: `${(count / max) * 100}%` }}
                      >
                        <span className="text-[11px] font-medium text-vela-100">
                          {count}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card>
          <CardTitle>Jadwal terdekat</CardTitle>
          {upcoming.length === 0 ? (
            <p className="text-xs text-ink-600">
              Belum ada draft terjadwal. Set jadwal di halaman Drafts.
            </p>
          ) : (
            <ul className="space-y-3">
              {upcoming.map((d) => (
                <li key={d.id} className="text-sm">
                  <Link
                    to={`/drafts/${d.id}`}
                    className="text-ink-300 hover:text-vela-300"
                  >
                    {d.title}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-600">
                    <span>{relativeTime(d.scheduledAt)}</span>
                    {d.platforms.map((p) => (
                      <Badge key={p}>{PLATFORM_META[p].label}</Badge>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardTitle hint="5 terakhir diubah">Draft terbaru</CardTitle>
        {recentDrafts.length === 0 ? (
          <EmptyState
            title="Belum ada draft"
            hint="Buat draft pertama untuk mulai menulis."
            action={
              <Link to="/drafts">
                <span className="text-sm text-vela-300 underline">Buka Drafts →</span>
              </Link>
            }
          />
        ) : (
          <div className="divide-y divide-ink-700/60">
            {recentDrafts.map((d) => (
              <Link
                key={d.id}
                to={`/drafts/${d.id}`}
                className="flex items-center justify-between gap-4 py-3 hover:bg-ink-700/20"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink-300">{d.title}</p>
                  <p className="mt-0.5 text-[11px] text-ink-600">
                    {d.body.length} karakter · diubah {relativeTime(d.updatedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Badge tone={d.status === 'approved' ? 'green' : 'amber'}>
                    {d.status}
                  </Badge>
                  {d.platforms.slice(0, 3).map((p) => (
                    <Badge key={p}>{PLATFORM_META[p].label}</Badge>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {stats.published > 0 ? (
        <Card>
          <CardTitle>Performa agregat</CardTitle>
          <p className="text-sm text-ink-400">
            Engagement rate-rata{' '}
            <span className="font-semibold text-emerald-300">
              {formatPercent(stats.rate)}
            </span>{' '}
            dari {formatNumber(stats.views)} views.
          </p>
        </Card>
      ) : null}
    </div>
  )
}