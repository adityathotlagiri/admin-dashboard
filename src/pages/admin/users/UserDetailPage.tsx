import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import { useAsync } from '../../../hooks/useAsync'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '../../../context/ToastContext'
import {
  getUserActivity,
  getUserById,
  updateUser,
  updateUserRole,
  updateUserStatus,
} from '../../../data/users'
import { ROLE_OPTIONS, type Role, type UserFormValues } from '../../../types'
import { formatDate, formatDateTime } from '../../../utils/format'
import Button from '../../../Components/ui/Button'
import ConfirmDialog from '../../../Components/ui/ConfirmDialog'
import Modal from '../../../Components/ui/Modal'
import PageHeader from '../../../Components/ui/PageHeader'
import Select from '../../../Components/ui/Select'
import { ErrorState, LoadingState } from '../../../Components/ui/States'
import { RoleBadge, StatusBadge } from '../../../Components/users/UserBadges'
import UserForm from '../../../Components/users/UserForm'
import { getStatusActions, type StatusAction } from '../../../Components/users/statusActions'

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-900">{value}</span>
    </div>
  )
}

export default function UserDetailPage() {
  const { id = '' } = useParams()
  const { user: currentUser } = useAuth()
  const toast = useToast()

  const [editOpen, setEditOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<StatusAction | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [roleDraft, setRoleDraft] = useState<Role | null>(null)
  const [roleSaving, setRoleSaving] = useState(false)

  const { data, loading, error, reload } = useAsync(async () => {
    const [user, activity] = await Promise.all([getUserById(id), getUserActivity(id)])
    return { user, activity }
  }, [id])

  const backLink = (
    <Link
      to="/admin/users"
      className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand"
    >
      <ArrowLeft size={16} />
      Back to users
    </Link>
  )

  if (loading && !data) return <LoadingState label="Loading user..." />

  if (error || !data) {
    return (
      <div>
        {backLink}
        <ErrorState message={error ?? 'User not found'} onRetry={reload} />
      </div>
    )
  }

  const { user, activity } = data
  const isSelf = user.id === currentUser?.id
  const selectedRole = roleDraft ?? user.role

  const handleSaveUser = async (values: UserFormValues) => {
    await updateUser(user.id, values)
    toast.success('User updated successfully')
    setEditOpen(false)
    setRoleDraft(null)
    reload()
  }

  const handleConfirmStatus = async () => {
    if (!pendingAction) return
    setActionLoading(true)
    try {
      await updateUserStatus(user.id, pendingAction.next)
      toast.success(`${user.name} is now ${pendingAction.next}`)
      setPendingAction(null)
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSaveRole = async () => {
    setRoleSaving(true)
    try {
      await updateUserRole(user.id, selectedRole)
      toast.success(`Role changed to ${selectedRole}`)
      setRoleDraft(null)
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role')
    } finally {
      setRoleSaving(false)
    }
  }

  return (
    <div>
      {backLink}

      <PageHeader
        title={user.name}
        description={user.email}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil size={16} />
              Edit
            </Button>
            {!isSelf &&
              getStatusActions(user.status).map((action) => {
                const Icon = action.icon
                return (
                  <Button
                    key={action.label}
                    variant={action.danger ? 'danger' : 'primary'}
                    onClick={() => setPendingAction(action)}
                  >
                    <Icon size={16} />
                    {action.label}
                  </Button>
                )
              })}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Profile */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col items-center gap-2 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-2xl font-semibold text-white">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <p className="text-lg font-semibold text-gray-900">{user.name}</p>
            <div className="flex gap-2">
              <RoleBadge role={user.role} />
              <StatusBadge status={user.status} />
            </div>
          </div>
          <div className="divide-y divide-gray-100 border-t border-gray-100">
            <InfoRow label="Email" value={user.email} />
            <InfoRow label="Phone" value={user.phone || '—'} />
            <InfoRow label="Registered" value={formatDate(user.registeredAt)} />
            <InfoRow label="Last active" value={formatDate(user.lastActive)} />
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {/* Role assignment */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Role assignment</h2>
            <p className="mb-4 mt-1 text-sm text-gray-500">
              Change what this user can access on the platform.
            </p>
            {isSelf ? (
              <p className="text-sm text-gray-400">You can't change your own role.</p>
            ) : (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="sm:w-56">
                  <Select
                    label="Role"
                    value={selectedRole}
                    onChange={(e) => setRoleDraft(e.target.value as Role)}
                    options={ROLE_OPTIONS}
                  />
                </div>
                <Button
                  onClick={handleSaveRole}
                  loading={roleSaving}
                  disabled={selectedRole === user.role}
                >
                  Save role
                </Button>
              </div>
            )}
          </div>

          {/* Activity history */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-gray-900">
              Registration & activity history
            </h2>
            <ul className="space-y-4">
              {activity.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.action}</p>
                    <p className="text-sm text-gray-500">{item.detail}</p>
                    <p className="mt-0.5 text-xs text-gray-400">{formatDateTime(item.date)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <Modal open={editOpen} title="Edit User" onClose={() => setEditOpen(false)}>
        <UserForm
          initial={{
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
          }}
          submitLabel="Save changes"
          onSubmit={handleSaveUser}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={pendingAction !== null}
        title={pendingAction ? `${pendingAction.label} user` : ''}
        message={pendingAction ? pendingAction.confirm(user.name) : ''}
        confirmLabel={pendingAction?.label}
        danger={pendingAction?.danger}
        loading={actionLoading}
        onConfirm={handleConfirmStatus}
        onCancel={() => setPendingAction(null)}
      />
    </div>
  )
}