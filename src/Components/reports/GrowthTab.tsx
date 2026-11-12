import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BookOpen, DollarSign, TrendingUp, Users } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { getGrowthReport } from '../../data/reports'
import { GRANULARITY_OPTIONS, type DateRange, type Granularity, type GrowthRow } from '../../types/reports'
import type { ReportExport } from '../../utils/exportReport'
import { formatCurrency, formatNumber } from '../../utils/format'
import type { Column } from '../ui/DataTable'
import Select from '../ui/Select'
import SimpleTable from '../ui/SimpleTable'
import StatCard from '../ui/StatCard'
import { ErrorState, LoadingState } from '../ui/States'
import ChartCard from './ChartCard'
import ExportButtons from './ExportButtons'
import { describeRange } from './reportHelpers'

const columns: Column<GrowthRow>[] = [
  {
    key: 'period',
    header: 'Period',
    render: (r) => <span className="font-medium text-gray-900">{r.period}</span>,
  },
  { key: 'newUsers', header: 'New users', render: (r) => formatNumber(r.newUsers) },
  { key: 'enrollments', header: 'Enrollments', render: (r) => formatNumber(r.enrollments) },
  { key: 'revenue', header: 'Revenue', render: (r) => formatCurrency(r.revenue) },
  {
    key: 'growth',
    header: 'Revenue growth',
    render: (r) =>
      r.revenueGrowth === null ? (
        <span className="text-gray-400">—</span>
      ) : (
        <span className={r.revenueGrowth >= 0 ? 'font-medium text-brand' : 'font-medium text-red-600'}>
          {r.revenueGrowth > 0 ? '+' : ''}
          {r.revenueGrowth}%
        </span>
      ),
  },
]

export default function GrowthTab({ range }: { range: DateRange }) {
  const [granularity, setGranularity] = useState<Granularity>('monthly')

  const { data, error, reload } = useAsync(
    () => getGrowthReport(range, granularity),
    [range.from, range.to, granularity],
  )

  const buildReport = async (): Promise<ReportExport | null> => {
    if (!data) return null
    const totalUsers = data.reduce((s, r) => s + r.newUsers, 0)
    const totalEnrollments = data.reduce((s, r) => s + r.enrollments, 0)
    const totalRevenue = data.reduce((s, r) => s + r.revenue, 0)

    return {
      title: `Platform Growth Report (${granularity})`,
      subtitle: describeRange(range),
      fileName: `platform-growth-${granularity}`,
      summary: [
        { label: 'New users', value: formatNumber(totalUsers) },
        { label: 'Enrollments', value: formatNumber(totalEnrollments) },
        { label: 'Revenue', value: formatCurrency(totalRevenue) },
      ],
      headers: ['Period', 'New users', 'Enrollments', 'Revenue (USD)', 'Revenue growth (%)'],
      rows: data.map((r) => [r.period, r.newUsers, r.enrollments, r.revenue, r.revenueGrowth ?? '']),
    }
  }

  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return <LoadingState label="Building growth report..." />

  const totalUsers = data.reduce((s, r) => s + r.newUsers, 0)
  const totalEnrollments = data.reduce((s, r) => s + r.enrollments, 0)
  const totalRevenue = data.reduce((s, r) => s + r.revenue, 0)
  const latestGrowth = data.length > 0 ? data[data.length - 1].revenueGrowth : null

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="sm:w-48">
          <Select
            label="View by"
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as Granularity)}
            options={GRANULARITY_OPTIONS}
          />
        </div>
        <ExportButtons getReport={buildReport} disabled={data.length === 0} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="New Users" value={formatNumber(totalUsers)} icon={Users} />
        <StatCard label="Enrollments" value={formatNumber(totalEnrollments)} icon={BookOpen} />
        <StatCard label="Revenue" value={formatCurrency(totalRevenue)} icon={DollarSign} />
        <StatCard
          label="Latest Revenue Growth"
          value={latestGrowth === null ? '—' : `${latestGrowth > 0 ? '+' : ''}${latestGrowth}%`}
          icon={TrendingUp}
          hint="Versus the previous period"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Users & enrollments" subtitle="New users and course enrollments per period">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="newUsers" name="New users" stroke="#238B45" strokeWidth={2} />
                <Line type="monotone" dataKey="enrollments" name="Enrollments" stroke="#2563eb" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Revenue" subtitle="Subscription revenue per period">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${v / 1000}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="revenue" name="Revenue" fill="#238B45" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <SimpleTable columns={columns} rows={data} rowKey={(r) => r.key} emptyTitle="No data for this range" />
    </div>
  )
}