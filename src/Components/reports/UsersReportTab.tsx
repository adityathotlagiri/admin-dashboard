import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  Calendar,
  Clock,
  GraduationCap,
  Percent,
  TrendingUp,
  UserCog,
  UserPlus,
  Users,
} from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { getUserReport } from '../../data/reports'
import type { DateRange, UserTrendPoint } from '../../types/reports'
import type { ReportExport } from '../../utils/exportReport'
import { formatNumber } from '../../utils/format'
import type { Column } from '../ui/DataTable'
import SimpleTable from '../ui/SimpleTable'
import StatCard from '../ui/StatCard'
import { ErrorState, LoadingState } from '../ui/States'
import ChartCard from './ChartCard'
import ExportButtons from './ExportButtons'
import { describeRange } from './reportHelpers'

const columns: Column<UserTrendPoint>[] = [
  {
    key: 'period',
    header: 'Period',
    render: (r) => <span className="font-medium text-gray-900">{r.period}</span>,
  },
  { key: 'students', header: 'Students', render: (r) => formatNumber(r.students) },
  { key: 'teachers', header: 'Teachers', render: (r) => formatNumber(r.teachers) },
  {
    key: 'total',
    header: 'Total registrations',
    render: (r) => <span className="font-medium">{formatNumber(r.total)}</span>,
  },
]

export default function UsersReportTab({ range }: { range: DateRange }) {
  const { data, error, reload } = useAsync(() => getUserReport(range), [range.from, range.to])

  const buildReport = async (): Promise<ReportExport | null> => {
    if (!data) return null
    return {
      title: 'User Registration Report',
      subtitle: describeRange(range),
      fileName: 'user-registrations',
      summary: [
        { label: 'Total registrations', value: formatNumber(data.totalRegistrations) },
        { label: 'Students', value: formatNumber(data.students) },
        { label: 'Teachers', value: formatNumber(data.teachers) },
        { label: 'Daily active users (avg)', value: formatNumber(data.activity.dau) },
        { label: 'Monthly active users', value: formatNumber(data.activity.mau) },
        { label: 'Average session length', value: `${data.activity.avgSessionMin} min` },
      ],
      headers: ['Period', 'Students', 'Teachers', 'Total registrations'],
      rows: data.trend.map((r) => [r.period, r.students, r.teachers, r.total]),
    }
  }

  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return <LoadingState label="Building user report..." />

  const { activity } = data

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <ExportButtons getReport={buildReport} disabled={data.trend.length === 0} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="New Registrations" value={formatNumber(data.totalRegistrations)} icon={UserPlus} />
        <StatCard label="Students" value={formatNumber(data.students)} icon={GraduationCap} />
        <StatCard label="Teachers" value={formatNumber(data.teachers)} icon={UserCog} />
        <StatCard label="Avg per Day" value={String(data.avgPerDay)} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Daily Active" value={formatNumber(activity.dau)} icon={Activity} hint="Average DAU" />
        <StatCard label="Weekly Active" value={formatNumber(activity.wau)} icon={Users} hint="WAU" />
        <StatCard label="Monthly Active" value={formatNumber(activity.mau)} icon={Calendar} hint="MAU" />
        <StatCard label="Avg Session" value={`${activity.avgSessionMin} min`} icon={Clock} />
        <StatCard label="Stickiness" value={`${activity.stickiness}%`} icon={Percent} hint="DAU ÷ MAU" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ChartCard title="Registrations" subtitle="New students and teachers over time">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" name="Students" stackId="users" fill="#238B45" />
                <Bar dataKey="teachers" name="Teachers" stackId="users" fill="#036724" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Activity by weekday" subtitle="Average active users per day of the week">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weekday}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="activeUsers" name="Active users" fill="#42CE70" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      <SimpleTable columns={columns} rows={data.trend} rowKey={(r) => r.period} emptyTitle="No data for this range" />
    </div>
  )
}