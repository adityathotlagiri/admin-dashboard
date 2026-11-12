import { useState } from 'react'
import { AlertTriangle, Bug, Search, Siren } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { useDebounce } from '../../hooks/useDebounce'
import { useToast } from '../../context/ToastContext'
import {
  getAlerts,
  getErrorLogs,
  getErrorSummary,
  updateAlertStatus,
} from '../../data/monitoring'
import {
  ALERT_STATUS_OPTIONS,
  ERROR_TYPE_OPTIONS,
  type AlertSeverity,
  type AlertStatus,
  type ErrorLog,
  type ErrorSortKey,
  type ErrorType,
  type SystemAlert,
} from '../../types/monitoring'
import { formatDateTime, formatNumber } from '../../utils/format'
import Button from '../ui/Button'
import DataTable, { type Column } from '../ui/DataTable'
import Select from '../ui/Select'
import StatCard from '../ui/StatCard'
import { EmptyState, ErrorState, LoadingState } from '../ui/States'
import { AlertStatusBadge, ErrorTypeBadge, SeverityBadge } from './MonitoringBadges'
import { timeAgo } from './monitoringHelpers'

const PAGE_SIZE = 8

const severityBorder: Record<AlertSeverity, string> = {
  critical: 'border-l-red-500',
  warning: 'border-l-amber-400',
  info: 'border-l-blue-400',
}

export default function ErrorsAlertsTab() {
  const toast = useToast()

  const [alertFilter, setAlertFilter] = useState<AlertStatus | 'all'>('all')
  const [busyId, setBusyId] = useState<string | null>(null)

  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput, 400)
  const [type, setType] = useState<ErrorType | 'all'>('all')
  const [sortBy, setSortBy] = useState<ErrorSortKey>('timestamp')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  const summary = useAsync(() => getErrorSummary())
  const alerts = useAsync(() => getAlerts())
  const logs = useAsync(
    () => getErrorLogs({ search, type, sortBy, sortDir, page, pageSize: PAGE_SIZE }),
    [search, type, sortBy, sortDir, page],
  )

  const changeAlertStatus = async (alert: SystemAlert, next: AlertStatus) => {
    setBusyId(alert.id)
    try {
      await updateAlertStatus(alert.id, next)
      toast.success(
        next === 'acknowledged'
          ? 'Alert acknowledged'
          : next === 'resolved'
            ? 'Alert resolved'
            : 'Alert reopened',
      )
      alerts.reload()
      summary.reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update alert')
    } finally {
      setBusyId(null)
    }
  }

  const handleSort = (key: string) => {
    if (key === sortBy) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key as ErrorSortKey)
      setSortDir('desc')
    }
    setPage(1)
  }

  const visibleAlerts = (alerts.data ?? []).filter(
    (a) => alertFilter === 'all' || a.status === alertFilter,
  )

  const columns: Column<ErrorLog>[] = [
    {
      key: 'timestamp',
      header: 'Time',
      sortable: true,
      render: (e) => <span className="text-gray-600">{formatDateTime(e.timestamp)}</span>,
    },
    { key: 'type', header: 'Type', render: (e) => <ErrorTypeBadge type={e.type} /> },
    {
      key: 'source',
      header: 'Source',
      render: (e) => <span className="font-mono text-xs text-gray-700">{e.source}</span>,
    },
    {
      key: 'statusCode',
      header: 'Code',
      render: (e) => (
        <span className="font-mono text-xs text-gray-600">{e.statusCode ?? '—'}</span>
      ),
    },
    {
      key: 'message',
      header: 'Message',
      render: (e) => <span className="text-gray-700">{e.message}</span>,
    },
    {
      key: 'occurrences',
      header: 'Count',
      sortable: true,
      render: (e) => <span className="text-gray-600">{formatNumber(e.occurrences)}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Failed Requests"
          value={summary.data ? formatNumber(summary.data.failedRequests24h) : '—'}
          icon={AlertTriangle}
          hint="Last 24 hours"
        />
        <StatCard
          label="Application Errors"
          value={summary.data ? formatNumber(summary.data.applicationErrors24h) : '—'}
          icon={Bug}
          hint="Last 24 hours"
        />
        <StatCard
          label="Open Alerts"
          value={summary.data ? formatNumber(summary.data.openAlerts) : '—'}
          icon={Siren}
          hint="Need attention"
        />
      </div>

      {/* Alerts */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-gray-900">System alerts</h2>
          <div className="sm:w-48">
            <Select
              value={alertFilter}
              onChange={(e) => setAlertFilter(e.target.value as AlertStatus | 'all')}
              options={[{ value: 'all', label: 'All alerts' }, ...ALERT_STATUS_OPTIONS]}
            />
          </div>
        </div>

        {alerts.error ? (
          <ErrorState message={alerts.error} onRetry={alerts.reload} />
        ) : !alerts.data ? (
          <LoadingState label="Loading alerts..." />
        ) : visibleAlerts.length === 0 ? (
          <EmptyState title="No alerts to show" description="Try a different filter." />
        ) : (
          <ul className="space-y-3">
            {visibleAlerts.map((alert) => (
              <li
                key={alert.id}
                className={`flex flex-col gap-3 rounded-lg border border-l-4 border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between ${
                  severityBorder[alert.severity]
                } ${alert.status === 'resolved' ? 'opacity-60' : ''}`}
              >
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={alert.severity} />
                    <AlertStatusBadge status={alert.status} />
                  </div>
                  <p className="text-sm font-medium text-gray-900">{alert.title}</p>
                  <p className="text-sm text-gray-500">{alert.description}</p>
                  <p className="mt-1 text-xs text-gray-400">
                    {alert.source} · {timeAgo(alert.createdAt)}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  {alert.status === 'open' && (
                    <Button
                      variant="outline"
                      className="px-3 py-1.5"
                      loading={busyId === alert.id}
                      onClick={() => changeAlertStatus(alert, 'acknowledged')}
                    >
                      Acknowledge
                    </Button>
                  )}
                  {alert.status !== 'resolved' && (
                    <Button
                      className="px-3 py-1.5"
                      loading={busyId === alert.id}
                      onClick={() => changeAlertStatus(alert, 'resolved')}
                    >
                      Resolve
                    </Button>
                  )}
                  {alert.status === 'resolved' && (
                    <Button
                      variant="ghost"
                      className="px-3 py-1.5"
                      loading={busyId === alert.id}
                      onClick={() => changeAlertStatus(alert, 'open')}
                    >
                      Reopen
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Error log */}
      <div>
        <h2 className="mb-3 text-base font-semibold text-gray-900">
          Application errors & failed requests
        </h2>

        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_200px]">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value)
                setPage(1)
              }}
              placeholder="Search by source or message..."
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <Select
            value={type}
            onChange={(e) => {
              setType(e.target.value as ErrorType | 'all')
              setPage(1)
            }}
            options={[{ value: 'all', label: 'All types' }, ...ERROR_TYPE_OPTIONS]}
          />
        </div>

        {logs.error ? (
          <ErrorState message={logs.error} onRetry={logs.reload} />
        ) : !logs.data ? (
          <LoadingState label="Loading error log..." />
        ) : (
          <DataTable
            columns={columns}
            rows={logs.data.items}
            rowKey={(e) => e.id}
            total={logs.data.total}
            page={page}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
            loading={logs.loading}
            emptyTitle="No errors found"
          />
        )}
      </div>
    </div>
  )
}