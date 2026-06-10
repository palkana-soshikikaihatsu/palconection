import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import api from '../../services/api'
import type { User } from '../../types'

export function ProfileView() {
  const { userId } = useParams<{ userId: string }>()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const isOwnProfile = !userId || userId === currentUser?.userId

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true)
      setError('')
      try {
        const result = await api.getProfile(userId)
        if (result.success && result.data) {
          setProfile(result.data)
        } else {
          setError(result.error || 'プロフィールの取得に失敗しました')
        }
      } catch {
        setError('プロフィールの取得に失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    fetchProfile()
  }, [userId])

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
        {error}
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>ユーザーが見つかりません</p>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-xl font-bold text-gray-800 mb-4">プロフィール</h1>

      <div className="card">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <img
            src={profile.profileImage || '/default-avatar.png'}
            alt={profile.displayName}
            className="w-24 h-24 rounded-full object-cover bg-gray-200"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="35" r="25" fill="%23ccc"/><ellipse cx="50" cy="85" rx="35" ry="25" fill="%23ccc"/></svg>'
            }}
          />

          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-gray-800">
              {profile.displayName}
            </h2>
            {profile.department && (
              <p className="text-gray-500 text-sm mt-1">
                🏢 {profile.department}
              </p>
            )}
            <p className="text-gray-400 text-xs mt-1">
              {profile.email}
            </p>
          </div>

          {isOwnProfile && (
            <Link
              to="/profile/edit"
              className="btn-secondary text-sm"
            >
              編集
            </Link>
          )}
        </div>

        {profile.bio && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-500 mb-2">自己紹介</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-gray-400 text-xs">
            登録日: {new Date(profile.createdAt).toLocaleDateString('ja-JP')}
          </p>
        </div>
      </div>
    </div>
  )
}
