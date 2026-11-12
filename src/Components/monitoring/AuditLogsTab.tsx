import { useState } from 'react'
import { Download, Search } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { useDebounce } from '../../hooks/useDebounce'
import { useToast } from '../../context/ToastContext'
import { getAuditLogs } from '../../data/monitoring'
import {
  AUDIT_CATEGORY_OPTIONS,
  AUDIT_RESULT_OPTIONS,
  type AuditCategory,
  type AuditLog,
  type AuditResult,
  type AuditSortKey,
} from '../../types/monitoring'
import { downloadCsv } from '../../utils/exportCsv'
import { formatDateTime } from '../../utils/format'
import Button from '../ui/Button'
import DataTable, { type Column } from '../ui/DataTable'
import Select from '../ui/Select'
import { ErrorState, LoadingState } from '../ui/States'
import { AuditResultBadge } from './MonitoringBadges'

const PAGE_SIZE = 10

export default function AuditLogsTab() {
  const toast = useToast()

  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput, 400)
  const [category, setCategory] = useState<AuditCategory | 'all'>('all')
  const [result, setResult] = useState<AuditResult | 'all'>('all')
  const [sortBy, setSortBy] = useState<AuditSortKey>('timestamp')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)
  const [exporting, setExporting] = useState(false)

  const logs = useAsync(
    () => getAuditLogs({ search, category, result, sortBy, sortDir, page, pageSize: PAGE_SIZE }),
    [search, category, result, sortBy, sortDir, page],
  )

  const handleSort = (key: string) => {
    if (key === sortBy) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key as AuditSortKey)
      setSortDir(key === 'timestamp' ? 'desc' : 'asc')
    }
    setPage(1)
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const all = await getAuditLogs({
        search,
        category,
        result,
        sortBy,
        sortDir,
        page: 1,
        pageSize: 100000,
      })
      if (all.items.length === 0) {
        toast.error('Nothing to export for the current filters')
        return
      }
      downloadCsv(
        'audit-log.csv',
        all.items.map((log) => ({
          Time: formatDateTime(log.timestamp),
          Actor: log.actor,
          Action: log.action,
          Category: log.category,
          Target: log.target,
          'IP address': log.ip,
          Result: log.result,
        })),
      )
      toast.success(`Exported ${all.items.length} audit entries`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const columns: Column<AuditLog>[] = [
    {
      key: 'timestamp',
      header: 'Time',
      sortable: true,
      render: (log) => <span className="text-gray-600">{formatDateTime(log.timestamp)}</span>,
    },
    {
      key: 'actor',
      header: 'Actor',
      sortable: true,
      render: (log) => <span className="font-medium text-gray-900">{log.actor}</span>,
    },
    {
      key: 'action',
      header: 'Action',
      sortable: true,
      render: (log) => <span className="font-mono text-xs text-gray-700">{log.action}</span>,
    },
    {
      key: 'target',
      header: 'Target',
      render: (log) => <span className="text-gray-600">{log.target}</span>,
    },
    {
      key: 'ip',
      header: 'IP address',
      render: (log) => <span className="font-mono text-xs text-gray-500">{log.ip}</span>,
    },
    {
      key: 'result',
      header: 'Result',
      render: (log) => <AuditResultBadge result={log.result} />,
    },
  ]

  return (
    <div>
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_190px_150px_auto]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPage(1)
            }}
            placeholder="Search by actor, action, or target..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <Select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value as AuditCategory | 'all')
            setPage(1)
          }}
          options={[{ value: 'all', label: 'All categories' }, ...AUDIT_CATEGORY_OPTIONS]}
        />
        <Select
          value={result}
          onChange={(e) => {
            setResult(e.target.value as AuditResult | 'all')
            setPage(1)
          }}
          options={[{ value: 'all', label: 'All results' }, ...AUDIT_RESULT_OPTIONS]}
        />
        <Button variant="outline" loading={exporting} onClick={handleExport}>
          <Download size={16} />
          Export CSV
        </Button>
      </div>

      {logs.error ? (
        <ErrorState message={logs.error} onRetry={logs.reload} />
      ) : !logs.data ? (
        <LoadingState label="Loading audit log..." />
      ) : (
        <DataTable
          columns={columns}
          rows={logs.data.items}
          rowKey={(log) => log.id}
          total={logs.data.total}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          loading={logs.loading}
          emptyTitle="No audit entries found"
        />
      )}
    </div>
  )
}