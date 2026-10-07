/**
 * Domain model for contentvela.
 *
 * All entities carry a string `id` and ISO-8601 timestamps so exported JSON
 * stays diffable and can be imported into any other tool without conversion.
 */

export type ID = string

export type Platform =
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'linkedin'
  | 'x'
  | 'blog'

export const PLATFORMS: Platform[] = [
  'instagram',
  'tiktok',
  'youtube',
  'linkedin',
  'x',
  'blog',
]

/** Human label + default character budget per platform. */
export const PLATFORM_META: Record<
  Platform,
  { label: string; limit: number; unit: string }
> = {
  instagram: { label: 'Instagram', limit: 2200, unit: 'karakter' },
  tiktok: { label: 'TikTok', limit: 2200, unit: 'karakter' },
  youtube: { label: 'YouTube', limit: 5000, unit: 'karakter' },
  linkedin: { label: 'LinkedIn', limit: 3000, unit: 'karakter' },
  x: { label: 'X / Twitter', limit: 280, unit: 'karakter' },
  blog: { label: 'Blog', limit: 100_000, unit: 'karakter' },
}

/** Lifecycle of an idea on the board. */
export type IdeaStatus = 'backlog' | 'inbox' | 'drafting' | 'ready' | 'dropped'

export const IDEA_STATUSES: IdeaStatus[] = [
  'inbox',
  'backlog',
  'drafting',
  'ready',
  'dropped',
]

export interface Idea {
  id: ID
  title: string
  notes: string
  tags: string[]
  status: IdeaStatus
  sourceUrl?: string
  createdAt: string
  updatedAt: string
}

export type DraftStatus = 'outline' | 'writing' | 'review' | 'approved'

export const DRAFT_STATUSES: DraftStatus[] = [
  'outline',
  'writing',
  'review',
  'approved',
]

export interface DraftVersion {
  /** ISO timestamp of the snapshot. */
  at: string
  title: string
  body: string
  /** Character count captured at snapshot time. */
  chars: number
}

export interface Draft {
  id: ID
  ideaId: ID | null
  title: string
  /** Markdown source. */
  body: string
  platforms: Platform[]
  tags: string[]
  status: DraftStatus
  versions: DraftVersion[]
  /** ISO timestamp; null means "publish as soon as approved". */
  scheduledAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Metrics {
  views: number
  likes: number
  comments: number
  shares: number
}

export const ZERO_METRICS: Metrics = {
  views: 0,
  likes: 0,
  comments: 0,
  shares: 0,
}

export type PostStatus = 'scheduled' | 'published' | 'failed'

export interface PublishedPost {
  id: ID
  draftId: ID
  platform: Platform
  status: PostStatus
  url: string | null
  publishedAt: string | null
  metrics: Metrics
}

export const TOTAL_ENGAGEMENT = (m: Metrics) =>
  m.likes + m.comments + m.shares

/** Engagement rate = (likes+comments+shares) / views, as a 0..1 fraction. */
export function engagementRate(m: Metrics): number {
  if (m.views <= 0) return 0
  return TOTAL_ENGAGEMENT(m) / m.views
}

/** Create an id that is unique enough for a single-user local app. */
export function newId(prefix: string): ID {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}_${Date.now().toString(36)}${rand}`
}

export function nowIso(): string {
  return new Date().toISOString()
}