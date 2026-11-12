import Badge, { type BadgeTone } from '../ui/Badge'
import type { CourseStatus } from '../../types'

const statusTone: Record<CourseStatus, BadgeTone> = {
  published: 'green',
  pending: 'amber',
  draft: 'blue',
  unpublished: 'gray',
  rejected: 'red',
}

const statusLabel: Record<CourseStatus, string> = {
  published: 'Published',
  pending: 'Pending',
  draft: 'Draft',
  unpublished: 'Unpublished',
  rejected: 'Rejected',
}

export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  return <Badge tone={statusTone[status]}>{statusLabel[status]}</Badge>
}