import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AUTH_CHANGED_EVENT } from './apis/apiClient'
import { getEmployee } from './apis/employeesApi'
import LoginPage from './pages/LoginPage'
import AnalyticsPage from './pages/AnalyticsPage'
import AdminEmployeesPage from './pages/AdminEmployeesPage'
import AuditLogsPage from './pages/AuditLogsPage'
import DepartmentsPage from './pages/DepartmentsPage'
import DirectoryPage from './pages/DirectoryPage'
import ForbiddenPage from './pages/ForbiddenPage'
import HelpPage from './pages/HelpPage'
import HomePage from './pages/HomePage'
import EmployeeProfilePage from './pages/EmployeeProfilePage'
import NotFoundPage from './pages/NotFoundPage'
import OfficesPage from './pages/OfficesPage'
import SettingsPage from './pages/SettingsPage'
import SkillsPage from './pages/SkillsPage'
import { logout, refreshSucceeded, updateAuthenticatedEmployee } from './store/authSlice'

const authenticatedRoutes = {
  '/analytics': AnalyticsPage,
  '/departments': DepartmentsPage,
  '/directory': DirectoryPage,
  '/help': HelpPage,
  '/home': HomePage,
  '/organization': HomePage,
  '/offices': OfficesPage,
  '/profile': SettingsPage,
  '/settings': SettingsPage,
  '/skills': SkillsPage,
}

const adminRoutes = {
  '/admin/employees': AdminEmployeesPage,
  '/admin/audit-logs': AuditLogsPage,
}

function Redirect({ to }) {
  useEffect(() => {
    window.location.replace(to)
  }, [to])

  return null
}

function LoadingSession() {
  return (
    <main className="grid min-h-svh place-items-center bg-slate-50 px-6 text-center">
      <div>
        <p className="text-lg font-bold text-slate-950">
          Restoring your session
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-500">
          Checking your employee profile...
        </p>
      </div>
    </main>
  )
}

function getTokenSubject(token) {
  if (!token) {
    return null
  }

  try {
    const payload = token.split('.')[1]
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decodedPayload = JSON.parse(window.atob(normalizedPayload))

    return decodedPayload.sub || null
  } catch {
    return null
  }
}

function App() {
  const dispatch = useDispatch()
  const { accessToken, employee, refreshToken } = useSelector((state) => state.auth)
  const [isRestoringSession, setIsRestoringSession] = useState(false)
  const path = window.location.pathname
  const hasSession = Boolean(accessToken || refreshToken)
  const needsEmployeeHydration = hasSession && !employee
  const hasPartialEmployee = hasSession && employee && (!employee.first_name || !employee.last_name)
  const isAdmin = employee?.role === 'hr_admin'

  useEffect(() => {
    function handleAuthChanged(event) {
      if (event.detail) {
        dispatch(refreshSucceeded(event.detail))
        return
      }

      dispatch(logout())
    }

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged)

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged)
    }
  }, [dispatch])

  useEffect(() => {
    let isMounted = true

    async function restoreSession() {
      const publicId =
        employee?.public_id ||
        getTokenSubject(accessToken) ||
        getTokenSubject(refreshToken)

      if (!hasSession || !publicId) {
        return
      }

      setIsRestoringSession(true)

      try {
        const fullEmployee = await getEmployee(publicId)

        if (isMounted) {
          dispatch(updateAuthenticatedEmployee(fullEmployee))
        }
      } catch {
        if (isMounted) {
          dispatch(logout())
        }
      } finally {
        if (isMounted) {
          setIsRestoringSession(false)
        }
      }
    }

    if (needsEmployeeHydration || hasPartialEmployee) {
      restoreSession()
    }

    return () => {
      isMounted = false
    }
  }, [
    accessToken,
    dispatch,
    employee,
    hasPartialEmployee,
    hasSession,
    needsEmployeeHydration,
    refreshToken,
  ])

  if (path === '/') {
    return <Redirect to={hasSession ? '/organization' : '/login'} />
  }

  if (path === '/home') {
    return <Redirect to="/organization" />
  }

  if (path === '/settings') {
    return <Redirect to="/profile" />
  }

  if (path === '/audit-logs') {
    return <Redirect to="/admin/audit-logs" />
  }

  if (path === '/login' && hasSession) {
    return <Redirect to="/organization" />
  }

  if (!hasSession) {
    return path === '/login' ? <LoginPage /> : <Redirect to="/login" />
  }

  if (isRestoringSession || needsEmployeeHydration || hasPartialEmployee) {
    return <LoadingSession />
  }

  if (/^\/employees\/[^/]+$/.test(path)) {
    return <EmployeeProfilePage />
  }

  if (path === '/403') {
    return <ForbiddenPage />
  }

  if (path in adminRoutes) {
    const AdminPage = adminRoutes[path]

    return isAdmin ? <AdminPage /> : <ForbiddenPage />
  }

  if (path.startsWith('/admin')) {
    return isAdmin ? <NotFoundPage /> : <ForbiddenPage />
  }

  const ActivePage = authenticatedRoutes[path]

  return ActivePage ? <ActivePage /> : <NotFoundPage />
}

export default App
