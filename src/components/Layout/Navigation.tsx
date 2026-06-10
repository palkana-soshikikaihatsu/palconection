import { NavLink } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'ホーム', icon: '🏠' },
  { path: '/communities', label: 'コミュニティ', icon: '👥' },
  { path: '/profile', label: 'プロフィール', icon: '👤' },
]

export function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <ul className="flex justify-around">
        {navItems.map((item) => (
          <li key={item.path} className="flex-1">
            <NavLink
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-3 transition-colors ${
                  isActive ? 'text-primary-600' : 'text-gray-500'
                }`
              }
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
