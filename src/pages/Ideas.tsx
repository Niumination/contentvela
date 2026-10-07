import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useContentStore } from '../shared/store'
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  Select,
  Textarea,
} from '../shared/components'
import { IDEA_STATUSES, type Idea, type IdeaStatus } from '../shared/types'
import { parseTags, relativeTime } from '../shared/utils'

const STATUS_LABEL: Record<IdeaStatus, string> = {
  inbox: 'Inbox',
  backlog: 'Backlog',
  drafting: 'Drafting',
  ready: 'Ready',
  dropped: 'Dropped',
}

function IdeaCard({ idea }: { idea: Idea }) {
  const updateIdea = useContentStore((s) => s.updateIdea)
  const removeIdea = useContentStore((s) => s.removeIdea)
  const drafts = useContentStore((s) => s.drafts)
  const linkedDrafts = drafts.filter((d) => d.ideaId === idea.id)

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-ink-300">{idea.title}</h3>
          <p className="mt-0.5 text-[11px] text-ink-600">
            dibuat {relativeTime(idea.createdAt)}
            {idea.sourceUrl ? (
              <>
                {' · '}
                <a
                  href={idea.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-vela-400 hover:underline"
                >
                  sumber
                </a>
              </>
            ) : null}
          </p>
        </div>
        <Badge tone={idea.status === 'ready' ? 'green' : 'neutral'}>
          {STATUS_LABEL[idea.status]}
        </Badge>
      </div>

      {idea.notes ? (
        <p className="text-xs leading-relaxed whitespace-pre-line text-ink-400">
          {idea.notes}
        </p>
      ) : null}

      {idea.tags.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {idea.tags.map((t) => (
            <Badge key={t} tone="amber">
              #{t}
            </Badge>
          ))}
        </div>
      ) : null}

      {linkedDrafts.length > 0 ? (
        <div className="text-[11px] text-ink-600">
          📄 {linkedDrafts.length} draft terkait
        </div>
      ) : null}

      <div className="mt-auto flex items-center gap-2 border-t border-ink-700/60 pt-3">
        <div className="w-36">
          <Select
            value={idea.status}
            onChange={(v) => updateIdea(idea.id, { status: v as IdeaStatus })}
            options={IDEA_STATUSES.map((s) => ({
              value: s,
              label: STATUS_LABEL[s],
            }))}
          />
        </div>
        <Link to={`/drafts?idea=${idea.id}`} className="ml-auto">
          <Button variant="ghost" size="sm">
            Tulis draft →
          </Button>
        </Link>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (confirm(`Hapus ide "${idea.title}"?`)) removeIdea(idea.id)
          }}
        >
          Hapus
        </Button>
      </div>
    </Card>
  )
}

export default function Ideas() {
  const ideas = useContentStore((s) => s.ideas)
  const addIdea = useContentStore((s) => s.addIdea)

  const [filter, setFilter] = useState<'all' | IdeaStatus>('all')
  const [title, setTitle] = useState('')
  const [notes, setNotes] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')
  const [sourceUrl, setSourceUrl] = useState('')

  const visible = useMemo(
    () =>
      filter === 'all'
        ? ideas
        : ideas.filter((i) => i.status === filter),
    [ideas, filter],
  )

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    addIdea({
      title,
      notes,
      tags: parseTags(tagsRaw),
      sourceUrl: sourceUrl.trim() || undefined,
      status: 'inbox',
    })
    setTitle('')
    setNotes('')
    setTagsRaw('')
    setSourceUrl('')
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-ink-300">Ideas</h1>
        <p className="mt-1 text-sm text-ink-600">
          Capture ide dari mana saja, lalu kondisikan jadi siap naskah.
        </p>
      </header>

      <Card>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Judul ide"
              value={title}
              onChange={setTitle}
              placeholder="Contoh: 3 cara efisiensi rantai pasok kopi"
            />
            <Input
              label="Sumber URL (opsional)"
              value={sourceUrl}
              onChange={setSourceUrl}
              placeholder="https://…"
            />
          </div>
          <Textarea
            label="Catatan"
            value={notes}
            onChange={setNotes}
            placeholder="Sudut pandang, angle, referensi, hook yang mau dipakai…"
            rows={3}
          />
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              label="Tags (pisahkan koma)"
              value={tagsRaw}
              onChange={setTagsRaw}
              placeholder="kopi, edukasi, hibrida"
            />
            <div className="flex items-end">
              <Button type="submit" disabled={!title.trim()}>
                + Tambah ide
              </Button>
            </div>
          </div>
        </form>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        {(['all', ...IDEA_STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              filter === s
                ? 'border-vela-600 bg-vela-600/15 text-vela-300'
                : 'border-ink-700 text-ink-400 hover:border-ink-600'
            }`}
          >
            {s === 'all' ? 'Semua' : STATUS_LABEL[s]}
            <span className="ml-1.5 opacity-60">
              {s === 'all'
                ? ideas.length
                : ideas.filter((i) => i.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="Tidak ada ide di filter ini"
          hint="Tambah ide di atas, atau ganti filter status."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} />
          ))}
        </div>
      )}
    </div>
  )
}