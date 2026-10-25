import { useCallback, useEffect, useRef, useState } from 'react'

export interface ToastMessage {
  kind: 'success' | 'error'
  text: string
}

const SHOW_FOR_MS = 4000

/** One toast at a time; a new one replaces the old and restarts the timer. */
export function useToast() {
  const [toast, setToast] = useState<ToastMessage | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const dismiss = useCallback(() => {
    clearTimeout(timer.current)
    setToast(null)
  }, [])

  const showToast = useCallback((kind: ToastMessage['kind'], text: string) => {
    clearTimeout(timer.current)
    setToast({ kind, text })
    timer.current = setTimeout(() => setToast(null), SHOW_FOR_MS)
  }, [])

  // Don't fire the timer after the page has gone.
  useEffect(() => () => clearTimeout(timer.current), [])

  return { toast, showToast, dismiss }
}
