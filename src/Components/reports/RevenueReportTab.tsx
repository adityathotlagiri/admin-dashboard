import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { DollarSign, TrendingUp, UserMinus, UserPlus } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { getRevenueReport } from '../../data/reports'
import type { DateRange, RevenueTrendPoint } from '../../types/reports'
import type { ReportExport } from '../../utils/exportReport'
import { formatCurrency, formatNumber } from '../../utils/format'
import type { Column } from '../ui/DataTable'
import SimpleTable from '../ui/SimpleTable'
import StatCard from '../ui/StatCard'
import { ErrorState, LoadingState } from '../ui/States'
import ChartCard from './ChartCard'
import ExportButtons from './ExportButtons'
import { describeRange } from './reportHelpers'

const PLAN_COLORS = ['#238B45', '#42CE70', '#036724', '#9be3b4']

const columns: Column<RevenueTrendPoint>[] = [
  {
    key: 'period',
    header: 'Period',
    render: (r) => <span className="font-medium text-gray-900">{r.period}</span>,
  },
  { key: 'revenue', header: 'Revenue', render: (r) => formatCurrency(r.revenue) },
  { key: 'new', header: 'New subscriptions', render: (r) => formatNumber(r.newSubscriptions) },
  { key: 'cancelled', header: 'Cancelled', render: (r) => formatNumber(r.cancelled) },
  {
    key: 'net',
    header: 'Net change',
    render: (r) => (
      <span className={r.net >= 0 ? 'font-medium text-brand' : 'font-medium text-red-600'}>
        {r.net > 0 ? '+' : ''}
        {r.net}
      </span>
    ),
  },
]

export default function RevenueReportTab({ range }: { range: DateRange }) {
  const { data, error, reload } = useAsync(() => getRevenueReport(range), [range.from, range.to])

  const buildReport = async (): Promise<ReportExport | null> => {
    if (!data) return null
    return {
      title: 'Subscription & Revenue Report',
      subtitle: describeRange(range),
      fileName: 'subscription-revenue',
      summary: [
        { label: 'Total revenue', value: formatCurrency(data.totalRevenue) },
        { label: 'New subscriptions', value: formatNumber(data.newSubscriptions) },
        { label: 'Cancellations', value: formatNumber(data.cancelled) },
        { label: 'Net subscriber change', value: String(data.netSubscribers) },
        ...data.byPlan.map((p) => ({
          label: `Revenue – ${p.plan}`,
          value: formatCurrency(p.revenue),
        })),
      ],
      headers: ['Period', 'Revenue (USD)', 'New subscriptions', 'Cancelled', 'Net change'],
      rows: data.trend.map((r) => [r.period, r.revenue, r.newSubscriptions, r.cancelled, r.net]),
    }
  }

  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return <LoadingState label="Building revenue report..." />

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ExportButtons getReport={buildReport} disabled={data.trend.length === 0} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Revenue" value={formatCurrency(data.totalRevenue)} icon={DollarSign} />
        <StatCard label="New Subscriptions" value={formatNumber(data.newSubscriptions)} icon={UserPlus} />
        <StatCard label="Cancellations" value={formatNumber(data.cancelled)} icon={UserMinus} />
        <StatCard
          label="Net Subscriber Change"
          value={`${data.netSubscribers > 0 ? '+' : ''}${data.netSubscribers}`}
          icon={TrendingUp}
          hint="New minus cancelled"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <ChartCard title="Revenue trend" subtitle="Subscription revenue over time">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={(v: number) => (v >= 1000 ? `$${v / 1000}k` : `$${v}`)}
                  />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="revenue" name="Revenue" fill="#238B45" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <ChartCard title="Revenue by plan" subtitle="Share of revenue per plan">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.byPlan}
                  dataKey="revenue"
                  nameKey="plan"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {data.byPlan.map((_, index) => (
                    <Cell key={index} fill={PLAN_COLORS[index % PLAN_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <SimpleTable columns={columns} rows={data.trend} rowKey={(r) => r.period} emptyTitle="No data for this range" />
    </div>
  )
}