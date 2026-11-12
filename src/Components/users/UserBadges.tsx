import Badge, { type BadgeTone } from '../ui/Badge'
import type { Role, UserStatus } from '../../types'

const roleTone: Record<Role, BadgeTone> = {
  admin: 'amber',
  teacher: 'blue',
  student: 'green',
}

const statusTone: Record<UserStatus, BadgeTone> = {
  active: 'green',
  inactive: 'gray',
  suspended: 'red',
}

export function RoleBadge({ role }: { role: Role }) {
  return (
    <Badge tone={roleTone[role]}>
      <span className="capitalize">{role}</span>
    </Badge>
  )
}

export function StatusBadge({ status }: { status: UserStatus }) {
  return (
    <Badge tone={statusTone[status]}>
      <span className="capitalize">{status}</span>
    </Badge>
  )
}