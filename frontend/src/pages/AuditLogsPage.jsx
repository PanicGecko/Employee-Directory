import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import AppShell from '../components/AppShell'
import DataState from '../components/DataState'
import PageHeader from '../components/PageHeader'
import { listAuditLogs } from '../apis/auditLogsApi'
import { getApiErrorMessage } from '../utils/apiError'
import { formatRole } from '../utils/employeeUtils'

function formatDate(value) {
  if (!value) {
    return 'Unknown time'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function formatAction(action) {
  return formatRole(action || 'audit event')
}

function formatPerson(name, fallbackId) {
  return name || `Employee #${fallbackId}`
}

function JsonPreview({ title, value }) {
  if (!value || Object.keys(value).length === 0) {
    return null
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words text-xs font-semibold leading-5 text-slate-700">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  )
}

function AuditLogCard({ log }) {
  const actorLabel = formatPerson(log.actor_name, log.actor_employee_id)
  const targetLabel =
    log.target_name || `${formatRole(log.target_type)} #${log.target_id}`

  return (
    <article className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="absolute left-0 top-0 h-full w-1 bg-blue-500" />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-blue-700">
              {log.target_type}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
              Target #{log.target_id}
            </span>
          </div>
          <h2 className="mt-3 text-xl font-bold text-slate-950">
            {formatAction(log.action)}
          </h2>
          <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-600 sm:grid-cols-2">
            <p className="rounded-xl bg-slate-50 px-3 py-2">
              <span className="block text-xs font-bold uppercase tracking-wide text-slate-400">
                Actor
              </span>
              <span className="mt-1 block text-slate-900">{actorLabel}</span>
              <span className="mt-0.5 block text-xs text-slate-400">
                Employee #{log.actor_employee_id}
              </span>
            </p>
            <p className="rounded-xl bg-slate-50 px-3 py-2">
              <span className="block text-xs font-bold uppercase tracking-wide text-slate-400">
                Target
              </span>
              <span className="mt-1 block text-slate-900">{targetLabel}</span>
              <span className="mt-0.5 block text-xs text-slate-400">
                {formatRole(log.target_type)} #{log.target_id}
              </span>
            </p>
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-500">
            {formatDate(log.created_at)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-600">
          Log #{log.id}
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <JsonPreview title="Old values" value={log.old_values} />
        <JsonPreview title="New values" value={log.new_values} />
      </div>
    </article>
  )
}

function ForbiddenAuditLogs() {
  return (
    <AppShell currentPath="/admin/audit-logs">
      <div className="mt-3 min-h-0 flex-1 overflow-visible lg:mt-5 lg:overflow-y-auto">
        <PageHeader
          title="Audit Logs"
          subtitle="Administrative history for employee directory changes."
        />
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
          <h2 className="text-lg font-bold">Admin access required</h2>
          <p className="mt-2 text-sm font-semibold">
            Audit logs are only available to HR admins.
          </p>
        </div>
      </div>
    </AppShell>
  )
}

function AuditLogsPage() {
  const currentEmployee = useSelector((state) => state.auth.employee)
  const isAdmin = currentEmployee?.role === 'hr_admin'
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20 })
  const [logsState, setLogsState] = useState({
    error: '',
    items: [],
    page: 1,
    pageSize: 20,
    status: 'idle',
    total: 0,
  })
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(logsState.total / logsState.pageSize)),
    [logsState.pageSize, logsState.total],
  )

  useEffect(() => {
    let isMounted = true

    async function loadLogs() {
      setLogsState((current) => ({
        ...current,
        error: '',
        status: 'loading',
      }))

      try {
        const data = await listAuditLogs({
          page: pagination.page,
          page_size: pagination.pageSize,
        })

        if (isMounted) {
          setLogsState({
            error: '',
            items: data.items || [],
            page: data.page || pagination.page,
            pageSize: data.page_size || pagination.pageSize,
            status: 'succeeded',
            total: data.total || 0,
          })
        }
      } catch (error) {
        if (isMounted) {
          setLogsState((current) => ({
            ...current,
            error: getApiErrorMessage(error, 'Unable to load audit logs.'),
            items: [],
            status: 'failed',
            total: 0,
          }))
        }
      }
    }

    if (isAdmin) {
      loadLogs()
    }

    return () => {
      isMounted = false
    }
  }, [isAdmin, pagination])

  if (!isAdmin) {
    return <ForbiddenAuditLogs />
  }

  return (
    <AppShell currentPath="/admin/audit-logs">
      <div className="mt-3 min-h-0 flex-1 overflow-visible lg:mt-5 lg:overflow-y-auto">
        <PageHeader
          title="Audit Logs"
          subtitle="A readable trail of changes made across employees, departments, offices, and skills."
        />

        {logsState.status === 'succeeded' ? (
          <section className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Total logs
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-950">
                {logsState.total}
              </p>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                Current page
              </p>
              <p className="mt-1 text-2xl font-bold text-blue-800">
                {logsState.page}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Page size
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-700">
                {logsState.pageSize}
              </p>
            </div>
          </section>
        ) : null}

        <div className="mt-5">
          <DataState
            error={logsState.error}
            isEmpty={
              logsState.status === 'succeeded' && logsState.items.length === 0
            }
            isLoading={logsState.status === 'loading'}
            loadingText="Loading audit logs..."
            emptyText="No audit logs have been recorded yet."
          />

          {logsState.status === 'succeeded' && logsState.items.length > 0 ? (
            <div className="grid gap-4">
              {logsState.items.map((log) => (
                <AuditLogCard key={log.id} log={log} />
              ))}
            </div>
          ) : null}
        </div>

        {logsState.status === 'succeeded' && logsState.total > 0 ? (
          <section className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-600 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p>
              Page {logsState.page} of {totalPages}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-3 py-2 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={logsState.page <= 1}
                onClick={() =>
                  setPagination((current) => ({
                    ...current,
                    page: Math.max(1, current.page - 1),
                  }))
                }
              >
                Previous
              </button>
              <button
                type="button"
                className="rounded-xl border border-slate-200 px-3 py-2 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={logsState.page >= totalPages}
                onClick={() =>
                  setPagination((current) => ({
                    ...current,
                    page: Math.min(totalPages, current.page + 1),
                  }))
                }
              >
                Next
              </button>
              <select
                className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                value={pagination.pageSize}
                onChange={(event) =>
                  setPagination({
                    page: 1,
                    pageSize: Number(event.target.value),
                  })
                }
              >
                {[10, 20, 50, 100].map((pageSize) => (
                  <option key={pageSize} value={pageSize}>
                    {pageSize} per page
                  </option>
                ))}
              </select>
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  )
}

export default AuditLogsPage
