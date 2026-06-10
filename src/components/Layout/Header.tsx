import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <span className="font-bold text-xl text-gray-800">パルコネ</span>
        </Link>

        {user && (
          <div className="flex items-center gap-4">
            <Link to="/profile" className="flex items-center gap-2 hover:opacity-80">
              <img
                src={user.profileImage || '/default-avatar.png'}
                alt={user.displayName}
                className="w-8 h-8 rounded-full object-cover bg-gray-200"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="35" r="25" fill="%23ccc"/><ellipse cx="50" cy="85" rx="35" ry="25" fill="%23ccc"/></svg>'
                }}
              />
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">
                {user.displayName}
              </span>
            </Link>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ログアウト
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
