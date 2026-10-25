import { Outlet } from 'react-router-dom'
import { NavBar } from './NavBar'

/** The frame of every logged-in page: the nav bar, then the page itself. */
export function AppLayout() {
  return (
    <>
      <NavBar />
      <Outlet />
    </>
  )
}
