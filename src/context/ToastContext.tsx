import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, X, XCircle } from 'lucide-react'

type ToastType = 'success' | 'error'

interface Toast {
  id: number
  type: ToastType
  message: string
}

interface ToastContextValue {
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (type: ToastType, message: string) => {
      const id = nextId.current++
      setToasts((prev) => [...prev, { id, type, message }])
      setTimeout(() => dismiss(id), 3500)
    },
    [dismiss],
  )

  const value: ToastContextValue = {
    success: (message) => push('success', message),
    error: (message) => push('error', message),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-4 z-[60] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-lg border bg-white p-3 shadow-lg ${
              toast.type === 'success' ? 'border-brand/30' : 'border-red-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-brand" />
            ) : (
              <XCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
            )}
            <p className="flex-1 text-sm text-gray-800">{toast.message}</p>
            <button
              onClick={() => dismiss(toast.id)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}