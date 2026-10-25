import { Link } from 'react-router-dom'

/** The Forecourt mark and name, linking home. */
export function Logo() {
  return (
    <Link to="/" className="inline-flex items-center gap-3 font-display text-xl text-ink">
      <span aria-hidden="true" className="grid size-9 place-items-center rounded-full bg-terracotta">
        <CarIcon className="size-5 text-cream" />
      </span>
      Forecourt
    </Link>
  )
}

/** A simple outline car, used in the logo and on vehicle cards. */
export function CarIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 16v-3.2a2 2 0 0 1 .6-1.4L6 9l1.6-2.4A2 2 0 0 1 9.3 5.7h4.6a2 2 0 0 1 1.5.7L18 9.5l1.9.6a1.6 1.6 0 0 1 1.1 1.5V16a1 1 0 0 1-1 1h-1" />
      <path d="M9 17h6" />
      <path d="M5 17H4a1 1 0 0 1-1-1" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  )
}
