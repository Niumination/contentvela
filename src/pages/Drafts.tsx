import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useContentStore } from '../shared/store'
import {
  Badge,
  Button,
  Card,
  CardTitle,
  EmptyState,
  Input,
  Select,
  Textarea,
} from '../shared/components'
import {
  DRAFT_STATUSES,
  PLATFORMS,
  PLATFORM_META,
  type DraftStatus,
  type Platform,
} from '../shared/types'
import { charUsage, formatDateTime, renderMarkdown } from '../shared/utils'

const STATUS_LABEL: Record<DraftStatus, string> = {
  outline: 'Outline',
  writing: 'Writing',
  review: 'Review',
  approved: 'Approved',
}

function Editor({ draftId }: { draftId: string }) {
  const draft = useContentStore((s) => s.drafts.find((d) => d.id === draftId))
  const ideas = useContentStore((s) => s.ideas)
  const updateDraft = useContentStore((s) => s.updateDraft)
  const snapshotDraft = useContentStore((s) => s.snapshotDraft)
  const removeDraft = useContentStore((s) => s.removeDraft)
  const enqueuePost = useContentStore((s) => s.enqueuePost)

  const [tab, setTab] = useState<'write' | 'preview'>('write')

  if (!draft) {
    return (
      <EmptyState
        title="Draft tidak ditemukan"
        hint="Mungkin sudah dihapus. Kembali ke daftar draft."
      />
    )
  }

  const linkedIdea = ideas.find((i) => i.id === draft.ideaId)

  function togglePlatform(p: Platform) {
    const has = draft!.platforms.includes(p)
    updateDraft(draftId, {
      platforms: has
        ? draft!.platforms.filter((x) => x !== p)
        : [...draft!.platforms, p],
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => history.back()}>
            ← Kembali
          </Button>
          <Badge tone={draft.status === 'approved' ? 'green' : 'amber'}>
            {STATUS_LABEL[draft.status]}
          </Badge>
          {linkedIdea ? (
            <span className="text-xs text-ink-600">
              dari ide: {linkedIdea.title}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="subtle" size="sm" onClick={() => snapshotDraft(draftId)}>
            Simpan versi
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (confirm(`Hapus draft "${draft.title}"?`)) {
                removeDraft(draftId)
                history.back()
              }
            }}
          >
            Hapus
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card>
            <Input
              value={draft.title}
              onChange={(v) => updateDraft(draftId, { title: v })}
              placeholder="Judul draft"
            />
            <div className="mt-3 flex gap-2">
              {(['write', 'preview'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`rounded-lg px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    tab === t
                      ? 'bg-vela-600/20 text-vela-300'
                      : 'text-ink-600 hover:text-ink-400'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="mt-3">
              {tab === 'write' ? (
                <Textarea
                  value={draft.body}
                  onChange={(v) => updateDraft(draftId, { body: v })}
                  placeholder="Tulis naskah dalam Markdown…"
                  rows={20}
                  mono
                />
              ) : (
                <div
                  className="vela-prose min-h-[420px] rounded-lg border border-ink-700 bg-ink-900/40 p-5"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(draft.body) }}
                />
              )}
            </div>
          </Card>

          <Card>
            <CardTitle hint={`${draft.versions.length} versi`}>Riwayat versi</CardTitle>
            {draft.versions.length === 0 ? (
              <p className="text-xs text-ink-600">
                Belum ada snapshot. Klik "Simpan versi" untuk mengarsipkan naskah
                saat ini.
              </p>
            ) : (
              <ul className="space-y-2">
                {[...draft.versions].reverse().map((v, i) => (
                  <li
                    key={`${v.at}-${i}`}
                    className="flex items-center justify-between gap-3 text-xs"
                  >
                    <span className="text-ink-400">
                      {formatDateTime(v.at)} · {v.chars} karakter
                    </span>
                    <span className="truncate text-ink-600">{v.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardTitle>Status</CardTitle>
            <Select
              value={draft.status}
              onChange={(v) => updateDraft(draftId, { status: v as DraftStatus })}
              options={DRAFT_STATUSES.map((s) => ({
                value: s,
                label: STATUS_LABEL[s],
              }))}
            />
            <div className="mt-4">
              <Input
                label="Jadwal publish (opsional)"
                type="datetime-local"
                value={draft.scheduledAt ? draft.scheduledAt.slice(0, 16) : ''}
                onChange={(v) =>
                  updateDraft(draftId, {
                    scheduledAt: v ? new Date(v).toISOString() : null,
                  })
                }
              />
            </div>
          </Card>

          <Card>
            <CardTitle>Target platform</CardTitle>
            <div className="space-y-2">
              {PLATFORMS.map((p) => {
                const on = draft.platforms.includes(p)
                const usage = charUsage(draft.body, p)
                return (
                  <button
                    key={p}
                    onClick={() => togglePlatform(p)}
                    className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                      on
                        ? 'border-vela-600/60 bg-vela-600/10'
                        : 'border-ink-700 hover:border-ink-600'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-ink-300">
                        {PLATFORM_META[p].label}
                      </span>
                      <span
                        className={`text-[11px] ${usage.over ? 'text-red-400' : 'text-ink-600'}`}
                      >
                        {usage.used}/{usage.limit}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-ink-900">
                      <div
                        className={`h-full rounded-full ${
                          usage.over ? 'bg-red-500' : 'bg-vela-500'
                        }`}
                        style={{ width: `${usage.pct}%` }}
                      />
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>

          <Card>
            <CardTitle>Terbitkan</CardTitle>
            {draft.platforms.length === 0 ? (
              <p className="text-xs text-ink-600">
                Pilih minimal satu platform di atas.
              </p>
            ) : (
              <div className="space-y-2">
                {draft.platforms.map((p) => (
                  <Button
                    key={p}
                    variant="ghost"
                    size="sm"
                    onClick={() => enqueuePost(draftId, p)}
                    title="Tambahkan antrean publish"
                  >
                    + {PLATFORM_META[p].label}
                  </Button>
                ))}
              </div>
            )}
            <p className="mt-3 text-[10px] leading-relaxed text-ink-600">
              Ini menambah entri ke antrean publish (halaman Publish) —
              connector API per platform belum diimplementasikan, jadi url
              diisi manual setelah terbit.
            </p>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function Drafts() {
  const drafts = useContentStore((s) => s.drafts)
  const addDraft = useContentStore((s) => s.addDraft)
  const [params] = useSearchParams()
  const ideaParam = params.get('idea')

  const [title, setTitle] = useState('')

  const sorted = useMemo(
    () => [...drafts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [drafts],
  )

  // When arriving from an idea, preselect that draft if it exists.
  const linked = useMemo(
    () => drafts.filter((d) => d.ideaId === ideaParam),
    [drafts, ideaParam],
  )
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    if (selectedId) return
    const first = ideaParam ? linked[0] : sorted[0]
    if (first) setSelectedId(first.id)
  }, [ideaParam, linked, sorted, selectedId])

  const active = selectedId ? drafts.find((d) => d.id === selectedId) : null

  if (active) {
    return (
      <div>
        <Editor draftId={active.id} />
        <div className="mt-6">
          <button
            onClick={() => setSelectedId(null)}
            className="text-xs text-ink-600 hover:text-ink-400"
          >
            ← Kembali ke daftar draft
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink-300">Drafts</h1>
        <p className="mt-1 text-sm text-ink-600">
          Tulis, tinjau, dansnapshot naskah sebelum terbit.
        </p>
      </header>

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!title.trim()) return
            const id = addDraft({
              title,
              ideaId: ideaParam,
              status: 'outline',
            })
            setSelectedId(id)
            setTitle('')
          }}
          className="flex items-end gap-3"
        >
          <div className="flex-1">
            <Input
              label="Judul draft baru"
              value={title}
              onChange={setTitle}
              placeholder="Contoh: Karat daun kopi — 3 tanda yang sering terlewat"
            />
          </div>
          <Button type="submit" disabled={!title.trim()}>
            + Buat draft
          </Button>
        </form>
      </Card>

      {sorted.length === 0 ? (
        <EmptyState
          title="Belum ada draft"
          hint="Buat draft pertama di atas untuk mulai menulis."
        />
      ) : (
        <Card>
          <CardTitle hint={`${sorted.length} draft`}>Semua draft</CardTitle>
          <div className="divide-y divide-ink-700/60">
            {sorted.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedId(d.id)}
                className="flex w-full items-center justify-between gap-4 py-3 text-left hover:bg-ink-700/20"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink-300">{d.title}</p>
                  <p className="mt-0.5 text-[11px] text-ink-600">
                    {d.body.length} karakter · {d.platforms.length} platform ·{' '}
                    {d.versions.length} versi
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Badge tone={d.status === 'approved' ? 'green' : 'amber'}>
                    {STATUS_LABEL[d.status]}
                  </Badge>
                  {d.scheduledAt ? (
                    <Badge tone="blue">{formatDateTime(d.scheduledAt)}</Badge>
                  ) : null}
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}