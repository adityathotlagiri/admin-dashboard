import { useState } from 'react'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../context/ToastContext'
import {
  cancelSubscription,
  changeSubscriptionPlan,
  getSubscriptionById,
  getSubscriptionTransactions,
  renewSubscription,
  setAutoRenew,
} from '../../data/subscriptions'
import type { Plan } from '../../types'
import { formatCurrency, formatDate } from '../../utils/format'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import Modal from '../ui/Modal'
import Select from '../ui/Select'
import { ErrorState, LoadingState } from '../ui/States'
import { SubscriptionStatusBadge, TransactionStatusBadge } from './SubscriptionBadges'
import { cycleUnit, endDateHint, endDateLabel } from './subscriptionHelpers'

interface Props {
  subscriptionId: string | null
  plans: Plan[]
  onClose: () => void
  onChanged: () => void
}

function InfoRow({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-right">
        <span className="font-medium text-gray-900">{value}</span>
        {hint && <span className="block text-xs text-gray-400">{hint}</span>}
      </span>
    </div>
  )
}

function DetailContent({
  id,
  plans,
  onChanged,
}: {
  id: string
  plans: Plan[]
  onChanged: () => void
}) {
  const toast = useToast()

  const { data, loading, error, reload } = useAsync(async () => {
    const [subscription, transactions] = await Promise.all([
      getSubscriptionById(id),
      getSubscriptionTransactions(id),
    ])
    return { subscription, transactions }
  }, [id])

  const [planDraft, setPlanDraft] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [cancelOpen, setCancelOpen] = useState(false)

  if (loading && !data) return <LoadingState label="Loading subscription..." />
  if (error || !data) return <ErrorState message={error ?? 'Subscription not found'} onRetry={reload} />

  const { subscription: sub, transactions } = data

  const run = async (key: string, action: () => Promise<unknown>, successMessage: string) => {
    setBusy(key)
    try {
      await action()
      toast.success(successMessage)
      setPlanDraft(null)
      reload()
      onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(null)
    }
  }

  const confirmCancel = async () => {
    await run('cancel', () => cancelSubscription(sub.id), 'Subscription cancelled')
    setCancelOpen(false)
  }

  const selectedPlan = planDraft ?? sub.planId
  const planOptions = plans
    .filter((p) => p.isActive || p.id === sub.planId)
    .map((p) => ({
      value: p.id,
      label: `${p.name} — ${formatCurrency(p.price)}/${cycleUnit[p.billingCycle]}`,
    }))

  const renewLabel =
    sub.status === 'active'
      ? 'Renew now'
      : sub.status === 'expired'
        ? 'Renew subscription'
        : 'Reactivate'

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-semibold text-gray-900">{sub.userName}</p>
          <p className="text-sm text-gray-500">{sub.userEmail}</p>
        </div>
        <SubscriptionStatusBadge status={sub.status} />
      </div>

      <div className="divide-y divide-gray-100 border-y border-gray-100">
        <InfoRow label="Plan" value={sub.planName} />
        <InfoRow label="Amount" value={formatCurrency(sub.amount)} />
        <InfoRow label="Started" value={formatDate(sub.startDate)} />
        <InfoRow
          label={endDateLabel(sub)}
          value={formatDate(sub.endDate)}
          hint={endDateHint(sub)}
        />
        <InfoRow label="Auto-renew" value={sub.autoRenew ? 'On' : 'Off'} />
      </div>

      {/* Actions */}
      <div className="space-y-4">
        {sub.status === 'active' && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Select
                label="Change plan"
                value={selectedPlan}
                onChange={(e) => setPlanDraft(e.target.value)}
                options={planOptions}
              />
            </div>
            <Button
              variant="outline"
              loading={busy === 'plan'}
              disabled={selectedPlan === sub.planId}
              onClick={() =>
                run('plan', () => changeSubscriptionPlan(sub.id, selectedPlan), 'Plan changed')
              }
            >
              Save plan
            </Button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button loading={busy === 'renew'} onClick={() => run('renew', () => renewSubscription(sub.id), 'Subscription renewed')}>
            {renewLabel}
          </Button>

          {sub.status === 'active' && (
            <>
              <Button
                variant="outline"
                loading={busy === 'auto'}
                onClick={() =>
                  run(
                    'auto',
                    () => setAutoRenew(sub.id, !sub.autoRenew),
                    sub.autoRenew ? 'Auto-renew turned off' : 'Auto-renew turned on',
                  )
                }
              >
                {sub.autoRenew ? 'Turn off auto-renew' : 'Turn on auto-renew'}
              </Button>
              <Button variant="danger" onClick={() => setCancelOpen(true)}>
                Cancel subscription
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Payment history */}
      <div>
        <h3 className="mb-2 text-sm font-semibold text-gray-900">Payment history</h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-gray-400">No payments yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {transactions.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{formatCurrency(t.amount)}</p>
                  <p className="text-xs text-gray-400">
                    {formatDate(t.date)} · {t.method}
                  </p>
                </div>
                <TransactionStatusBadge status={t.status} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={cancelOpen}
        title="Cancel subscription"
        message={`Cancel ${sub.userName}'s ${sub.planName} subscription? Auto-renew will be turned off.`}
        confirmLabel="Cancel subscription"
        danger
        loading={busy === 'cancel'}
        onConfirm={confirmCancel}
        onCancel={() => setCancelOpen(false)}
      />
    </div>
  )
}

export default function SubscriptionDetailModal({
  subscriptionId,
  plans,
  onClose,
  onChanged,
}: Props) {
  return (
    <Modal open={subscriptionId !== null} title="Subscription details" onClose={onClose}>
      {subscriptionId && (
        <DetailContent id={subscriptionId} plans={plans} onChanged={onChanged} />
      )}
    </Modal>
  )
}