import { useNavigate } from 'react-router-dom'
import { LogOut, Menu } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export default function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 sm:px-6 lg:px-8">
      <button
        className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="hidden text-sm text-gray-500 lg:block">Admin Panel</div>

      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
          <p className="text-xs capitalize text-gray-400">{user?.role}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white">
          {user?.name.charAt(0).toUpperCase()}
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600"
          aria-label="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}