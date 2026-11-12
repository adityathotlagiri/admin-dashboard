import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download, Search } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { useDebounce } from '../../hooks/useDebounce'
import { useToast } from '../../context/ToastContext'
import { getSubscriptionRevenueTrend, getTransactions } from '../../data/subscriptions'
import {
  TRANSACTION_STATUS_OPTIONS,
  type Transaction,
  type TransactionSortKey,
  type TransactionStatus,
} from '../../types'
import { downloadCsv } from '../../utils/exportCsv'
import { formatCurrency, formatDateTime } from '../../utils/format'
import Button from '../ui/Button'
import DataTable, { type Column } from '../ui/DataTable'
import Select from '../ui/Select'
import { ErrorState, LoadingState } from '../ui/States'
import { TransactionStatusBadge } from './SubscriptionBadges'

const PAGE_SIZE = 8

export default function TransactionsTab() {
  const toast = useToast()

  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput, 400)
  const [status, setStatus] = useState<TransactionStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<TransactionSortKey>('date')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(false)

  const transactions = useAsync(
    () => getTransactions({ search, status, sortBy, sortDir, page, pageSize: PAGE_SIZE }),
    [search, status, sortBy, sortDir, page],
  )
  const trend = useAsync(() => getSubscriptionRevenueTrend())

  const handleSort = (key: string) => {
    if (key === sortBy) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key as TransactionSortKey)
      setSortDir('asc')
    }
    setPage(1)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const result = await getTransactions({
        search,
        status,
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
        'transactions-report.csv',
        result.items.map((t) => ({
          'Transaction ID': t.id,
          User: t.userName,
          Plan: t.planName,
          Amount: t.amount,
          Method: t.method,
          Status: t.status,
          Date: formatDateTime(t.date),
        })),
      )
      toast.success(`Exported ${result.items.length} transactions`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const columns: Column<Transaction>[] = [
    {
      key: 'id',
      header: 'Transaction',
      render: (t) => <span className="font-mono text-xs text-gray-500">{t.id}</span>,
    },
    {
      key: 'userName',
      header: 'User',
      sortable: true,
      render: (t) => <span className="font-medium text-gray-900">{t.userName}</span>,
    },
    {
      key: 'plan',
      header: 'Plan',
      render: (t) => <span className="text-gray-600">{t.planName}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (t) => <span className="text-gray-700">{formatCurrency(t.amount)}</span>,
    },
    {
      key: 'method',
      header: 'Method',
      render: (t) => <span className="text-gray-600">{t.method}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (t) => <TransactionStatusBadge status={t.status} />,
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (t) => <span className="text-gray-600">{formatDateTime(t.date)}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Revenue chart */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-gray-900">
          Subscription revenue (last 6 months)
        </h2>
        {trend.error ? (
          <ErrorState message={trend.error} onRetry={trend.reload} />
        ) : !trend.data ? (
          <LoadingState label="Loading revenue..." />
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${v}`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="revenue" name="Revenue" fill="#238B45" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Transactions */}
      <div>
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_180px_auto]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                setPage(1)
              }}
              placeholder="Search by user, plan, or transaction ID..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as TransactionStatus | 'all')
              setPage(1)
            }}
            options={[{ value: 'all', label: 'All statuses' }, ...TRANSACTION_STATUS_OPTIONS]}
          />
          <Button variant="outline" loading={exporting} onClick={handleExport}>
            <Download size={16} />
            Export CSV
          </Button>
        </div>

        {transactions.error ? (
          <ErrorState message={transactions.error} onRetry={transactions.reload} />
        ) : !transactions.data ? (
          <LoadingState label="Loading transactions..." />
        ) : (
          <DataTable
            columns={columns}
            rows={transactions.data.items}
            rowKey={(t) => t.id}
            total={transactions.data.total}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
            loading={transactions.loading}
            emptyTitle="No transactions found"
          />
        )}
      </div>
    </div>
  )
}