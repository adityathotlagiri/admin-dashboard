import { useState } from 'react'
import { Check, Pencil, Plus } from 'lucide-react'
import { useAsync } from '../../hooks/useAsync'
import { useToast } from '../../context/ToastContext'
import { createPlan, getPlans, setPlanActive, updatePlan } from '../../data/subscriptions'
import type { Plan, PlanFormValues } from '../../types'
import { formatCurrency, formatNumber } from '../../utils/format'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'
import Modal from '../ui/Modal'
import { ErrorState, LoadingState } from '../ui/States'
import PlanForm from './PlanForm'
import { cycleUnit, planToFormValues } from './subscriptionHelpers'

type FormState = { mode: 'create' } | { mode: 'edit'; plan: Plan } | null

export default function PlansTab({ onChanged }: { onChanged: () => void }) {
  const toast = useToast()
  const { data, error, reload } = useAsync(() => getPlans())

  const [formState, setFormState] = useState<FormState>(null)
  const [toggling, setToggling] = useState<Plan | null>(null)
  const [toggleLoading, setToggleLoading] = useState(false)

  const handleSave = async (values: PlanFormValues) => {
    if (formState?.mode === 'edit') {
      await updatePlan(formState.plan.id, values)
      toast.success('Plan updated successfully')
    } else {
      await createPlan(values)
      toast.success('Plan created successfully')
    }
    setFormState(null)
    reload()
    onChanged()
  }

  const handleToggle = async () => {
    if (!toggling) return
    setToggleLoading(true)
    try {
      await setPlanActive(toggling.id, !toggling.isActive)
      toast.success(`${toggling.name} plan ${toggling.isActive ? 'deactivated' : 'activated'}`)
      setToggling(null)
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update plan')
    } finally {
      setToggleLoading(false)
    }
  }

  if (error) return <ErrorState message={error} onRetry={reload} />
  if (!data) return <LoadingState label="Loading plans..." />

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">{data.length} subscription plans</p>
        <Button onClick={() => setFormState({ mode: 'create' })}>
          <Plus size={16} />
          Add Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {data.map((plan) => (
          <div
            key={plan.id}
            className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">{plan.name}</h3>
              <Badge tone={plan.isActive ? 'green' : 'gray'}>
                {plan.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <p className="text-3xl font-semibold text-gray-900">
              {formatCurrency(plan.price)}
              <span className="text-sm font-normal text-gray-400">/{cycleUnit[plan.billingCycle]}</span>
            </p>
            <p className="mt-2 text-sm text-gray-500">{plan.description}</p>

            <ul className="my-4 flex-1 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                  <Check size={16} className="mt-0.5 shrink-0 text-brand" />
                  {feature}
                </li>
              ))}
            </ul>

            <p className="mb-3 text-xs text-gray-400">
              {formatNumber(plan.subscribers)} active subscribers
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setFormState({ mode: 'edit', plan })}
              >
                <Pencil size={14} />
                Edit
              </Button>
              <Button
                variant={plan.isActive ? 'ghost' : 'primary'}
                className="flex-1"
                onClick={() => setToggling(plan)}
              >
                {plan.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={formState !== null}
        title={formState?.mode === 'edit' ? 'Edit Plan' : 'Add New Plan'}
        onClose={() => setFormState(null)}
      >
        {formState && (
          <PlanForm
            mode={formState.mode}
            initial={formState.mode === 'edit' ? planToFormValues(formState.plan) : undefined}
            onSubmit={handleSave}
            onCancel={() => setFormState(null)}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={toggling !== null}
        title={toggling?.isActive ? 'Deactivate plan' : 'Activate plan'}
        message={
          toggling
            ? toggling.isActive
              ? `Deactivate the ${toggling.name} plan? Existing subscribers keep their access, but new users can't choose it.`
              : `Activate the ${toggling.name} plan? New users will be able to choose it.`
            : ''
        }
        confirmLabel={toggling?.isActive ? 'Deactivate' : 'Activate'}
        danger={toggling?.isActive}
        loading={toggleLoading}
        onConfirm={handleToggle}
        onCancel={() => setToggling(null)}
      />
    </div>
  )
}