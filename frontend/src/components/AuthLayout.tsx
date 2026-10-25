import type { ReactNode } from 'react'
import { Logo } from './Logo'

/**
 * The split layout of the login and register pages: the form on the left,
 * a decorative sage panel on the right (hidden on small screens).
 */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <main className="flex flex-col px-6 py-10 sm:px-16">
        <Logo />
        <div className="my-auto w-full max-w-md py-12">{children}</div>
      </main>

      <aside
        aria-hidden="true"
        className="relative m-6 hidden overflow-hidden rounded-[2rem] bg-sage-tint lg:block"
      >
        <div className="absolute -top-24 -right-24 size-[26rem] rounded-full bg-sage" />
        <div className="absolute bottom-20 left-14 size-72 rounded-full bg-peach" />
        <p className="absolute bottom-12 left-12 max-w-md font-display text-4xl leading-tight text-sage-dark">
          Every car on the lot, one click from yours.
        </p>
      </aside>
    </div>
  )
}
