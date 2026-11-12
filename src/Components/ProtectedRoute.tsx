import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../types'

interface Props {
  allowedRoles: Role[]
}

export default function ProtectedRoute({ allowedRoles }: Props) {
  const { user, hasRole } = useAuth()

  if (!user) return <Navigate to="/login" replace />
  if (!hasRole(allowedRoles)) return <Navigate to="/login" replace />

  return <Outlet />
}