import { useEffect, useState, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  confirmLabel: string
  onConfirm: () => void
  className?: string
}

/** A button that needs a second click within a few seconds, for destructive actions. */
export function ConfirmButton({ children, confirmLabel, onConfirm, className = 'button' }: Props) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const timeout = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(timeout)
  }, [armed])

  return (
    <button
      className={`${className}${armed ? ' danger' : ''}`}
      onClick={() => {
        if (armed) {
          setArmed(false)
          onConfirm()
        } else setArmed(true)
      }}
    >
      {armed ? confirmLabel : children}
    </button>
  )
}
