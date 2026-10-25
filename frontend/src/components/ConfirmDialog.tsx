import { useEffect, useRef, type ReactNode } from 'react'

interface ConfirmDialogProps {
  title: string
  children: ReactNode
  confirmLabel: string
  cancelLabel: string
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

/**
 * A modal question with two answers. Focus starts on the safe answer, and
 * Escape cancels, so a stray Enter key never deletes anything.
 */
export function ConfirmDialog({
  title,
  children,
  confirmLabel,
  cancelLabel,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelButton.current?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onCancel])

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/40 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-md rounded-[2rem] bg-sand p-7 shadow-xl"
      >
        <h2 id="confirm-title" className="font-display text-2xl">
          {title}
        </h2>
        <div className="mt-3 text-sm leading-relaxed">{children}</div>
        <div className="mt-6 flex justify-end gap-3">
          <button ref={cancelButton} type="button" onClick={onCancel} className="btn-secondary">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="btn-primary bg-terracotta-dark py-2.5"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
