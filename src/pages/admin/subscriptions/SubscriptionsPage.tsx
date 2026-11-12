import { useState } from 'react'
import { Clock, CreditCard, DollarSign, TrendingUp } from 'lucide-react'
import { useAsync } from '../../../hooks/useAsync'
import { getSubscriptionStats } from '../../../data/subscriptions'
import { formatCurrency, formatNumber } from '../../../utils/format'
import PageHeader from '../../../Components/ui/PageHeader'
import StatCard from '../../../Components/ui/StatCard'
import Tabs from '../../../Components/ui/Tabs'
import PlansTab from '../../../Components/subscriptions/PlansTab'
import SubscriptionsTab from '../../../Components/subscriptions/SubscriptionsTab'
import TransactionsTab from '../../../Components/subscriptions/TransactionsTab'

type TabKey = 'plans' | 'subscriptions' | 'transactions'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'plans', label: 'Plans' },
  { key: 'subscriptions', label: 'Subscriptions' },
  { key: 'transactions', label: 'Revenue & Transactions' },
]

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('plans')
  const stats = useAsync(() => getSubscriptionStats())

  return (
    <div>
      <PageHeader
        title="Subscription Management"
        description="Manage plans, track subscribers, and monitor revenue."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Monthly Revenue"
          value={stats.data ? formatCurrency(stats.data.monthlyRevenue) : '—'}
          icon={TrendingUp}
          hint="Last 30 days"
        />
        <StatCard
          label="Total Revenue"
          value={stats.data ? formatCurrency(stats.data.totalRevenue) : '—'}
          icon={DollarSign}
          hint="Successful payments"
        />
        <StatCard
          label="Active Subscriptions"
          value={stats.data ? formatNumber(stats.data.activeSubscriptions) : '—'}
          icon={CreditCard}
        />
        <StatCard
          label="Expiring Soon"
          value={stats.data ? formatNumber(stats.data.expiringSoon) : '—'}
          icon={Clock}
          hint="Within the next 7 days"
        />
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'plans' && <PlansTab onChanged={stats.reload} />}
      {activeTab === 'subscriptions' && <SubscriptionsTab onChanged={stats.reload} />}
      {activeTab === 'transactions' && <TransactionsTab />}
    </div>
  )
}