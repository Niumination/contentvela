import { beforeEach, describe, expect, it } from 'vitest'
import { useContentStore } from '../shared/store'
import { ZERO_METRICS, engagementRate } from '../shared/types'

const initial = useContentStore.getState()

beforeEach(() => {
  useContentStore.setState({
    ideas: [],
    drafts: [],
    posts: [],
    platformMetrics: {},
  })
})

describe('idea lifecycle', () => {
  it('creates an idea with defaults and trims the title', () => {
    const id = useContentStore.getState().addIdea({ title: '  Ide baru  ' })
    const idea = useContentStore.getState().ideas.find((i) => i.id === id)
    expect(idea).toBeDefined()
    expect(idea!.title).toBe('Ide baru')
    expect(idea!.status).toBe('inbox')
    expect(idea!.tags).toEqual([])
  })

  it('updates an idea and bumps updatedAt', () => {
    const id = useContentStore.getState().addIdea({ title: 'A' })
    useContentStore.getState().updateIdea(id, { status: 'ready', tags: ['x'] })
    const idea = useContentStore.getState().ideas[0]
    expect(idea.status).toBe('ready')
    expect(idea.tags).toEqual(['x'])
  })

  it('removes an idea by id', () => {
    const id = useContentStore.getState().addIdea({ title: 'A' })
    useContentStore.getState().removeIdea(id)
    expect(useContentStore.getState().ideas).toHaveLength(0)
  })
})

describe('draft lifecycle', () => {
  it('creates a draft linked to an idea', () => {
    const ideaId = useContentStore.getState().addIdea({ title: 'I' })
    const id = useContentStore
      .getState()
      .addDraft({ title: 'D', ideaId, body: 'hello' })
    const draft = useContentStore.getState().drafts[0]
    expect(draft.id).toBe(id)
    expect(draft.ideaId).toBe(ideaId)
    expect(draft.status).toBe('outline')
    expect(draft.versions).toEqual([])
  })

  it('appends an immutable version snapshot with char count', () => {
    const id = useContentStore.getState().addDraft({ title: 'D', body: 'abc' })
    useContentStore.getState().snapshotDraft(id)
    useContentStore.getState().updateDraft(id, { body: 'abcdef' })
    useContentStore.getState().snapshotDraft(id)

    const draft = useContentStore.getState().drafts[0]
    expect(draft.versions).toHaveLength(2)
    expect(draft.versions[0].chars).toBe(3)
    expect(draft.versions[0].body).toBe('abc')
    expect(draft.versions[1].chars).toBe(6)
  })
})

describe('publish queue', () => {
  it('enqueues a scheduled post with zeroed metrics', () => {
    const draftId = useContentStore.getState().addDraft({ title: 'D' })
    const postId = useContentStore
      .getState()
      .enqueuePost(draftId, 'instagram')
    const post = useContentStore.getState().posts[0]
    expect(post.id).toBe(postId)
    expect(post.platform).toBe('instagram')
    expect(post.status).toBe('scheduled')
    expect(post.metrics).toEqual(ZERO_METRICS)
    expect(post.publishedAt).toBeNull()
  })

  it('merges metric updates without dropping other fields', () => {
    const draftId = useContentStore.getState().addDraft({ title: 'D' })
    const postId = useContentStore.getState().enqueuePost(draftId, 'tiktok')
    useContentStore.getState().updatePostMetrics(postId, { views: 100 })
    useContentStore.getState().updatePostMetrics(postId, { likes: 8 })
    const post = useContentStore.getState().posts[0]
    expect(post.metrics).toEqual({ views: 100, likes: 8, comments: 0, shares: 0 })
  })

  it('marks a post published with url and timestamp', () => {
    const draftId = useContentStore.getState().addDraft({ title: 'D' })
    const postId = useContentStore.getState().enqueuePost(draftId, 'blog')
    useContentStore.getState().updatePost(postId, {
      status: 'published',
      url: 'https://example.com/p',
    })
    const post = useContentStore.getState().posts[0]
    expect(post.status).toBe('published')
    expect(post.url).toBe('https://example.com/p')
  })
})

describe('syncPlatformMetrics', () => {
  it('rolls every post up per platform', () => {
    const a = useContentStore.getState().addDraft({ title: 'A' })
    const b = useContentStore.getState().addDraft({ title: 'B' })
    const p1 = useContentStore.getState().enqueuePost(a, 'instagram')
    const p2 = useContentStore.getState().enqueuePost(b, 'instagram')
    const p3 = useContentStore.getState().enqueuePost(b, 'youtube')

    useContentStore.getState().updatePostMetrics(p1, { views: 100, likes: 10 })
    useContentStore.getState().updatePostMetrics(p2, { views: 50, shares: 5 })
    useContentStore.getState().updatePostMetrics(p3, { views: 20, comments: 2 })

    useContentStore.getState().syncPlatformMetrics()
    const roll = useContentStore.getState().platformMetrics

    expect(roll.instagram).toEqual({
      views: 150,
      likes: 10,
      comments: 0,
      shares: 5,
    })
    expect(roll.youtube.views).toBe(20)
    // 15 interaksi (10 like + 5 share) dari 150 views = 0.1
    expect(engagementRate(roll.instagram)).toBeCloseTo(15 / 150, 5)
  })

  it('produces an empty roll-up when there are no posts', () => {
    useContentStore.getState().syncPlatformMetrics()
    expect(useContentStore.getState().platformMetrics).toEqual({})
  })
})

describe('seed and reset', () => {
  it('resetToSeed repopulates ideas and drafts', () => {
    useContentStore.getState().resetToSeed()
    const s = useContentStore.getState()
    expect(s.ideas.length).toBeGreaterThan(0)
    expect(s.drafts.length).toBeGreaterThan(0)
    expect(s.posts).toHaveLength(0)
  })

  it('clearAll empties every collection', () => {
    useContentStore.getState().resetToSeed()
    useContentStore.getState().clearAll()
    const s = useContentStore.getState()
    expect(s.ideas).toHaveLength(0)
    expect(s.drafts).toHaveLength(0)
    expect(s.posts).toHaveLength(0)
  })

  it('exposes an initial store snapshot', () => {
    expect(typeof initial.addIdea).toBe('function')
  })
})