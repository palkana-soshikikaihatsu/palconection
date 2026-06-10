import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import type { User } from '../../types'

interface MemberCardProps {
  member: User
}

function MemberCard({ member }: MemberCardProps) {
  return (
    <Link
      to={`/profile/${member.userId}`}
      className="card hover:shadow-md transition-shadow"
    >
      <div className="flex flex-col items-center text-center">
        <img
          src={member.profileImage || '/default-avatar.png'}
          alt={member.displayName}
          className="w-20 h-20 rounded-full object-cover bg-gray-200 mb-3"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="35" r="25" fill="%23ccc"/><ellipse cx="50" cy="85" rx="35" ry="25" fill="%23ccc"/></svg>'
          }}
        />
        
        <h3 className="font-medium text-gray-800 truncate w-full">
          {member.displayName}
        </h3>
        
        {member.department && (
          <p className="text-sm text-primary-600 mt-1">
            {member.department}
          </p>
        )}
        
        {member.bio && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
            {member.bio}
          </p>
        )}
      </div>
    </Link>
  )
}

export function MemberGrid() {
  const [members, setMembers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')

  const fetchMembers = useCallback(async (pageNum: number, searchTerm: string, append: boolean = false) => {
    setIsLoading(true)
    setError('')
    
    try {
      const result = await api.getMembers(pageNum, searchTerm)
      if (result.success && result.data) {
        if (append) {
          setMembers(prev => [...prev, ...result.data!.items])
        } else {
          setMembers(result.data.items)
        }
        setTotal(result.data.total)
        setHasMore(result.data.hasMore)
        setPage(result.data.nextPage)
      } else {
        setError(result.error || 'メンバーの取得に失敗しました')
      }
    } catch {
      setError('メンバーの取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMembers(1, search, false)
  }, [fetchMembers, search])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchMembers(page, search, true)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800">メンバー</h1>
          {total > 0 && (
            <p className="text-sm text-gray-500">{total}人のメンバー</p>
          )}
        </div>
      </div>

      <form onSubmit={handleSearch} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="名前や部署で検索..."
            className="input-field flex-1"
          />
          <button type="submit" className="btn-primary">
            検索
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">
          {error}
        </div>
      )}

      {isLoading && members.length === 0 && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
      )}

      {!isLoading && members.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-4xl mb-2">👥</p>
          <p>メンバーが見つかりません</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {members.map((member) => (
          <MemberCard key={member.userId} member={member} />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={loadMore}
            disabled={isLoading}
            className="btn-secondary"
          >
            {isLoading ? '読み込み中...' : 'もっと見る'}
          </button>
        </div>
      )}
    </div>
  )
}
