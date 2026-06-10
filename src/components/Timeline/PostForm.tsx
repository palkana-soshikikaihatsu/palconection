import { useState, FormEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'

interface PostFormProps {
  onSubmit: (content: string, imageUrl?: string) => Promise<{ success: boolean; error?: string }>
  placeholder?: string
}

export function PostForm({ onSubmit, placeholder = '今何してる？' }: PostFormProps) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [showImageInput, setShowImageInput] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    setError('')

    const result = await onSubmit(content.trim(), imageUrl.trim() || undefined)
    
    if (result.success) {
      setContent('')
      setImageUrl('')
      setShowImageInput(false)
    } else {
      setError(result.error || '投稿に失敗しました')
    }

    setIsSubmitting(false)
  }

  return (
    <div className="card mb-4">
      <form onSubmit={handleSubmit}>
        <div className="flex gap-3">
          <img
            src={user?.profileImage || '/default-avatar.png'}
            alt={user?.displayName || 'User'}
            className="w-10 h-10 rounded-full object-cover bg-gray-200 flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="35" r="25" fill="%23ccc"/><ellipse cx="50" cy="85" rx="35" ry="25" fill="%23ccc"/></svg>'
            }}
          />

          <div className="flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              rows={3}
              className="w-full resize-none border-0 focus:ring-0 text-gray-700 placeholder-gray-400 outline-none"
              disabled={isSubmitting}
              maxLength={500}
            />

            {showImageInput && (
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="画像URL（Imgur等）"
                className="input-field mt-2 text-sm"
                disabled={isSubmitting}
              />
            )}

            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowImageInput(!showImageInput)}
                className="text-gray-500 hover:text-primary-600 text-sm"
              >
                🖼️ 画像を追加
              </button>

              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">
                  {content.length}/500
                </span>
                <button
                  type="submit"
                  disabled={!content.trim() || isSubmitting}
                  className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '投稿中...' : '投稿する'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
