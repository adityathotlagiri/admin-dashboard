import {
  Area,
  AreaChart,
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
  Ban,
  BookOpen,
  BookX,
  CreditCard,
  DollarSign,
  GraduationCap,
  TrendingUp,
  UserCog,
  Users,
} from 'lucide-react'
import { useAsync } from '../../../hooks/useAsync'
import {
  getDashboardStats,
  getNotifications,
  getRecentActivities,
  getRevenueTrend,
  getUserGrowth,
} from '../../../data/dashboardData'
import { formatCurrency, formatNumber } from '../../../utils/format'
import PageHeader from '../../../Components/ui/PageHeader'
import StatCard from '../../../Components/ui/StatCard'
import Badge, { type BadgeTone } from '../../../Components/ui/Badge'
import { EmptyState, ErrorState, LoadingState } from '../../../Components/ui/States'
import type { ActivityType, NotificationLevel } from '../../../types'

const activityTone: Record<ActivityType, BadgeTone> = {
  user: 'blue',
  course: 'green',
  subscription: 'amber',
  system: 'gray',
}

const notificationTone: Record<NotificationLevel, BadgeTone> = {
  info: 'blue',
  warning: 'amber',
  success: 'green',
  error: 'red',
}

export default function AdminDashboard() {
  const { data, loading, error, reload } = useAsync(async () => {
    const [stats, growth, revenue, activities, notifications] = await Promise.all([
      getDashboardStats(),
      getUserGrowth(),
      getRevenueTrend(),
      getRecentActivities(),
      getNotifications(),
    ])
    return { stats, growth, revenue, activities, notifications }
  })

  if (loading) return <LoadingState label="Loading dashboard..." />
  if (error || !data) return <ErrorState message={error ?? 'Failed to load dashboard'} onRetry={reload} />

  const { stats, growth, revenue, activities, notifications } = data

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Platform overview and key metrics at a glance."
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total Users" value={formatNumber(stats.totalUsers)} icon={Users} />
        <StatCard label="Students" value={formatNumber(stats.students)} icon={GraduationCap} />
        <StatCard label="Teachers" value={formatNumber(stats.teachers)} icon={UserCog} />
        <StatCard label="Admins" value={formatNumber(stats.admins)} icon={UserCog} />
        <StatCard label="Published Courses" value={formatNumber(stats.publishedCourses)} icon={BookOpen} />
        <StatCard label="Unpublished Courses" value={formatNumber(stats.unpublishedCourses)} icon={BookX} />
        <StatCard label="Active Subscriptions" value={formatNumber(stats.activeSubscriptions)} icon={CreditCard} />
        <StatCard label="Inactive Subscriptions" value={formatNumber(stats.inactiveSubscriptions)} icon={Ban} />
        <StatCard
          label="Total Revenue"
          value={formatCurrency(stats.totalRevenue)}
          icon={DollarSign}
          hint="All time"
        />
        <StatCard
          label="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={TrendingUp}
          hint="Current month"
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">User Growth</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="students"
                  name="Students"
                  stroke="#238B45"
                  fill="#42CE70"
                  fillOpacity={0.25}
                />
                <Area
                  type="monotone"
                  dataKey="teachers"
                  name="Teachers"
                  stroke="#036724"
                  fill="#036724"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Revenue</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => `$${v / 1000}k`} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Bar dataKey="revenue" name="Revenue" fill="#238B45" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Activities + notifications */}
      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Recent Activities</h2>
          {activities.length === 0 ? (
            <EmptyState title="No recent activity" />
          ) : (
                        <ul className="divide-y divide-gray-100">
              {activities.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm text-gray-800">{item.message}</p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {item.actor} · {item.time}
                    </p>
                  </div>
                  <Badge tone={activityTone[item.type]}>{item.type}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-900">Notifications</h2>
          {notifications.length === 0 ? (
            <EmptyState title="You're all caught up" />
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.map((item) => (
                <li key={item.id} className="flex items-start justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.title}</p>
                    <p className="text-sm text-gray-500">{item.description}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{item.time}</p>
                  </div>
                  <Badge tone={notificationTone[item.level]}>{item.level}</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}