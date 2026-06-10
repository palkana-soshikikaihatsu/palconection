import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCommunities } from '../../hooks/useCommunities'
import type { Community } from '../../types'

interface CommunityCardProps {
  community: Community
  onJoin: (communityId: string) => void
  onLeave: (communityId: string) => void
}

function CommunityCard({ community, onJoin, onLeave }: CommunityCardProps) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <Link
            to={`/communities/${community.communityId}`}
            className="font-medium text-gray-800 hover:text-primary-600 block truncate"
          >
            {community.name}
          </Link>
          <p className="text-gray-500 text-sm mt-1 line-clamp-2">
            {community.description}
          </p>
          <p className="text-gray-400 text-xs mt-2">
            👥 {community.memberCount}人のメンバー
          </p>
        </div>

        <button
          onClick={() =>
            community.isJoined
              ? onLeave(community.communityId)
              : onJoin(community.communityId)
          }
          className={`ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
            community.isJoined
              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {community.isJoined ? '参加中' : '参加する'}
        </button>
      </div>
    </div>
  )
}

export function CommunityList() {
  const {
    communities,
    isLoading,
    error,
    fetchCommunities,
    joinCommunity,
    leaveCommunity,
  } = useCommunities()

  useEffect(() => {
    fetchCommunities()
  }, [fetchCommunities])

  const joinedCommunities = communities.filter((c) => c.isJoined)
  const otherCommunities = communities.filter((c) => !c.isJoined)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800">コミュニティ</h1>
        <button
          onClick={fetchCommunities}
          disabled={isLoading}
          className="text-primary-600 hover:text-primary-700 text-sm font-medium disabled:opacity-50"
        >
          🔄 更新
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      )}

      {!isLoading && communities.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-2">👥</p>
          <p>コミュニティがありません</p>
        </div>
      )}

      {joinedCommunities.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-medium text-gray-500 mb-3">参加中のコミュニティ</h2>
          <div className="space-y-3">
            {joinedCommunities.map((community) => (
              <CommunityCard
                key={community.communityId}
                community={community}
                onJoin={joinCommunity}
                onLeave={leaveCommunity}
              />
            ))}
          </div>
        </div>
      )}

      {otherCommunities.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-500 mb-3">その他のコミュニティ</h2>
          <div className="space-y-3">
            {otherCommunities.map((community) => (
              <CommunityCard
                key={community.communityId}
                community={community}
                onJoin={joinCommunity}
                onLeave={leaveCommunity}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
