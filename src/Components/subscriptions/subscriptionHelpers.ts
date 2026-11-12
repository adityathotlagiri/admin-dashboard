import type { BillingCycle, Plan, PlanFormValues, Subscription } from '../../types'

const DAY = 24 * 60 * 60 * 1000

export const cycleUnit: Record<BillingCycle, string> = {
  monthly: 'month',
  quarterly: 'quarter',
  yearly: 'year',
}

export function planToFormValues(plan: Plan): PlanFormValues {
  return {
    name: plan.name,
    description: plan.description,
    price: String(plan.price),
    billingCycle: plan.billingCycle,
    featuresText: plan.features.join('\n'),
    isActive: plan.isActive,
  }
}

export function daysUntil(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / DAY)
}

const pluralDays = (n: number) => `${n} day${n === 1 ? '' : 's'}`

export function endDateLabel(sub: Subscription) {
  if (sub.status === 'active') return sub.autoRenew ? 'Renews on' : 'Expires on'
  if (sub.status === 'cancelled') return 'Access ends'
  return 'Expired on'
}

export function endDateHint(sub: Subscription) {
  const days = daysUntil(sub.endDate)

  if (sub.status === 'expired') {
    return days === 0 ? 'Expired today' : `Expired ${pluralDays(Math.abs(days))} ago`
  }
  if (sub.status === 'cancelled') {
    if (days > 0) return `Access ends in ${pluralDays(days)}`
    return days === 0 ? 'Access ends today' : `Ended ${pluralDays(Math.abs(days))} ago`
  }

  const verb = sub.autoRenew ? 'Renews' : 'Expires'
  return days <= 0 ? `${verb} today` : `${verb} in ${pluralDays(days)}`
}