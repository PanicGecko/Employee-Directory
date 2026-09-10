import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  accountNavItems,
  adminNavItems,
  mainNavItems,
} from '../constants/navigation'
import { logoutSession } from '../store/thunks/authThunks'
import { getEmployeeInitials, getEmployeeName } from '../utils/employeeUtils'
import HomeSidebar from './HomeSidebar'

function MobileNavLink({ href, label, currentPath, onClick }) {
  const active = currentPath === href

  return (
    <a
      href={href}
      className={`flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold transition ${
        active
          ? 'bg-blue-50 text-blue-600'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
      }`}
      onClick={onClick}
    >
      <span>{label}</span>
      <span
        className={`h-2.5 w-2.5 rounded-full ${
          active ? 'bg-blue-600' : 'bg-slate-300'
        }`}
      />
    </a>
  )
}

function AppShell({ children, currentPath }) {
  const dispatch = useDispatch()
  const employee = useSelector((state) => state.auth.employee)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const isAdmin = employee?.role === 'hr_admin'

  async function handleLogout() {
    await dispatch(logoutSession())
    window.location.href = '/login'
  }

  return (
    <main className="min-h-svh overflow-x-hidden bg-slate-50 p-2 text-slate-950 sm:p-4 lg:h-svh lg:overflow-hidden">
      <div className="mx-auto flex min-h-[calc(100svh-1rem)] w-full max-w-[1850px] gap-3 sm:min-h-[calc(100svh-2rem)] lg:h-full lg:min-h-0">
        <HomeSidebar currentPath={currentPath} />

        <section className="relative flex min-h-0 min-w-0 flex-1 flex-col rounded-2xl border border-slate-200 bg-white/75 p-3 shadow-sm sm:rounded-3xl sm:p-4">
          <header className="sticky top-2 z-20 mb-3 flex shrink-0 items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-sm backdrop-blur lg:hidden">
            <button
              type="button"
              className="inline-flex h-10 w-10 flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-blue-200 hover:text-blue-600 lg:hidden"
              aria-expanded={isMobileNavOpen}
              aria-label={
                isMobileNavOpen ? 'Close navigation menu' : 'Open navigation menu'
              }
              onClick={() => setIsMobileNavOpen((isOpen) => !isOpen)}
            >
              <span
                className={`h-0.5 w-4 rounded-full bg-current transition ${
                  isMobileNavOpen ? 'translate-y-2 rotate-45' : ''
                }`}
              />
              <span
                className={`h-0.5 w-4 rounded-full bg-current transition ${
                  isMobileNavOpen ? 'opacity-0' : ''
                }`}
              />
              <span
                className={`h-0.5 w-4 rounded-full bg-current transition ${
                  isMobileNavOpen ? '-translate-y-2 -rotate-45' : ''
                }`}
              />
            </button>
            <p className="ml-auto text-sm font-bold text-slate-700">Menu</p>
          </header>

          {isMobileNavOpen ? (
            <div className="z-10 mb-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:hidden">
              <nav className="space-y-1" aria-label="Mobile primary navigation">
                {mainNavItems.map((item) => (
                  <MobileNavLink
                    key={item.href}
                    currentPath={currentPath}
                    href={item.href}
                    label={item.label}
                    onClick={() => setIsMobileNavOpen(false)}
                  />
                ))}
              </nav>

              {isAdmin ? (
                <div className="mt-3 border-t border-slate-200 pt-3">
                  <p className="px-4 text-xs font-bold uppercase tracking-wide text-slate-400">
                    Admin
                  </p>
                  <nav className="mt-1 space-y-1" aria-label="Mobile admin navigation">
                    {adminNavItems.map((item) => (
                      <MobileNavLink
                        key={item.href}
                        currentPath={currentPath}
                        href={item.href}
                        label={item.label}
                        onClick={() => setIsMobileNavOpen(false)}
                      />
                    ))}
                  </nav>
                </div>
              ) : null}

              <div className="mt-3 border-t border-slate-200 pt-3">
                {accountNavItems.map((item) => (
                  <MobileNavLink
                    key={item.href}
                    currentPath={currentPath}
                    href={item.href}
                    label={item.label}
                    onClick={() => setIsMobileNavOpen(false)}
                  />
                ))}
              </div>

              <div className="mt-3 rounded-2xl bg-slate-50 p-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    {employee ? getEmployeeInitials(employee) : 'ED'}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-950">
                      {employee ? getEmployeeName(employee) : 'Employee Directory'}
                    </p>
                    <p className="text-xs font-medium capitalize text-slate-500">
                      {employee?.role
                        ? employee.role.replace('_', ' ')
                        : 'Signed in'}
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
          ) : null}

          {children}
        </section>
      </div>
    </main>
  )
}

export default AppShell
