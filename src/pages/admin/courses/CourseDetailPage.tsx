import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { useAsync } from '../../../hooks/useAsync'
import { useToast } from '../../../context/ToastContext'
import {
  assignTeacher,
  deleteCourse,
  getCategories,
  getCourseById,
  getCourseEnrollmentTrend,
  getTeachers,
  updateCourse,
  updateCourseSettings,
  updateCourseStatus,
} from '../../../data/courses'
import {
  AVAILABILITY_OPTIONS,
  VISIBILITY_OPTIONS,
  type CourseAvailability,
  type CourseFormValues,
  type CourseVisibility,
} from '../../../types'
import { formatCurrency, formatDate, formatNumber } from '../../../utils/format'
import Button from '../../../Components/ui/Button'
import ConfirmDialog from '../../../Components/ui/ConfirmDialog'
import Modal from '../../../Components/ui/Modal'
import PageHeader from '../../../Components/ui/PageHeader'
import Select from '../../../Components/ui/Select'
import { ErrorState, LoadingState } from '../../../Components/ui/States'
import { CourseStatusBadge } from '../../../Components/courses/CourseBadges'
import CourseForm from '../../../Components/courses/CourseForm'
import RejectDialog from '../../../Components/courses/RejectDialog'
import {
  courseToFormValues,
  getCourseActions,
  type CourseAction,
} from '../../../Components/courses/courseActions'

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-900">{value}</span>
    </div>
  )
}

export default function CourseDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [editOpen, setEditOpen] = useState(false)
  const [pending, setPending] = useState<CourseAction | null>(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const [teacherDraft, setTeacherDraft] = useState<string | null>(null)
  const [savingTeacher, setSavingTeacher] = useState(false)
  const [visibilityDraft, setVisibilityDraft] = useState<CourseVisibility | null>(null)
  const [availabilityDraft, setAvailabilityDraft] = useState<CourseAvailability | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)

  const { data, loading, error, reload } = useAsync(async () => {
    const [course, trend, categories, teachers] = await Promise.all([
      getCourseById(id),
      getCourseEnrollmentTrend(id),
      getCategories(),
      getTeachers(),
    ])
    return { course, trend, categories, teachers }
  }, [id])

  const backLink = (
    <Link
      to="/admin/courses"
      className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand"
    >
      <ArrowLeft size={16} />
      Back to courses
    </Link>
  )

  if (loading && !data) return <LoadingState label="Loading course..." />

  if (error || !data) {
    return (
      <div>
        {backLink}
        <ErrorState message={error ?? 'Course not found'} onRetry={reload} />
      </div>
    )
  }

  const { course, trend, categories, teachers } = data

  const selectedTeacher = teacherDraft ?? course.teacherId
  const selectedVisibility = visibilityDraft ?? course.visibility
  const selectedAvailability = availabilityDraft ?? course.availability
  const settingsChanged =
    selectedVisibility !== course.visibility || selectedAvailability !== course.availability

  const resetDrafts = () => {
    setTeacherDraft(null)
    setVisibilityDraft(null)
    setAvailabilityDraft(null)
  }

  const handleSaveCourse = async (values: CourseFormValues) => {
    await updateCourse(course.id, values)
    toast.success('Course updated successfully')
    setEditOpen(false)
    resetDrafts()
    reload()
  }

  const runStatusChange = async (reason?: string) => {
    if (!pending) return
    setActionLoading(true)
    try {
      await updateCourseStatus(course.id, pending.next, reason)
      toast.success(`Course ${pending.doneLabel}`)
      setPending(null)
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update course')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    setActionLoading(true)
    try {
      await deleteCourse(course.id)
      toast.success(`"${course.title}" deleted`)
      navigate('/admin/courses', { replace: true })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete course')
      setActionLoading(false)
    }
  }

  const handleSaveTeacher = async () => {
    setSavingTeacher(true)
    try {
      await assignTeacher(course.id, selectedTeacher)
      toast.success('Teacher assigned')
      setTeacherDraft(null)
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to assign teacher')
    } finally {
      setSavingTeacher(false)
    }
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      await updateCourseSettings(course.id, {
        visibility: selectedVisibility,
        availability: selectedAvailability,
      })
      toast.success('Course settings updated')
      setVisibilityDraft(null)
      setAvailabilityDraft(null)
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update settings')
    } finally {
      setSavingSettings(false)
    }
  }

  const needsReason = pending?.requiresReason === true

  return (
    <div>
      {backLink}

      <PageHeader
        title={course.title}
        description={`${course.category} · ${course.subject}`}
        actions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil size={16} />
              Edit
            </Button>
            {getCourseActions(course.status).map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.label}
                  variant={action.danger ? 'danger' : 'primary'}
                  onClick={() => setPending(action)}
                >
                  <Icon size={16} />
                  {action.label}
                </Button>
              )
            })}
            <Button variant="outline" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={16} />
              Delete
            </Button>
          </>
        }
      />

      {course.status === 'rejected' && course.rejectionReason && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <p className="font-medium">This course was rejected</p>
          <p className="mt-1">{course.rejectionReason}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Course info */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <CourseStatusBadge status={course.status} />
          </div>
          <p className="mb-4 text-sm text-gray-600">{course.description}</p>
          <div className="divide-y divide-gray-100 border-t border-gray-100">
            <InfoRow label="Teacher" value={course.teacherName} />
            <InfoRow label="Price" value={course.price === 0 ? 'Free' : formatCurrency(course.price)} />
            <InfoRow label="Visibility" value={course.visibility === 'public' ? 'Public' : 'Private'} />
            <InfoRow
              label="Enrollment"
              value={course.availability === 'open' ? 'Open' : 'Closed'}
            />
            <InfoRow label="Created" value={formatDate(course.createdAt)} />
            <InfoRow label="Last updated" value={formatDate(course.updatedAt)} />
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {/* Enrollment stats */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Enrollment statistics</h2>
                <p className="text-sm text-gray-500">New enrollments per month</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-gray-900">
                  {formatNumber(course.enrollments)}
                </p>
                <p className="text-xs text-gray-400">Total students</p>
              </div>
            </div>
            {course.enrollments === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400">
                No enrollments yet. Enrollments appear once the course is published.
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="enrollments"
                      name="Enrollments"
                      stroke="#238B45"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Teacher assignment */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Assigned teacher</h2>
            <p className="mb-4 mt-1 text-sm text-gray-500">
              The teacher responsible for this course.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="sm:w-64">
                <Select
                  label="Teacher"
                  value={selectedTeacher}
                  onChange={(e) => setTeacherDraft(e.target.value)}
                  options={teachers.map((t) => ({ value: t.id, label: t.name }))}
                />
              </div>
              <Button
                onClick={handleSaveTeacher}
                loading={savingTeacher}
                disabled={selectedTeacher === course.teacherId}
              >
                Save teacher
              </Button>
            </div>
          </div>

          {/* Visibility & availability */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900">Visibility & availability</h2>
            <p className="mb-4 mt-1 text-sm text-gray-500">
              Control who can see this course and whether students can enroll.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="sm:w-52">
                <Select
                  label="Visibility"
                  value={selectedVisibility}
                  onChange={(e) => setVisibilityDraft(e.target.value as CourseVisibility)}
                  options={VISIBILITY_OPTIONS}
                />
              </div>
              <div className="sm:w-52">
                <Select
                  label="Availability"
                  value={selectedAvailability}
                  onChange={(e) => setAvailabilityDraft(e.target.value as CourseAvailability)}
                  options={AVAILABILITY_OPTIONS}
                />
              </div>
              <Button
                onClick={handleSaveSettings}
                loading={savingSettings}
                disabled={!settingsChanged}
              >
                Save settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit */}
      <Modal open={editOpen} title="Edit Course" onClose={() => setEditOpen(false)}>
        <CourseForm
          mode="edit"
          categories={categories}
          teachers={teachers}
          initial={courseToFormValues(course)}
          onSubmit={handleSaveCourse}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      {/* Approve / publish / unpublish */}
      <ConfirmDialog
        open={pending !== null && !needsReason}
        title={pending ? `${pending.label} course` : ''}
        message={pending ? pending.confirm(course.title) : ''}
        confirmLabel={pending?.label}
        danger={pending?.danger}
        loading={actionLoading}
        onConfirm={() => runStatusChange()}
        onCancel={() => setPending(null)}
      />

      {/* Reject */}
      <RejectDialog
        open={pending !== null && needsReason}
        courseTitle={course.title}
        loading={actionLoading}
        onConfirm={(reason) => runStatusChange(reason)}
        onCancel={() => setPending(null)}
      />

      {/* Delete */}
      <ConfirmDialog
        open={deleteOpen}
        title="Delete course"
        message={`Delete "${course.title}"? This permanently removes the course and its enrollment data. This can't be undone.`}
        confirmLabel="Delete"
        danger
        loading={actionLoading}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}