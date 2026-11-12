import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Pencil, Plus, Search } from 'lucide-react'
import { useAsync } from '../../../hooks/useAsync'
import { useDebounce } from '../../../hooks/useDebounce'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '../../../context/ToastContext'
import {
  createUser,
  getUsers,
  updateUser,
  updateUserStatus,
} from '../../../data/users'
import {
  ROLE_OPTIONS,
  STATUS_OPTIONS,
  type Role,
  type User,
  type UserFormValues,
  type UserSortKey,
  type UserStatus,
} from '../../../types'
import { formatDate } from '../../../utils/format'
import Button from '../../../Components/ui/Button'
import ConfirmDialog from '../../../Components/ui/ConfirmDialog'
import DataTable, { type Column } from '../../../Components/ui/DataTable'
import Modal from '../../../Components/ui/Modal'
import PageHeader from '../../../Components/ui/PageHeader'
import Select from '../../../Components/ui/Select'
import { ErrorState, LoadingState } from '../../../Components/ui/States'
import { RoleBadge, StatusBadge } from '../../../Components/users/UserBadges'
import UserForm from '../../../Components/users/UserForm'
import { getStatusActions, type StatusAction } from '../../../Components/users/statusActions'

const PAGE_SIZE = 8

type FormState = { mode: 'create' } | { mode: 'edit'; user: User } | null
type PendingAction = { user: User; action: StatusAction } | null

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const toast = useToast()

  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput, 400)
  const [role, setRole] = useState<Role | 'all'>('all')
  const [status, setStatus] = useState<UserStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<UserSortKey>('registeredAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  const [formState, setFormState] = useState<FormState>(null)
  const [pending, setPending] = useState<PendingAction>(null)
  const [actionLoading, setActionLoading] = useState(false)

  const { data, loading, error, reload } = useAsync(
    () => getUsers({ search, role, status, sortBy, sortDir, page, pageSize: PAGE_SIZE }),
    [search, role, status, sortBy, sortDir, page],
  )

  const handleSort = (key: string) => {
    if (key === sortBy) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key as UserSortKey)
      setSortDir('asc')
    }
    setPage(1)
  }

  const handleSaveUser = async (values: UserFormValues) => {
    if (formState?.mode === 'edit') {
      await updateUser(formState.user.id, values)
      toast.success('User updated successfully')
    } else {
      await createUser(values)
      toast.success('User added successfully')
    }
    setFormState(null)
    reload()
  }

  const handleConfirmStatus = async () => {
    if (!pending) return
    setActionLoading(true)
    try {
      await updateUserStatus(pending.user.id, pending.action.next)
      toast.success(`${pending.user.name} is now ${pending.action.next}`)
      setPending(null)
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setActionLoading(false)
    }
  }

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: 'User',
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-hover">
            {u.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <Link
              to={`/admin/users/${u.id}`}
              className="font-medium text-gray-900 hover:text-brand"
            >
              {u.name}
            </Link>
            <p className="text-xs text-gray-500">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'role', header: 'Role', sortable: true, render: (u) => <RoleBadge role={u.role} /> },
    { key: 'status', header: 'Status', sortable: true, render: (u) => <StatusBadge status={u.status} /> },
    {
      key: 'registeredAt',
      header: 'Registered',
      sortable: true,
      render: (u) => <span className="text-gray-600">{formatDate(u.registeredAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (u) => {
        const isSelf = u.id === currentUser?.id
        return (
          <div className="flex items-center justify-end gap-1">
            <Link
              to={`/admin/users/${u.id}`}
              title="View"
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-brand"
            >
              <Eye size={16} />
            </Link>
            <button
              title="Edit"
              onClick={() => setFormState({ mode: 'edit', user: u })}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-brand"
            >
              <Pencil size={16} />
            </button>
            {!isSelf &&
              getStatusActions(u.status).map((action) => {
                const Icon = action.icon
                return (
                  <button
                    key={action.label}
                    title={action.label}
                    onClick={() => setPending({ user: u, action })}
                    className={`rounded-lg p-2 text-gray-500 hover:bg-gray-100 ${
                      action.danger ? 'hover:text-red-600' : 'hover:text-brand'
                    }`}
                  >
                    <Icon size={16} />
                  </button>
                )
              })}
          </div>
        )
      },
    },
  ]

  return (
    <div>
      <PageHeader
        title="User Management"
        description="View, add, and manage all registered users."
        actions={
          <Button onClick={() => setFormState({ mode: 'create' })}>
            <Plus size={16} />
            Add User
          </Button>
        }
      />

      {/* Search + filters */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_180px_180px]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPage(1)
            }}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <Select
          value={role}
          onChange={(e) => {
            setRole(e.target.value as Role | 'all')
            setPage(1)
          }}
          options={[{ value: 'all', label: 'All roles' }, ...ROLE_OPTIONS]}
        />
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as UserStatus | 'all')
            setPage(1)
          }}
          options={[{ value: 'all', label: 'All statuses' }, ...STATUS_OPTIONS]}
        />
      </div>

      {/* Table */}
      {error ? (
        <ErrorState message={error} onRetry={reload} />
      ) : !data ? (
        <LoadingState label="Loading users..." />
      ) : (
        <DataTable
          columns={columns}
          rows={data.items}
          rowKey={(u) => u.id}
          total={data.total}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          loading={loading}
          emptyTitle="No users found"
        />
      )}

      {/* Add / Edit modal */}
      <Modal
        open={formState !== null}
        title={formState?.mode === 'edit' ? 'Edit User' : 'Add New User'}
        onClose={() => setFormState(null)}
      >
        {formState && (
          <UserForm
            initial={
              formState.mode === 'edit'
                ? {
                    name: formState.user.name,
                    email: formState.user.email,
                    phone: formState.user.phone,
                    role: formState.user.role,
                  }
                : undefined
            }
            submitLabel={formState.mode === 'edit' ? 'Save changes' : 'Add user'}
            onSubmit={handleSaveUser}
            onCancel={() => setFormState(null)}
          />
        )}
      </Modal>

      {/* Status confirmation */}
      <ConfirmDialog
        open={pending !== null}
        title={pending ? `${pending.action.label} user` : ''}
        message={pending ? pending.action.confirm(pending.user.name) : ''}
        confirmLabel={pending?.action.label}
        danger={pending?.action.danger}
        loading={actionLoading}
        onConfirm={handleConfirmStatus}
        onCancel={() => setPending(null)}
      />
    </div>
  )
}