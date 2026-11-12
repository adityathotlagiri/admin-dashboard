import type {
  BillingCycle,
  Paginated,
  Plan,
  PlanFormValues,
  RevenuePoint,
  Subscription,
  SubscriptionQuery,
  SubscriptionStats,
  SubscriptionStatus,
  Transaction,
  TransactionQuery,
  TransactionStatus,
} from '../types'
import { delay } from './delay'

const DAY = 24 * 60 * 60 * 1000

const CYCLE_DAYS: Record<BillingCycle, number> = {
  monthly: 30,
  quarterly: 90,
  yearly: 365,
}

type PlanRecord = Omit<Plan, 'subscribers'>

const plans: PlanRecord[] = [
  {
    id: 'plan-1',
    name: 'Basic',
    description: 'Everything you need to start learning.',
    price: 9,
    billingCycle: 'monthly',
    features: ['Access to free courses', 'AI tutor (20 questions/day)', 'Community support'],
    isActive: true,
  },
  {
    id: 'plan-2',
    name: 'Pro',
    description: 'Full access for serious learners.',
    price: 19,
    billingCycle: 'monthly',
    features: ['All courses unlocked', 'Unlimited AI tutor', 'Progress analytics', 'Email support'],
    isActive: true,
  },
  {
    id: 'plan-3',
    name: 'Premium',
    description: 'Best for exam preparation, billed every 3 months.',
    price: 54,
    billingCycle: 'quarterly',
    features: ['Everything in Pro', 'Live doubt sessions', 'Downloadable certificates', 'Priority support'],
    isActive: true,
  },
  {
    id: 'plan-4',
    name: 'Pro Annual',
    description: 'Pro plan with two months free.',
    price: 190,
    billingCycle: 'yearly',
    features: ['Everything in Pro', '2 months free', 'Early access to new courses'],
    isActive: true,
  },
]

const firstNames = ['Aarav', 'Priya', 'Rahul', 'Ananya', 'Vikram', 'Neha', 'Rohan', 'Sneha', 'Karthik', 'Divya', 'Arjun', 'Meera']
const lastNames = ['Sharma', 'Verma', 'Rao', 'Reddy', 'Iyer', 'Nair', 'Patel', 'Singh', 'Gupta']
const paymentMethods = ['Credit card', 'UPI', 'Net banking', 'PayPal']

let nextPlanId = plans.length + 1

function findPlanRecord(id: string) {
  const plan = plans.find((p) => p.id === id)
  if (!plan) throw new Error('Plan not found')
  return plan
}

function buildSubscription(i: number): Subscription {
  const plan = plans[i % plans.length]
  const first = firstNames[(i * 5) % firstNames.length]
  const last = lastNames[(i * 7) % lastNames.length]

  const status: SubscriptionStatus =
    i % 5 === 1 ? 'expired' : i % 7 === 3 ? 'cancelled' : 'active'

  let endOffsetDays: number
  if (status === 'active') endOffsetDays = ((i * 3) % 30) + 1
  else if (status === 'expired') endOffsetDays = -(((i * 4) % 60) + 1)
  else endOffsetDays = ((i * 2) % 20) - 8

  const end = Date.now() + endOffsetDays * DAY
  const start = end - CYCLE_DAYS[plan.billingCycle] * DAY

  return {
    id: `sub-${i + 1}`,
    userName: `${first} ${last}`,
    userEmail: `${first}.${last}${i + 1}@example.com`.toLowerCase(),
    planId: plan.id,
    planName: plan.name,
    status,
    startDate: new Date(start).toISOString(),
    endDate: new Date(end).toISOString(),
    autoRenew: status === 'active' && i % 3 !== 0,
    amount: plan.price,
  }
}

const subscriptions: Subscription[] = Array.from({ length: 40 }, (_, i) => buildSubscription(i))

const transactions: Transaction[] = subscriptions
  .flatMap((sub, i) => {
    const cycleMs = CYCLE_DAYS[findPlanRecord(sub.planId).billingCycle] * DAY
    const count = 1 + (i % 4)

    return Array.from({ length: count }, (_, k): Transaction => {
      const status: TransactionStatus =
        (i + k) % 13 === 5 ? 'failed' : (i + k) % 17 === 7 ? 'refunded' : 'success'

      return {
        id: '',
        subscriptionId: sub.id,
        userName: sub.userName,
        planName: sub.planName,
        amount: sub.amount,
        method: paymentMethods[(i + k) % paymentMethods.length],
        status,
        date: new Date(new Date(sub.startDate).getTime() - k * cycleMs).toISOString(),
      }
    })
  })
  .sort((a, b) => b.date.localeCompare(a.date))
  .map((t, index) => ({ ...t, id: `txn-${1000 + index}` }))

let nextTxnId = 1000 + transactions.length

function findSubscriptionIndex(id: string) {
  const index = subscriptions.findIndex((s) => s.id === id)
  if (index === -1) throw new Error('Subscription not found')
  return index
}

function compareValues(left: string | number, right: string | number) {
  return typeof left === 'number' && typeof right === 'number'
    ? left - right
    : String(left).localeCompare(String(right))
}

function recordPayment(sub: Subscription, amount: number) {
  transactions.unshift({
    id: `txn-${nextTxnId++}`,
    subscriptionId: sub.id,
    userName: sub.userName,
    planName: sub.planName,
    amount,
    method: 'Credit card',
    status: 'success',
    date: new Date().toISOString(),
  })
}

/* ---------- Plans ---------- */

function parseFeatures(text: string) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function assertPlanNameFree(name: string, ignoreId?: string) {
  const taken = plans.some(
    (p) => p.name.toLowerCase() === name.trim().toLowerCase() && p.id !== ignoreId,
  )
  if (taken) throw new Error('A plan with this name already exists')
}

export async function getPlans(): Promise<Plan[]> {
  await delay(400)
  return plans.map((p) => ({
    ...p,
    features: [...p.features],
    subscribers: subscriptions.filter((s) => s.planId === p.id && s.status === 'active').length,
  }))
}

export async function createPlan(values: PlanFormValues): Promise<void> {
  await delay(600)
  assertPlanNameFree(values.name)

  plans.push({
    id: `plan-${nextPlanId++}`,
    name: values.name.trim(),
    description: values.description.trim(),
    price: Number(values.price),
    billingCycle: values.billingCycle,
    features: parseFeatures(values.featuresText),
    isActive: values.isActive,
  })
}

export async function updatePlan(id: string, values: PlanFormValues): Promise<void> {
  await delay(600)
  const plan = findPlanRecord(id)
  assertPlanNameFree(values.name, id)

  plan.name = values.name.trim()
  plan.description = values.description.trim()
  plan.price = Number(values.price)
  plan.billingCycle = values.billingCycle
  plan.features = parseFeatures(values.featuresText)
  plan.isActive = values.isActive

  // Keep existing subscriptions showing the up-to-date plan name
  subscriptions.forEach((s, index) => {
    if (s.planId === id) subscriptions[index] = { ...s, planName: plan.name }
  })
  transactions.forEach((t, index) => {
    if (t.subscriptionId && subscriptions.find((s) => s.id === t.subscriptionId)?.planId === id) {
      transactions[index] = { ...t, planName: plan.name }
    }
  })
}

export async function setPlanActive(id: string, isActive: boolean): Promise<void> {
  await delay(400)
  findPlanRecord(id).isActive = isActive
}

/* ---------- Subscriptions ---------- */

export async function getSubscriptions(
  query: SubscriptionQuery,
): Promise<Paginated<Subscription>> {
  await delay(400)

  const term = query.search.trim().toLowerCase()

  const filtered = subscriptions.filter((s) => {
    const matchesSearch =
      !term ||
      s.userName.toLowerCase().includes(term) ||
      s.userEmail.toLowerCase().includes(term) ||
      s.planName.toLowerCase().includes(term)
    const matchesStatus = query.status === 'all' || s.status === query.status
    const matchesPlan = query.planId === 'all' || s.planId === query.planId
    return matchesSearch && matchesStatus && matchesPlan
  })

  const sorted = [...filtered].sort((a, b) => {
    const cmp = compareValues(a[query.sortBy], b[query.sortBy])
    return query.sortDir === 'asc' ? cmp : -cmp
  })

  const start = (query.page - 1) * query.pageSize

  return {
    items: sorted.slice(start, start + query.pageSize),
    total: sorted.length,
    page: query.page,
    pageSize: query.pageSize,
  }
}

export async function getSubscriptionById(id: string): Promise<Subscription> {
  await delay(300)
  return subscriptions[findSubscriptionIndex(id)]
}

export async function getSubscriptionTransactions(id: string): Promise<Transaction[]> {
  await delay(300)
  return transactions.filter((t) => t.subscriptionId === id)
}

export async function changeSubscriptionPlan(id: string, planId: string): Promise<void> {
  await delay(500)
  const index = findSubscriptionIndex(id)
  const sub = subscriptions[index]
  if (sub.status !== 'active') throw new Error('Only active subscriptions can change plan')

  const plan = findPlanRecord(planId)
  subscriptions[index] = { ...sub, planId: plan.id, planName: plan.name, amount: plan.price }
}

export async function setAutoRenew(id: string, autoRenew: boolean): Promise<void> {
  await delay(400)
  const index = findSubscriptionIndex(id)
  if (subscriptions[index].status !== 'active') {
    throw new Error('Auto-renew can only be changed on active subscriptions')
  }
  subscriptions[index] = { ...subscriptions[index], autoRenew }
}

export async function renewSubscription(id: string): Promise<void> {
  await delay(600)
  const index = findSubscriptionIndex(id)
  const sub = subscriptions[index]
  const plan = findPlanRecord(sub.planId)

  const base = Math.max(Date.now(), new Date(sub.endDate).getTime())
  const end = new Date(base + CYCLE_DAYS[plan.billingCycle] * DAY).toISOString()

  subscriptions[index] = {
    ...sub,
    status: 'active',
    endDate: end,
    amount: plan.price,
    autoRenew: sub.status === 'active' ? sub.autoRenew : true,
  }
  recordPayment(subscriptions[index], plan.price)
}

export async function cancelSubscription(id: string): Promise<void> {
  await delay(500)
  const index = findSubscriptionIndex(id)
  if (subscriptions[index].status !== 'active') {
    throw new Error('Only active subscriptions can be cancelled')
  }
  subscriptions[index] = { ...subscriptions[index], status: 'cancelled', autoRenew: false }
}

/* ---------- Transactions & revenue ---------- */

export async function getTransactions(query: TransactionQuery): Promise<Paginated<Transaction>> {
  await delay(400)

  const term = query.search.trim().toLowerCase()

  const filtered = transactions.filter((t) => {
    const matchesSearch =
      !term ||
      t.userName.toLowerCase().includes(term) ||
      t.planName.toLowerCase().includes(term) ||
      t.id.toLowerCase().includes(term)
    const matchesStatus = query.status === 'all' || t.status === query.status
    return matchesSearch && matchesStatus
  })

  const sorted = [...filtered].sort((a, b) => {
    const cmp = compareValues(a[query.sortBy], b[query.sortBy])
    return query.sortDir === 'asc' ? cmp : -cmp
  })

  const start = (query.page - 1) * query.pageSize

  return {
    items: sorted.slice(start, start + query.pageSize),
    total: sorted.length,
    page: query.page,
    pageSize: query.pageSize,
  }
}

export async function getSubscriptionStats(): Promise<SubscriptionStats> {
  await delay(400)
  const now = Date.now()
  const paid = transactions.filter((t) => t.status === 'success')

  return {
    monthlyRevenue: paid
      .filter((t) => now - new Date(t.date).getTime() <= 30 * DAY)
      .reduce((sum, t) => sum + t.amount, 0),
    totalRevenue: paid.reduce((sum, t) => sum + t.amount, 0),
    activeSubscriptions: subscriptions.filter((s) => s.status === 'active').length,
    expiringSoon: subscriptions.filter((s) => {
      if (s.status !== 'active') return false
      const msLeft = new Date(s.endDate).getTime() - now
      return msLeft >= 0 && msLeft <= 7 * DAY
    }).length,
  }
}

export async function getSubscriptionRevenueTrend(): Promise<RevenuePoint[]> {
  await delay(500)
  const now = new Date()

  return Array.from({ length: 6 }, (_, i) => {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)

    const revenue = transactions
      .filter((t) => {
        if (t.status !== 'success') return false
        const date = new Date(t.date)
        return (
          date.getFullYear() === monthStart.getFullYear() &&
          date.getMonth() === monthStart.getMonth()
        )
      })
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      month: monthStart.toLocaleString('en-US', { month: 'short' }),
      revenue,
    }
  })
}