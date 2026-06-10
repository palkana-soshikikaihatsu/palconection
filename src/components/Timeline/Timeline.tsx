import { useEffect, useCallback, useRef } from 'react'
import { usePosts } from '../../hooks/usePosts'
import { PostCard } from './PostCard'
import { PostForm } from './PostForm'

export function Timeline() {
  const {
    posts,
    isLoading,
    hasMore,
    error,
    fetchPosts,
    loadMore,
    refresh,
    createPost,
    likePost,
  } = usePosts()

  const observerRef = useRef<IntersectionObserver>()
  const loadMoreRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isLoading) return
      if (observerRef.current) observerRef.current.disconnect()
      
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore()
        }
      })
      
      if (node) observerRef.current.observe(node)
    },
    [isLoading, hasMore, loadMore]
  )

  useEffect(() => {
    fetchPosts(1)
  }, [fetchPosts])

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">タイムライン</h1>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium disabled:opacity-50"
        >
          🔄 更新
        </button>
      </div>

      <PostForm onSubmit={createPost} />

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <PostCard key={post.postId} post={post} onLike={likePost} />
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      )}

      {!isLoading && posts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-2">📝</p>
          <p>まだ投稿がありません</p>
          <p className="text-sm">最初の投稿をしてみましょう！</p>
        </div>
      )}

      {hasMore && <div ref={loadMoreRef} className="h-10" />}

      {!hasMore && posts.length > 0 && (
        <p className="text-center text-gray-400 text-sm py-8">
          これ以上の投稿はありません
        </p>
      )}
    </div>
  )
}
