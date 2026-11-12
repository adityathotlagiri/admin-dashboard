import { useState, type FormEvent } from 'react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import Textarea from '../ui/Textarea'

interface Props {
  open: boolean
  courseTitle: string
  loading?: boolean
  onConfirm: (reason: string) => void
  onCancel: () => void
}

function RejectForm({
  courseTitle,
  loading,
  onConfirm,
  onCancel,
}: Omit<Props, 'open'>) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (reason.trim().length < 5) {
      setError('Please give a reason (at least 5 characters)')
      return
    }
    onConfirm(reason.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <p className="text-sm text-gray-600">
        Reject <span className="font-medium text-gray-900">"{courseTitle}"</span>? The teacher
        will see your reason.
      </p>
      <Textarea
        label="Reason for rejection"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        error={error}
        placeholder="e.g. Lesson plan is incomplete"
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="danger" loading={loading}>
          Reject course
        </Button>
      </div>
    </form>
  )
}

export default function RejectDialog({ open, ...rest }: Props) {
  return (
    <Modal open={open} title="Reject course" onClose={rest.onCancel}>
      <RejectForm {...rest} />
    </Modal>
  )
}