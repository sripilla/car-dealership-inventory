// React Router pieces:
// - BrowserRouter: watches the browser URL and makes routing available to the app.
// - Routes: picks the ONE best-matching <Route> for the current URL.
// - Route: maps a URL path to a component.
// - Navigate: when rendered, redirects to another URL.
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

// Shared layout (the nav bar) shown around every logged-in page.
import { AppLayout } from './components/AppLayout'

// Holds the logged-in user and token in React context, so any component
// can read them (via a hook) without passing props down many levels.
import { AuthProvider } from './context/AuthProvider'

// The page components (one per screen).
import { AdminPage } from './pages/AdminPage'
import { DashboardPage } from './pages/DashboardPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'

// Route guards: they decide whether the child routes may be shown.
// If allowed, they render <Outlet /> (the child route).
// If not, they redirect with <Navigate />.
import { AdminRoute } from './routes/AdminRoute'
import { ProtectedRoute } from './routes/ProtectedRoute'

/**
 * The single-page app: one HTML page, with React Router choosing which
 * page component to show for the URL.
 */
function App() {
  return (
    // AuthProvider is the outermost wrapper so EVERYTHING inside
    // (guards, nav bar, pages) can read who is logged in.
    // Note: it sits outside BrowserRouter, so AuthProvider itself
    // cannot use router hooks like useNavigate.
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes: no login needed. */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* "Layout route": it has no path, it only wraps its children.
              ProtectedRoute checks for a logged-in user:
              - logged in  -> renders <Outlet /> (the nested routes)
              - logged out -> redirects to /login */}
          <Route element={<ProtectedRoute />}>
            {/* The nav bar (AppLayout) wraps every logged-in page.
                AppLayout renders the nav, then <Outlet /> for the page. */}
            <Route element={<AppLayout />}>
              {/* "/" = the dashboard: list, search and purchase vehicles. */}
              <Route path="/" element={<DashboardPage />} />
            </Route>
          </Route>

          {/* Same pattern, but a stricter guard:
              AdminRoute only lets admins through.
              Others are redirected (to /login if logged out). */}
          <Route element={<AdminRoute />}>
            <Route element={<AppLayout />}>
              {/* Admin-only screen: add, update, delete and restock vehicles. */}
              <Route path="/admin" element={<AdminPage />} />
            </Route>
          </Route>

          {/* Unknown URLs go home (and from there to /login if logged out).
              "*" matches any path not matched above.
              "replace" swaps the bad URL out of browser history,
              so the Back button doesn't land on it again. */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

// Default export so main.tsx can do: import App from './App'
export default App