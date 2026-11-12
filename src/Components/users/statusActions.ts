import { Ban, UserCheck, UserX, type LucideIcon } from 'lucide-react'
import type { UserStatus } from '../../types'

export interface StatusAction {
  label: string
  next: UserStatus
  icon: LucideIcon
  danger?: boolean
  confirm: (name: string) => string
}

const activate: StatusAction = {
  label: 'Activate',
  next: 'active',
  icon: UserCheck,
  confirm: (name) => `Activate ${name}? They will regain access to the platform.`,
}

const reactivate: StatusAction = {
  label: 'Reactivate',
  next: 'active',
  icon: UserCheck,
  confirm: (name) => `Reactivate ${name}? Their suspension will be lifted.`,
}

const deactivate: StatusAction = {
  label: 'Deactivate',
  next: 'inactive',
  icon: UserX,
  danger: true,
  confirm: (name) => `Deactivate ${name}? They won't be able to use the platform until reactivated.`,
}

const suspend: StatusAction = {
  label: 'Suspend',
  next: 'suspended',
  icon: Ban,
  danger: true,
  confirm: (name) => `Suspend ${name}? Their account will be blocked immediately.`,
}

export function getStatusActions(status: UserStatus): StatusAction[] {
  switch (status) {
    case 'active':
      return [deactivate, suspend]
    case 'inactive':
      return [activate, suspend]
    case 'suspended':
      return [reactivate]
  }
}