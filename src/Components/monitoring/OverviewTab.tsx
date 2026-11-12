import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import {
  getApiEndpoints,
  getDatabaseStatus,
  getServices,
  getSystemSummary,
} from '../../data/monitoring'
import type { ApiEndpoint, HealthStatus, ResourcePoint } from '../../types/monitoring'
import { formatNumber } from '../../utils/format'
import type { Column } from '../ui/DataTable'
import SimpleTable from '../ui/SimpleTable'
import StatCard from '../ui/StatCard'
import { ErrorState, LoadingState } from '../ui/States'
import { EndpointHealthBadge, HealthBadge, MethodBadge } from './MonitoringBadges'
import ResourceGauge from './ResourceGauge'

interface Props {
  tick: number
  history: ResourcePoint[]
}

const banner: Record<HealthStatus, { title: string; classes: string; icon: LucideIcon }> = {
  operational: {
    title: 'All systems operational',
    classes: 'border-brand/30 bg-brand-soft text-brand-hover',
    icon: CheckCircle2,
  },
  degraded: {
    title: 'Some services are degraded',
    classes: 'border-amber-200 bg-amber-50 text-amber-800',
    icon: AlertTriangle,
  },
  down: {
    title: 'Service outage detected',
    classes: 'border-red-200 bg-red-50 text-red-700',
    icon: XCircle,
  },
}

const endpointColumns: Column<ApiEndpoint>[] = [
  {
    key: 'endpoint',
    header: 'Endpoint',
    render: (e) => (
      <div className="flex items-center gap-2">
        <MethodBadge method={e.method} />
        <span className="font-mono text-xs text-gray-700">{e.path}</span>
      </div>
    ),
  },
  { key: 'status', header: 'Status', render: (e) => <EndpointHealthBadge status={e.status} /> },
  {
    key: 'code',
    header: 'Last code',
    render: (e) => <span className="font-mono text-xs text-gray-600">{e.lastStatusCode}</span>,
  },
  {
    key: 'avg',
    header: 'Avg response',
    render: (e) => <span className="text-gray-600">{e.avgResponseMs} ms</span>,
  },
  {
    key: 'p95',
    header: 'P95',
    render: (e) => <span className="text-gray-600">{e.p95Ms} ms</span>,
  },
  {
    key: 'requests',
    header: 'Requests / hr',
    render: (e) => <span className="text-gray-600">{formatNumber(e.requestsPerHour)}</span>,
  },
  {
    key: 'errors',
    header: 'Error rate',
    render: (e) => (
      <span className={e.errorRate >= 3 ? 'font-medium text-red-600' : 'text-gray-600'}>
        {e.errorRate}%
      </span>
    ),
  },
]

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-gray-900">{title}</h2>
      {children}
    </div>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900">{children}</span>
    </div>
  )
}

function UsageBar({ value, max }: { value: number; max: number }) {
  const percent = Math.round((value / max) * 100)
  const color = percent >= 85 ? 'bg-red-500' : percent >= 70 ? 'bg-amber-500' : 'bg-brand'

  return (
    <div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-gray-100">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${percent}%` }} />
    </div>
  )
}

export default function OverviewTab({ tick, history }: Props) {
  const summary = useAsync(() => getSystemSummary(), [tick])
  const services = useAsync(() => getServices(), [tick])
  const endpoints = useAsync(() => getApiEndpoints(), [tick])
  const database = useAsync(() => getDatabaseStatus(), [tick])

  const latest = history[history.length - 1]

  const status = summary.data?.overallStatus
  const bannerConfig = status ? banner[status] : null
  const BannerIcon = bannerConfig?.icon

  const operationalCount = services.data?.filter((s) => s.status === 'operational').length ?? 0
  const serviceTotal = services.data?.length ?? 0

  return (
    <div className="space-y-6">
      {/* Overall health */}
      {summary.error ? (
        <ErrorState message={summary.error} onRetry={summary.reload} />
      ) : !summary.data || !bannerConfig || !BannerIcon ? (
        <LoadingState label="Checking platform health..." />
      ) : (
        <>
          <div className={`flex items-center gap-3 rounded-xl border p-4 ${bannerConfig.classes}`}>
            <BannerIcon size={24} />
            <div>
              <p className="font-semibold">{bannerConfig.title}</p>
              {serviceTotal > 0 && (
                <p className="text-sm opacity-80">
                  {operationalCount} of {serviceTotal} services operational ·{' '}
                  {summary.data.openAlerts} open alert{summary.data.openAlerts === 1 ? '' : 's'}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Uptime"
              value={`${summary.data.uptimePercent.toFixed(2)}%`}
              icon={Activity}
              hint="Last 30 days"
            />
            <StatCard
              label="Avg Response Time"
              value={`${summary.data.avgResponseMs} ms`}
              icon={Clock}
              hint="All API endpoints"
            />
            <StatCard
              label="Error Rate"
              value={`${summary.data.errorRate}%`}
              icon={AlertTriangle}
              hint="Failed requests"
            />
            <StatCard
              label="Requests / Minute"
              value={formatNumber(summary.data.requestsPerMin)}
              icon={Zap}
              hint="Current traffic"
            />
          </div>
        </>
      )}

      {/* Server resources */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ResourceGauge
          label="CPU usage"
          value={latest?.cpu ?? 0}
          detail="Application servers (average)"
        />
        <ResourceGauge
          label="Memory usage"
          value={latest?.memory ?? 0}
          detail="Application servers (average)"
        />
        <ResourceGauge
          label="Disk usage"
          value={summary.data?.diskUsage ?? 0}
          detail="Primary storage volume"
        />
      </div>

      <Card title="CPU & memory (live)">
        {history.length === 0 ? (
          <LoadingState label="Collecting metrics..." />
        ) : (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} unit="%" />
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cpu"
                  name="CPU"
                  stroke="#238B45"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="memory"
                  name="Memory"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Services + database */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Backend services">
          {services.error ? (
            <ErrorState message={services.error} onRetry={services.reload} />
          ) : !services.data ? (
            <LoadingState label="Checking services..." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {services.data.map((service) => (
                <li key={service.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{service.name}</p>
                    <p className="text-xs text-gray-400">
                      {service.latencyMs} ms · {service.uptime}% uptime
                    </p>
                  </div>
                  <HealthBadge status={service.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Database">
          {database.error ? (
            <ErrorState message={database.error} onRetry={database.reload} />
          ) : !database.data ? (
            <LoadingState label="Checking database..." />
          ) : (
            <div className="divide-y divide-gray-100">
              <DetailRow label="Engine">{database.data.engine}</DetailRow>
              <DetailRow label="Connection">
                <HealthBadge status={database.data.status} />
              </DetailRow>
              <DetailRow label="Active connections">
                <div className="flex flex-col items-end">
                  {database.data.activeConnections} / {database.data.maxConnections}
                  <UsageBar
                    value={database.data.activeConnections}
                    max={database.data.maxConnections}
                  />
                </div>
              </DetailRow>
              <DetailRow label="Avg query time">{database.data.avgQueryMs} ms</DetailRow>
              <DetailRow label="Slow queries (last hour)">{database.data.slowQueries}</DetailRow>
              <DetailRow label="Replication lag">{database.data.replicationLagMs} ms</DetailRow>
              <DetailRow label="Storage">
                <div className="flex flex-col items-end">
                  {database.data.storageUsedGb} / {database.data.storageTotalGb} GB
                  <UsageBar
                    value={database.data.storageUsedGb}
                    max={database.data.storageTotalGb}
                  />
                </div>
              </DetailRow>
            </div>
          )}
        </Card>
      </div>

      {/* API performance */}
      <Card title="API response status & performance">
        {endpoints.error ? (
          <ErrorState message={endpoints.error} onRetry={endpoints.reload} />
        ) : !endpoints.data ? (
          <LoadingState label="Loading endpoints..." />
        ) : (
          <SimpleTable columns={endpointColumns} rows={endpoints.data} rowKey={(e) => e.id} />
        )}
      </Card>
    </div>
  )
}