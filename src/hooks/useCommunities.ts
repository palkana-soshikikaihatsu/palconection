import { useState, useCallback } from 'react'
import api from '../services/api'
import type { Community, CommunityPost } from '../types'

export function useCommunities() {
  const [communities, setCommunities] = useState<Community[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCommunities = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await api.getCommunities()
      if (result.success && result.data) {
        setCommunities(result.data)
      } else {
        setError(result.error || 'コミュニティの取得に失敗しました')
      }
    } catch {
      setError('コミュニティの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const joinCommunity = useCallback(async (communityId: string) => {
    try {
      const result = await api.joinCommunity(communityId)
      if (result.success) {
        setCommunities(prev =>
          prev.map(c =>
            c.communityId === communityId
              ? { ...c, isJoined: true, memberCount: c.memberCount + 1 }
              : c
          )
        )
        return { success: true }
      }
      return { success: false, error: result.error }
    } catch {
      return { success: false, error: '参加に失敗しました' }
    }
  }, [])

  const leaveCommunity = useCallback(async (communityId: string) => {
    try {
      const result = await api.leaveCommunity(communityId)
      if (result.success) {
        setCommunities(prev =>
          prev.map(c =>
            c.communityId === communityId
              ? { ...c, isJoined: false, memberCount: c.memberCount - 1 }
              : c
          )
        )
        return { success: true }
      }
      return { success: false, error: result.error }
    } catch {
      return { success: false, error: '退出に失敗しました' }
    }
  }, [])

  return {
    communities,
    isLoading,
    error,
    fetchCommunities,
    joinCommunity,
    leaveCommunity,
  }
}

export function useCommunityPosts(communityId: string) {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await api.getCommunityPosts(communityId, pageNum)
      if (result.success && result.data) {
        if (append) {
          setPosts(prev => [...prev, ...result.data!.items])
        } else {
          setPosts(result.data.items)
        }
        setHasMore(result.data.hasMore)
        setPage(result.data.nextPage)
      } else {
        setError(result.error || '投稿の取得に失敗しました')
      }
    } catch {
      setError('投稿の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [communityId])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchPosts(page, true)
    }
  }, [fetchPosts, page, isLoading, hasMore])

  const refresh = useCallback(() => {
    setPage(1)
    setHasMore(true)
    fetchPosts(1, false)
  }, [fetchPosts])

  const createPost = useCallback(async (content: string) => {
    setIsLoading(true)
    try {
      const result = await api.createCommunityPost(communityId, content)
      if (result.success && result.data) {
        setPosts(prev => [result.data!, ...prev])
        return { success: true }
      }
      return { success: false, error: result.error || '投稿に失敗しました' }
    } catch {
      return { success: false, error: '投稿に失敗しました' }
    } finally {
      setIsLoading(false)
    }
  }, [communityId])

  return {
    posts,
    isLoading,
    hasMore,
    error,
    fetchPosts,
    loadMore,
    refresh,
    createPost,
  }
}
