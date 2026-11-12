import type {
  ActivityItem,
  DashboardStats,
  NotificationItem,
  RevenuePoint,
  UserGrowthPoint,
} from '../types'
import { delay } from './delay'

export async function getDashboardStats(): Promise<DashboardStats> {
  await delay(500)
  return {
    totalUsers: 12480,
    students: 11260,
    teachers: 1190,
    admins: 30,
    publishedCourses: 214,
    unpublishedCourses: 37,
    activeSubscriptions: 4120,
    inactiveSubscriptions: 1385,
    totalRevenue: 482300,
    monthlyRevenue: 52400,
  }
}

export async function getUserGrowth(): Promise<UserGrowthPoint[]> {
  await delay(600)
  return [
    { month: 'Jan', students: 620, teachers: 40 },
    { month: 'Feb', students: 710, teachers: 52 },
    { month: 'Mar', students: 880, teachers: 61 },
    { month: 'Apr', students: 960, teachers: 70 },
    { month: 'May', students: 1120, teachers: 84 },
    { month: 'Jun', students: 1290, teachers: 90 },
    { month: 'Jul', students: 1410, teachers: 102 },
    { month: 'Aug', students: 1580, teachers: 110 },
  ]
}

export async function getRevenueTrend(): Promise<RevenuePoint[]> {
  await delay(600)
  return [
    { month: 'Jan', revenue: 21000 },
    { month: 'Feb', revenue: 26500 },
    { month: 'Mar', revenue: 31200 },
    { month: 'Apr', revenue: 36800 },
    { month: 'May', revenue: 41500 },
    { month: 'Jun', revenue: 45900 },
    { month: 'Jul', revenue: 49100 },
    { month: 'Aug', revenue: 52400 },
  ]
}

export async function getRecentActivities(): Promise<ActivityItem[]> {
  await delay(400)
  return [
    { id: 'a1', message: 'New teacher registered', actor: 'Priya Sharma', time: '5 min ago', type: 'user' },
    { id: 'a2', message: 'Course "Python for Beginners" submitted for approval', actor: 'Rahul Verma', time: '22 min ago', type: 'course' },
    { id: 'a3', message: 'Premium plan purchased', actor: 'Ananya Rao', time: '1 hr ago', type: 'subscription' },
    { id: 'a4', message: 'Database backup completed', actor: 'System', time: '3 hrs ago', type: 'system' },
    { id: 'a5', message: 'User account suspended', actor: 'Admin', time: '5 hrs ago', type: 'user' },
    { id: 'a6', message: 'Course "Calculus Basics" published', actor: 'Admin', time: 'Yesterday', type: 'course' },
  ]
}

export async function getNotifications(): Promise<NotificationItem[]> {
  await delay(400)
  return [
    { id: 'n1', title: '3 courses awaiting approval', description: 'Review submitted courses from teachers.', time: '10 min ago', level: 'warning' },
    { id: 'n2', title: 'Payment gateway latency', description: 'Average response time above 800ms.', time: '1 hr ago', level: 'error' },
    { id: 'n3', title: 'Monthly revenue target reached', description: 'Revenue crossed $50k this month.', time: '2 hrs ago', level: 'success' },
    { id: 'n4', title: 'Scheduled maintenance', description: 'Sunday 2:00 AM – 3:00 AM.', time: 'Yesterday', level: 'info' },
  ]
}