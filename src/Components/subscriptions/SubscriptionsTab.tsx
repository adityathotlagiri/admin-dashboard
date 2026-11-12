import { useState } from 'react'
import { Download, Eye, Search } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { useDebounce } from '../../hooks/useDebounce'
import { useToast } from '../../context/ToastContext'
import { getPlans, getSubscriptions } from '../../data/subscriptions'
import {
  SUBSCRIPTION_STATUS_OPTIONS,
  type Subscription,
  type SubscriptionSortKey,
  type SubscriptionStatus,
} from '../../types'
import { downloadCsv } from '../../utils/exportCsv'
import { formatCurrency, formatDate } from '../../utils/format'
import Button from '../ui/Button'
import DataTable, { type Column } from '../ui/DataTable'
import Select from '../ui/Select'
import { ErrorState, LoadingState } from '../ui/States'
import SubscriptionDetailModal from './SubscriptionDetailModal'
import { SubscriptionStatusBadge } from './SubscriptionBadges'
import { endDateHint, endDateLabel } from './subscriptionHelpers'

const PAGE_SIZE = 8

export default function SubscriptionsTab({ onChanged }: { onChanged: () => void }) {
  const toast = useToast()

  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput, 400)
  const [status, setStatus] = useState<SubscriptionStatus | 'all'>('all')
  const [planId, setPlanId] = useState('all')
  const [sortBy, setSortBy] = useState<SubscriptionSortKey>('startDate')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)

  const subscriptions = useAsync(
    () => getSubscriptions({ search, status, planId, sortBy, sortDir, page, pageSize: PAGE_SIZE }),
    [search, status, planId, sortBy, sortDir, page],
  )
  const plans = useAsync(() => getPlans())

  const handleChanged = () => {
    subscriptions.reload()
    plans.reload()
    onChanged()
  }

  const handleSort = (key: string) => {
    if (key === sortBy) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key as SubscriptionSortKey)
      setSortDir('asc')
    }
    setPage(1)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const result = await getSubscriptions({
        search,
        status,
        planId,
        sortBy,
        sortDir,
        page: 1,
        pageSize: 100000,
      })
      if (result.items.length === 0) {
        toast.error('Nothing to export for the current filters')
        return
      }
      downloadCsv(
        'subscriptions-report.csv',
        result.items.map((s) => ({
          User: s.userName,
          Email: s.userEmail,
          Plan: s.planName,
          Status: s.status,
          Started: formatDate(s.startDate),
          'Renews / Expires': formatDate(s.endDate),
          'Auto-renew': s.autoRenew ? 'Yes' : 'No',
          Amount: s.amount,
        })),
      )
      toast.success(`Exported ${result.items.length} subscriptions`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const columns: Column<Subscription>[] = [
    {
      key: 'userName',
      header: 'User',
      sortable: true,
      render: (s) => (
        <div>
          <button
            onClick={() => setSelectedId(s.id)}
            className="font-medium text-gray-900 hover:text-brand"
          >
            {s.userName}
          </button>
          <p className="text-xs text-gray-500">{s.userEmail}</p>
        </div>
      ),
    },
    {
      key: 'planName',
      header: 'Plan',
      sortable: true,
      render: (s) => <span className="text-gray-600">{s.planName}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (s) => <SubscriptionStatusBadge status={s.status} />,
    },
    {
      key: 'startDate',
      header: 'Started',
      sortable: true,
      render: (s) => <span className="text-gray-600">{formatDate(s.startDate)}</span>,
    },
    {
      key: 'endDate',
      header: 'Renews / Expires',
      sortable: true,
      render: (s) => (
        <div>
          <p className="text-gray-700">{formatDate(s.endDate)}</p>
          <p className="text-xs text-gray-400" title={endDateLabel(s)}>
            {endDateHint(s)}
          </p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (s) => <span className="text-gray-600">{formatCurrency(s.amount)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (s) => (
        <div className="flex justify-end">
          <button
            title="View details"
            onClick={() => setSelectedId(s.id)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-brand"
          >
            <Eye size={16} />
          </button>
        </div>
      ),
    },
  ]

  const planOptions = [
    { value: 'all', label: 'All plans' },
    ...(plans.data ?? []).map((p) => ({ value: p.id, label: p.name })),
  ]

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_170px_170px_auto]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPage(1)
            }}
            placeholder="Search by name, email, or plan..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as SubscriptionStatus | 'all')
            setPage(1)
          }}
          options={[{ value: 'all', label: 'All statuses' }, ...SUBSCRIPTION_STATUS_OPTIONS]}
        />
        <Select
          value={planId}
          onChange={(e) => {
            setPlanId(e.target.value)
            setPage(1)
          }}
          options={planOptions}
        />
        <Button variant="outline" loading={exporting} onClick={handleExport}>
          <Download size={16} />
          Export CSV
        </Button>
      </div>

      {subscriptions.error ? (
        <ErrorState message={subscriptions.error} onRetry={subscriptions.reload} />
      ) : !subscriptions.data ? (
        <LoadingState label="Loading subscriptions..." />
      ) : (
        <DataTable
          columns={columns}
          rows={subscriptions.data.items}
          rowKey={(s) => s.id}
          total={subscriptions.data.total}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          loading={subscriptions.loading}
          emptyTitle="No subscriptions found"
        />
      )}

      <SubscriptionDetailModal
        subscriptionId={selectedId}
        plans={plans.data ?? []}
        onClose={() => setSelectedId(null)}
        onChanged={handleChanged}
      />
    </div>
  )
}