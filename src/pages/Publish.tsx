import { useMemo, useState } from 'react'
import { useContentStore } from '../shared/store'
import {
  Badge,
  Button,
  Card,
  CardTitle,
  EmptyState,
} from '../shared/components'
import { TOTAL_ENGAGEMENT, type Platform } from '../shared/types'
import { formatDateTime, formatNumber, platformLabel } from '../shared/utils'

export default function Publish() {
  const posts = useContentStore((s) => s.posts)
  const drafts = useContentStore((s) => s.drafts)
  const updatePost = useContentStore((s) => s.updatePost)
  const updatePostMetrics = useContentStore((s) => s.updatePostMetrics)
  const removePost = useContentStore((s) => s.removePost)

  const [filter, setFilter] = useState<'all' | 'scheduled' | 'published' | 'failed'>(
    'all',
  )

  const visible = useMemo(
    () => (filter === 'all' ? posts : posts.filter((p) => p.status === filter)),
    [posts, filter],
  )

  function markPublished(id: string) {
    const url = prompt('URL konten yang sudah terbit:')
    if (url === null) return
    updatePost(id, {
      status: 'published',
      url: url.trim() || null,
      publishedAt: new Date().toISOString(),
    })
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink-300">Publish</h1>
        <p className="mt-1 text-sm text-ink-600">
          Anteur release per platform. Tandai terbit lalu catat URL-nya untuk
          halaman Analytics.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {(['all', 'scheduled', 'published', 'failed'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              filter === s
                ? 'border-vela-600 bg-vela-600/15 text-vela-300'
                : 'border-ink-700 text-ink-400 hover:border-ink-600'
            }`}
          >
            {s === 'all' ? 'Semua' : s}
            <span className="ml-1.5 opacity-60">
              {s === 'all'
                ? posts.length
                : posts.filter((p) => p.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="Antrean kosong"
          hint="Tambahkan draft ke platform dari halaman Drafts → tombol Terbitkan."
        />
      ) : (
        <div className="space-y-3">
          {visible.map((post) => {
            const draft = drafts.find((d) => d.id === post.draftId)
            return (
              <Card key={post.id} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink-300">
                      {draft?.title ?? 'Draft terhapus'}
                    </p>
                    <p className="mt-0.5 text-[11px] text-ink-600">
                      {platformLabel(post.platform as Platform)}
                      {post.publishedAt
                        ? ` · terbit ${formatDateTime(post.publishedAt)}`
                        : ' · belum terbit'}
                    </p>
                  </div>
                  <Badge
                    tone={
                      post.status === 'published'
                        ? 'green'
                        : post.status === 'failed'
                          ? 'red'
                          : 'blue'
                    }
                  >
                    {post.status}
                  </Badge>
                </div>

                {post.url ? (
                  <a
                    href={post.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block truncate text-xs text-vela-400 hover:underline"
                  >
                    {post.url}
                  </a>
                ) : null}

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(['views', 'likes', 'comments', 'shares'] as const).map((k) => (
                    <label key={k} className="block">
                      <span className="mb-0.5 block text-[10px] tracking-wide text-ink-600 uppercase">
                        {k}
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={post.metrics[k]}
                        onChange={(e) =>
                          updatePostMetrics(post.id, {
                            [k]: Number(e.target.value) || 0,
                          })
                        }
                        className="w-full rounded-lg border border-ink-700 bg-ink-900/60 px-2 py-1.5 text-sm text-ink-300 outline-none focus:border-vela-600"
                      />
                    </label>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-ink-700/60 pt-3">
                  {post.status !== 'published' ? (
                    <Button variant="primary" size="sm" onClick={() => markPublished(post.id)}>
                      Tandai terbit
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" onClick={() => updatePost(post.id, { status: 'scheduled', publishedAt: null })}>
                      Batalkan
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updatePost(post.id, { status: 'failed' })}
                  >
                    Tandai gagal
                  </Button>
                  <span className="ml-auto text-[11px] text-ink-600">
                    {formatNumber(TOTAL_ENGAGEMENT(post.metrics))} interaksi
                  </span>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (confirm('Hapus entri ini dari antrean?')) removePost(post.id)
                    }}
                  >
                    Hapus
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <Card>
        <CardTitle>Catatan integrator</CardTitle>
        <p className="text-xs leading-relaxed text-ink-400">
          Versi ini <strong className="text-ink-300">tidak</strong> memanggil
          API platform (Meta Graph, TikTok Content API, YouTube Data API,
          LinkedIn API). Semua metric diisi manual dan disimpan lokal.
          Integrasi API bisa ditambahkan lewat connector di{' '}
          <code className="text-vela-400">src/shared/</code> tanpa mengubah
          model data.
        </p>
      </Card>
    </div>
  )
}