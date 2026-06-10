import { useEffect, useCallback, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useCommunityPosts, useCommunities } from '../../hooks/useCommunities'
import { CommunityPostCard } from './CommunityPost'
import { PostForm } from '../Timeline/PostForm'

export function CommunityBoard() {
  const { communityId } = useParams<{ communityId: string }>()
  const { communities, fetchCommunities } = useCommunities()
  const [community, setCommunity] = useState(
    communities.find((c) => c.communityId === communityId)
  )

  const {
    posts,
    isLoading,
    hasMore,
    error,
    fetchPosts,
    loadMore,
    refresh,
    createPost,
  } = useCommunityPosts(communityId || '')

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
    if (communityId) {
      fetchPosts(1)
      if (!community) {
        fetchCommunities()
      }
    }
  }, [communityId, fetchPosts, fetchCommunities, community])

  useEffect(() => {
    const found = communities.find((c) => c.communityId === communityId)
    if (found) setCommunity(found)
  }, [communities, communityId])

  if (!communityId) {
    return <div>コミュニティが見つかりません</div>
  }

  return (
    <div>
      <Link
        to="/communities"
        className="text-primary-600 hover:text-primary-700 text-sm mb-4 inline-block"
      >
        ← コミュニティ一覧に戻る
      </Link>

      {community && (
        <div className="card mb-4">
          <h1 className="text-xl font-bold text-gray-800">{community.name}</h1>
          <p className="text-gray-500 mt-1">{community.description}</p>
          <p className="text-gray-400 text-sm mt-2">
            👥 {community.memberCount}人のメンバー
          </p>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-700">投稿</h2>
        <button
          onClick={refresh}
          disabled={isLoading}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium disabled:opacity-50"
        >
          🔄 更新
        </button>
      </div>

      {community?.isJoined && (
        <PostForm
          onSubmit={(content) => createPost(content)}
          placeholder="コミュニティに投稿..."
        />
      )}

      {!community?.isJoined && (
        <div className="bg-yellow-50 text-yellow-700 px-4 py-3 rounded-lg text-sm mb-4">
          投稿するにはコミュニティに参加してください
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <CommunityPostCard key={post.postId} post={post} />
        ))}
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      )}

      {!isLoading && posts.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-2">💬</p>
          <p>まだ投稿がありません</p>
          {community?.isJoined && (
            <p className="text-sm">最初の投稿をしてみましょう！</p>
          )}
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
