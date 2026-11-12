import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './Components/ProtectedRoute'
import AdminLayout from './Components/layout/AdminLayout'
import Login from './pages/admin/Login'
import AdminDashboard from './pages/admin/dashboard/AdminDashboard'
import UsersPage from './pages/admin/users/UsersPage'
import UserDetailPage from './pages/admin/users/UserDetailPage'
import CoursesPage from './pages/admin/courses/CoursesPage'
import CourseDetailPage from './pages/admin/courses/CourseDetailPage'
import SubscriptionsPage from './pages/admin/subscriptions/SubscriptionsPage'
import SystemMonitoringPage from './pages/admin/monitoring/SystemMonitoringPage'
import ReportsPage from './pages/admin/reports/ReportsPage'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="users/:id" element={<UserDetailPage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="courses/:id" element={<CourseDetailPage />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
          <Route path="monitoring" element={<SystemMonitoringPage />} />
          <Route path="reports" element={<ReportsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}