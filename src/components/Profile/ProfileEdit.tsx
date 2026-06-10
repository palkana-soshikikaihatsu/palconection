import { useState, FormEvent, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import api from '../../services/api'

export function ProfileEdit() {
  const { user, refreshSession } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [department, setDepartment] = useState('')
  const [bio, setBio] = useState('')
  const [profileImage, setProfileImage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '')
      setDepartment(user.department || '')
      setBio(user.bio || '')
      setProfileImage(user.profileImage || '')
    }
  }, [user])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setSuccess(false)

    try {
      const result = await api.updateProfile({
        displayName,
        department,
        bio,
        profileImage,
      })

      if (result.success) {
        setSuccess(true)
        await refreshSession()
        setTimeout(() => navigate('/profile'), 1500)
      } else {
        setError(result.error || '更新に失敗しました')
      }
    } catch {
      setError('更新に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-4">プロフィール編集</h1>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm">
              プロフィールを更新しました。リダイレクトします...
            </div>
          )}

          <div className="flex justify-center mb-4">
            <div className="relative">
              <img
                src={profileImage || '/default-avatar.png'}
                alt="プロフィール画像"
                className="w-24 h-24 rounded-full object-cover bg-gray-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="35" r="25" fill="%23ccc"/><ellipse cx="50" cy="85" rx="35" ry="25" fill="%23ccc"/></svg>'
                }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700 mb-1">
              プロフィール画像URL
            </label>
            <input
              type="url"
              id="profileImage"
              value={profileImage}
              onChange={(e) => setProfileImage(e.target.value)}
              className="input-field"
              placeholder="https://example.com/image.jpg"
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-400 mt-1">
              Imgur等の画像URLを入力してください
            </p>
          </div>

          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              表示名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input-field"
              placeholder="山田 太郎"
              required
              maxLength={50}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
              部署
            </label>
            <input
              type="text"
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="input-field"
              placeholder="開発部"
              maxLength={50}
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              自己紹介
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="input-field resize-none"
              rows={4}
              placeholder="自己紹介を入力..."
              maxLength={500}
              disabled={isSubmitting}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">
              {bio.length}/500
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="btn-secondary flex-1"
              disabled={isSubmitting}
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !displayName.trim()}
            >
              {isSubmitting ? '保存中...' : '保存する'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
