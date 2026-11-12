import { useState, type FormEvent } from 'react'
import {
  AVAILABILITY_OPTIONS,
  VISIBILITY_OPTIONS,
  type CourseAvailability,
  type CourseCategory,
  type CourseFormValues,
  type CourseVisibility,
  type Teacher,
} from '../../types'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Textarea from '../ui/Textarea'

interface Props {
  mode: 'create' | 'edit'
  categories: CourseCategory[]
  teachers: Teacher[]
  initial?: CourseFormValues
  onSubmit: (values: CourseFormValues) => Promise<void>
  onCancel: () => void
}

type Errors = Partial<Record<keyof CourseFormValues, string>>

function defaultValues(categories: CourseCategory[], teachers: Teacher[]): CourseFormValues {
  return {
    title: '',
    description: '',
    category: categories[0]?.name ?? '',
    subject: categories[0]?.subjects[0] ?? '',
    teacherId: teachers[0]?.id ?? '',
    price: '0',
    visibility: 'public',
    availability: 'open',
    publishNow: false,
  }
}

export default function CourseForm({
  mode,
  categories,
  teachers,
  initial,
  onSubmit,
  onCancel,
}: Props) {
  const [values, setValues] = useState<CourseFormValues>(
    initial ?? defaultValues(categories, teachers),
  )
  const [errors, setErrors] = useState<Errors>({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const setField = <K extends keyof CourseFormValues>(key: K, value: CourseFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleCategoryChange = (name: string) => {
    const category = categories.find((c) => c.name === name)
    setValues((prev) => ({
      ...prev,
      category: name,
      subject: category?.subjects[0] ?? '',
    }))
  }

  const subjects = categories.find((c) => c.name === values.category)?.subjects ?? []
  const subjectOptions =
    subjects.length > 0
      ? subjects.map((s) => ({ value: s, label: s }))
      : [{ value: '', label: 'No subjects available' }]

  const validate = () => {
    const next: Errors = {}

    if (!values.title.trim()) next.title = 'Title is required'
    else if (values.title.trim().length < 3) next.title = 'Title must be at least 3 characters'

    if (!values.description.trim()) next.description = 'Description is required'
    else if (values.description.trim().length < 10) {
      next.description = 'Description must be at least 10 characters'
    }

    if (!values.category) next.category = 'Choose a category'
    if (!values.subject) next.subject = 'Choose a subject (add one in Manage categories)'
    if (!values.teacherId) next.teacherId = 'Assign a teacher'

    const price = Number(values.price)
    if (values.price.trim() === '' || Number.isNaN(price) || price < 0) {
      next.price = 'Enter a price of 0 or more'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setServerError('')
    if (!validate()) return

    setSubmitting(true)
    try {
      await onSubmit(values)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <Input
        label="Course title"
        value={values.title}
        onChange={(e) => setField('title', e.target.value)}
        error={errors.title}
        placeholder="e.g. Python Fundamentals"
      />

      <Textarea
        label="Description"
        value={values.description}
        onChange={(e) => setField('description', e.target.value)}
        error={errors.description}
        placeholder="What will students learn?"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Select
            label="Category"
            value={values.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            options={categories.map((c) => ({ value: c.name, label: c.name }))}
          />
          {errors.category && <p className="mt-1 text-xs text-red-600">{errors.category}</p>}
        </div>
        <div>
          <Select
            label="Subject"
            value={values.subject}
            onChange={(e) => setField('subject', e.target.value)}
            options={subjectOptions}
          />
          {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <Select
            label="Assigned teacher"
            value={values.teacherId}
            onChange={(e) => setField('teacherId', e.target.value)}
            options={teachers.map((t) => ({ value: t.id, label: t.name }))}
          />
          {errors.teacherId && <p className="mt-1 text-xs text-red-600">{errors.teacherId}</p>}
        </div>
        <Input
          label="Price (USD)"
          type="number"
          min="0"
          step="any"
          value={values.price}
          onChange={(e) => setField('price', e.target.value)}
          error={errors.price}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Visibility"
          value={values.visibility}
          onChange={(e) => setField('visibility', e.target.value as CourseVisibility)}
          options={VISIBILITY_OPTIONS}
        />
        <Select
          label="Availability"
          value={values.availability}
          onChange={(e) => setField('availability', e.target.value as CourseAvailability)}
          options={AVAILABILITY_OPTIONS}
        />
      </div>

      {mode === 'create' && (
        <label className="flex items-start gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={values.publishNow}
            onChange={(e) => setField('publishNow', e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-brand"
          />
          <span>
            Publish immediately
            <span className="block text-xs text-gray-400">
              Otherwise the course is saved as a draft.
            </span>
          </span>
        </label>
      )}

      {serverError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {mode === 'edit' ? 'Save changes' : 'Create course'}
        </Button>
      </div>
    </form>
  )
}