/**
 * Single persisted Zustand store for all contentvela data.
 *
 * Persist strategy: localStorage under `contentvela.v1`. On first load the app
 * seeds a couple of example ideas/drafts so the UI is never an empty void —
 * useful for screenshots and for verifying the workflow end-to-end.
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  ZERO_METRICS,
  newId,
  nowIso,
  type Draft,
  type DraftStatus,
  type ID,
  type Idea,
  type IdeaStatus,
  type Metrics,
  type Platform,
  type PublishedPost,
} from './types'

const STORAGE_KEY = 'contentvela.v1'

export interface ContentVelaState {
  ideas: Idea[]
  drafts: Draft[]
  posts: PublishedPost[]
  /** Per-platform last-known metrics for the analytics roll-up. */
  platformMetrics: Record<string, Metrics>

  // ideas
  addIdea: (input: Partial<Idea> & { title: string }) => ID
  updateIdea: (id: ID, patch: Partial<Idea>) => void
  removeIdea: (id: ID) => void

  // drafts
  addDraft: (input: Partial<Draft> & { title: string }) => ID
  updateDraft: (id: ID, patch: Partial<Draft>) => void
  /** Save a snapshot of the current title/body into draft.versions. */
  snapshotDraft: (id: ID) => void
  removeDraft: (id: ID) => void

  // publish queue
  enqueuePost: (draftId: ID, platform: Platform, url?: string) => ID
  updatePost: (id: ID, patch: Partial<PublishedPost>) => void
  updatePostMetrics: (id: ID, metrics: Partial<Metrics>) => void
  removePost: (id: ID) => void

  /** Roll every published post's metrics into platformMetrics. */
  syncPlatformMetrics: () => void

  /** Wipe everything back to the seed state. */
  resetToSeed: () => void
  clearAll: () => void
}

function seedState(): Pick<
  ContentVelaState,
  'ideas' | 'drafts' | 'posts' | 'platformMetrics'
> {
  const t = nowIso()
  const ideaId = newId('idea')
  const ideaId2 = newId('idea')
  const draftId = newId('draft')

  const ideas: Idea[] = [
    {
      id: ideaId,
      title: 'Stasiun Cuaca Kebun — Eduardisi mikroklimat kopi',
      notes:
        'Ter especificamente: riwayat bloom/fase bulan + RH untuk deteksi karat daun. Panjang ~90 detik untuk YouTube Shorts.',
      tags: ['kopi', 'agroklimat', 'edukatif'],
      status: 'drafting',
      createdAt: t,
      updatedAt: t,
    },
    {
      id: ideaId2,
      title: 'Kenapa curl 9router gratis masih cukup untuk cron produksi',
      notes:
        'Studi kasus: 3 job LLM dipin ke oc-combo-2 via provider 9router, hemat ~117k token/hari.',
      tags: ['teknologi', 'hermes'],
      status: 'backlog',
      createdAt: t,
      updatedAt: t,
    },
  ]

  const drafts: Draft[] = [
    {
      id: draftId,
      ideaId,
      title: 'Karat daun kopi: 3 tanda yang sering terlewat',
      body: `## Hook

Kopi Gayo kehilangan 20–30% panen kalau karat daun (*Hemileia vastatrix*) lolos deteksi.

## 3 tanda yang sering terlewat

1. **Kelembapan > 85%** selama 6 jam berturut-turut
2. **Suhu 15–24°C** — justru rentang "ideal" buat jamur
3. **Bercak kuning di sisi bawah daun**, bukan permukaan atas

> Rahasianya: jangan tunggu bercak sampai sudah jelas.

## Call to action

Cek mikroklimat kebun kamu hari ini juga.`,
      platforms: ['instagram', 'youtube'],
      tags: ['kopi', 'penyakit'],
      status: 'writing',
      versions: [],
      scheduledAt: null,
      createdAt: t,
      updatedAt: t,
    },
  ]

  const posts: PublishedPost[] = []

  return { ideas, drafts, posts, platformMetrics: {} }
}

export const useContentStore = create<ContentVelaState>()(
  persist(
    (set, get) => ({
      ...seedState(),

      addIdea: (input) => {
        const t = nowIso()
        const idea: Idea = {
          id: newId('idea'),
          title: input.title.trim(),
          notes: input.notes ?? '',
          tags: input.tags ?? [],
          status: input.status ?? 'inbox',
          sourceUrl: input.sourceUrl,
          createdAt: t,
          updatedAt: t,
        }
        set((s) => ({ ideas: [idea, ...s.ideas] }))
        return idea.id
      },

      updateIdea: (id, patch) =>
        set((s) => ({
          ideas: s.ideas.map((i) =>
            i.id === id ? { ...i, ...patch, updatedAt: nowIso() } : i,
          ),
        })),

      removeIdea: (id) =>
        set((s) => ({ ideas: s.ideas.filter((i) => i.id !== id) })),

      addDraft: (input) => {
        const t = nowIso()
        const draft: Draft = {
          id: newId('draft'),
          ideaId: input.ideaId ?? null,
          title: input.title.trim(),
          body: input.body ?? '',
          platforms: input.platforms ?? [],
          tags: input.tags ?? [],
          status: input.status ?? 'outline',
          versions: [],
          scheduledAt: input.scheduledAt ?? null,
          createdAt: t,
          updatedAt: t,
        }
        set((s) => ({ drafts: [draft, ...s.drafts] }))
        return draft.id
      },

      updateDraft: (id, patch) =>
        set((s) => ({
          drafts: s.drafts.map((d) =>
            d.id === id ? { ...d, ...patch, updatedAt: nowIso() } : d,
          ),
        })),

      snapshotDraft: (id) =>
        set((s) => ({
          drafts: s.drafts.map((d) => {
            if (d.id !== id) return d
            return {
              ...d,
              versions: [
                ...d.versions,
                { at: nowIso(), title: d.title, body: d.body, chars: d.body.length },
              ],
            }
          }),
        })),

      removeDraft: (id) =>
        set((s) => ({ drafts: s.drafts.filter((d) => d.id !== id) })),

      enqueuePost: (draftId, platform, url) => {
        const post: PublishedPost = {
          id: newId('post'),
          draftId,
          platform,
          status: 'scheduled',
          url: url ?? null,
          publishedAt: null,
          metrics: { ...ZERO_METRICS },
        }
        set((s) => ({ posts: [...s.posts, post] }))
        return post.id
      },

      updatePost: (id, patch) =>
        set((s) => ({ posts: s.posts.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),

      updatePostMetrics: (id, metrics) =>
        set((s) => ({
          posts: s.posts.map((p) =>
            p.id === id
              ? { ...p, metrics: { ...p.metrics, ...metrics } }
              : p,
          ),
        })),

      removePost: (id) =>
        set((s) => ({ posts: s.posts.filter((p) => p.id !== id) })),

      syncPlatformMetrics: () => {
        const roll: Record<string, Metrics> = {}
        for (const p of get().posts) {
          const cur = roll[p.platform] ?? { ...ZERO_METRICS }
          roll[p.platform] = {
            views: cur.views + p.metrics.views,
            likes: cur.likes + p.metrics.likes,
            comments: cur.comments + p.metrics.comments,
            shares: cur.shares + p.metrics.shares,
          }
        }
        set({ platformMetrics: roll })
      },

      resetToSeed: () => set(seedState()),
      clearAll: () =>
        set({ ideas: [], drafts: [], posts: [], platformMetrics: {} }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
    },
  ),
)

/** Derive a draft's idea title, if linked. */
export function useIdeaTitle(ideaId: ID | null): string {
  if (!ideaId) return '—'
  return useContentStore((s) => s.ideas.find((i) => i.id === ideaId)?.title ?? '—')
}

export type { DraftStatus, IdeaStatus }