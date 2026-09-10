import { useDispatch, useSelector } from 'react-redux'
import {
  accountNavItems,
  adminNavItems,
  mainNavItems,
} from '../constants/navigation'
import { logoutSession } from '../store/thunks/authThunks'
import { getEmployeeInitials, getEmployeeName } from '../utils/employeeUtils'
import BrandLogo from './BrandLogo'

function SidebarLink({ href, label, currentPath }) {
  const active = currentPath === href

  return (
    <a
      href={href}
      className={`flex items-center gap-4 rounded-xl px-4 py-3 text-base font-medium transition ${
        active
          ? 'bg-blue-50 text-blue-600'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <span className="grid h-6 w-6 place-items-center">
        <span
          className={`h-2.5 w-2.5 rounded-full ${
            active ? 'bg-blue-600' : 'bg-slate-300'
          }`}
        />
      </span>
      {label}
    </a>
  )
}

function HomeSidebar({ currentPath = '/organization' }) {
  const dispatch = useDispatch()
  const employee = useSelector((state) => state.auth.employee)
  const isAdmin = employee?.role === 'hr_admin'

  async function handleLogout() {
    await dispatch(logoutSession())
    window.location.href = '/login'
  }

  return (
    <aside className="hidden w-56 shrink-0 rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-sm shadow-slate-200/70 lg:flex lg:min-h-full lg:flex-col">
      <BrandLogo compact />

      <nav className="mt-10 space-y-2" aria-label="Primary navigation">
        {mainNavItems.map((item) => (
          <SidebarLink
            key={item.href}
            currentPath={currentPath}
            href={item.href}
            label={item.label}
          />
        ))}
      </nav>

      {isAdmin ? (
        <div className="mt-8 border-t border-slate-200 pt-5">
          <p className="px-4 text-xs font-bold uppercase tracking-wide text-slate-400">
            Admin
          </p>
          <nav className="mt-2 space-y-2" aria-label="Admin navigation">
            {adminNavItems.map((item) => (
              <SidebarLink
                key={item.href}
                currentPath={currentPath}
                href={item.href}
                label={item.label}
              />
            ))}
          </nav>
        </div>
      ) : null}

      <div className="mt-auto space-y-2 border-t border-slate-200 pt-5">
        {accountNavItems.map((item) => (
          <SidebarLink
            key={item.href}
            currentPath={currentPath}
            href={item.href}
            label={item.label}
          />
        ))}
        <div className="rounded-2xl bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blue-600 text-sm font-bold text-white">
              {employee ? getEmployeeInitials(employee) : 'ED'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-slate-950">
                {employee ? getEmployeeName(employee) : 'Employee Directory'}
              </p>
              <p className="text-xs font-medium capitalize text-slate-500">
                {employee?.role ? employee.role.replace('_', ' ') : 'Signed in'}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}

export default HomeSidebar
