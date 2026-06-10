import { useState, useCallback } from 'react'
import api from '../services/api'
import type { Post } from '../types'

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await api.getPosts(pageNum)
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
  }, [])

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

  const createPost = useCallback(async (content: string, imageUrl?: string) => {
    setIsLoading(true)
    try {
      const result = await api.createPost(content, imageUrl)
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
  }, [])

  const likePost = useCallback(async (postId: string) => {
    const post = posts.find(p => p.postId === postId)
    if (!post) return

    const wasLiked = post.likedByMe
    setPosts(prev =>
      prev.map(p =>
        p.postId === postId
          ? { ...p, likedByMe: !wasLiked, likes: wasLiked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    )

    try {
      const result = wasLiked
        ? await api.unlikePost(postId)
        : await api.likePost(postId)

      if (result.success && result.data) {
        setPosts(prev =>
          prev.map(p =>
            p.postId === postId ? { ...p, likes: result.data!.likes } : p
          )
        )
      }
    } catch {
      setPosts(prev =>
        prev.map(p =>
          p.postId === postId
            ? { ...p, likedByMe: wasLiked, likes: post.likes }
            : p
        )
      )
    }
  }, [posts])

  return {
    posts,
    isLoading,
    hasMore,
    error,
    fetchPosts,
    loadMore,
    refresh,
    createPost,
    likePost,
  }
}
