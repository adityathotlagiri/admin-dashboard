import { useState, type FormEvent } from 'react'
import { ROLE_OPTIONS, type Role, type UserFormValues } from '../../types'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'

interface Props {
  initial?: UserFormValues
  submitLabel: string
  onSubmit: (values: UserFormValues) => Promise<void>
  onCancel: () => void
}

const emptyValues: UserFormValues = { name: '', email: '', phone: '', role: 'student' }

type Errors = Partial<Record<keyof UserFormValues, string>>

export default function UserForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<UserFormValues>(initial ?? emptyValues)
  const [errors, setErrors] = useState<Errors>({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const setField = <K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const validate = () => {
    const next: Errors = {}

    if (!values.name.trim()) next.name = 'Name is required'
    else if (values.name.trim().length < 2) next.name = 'Name must be at least 2 characters'

    if (!values.email.trim()) next.email = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) next.email = 'Enter a valid email'

    if (values.phone.trim() && !/^[+\d][\d\s-]{6,17}$/.test(values.phone.trim())) {
      next.phone = 'Enter a valid phone number'
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
        label="Full name"
        value={values.name}
        onChange={(e) => setField('name', e.target.value)}
        error={errors.name}
        placeholder="e.g. Priya Sharma"
      />
      <Input
        label="Email"
        type="email"
        value={values.email}
        onChange={(e) => setField('email', e.target.value)}
        error={errors.email}
        placeholder="name@example.com"
      />
      <Input
        label="Phone (optional)"
        value={values.phone}
        onChange={(e) => setField('phone', e.target.value)}
        error={errors.phone}
        placeholder="+91 98765 43210"
      />
      <Select
        label="Role"
        value={values.role}
        onChange={(e) => setField('role', e.target.value as Role)}
        options={ROLE_OPTIONS}
      />

      {serverError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}