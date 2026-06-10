import { Link } from 'react-router-dom'
import type { Post } from '../../types'

interface PostCardProps {
  post: Post
  onLike: (postId: string) => void
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'たった今'
  if (minutes < 60) return `${minutes}分前`
  if (hours < 24) return `${hours}時間前`
  if (days < 7) return `${days}日前`
  
  return date.toLocaleDateString('ja-JP', {
    month: 'short',
    day: 'numeric',
  })
}

export function PostCard({ post, onLike }: PostCardProps) {
  return (
    <article className="card">
      <div className="flex gap-3">
        <Link to={`/profile/${post.userId}`}>
          <img
            src={post.userImage || '/default-avatar.png'}
            alt={post.userName}
            className="w-10 h-10 rounded-full object-cover bg-gray-200 flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="35" r="25" fill="%23ccc"/><ellipse cx="50" cy="85" rx="35" ry="25" fill="%23ccc"/></svg>'
            }}
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              to={`/profile/${post.userId}`}
              className="font-medium text-gray-800 hover:underline truncate"
            >
              {post.userName}
            </Link>
            <span className="text-gray-400 text-sm flex-shrink-0">
              {formatDate(post.createdAt)}
            </span>
          </div>

          <p className="text-gray-700 whitespace-pre-wrap break-words">
            {post.content}
          </p>

          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt="投稿画像"
              className="mt-3 rounded-lg max-h-96 object-cover"
            />
          )}

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={() => onLike(post.postId)}
              className={`flex items-center gap-1 text-sm transition-colors ${
                post.likedByMe
                  ? 'text-red-500'
                  : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <span>{post.likedByMe ? '❤️' : '🤍'}</span>
              <span>{post.likes > 0 ? post.likes : ''}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
