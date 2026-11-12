import Badge, { type BadgeTone } from '../ui/Badge'
import type { SubscriptionStatus, TransactionStatus } from '../../types'

const subscriptionTone: Record<SubscriptionStatus, BadgeTone> = {
  active: 'green',
  expired: 'amber',
  cancelled: 'gray',
}

const transactionTone: Record<TransactionStatus, BadgeTone> = {
  success: 'green',
  failed: 'red',
  refunded: 'blue',
}

const transactionLabel: Record<TransactionStatus, string> = {
  success: 'Successful',
  failed: 'Failed',
  refunded: 'Refunded',
}

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  return (
    <Badge tone={subscriptionTone[status]}>
      <span className="capitalize">{status}</span>
    </Badge>
  )
}

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  return <Badge tone={transactionTone[status]}>{transactionLabel[status]}</Badge>
}