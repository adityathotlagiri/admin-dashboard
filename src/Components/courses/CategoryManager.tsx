import { useState, type FormEvent } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import { addCategory, addSubject, deleteCategory, removeSubject } from '../../data/courses'
import type { CourseCategory } from '../../types'
import Button from '../ui/Button'
import ConfirmDialog from '../ui/ConfirmDialog'

interface Props {
  categories: CourseCategory[]
  onChanged: () => void
}

export default function CategoryManager({ categories, onChanged }: Props) {
  const toast = useToast()
  const [newCategory, setNewCategory] = useState('')
  const [subjectDrafts, setSubjectDrafts] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [toDelete, setToDelete] = useState<CourseCategory | null>(null)

  const run = async (fn: () => Promise<void>, successMessage: string) => {
    setBusy(true)
    try {
      await fn()
      toast.success(successMessage)
      onChanged()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const handleAddCategory = (e: FormEvent) => {
    e.preventDefault()
    run(async () => {
      await addCategory(newCategory)
      setNewCategory('')
    }, 'Category added')
  }

  const handleAddSubject = (e: FormEvent, category: CourseCategory) => {
    e.preventDefault()
    run(async () => {
      await addSubject(category.id, subjectDrafts[category.id] ?? '')
      setSubjectDrafts((prev) => ({ ...prev, [category.id]: '' }))
    }, 'Subject added')
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    const target = toDelete
    await run(() => deleteCategory(target.id), 'Category deleted')
    setToDelete(null)
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleAddCategory} className="flex gap-2">
        <input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category name"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <Button type="submit" disabled={busy || !newCategory.trim()}>
          <Plus size={16} />
          Add
        </Button>
      </form>

      <ul className="space-y-3">
        {categories.map((category) => (
          <li key={category.id} className="rounded-lg border border-gray-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900">{category.name}</p>
              <button
                title="Delete category"
                onClick={() => setToDelete(category)}
                disabled={busy}
                className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-600"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              {category.subjects.length === 0 && (
                <span className="text-xs text-gray-400">No subjects yet</span>
              )}
              {category.subjects.map((subject) => (
                <span
                  key={subject}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-hover"
                >
                  {subject}
                  <button
                    title={`Remove ${subject}`}
                    onClick={() => run(() => removeSubject(category.id, subject), 'Subject removed')}
                    disabled={busy}
                    className="rounded-full hover:text-red-600"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>

            <form onSubmit={(e) => handleAddSubject(e, category)} className="flex gap-2">
              <input
                value={subjectDrafts[category.id] ?? ''}
                onChange={(e) =>
                  setSubjectDrafts((prev) => ({ ...prev, [category.id]: e.target.value }))
                }
                placeholder="Add a subject"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <Button
                type="submit"
                variant="outline"
                className="px-3 py-1.5"
                disabled={busy || !(subjectDrafts[category.id] ?? '').trim()}
              >
                Add
              </Button>
            </form>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete category"
        message={
          toDelete
            ? `Delete "${toDelete.name}" and all of its subjects? This only works if no courses use it.`
            : ''
        }
        confirmLabel="Delete"
        danger
        loading={busy}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}