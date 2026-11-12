import { useState, type FormEvent } from 'react'
import { BILLING_OPTIONS, type BillingCycle, type PlanFormValues } from '../../types'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Select from '../ui/Select'
import Textarea from '../ui/Textarea'

interface Props {
  mode: 'create' | 'edit'
  initial?: PlanFormValues
  onSubmit: (values: PlanFormValues) => Promise<void>
  onCancel: () => void
}

const emptyValues: PlanFormValues = {
  name: '',
  description: '',
  price: '',
  billingCycle: 'monthly',
  featuresText: '',
  isActive: true,
}

type Errors = Partial<Record<keyof PlanFormValues, string>>

export default function PlanForm({ mode, initial, onSubmit, onCancel }: Props) {
  const [values, setValues] = useState<PlanFormValues>(initial ?? emptyValues)
  const [errors, setErrors] = useState<Errors>({})
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const setField = <K extends keyof PlanFormValues>(key: K, value: PlanFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const validate = () => {
    const next: Errors = {}

    if (!values.name.trim()) next.name = 'Plan name is required'
    else if (values.name.trim().length < 2) next.name = 'Name must be at least 2 characters'

    if (!values.description.trim()) next.description = 'Description is required'

    const price = Number(values.price)
    if (values.price.trim() === '' || Number.isNaN(price) || price < 0) {
      next.price = 'Enter a price of 0 or more'
    }

    if (!values.featuresText.split('\n').some((line) => line.trim())) {
      next.featuresText = 'Add at least one feature'
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
        label="Plan name"
        value={values.name}
        onChange={(e) => setField('name', e.target.value)}
        error={errors.name}
        placeholder="e.g. Pro"
      />

      <Textarea
        label="Description"
        rows={2}
        value={values.description}
        onChange={(e) => setField('description', e.target.value)}
        error={errors.description}
        placeholder="Short summary shown to students"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Price (USD)"
          type="number"
          min="0"
          step="any"
          value={values.price}
          onChange={(e) => setField('price', e.target.value)}
          error={errors.price}
        />
        <Select
          label="Billing cycle"
          value={values.billingCycle}
          onChange={(e) => setField('billingCycle', e.target.value as BillingCycle)}
          options={BILLING_OPTIONS}
        />
      </div>

      <Textarea
        label="Features (one per line)"
        value={values.featuresText}
        onChange={(e) => setField('featuresText', e.target.value)}
        error={errors.featuresText}
        placeholder={'All courses unlocked\nUnlimited AI tutor'}
      />

      <label className="flex items-start gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(e) => setField('isActive', e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-brand"
        />
        <span>
          Plan is active
          <span className="block text-xs text-gray-400">
            Inactive plans can't be bought by new subscribers.
          </span>
        </span>
      </label>

      {serverError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{serverError}</p>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {mode === 'edit' ? 'Save changes' : 'Create plan'}
        </Button>
      </div>
    </form>
  )
}