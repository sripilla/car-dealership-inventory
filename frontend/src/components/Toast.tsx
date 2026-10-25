import type { ToastMessage } from '../lib/useToast'

/**
 * A message in the bottom corner. Success uses role="status" (read out
 * politely); an error uses role="alert" (read out straight away).
 */
export function Toast({ toast, onDismiss }: { toast: ToastMessage | null; onDismiss: () => void }) {
  if (toast === null) return null
  const success = toast.kind === 'success'

  return (
    <div
      role={success ? 'status' : 'alert'}
      className="fixed inset-x-4 bottom-4 z-50 flex items-center gap-3 rounded-full bg-ink px-5 py-3 text-sm text-cream shadow-lg sm:inset-x-auto sm:right-6 sm:bottom-6"
    >
      <span
        aria-hidden="true"
        className={`grid size-7 shrink-0 place-items-center rounded-full ${
          success ? 'bg-sage-dark' : 'bg-danger'
        }`}
      >
        {success ? '✓' : '!'}
      </span>
      <span className="flex-1">{toast.text}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss" className="px-1 text-cream/70 hover:text-cream">
        ×
      </button>
    </div>
  )
}
