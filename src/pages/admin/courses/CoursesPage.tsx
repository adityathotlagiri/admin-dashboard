import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Clock,
  Eye,
  Globe,
  Pencil,
  Plus,
  Search,
  Tags,
  Trash2,
  Users,
} from 'lucide-react'
import { useAsync } from '../../../hooks/useAsync'
import { useDebounce } from '../../../hooks/useDebounce'
import { useToast } from '../../../context/ToastContext'
import {
  createCourse,
  deleteCourse,
  getCategories,
  getCourses,
  getCourseStats,
  getTeachers,
  updateCourse,
  updateCourseStatus,
} from '../../../data/courses'
import {
  COURSE_STATUS_OPTIONS,
  type Course,
  type CourseFormValues,
  type CourseSortKey,
  type CourseStatus,
} from '../../../types'
import { formatDate, formatNumber } from '../../../utils/format'
import Button from '../../../Components/ui/Button'
import ConfirmDialog from '../../../Components/ui/ConfirmDialog'
import DataTable, { type Column } from '../../../Components/ui/DataTable'
import Modal from '../../../Components/ui/Modal'
import PageHeader from '../../../Components/ui/PageHeader'
import Select from '../../../Components/ui/Select'
import StatCard from '../../../Components/ui/StatCard'
import { ErrorState, LoadingState } from '../../../Components/ui/States'
import CategoryManager from '../../../Components/courses/CategoryManager'
import { CourseStatusBadge } from '../../../Components/courses/CourseBadges'
import CourseForm from '../../../Components/courses/CourseForm'
import RejectDialog from '../../../Components/courses/RejectDialog'
import {
  courseToFormValues,
  getCourseActions,
  type CourseAction,
} from '../../../Components/courses/courseActions'

const PAGE_SIZE = 8

type FormState = { mode: 'create' } | { mode: 'edit'; course: Course } | null
type PendingAction = { course: Course; action: CourseAction } | null

export default function CoursesPage() {
  const toast = useToast()

  const [searchInput, setSearchInput] = useState('')
  const search = useDebounce(searchInput, 400)
  const [category, setCategory] = useState('all')
  const [status, setStatus] = useState<CourseStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<CourseSortKey>('updatedAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  const [formState, setFormState] = useState<FormState>(null)
  const [pending, setPending] = useState<PendingAction>(null)
  const [toDelete, setToDelete] = useState<Course | null>(null)
  const [categoriesOpen, setCategoriesOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const courses = useAsync(
    () => getCourses({ search, category, status, sortBy, sortDir, page, pageSize: PAGE_SIZE }),
    [search, category, status, sortBy, sortDir, page],
  )
  const stats = useAsync(() => getCourseStats())
  const meta = useAsync(async () => {
    const [categories, teachers] = await Promise.all([getCategories(), getTeachers()])
    return { categories, teachers }
  })

  const refreshCourses = () => {
    courses.reload()
    stats.reload()
  }

  const handleSort = (key: string) => {
    if (key === sortBy) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(key as CourseSortKey)
      setSortDir('asc')
    }
    setPage(1)
  }

  const handleSaveCourse = async (values: CourseFormValues) => {
    if (formState?.mode === 'edit') {
      await updateCourse(formState.course.id, values)
      toast.success('Course updated successfully')
    } else {
      await createCourse(values)
      toast.success(values.publishNow ? 'Course created and published' : 'Course saved as draft')
    }
    setFormState(null)
    refreshCourses()
  }

  const runStatusChange = async (reason?: string) => {
    if (!pending) return
    setActionLoading(true)
    try {
      await updateCourseStatus(pending.course.id, pending.action.next, reason)
      toast.success(`"${pending.course.title}" ${pending.action.doneLabel}`)
      setPending(null)
      refreshCourses()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update course')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!toDelete) return
    setActionLoading(true)
    try {
      await deleteCourse(toDelete.id)
      toast.success(`"${toDelete.title}" deleted`)
      setToDelete(null)
      refreshCourses()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete course')
    } finally {
      setActionLoading(false)
    }
  }

  const columns: Column<Course>[] = [
    {
      key: 'title',
      header: 'Course',
      sortable: true,
      render: (c) => (
        <div>
          <Link to={`/admin/courses/${c.id}`} className="font-medium text-gray-900 hover:text-brand">
            {c.title}
          </Link>
          <p className="text-xs text-gray-500">
            {c.subject}
            {c.visibility === 'private' && ' · Private'}
            {c.availability === 'closed' && ' · Enrollment closed'}
          </p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (c) => <span className="text-gray-600">{c.category}</span>,
    },
    {
      key: 'teacher',
      header: 'Teacher',
      render: (c) => <span className="text-gray-600">{c.teacherName}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (c) => <CourseStatusBadge status={c.status} />,
    },
    {
      key: 'enrollments',
      header: 'Enrolled',
      sortable: true,
      render: (c) => <span className="text-gray-600">{formatNumber(c.enrollments)}</span>,
    },
    {
      key: 'updatedAt',
      header: 'Updated',
      sortable: true,
      render: (c) => <span className="text-gray-600">{formatDate(c.updatedAt)}</span>,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (c) => (
        <div className="flex items-center justify-end gap-1">
          <Link
            to={`/admin/courses/${c.id}`}
            title="View"
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-brand"
          >
            <Eye size={16} />
          </Link>
          <button
            title="Edit"
            disabled={!meta.data}
            onClick={() => setFormState({ mode: 'edit', course: c })}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-brand disabled:opacity-40"
          >
            <Pencil size={16} />
          </button>
          {getCourseActions(c.status).map((action) => {
            const Icon = action.icon
            return (
              <button
                key={action.label}
                title={action.label}
                onClick={() => setPending({ course: c, action })}
                className={`rounded-lg p-2 text-gray-500 hover:bg-gray-100 ${
                  action.danger ? 'hover:text-red-600' : 'hover:text-brand'
                }`}
              >
                <Icon size={16} />
              </button>
            )
          })}
          <button
            title="Delete"
            onClick={() => setToDelete(c)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-red-600"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ]

  const categoryOptions = [
    { value: 'all', label: 'All categories' },
    ...(meta.data?.categories ?? []).map((c) => ({ value: c.name, label: c.name })),
  ]

  const needsReason = pending?.action.requiresReason === true

  return (
    <div>
      <PageHeader
        title="Course Management"
        description="Create, review, and manage every course on the platform."
        actions={
          <>
            <Button variant="outline" disabled={!meta.data} onClick={() => setCategoriesOpen(true)}>
              <Tags size={16} />
              Categories
            </Button>
            <Button disabled={!meta.data} onClick={() => setFormState({ mode: 'create' })}>
              <Plus size={16} />
              Add Course
            </Button>
          </>
        }
      />

      {/* Enrollment & course stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Courses"
          value={stats.data ? formatNumber(stats.data.totalCourses) : '—'}
          icon={BookOpen}
        />
        <StatCard
          label="Published"
          value={stats.data ? formatNumber(stats.data.published) : '—'}
          icon={Globe}
        />
        <StatCard
          label="Pending Approval"
          value={stats.data ? formatNumber(stats.data.pendingApproval) : '—'}
          icon={Clock}
        />
        <StatCard
          label="Total Enrollments"
          value={stats.data ? formatNumber(stats.data.totalEnrollments) : '—'}
          icon={Users}
        />
      </div>

      {/* Search + filters */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_200px_200px]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value)
              setPage(1)
            }}
            placeholder="Search by title, subject, or teacher..."
            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <Select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value)
            setPage(1)
          }}
          options={categoryOptions}
        />
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as CourseStatus | 'all')
            setPage(1)
          }}
          options={[{ value: 'all', label: 'All statuses' }, ...COURSE_STATUS_OPTIONS]}
        />
      </div>

      {/* Table */}
      {courses.error ? (
        <ErrorState message={courses.error} onRetry={courses.reload} />
      ) : !courses.data ? (
        <LoadingState label="Loading courses..." />
      ) : (
        <DataTable
          columns={columns}
          rows={courses.data.items}
          rowKey={(c) => c.id}
          total={courses.data.total}
          page={page}
          pageSize={PAGE_SIZE}
          onPageChange={setPage}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          loading={courses.loading}
          emptyTitle="No courses found"
        />
      )}

      {/* Add / Edit */}
      <Modal
        open={formState !== null}
        title={formState?.mode === 'edit' ? 'Edit Course' : 'Add New Course'}
        onClose={() => setFormState(null)}
      >
        {formState && meta.data && (
          <CourseForm
            mode={formState.mode}
            categories={meta.data.categories}
            teachers={meta.data.teachers}
            initial={formState.mode === 'edit' ? courseToFormValues(formState.course) : undefined}
            onSubmit={handleSaveCourse}
            onCancel={() => setFormState(null)}
          />
        )}
      </Modal>

      {/* Categories & subjects */}
      <Modal
        open={categoriesOpen}
        title="Categories & Subjects"
        onClose={() => setCategoriesOpen(false)}
      >
        {meta.data && (
          <CategoryManager categories={meta.data.categories} onChanged={meta.reload} />
        )}
      </Modal>

      {/* Approve / publish / unpublish */}
      <ConfirmDialog
        open={pending !== null && !needsReason}
        title={pending ? `${pending.action.label} course` : ''}
        message={pending ? pending.action.confirm(pending.course.title) : ''}
        confirmLabel={pending?.action.label}
        danger={pending?.action.danger}
        loading={actionLoading}
        onConfirm={() => runStatusChange()}
        onCancel={() => setPending(null)}
      />

      {/* Reject (needs a reason) */}
      <RejectDialog
        open={pending !== null && needsReason}
        courseTitle={pending?.course.title ?? ''}
        loading={actionLoading}
        onConfirm={(reason) => runStatusChange(reason)}
        onCancel={() => setPending(null)}
      />

      {/* Delete */}
      <ConfirmDialog
        open={toDelete !== null}
        title="Delete course"
        message={
          toDelete
            ? `Delete "${toDelete.title}"? This permanently removes the course and its enrollment data. This can't be undone.`
            : ''
        }
        confirmLabel="Delete"
        danger
        loading={actionLoading}
        onConfirm={handleDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}