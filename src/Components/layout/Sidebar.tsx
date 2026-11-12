import { NavLink } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  BookOpen,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Users,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import type { Role } from '../../types'

interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  roles: Role[]
  end?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard', to: '/admin', icon: LayoutDashboard, roles: ['admin'], end: true },
  { label: 'Users', to: '/admin/users', icon: Users, roles: ['admin'] },
  { label: 'Courses', to: '/admin/courses', icon: BookOpen, roles: ['admin'] },
  { label: 'Subscriptions', to: '/admin/subscriptions', icon: CreditCard, roles: ['admin'] },
  { label: 'System Monitoring', to: '/admin/monitoring', icon: Activity, roles: ['admin'] },
  { label: 'Reports', to: '/admin/reports', icon: BarChart3, roles: ['admin'] },
]

interface Props {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: Props) {
  const { hasRole } = useAuth()

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-gray-200 bg-white transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-5">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-brand p-1.5 text-white">
              <GraduationCap size={20} />
            </div>
            <span className="text-lg font-semibold text-gray-900">EduAdmin</span>
          </div>
          <button className="rounded p-1 text-gray-500 hover:bg-gray-100 lg:hidden" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems
            .filter((item) => hasRole(item.roles))
            .map(({ label, to, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand text-white'
                      : 'text-gray-600 hover:bg-brand-soft hover:text-brand-hover'
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
        </nav>
      </aside>
    </>
  )
}