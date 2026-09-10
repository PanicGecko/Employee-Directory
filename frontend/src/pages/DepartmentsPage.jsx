import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AppShell from '../components/AppShell'
import DataState from '../components/DataState'
import Field from '../components/Field'
import PageHeader from '../components/PageHeader'
import {
  loadDepartments,
  removeDepartment,
  saveDepartment,
} from '../store/thunks/directoryThunks'

const emptyDepartment = { description: '', name: '' }

function getMessageTone(message) {
  if (!message) {
    return 'info'
  }

  return /unable|cannot|failed|required|error/i.test(message) ? 'error' : 'info'
}

function DepartmentsPage() {
  const dispatch = useDispatch()
  const currentEmployee = useSelector((state) => state.auth.employee)
  const departments = useSelector((state) => state.directory.departments)
  const isAdmin = currentEmployee?.role === 'hr_admin'
  const [editingDepartment, setEditingDepartment] = useState(null)
  const [form, setForm] = useState(emptyDepartment)
  const [message, setMessage] = useState('')
  const [departmentToDeactivate, setDepartmentToDeactivate] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const activeCount = departments.items.filter(
    (department) => department.is_active,
  ).length
  const inactiveCount = departments.items.length - activeCount
  const messageTone = getMessageTone(message)

  useEffect(() => {
    dispatch(loadDepartments())
  }, [dispatch])

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    const name = form.name.trim()

    if (!name) {
      setMessage('Department name is required.')
      return
    }

    setIsSubmitting(true)

    const result = await dispatch(
      saveDepartment(
        {
          description: form.description.trim() || null,
          name,
        },
        editingDepartment?.id,
      ),
    )

    setIsSubmitting(false)
    setMessage(result.ok ? 'Department saved.' : result.error)
    if (result.ok) {
      setEditingDepartment(null)
      setForm(emptyDepartment)
    }
  }

  async function handleDelete() {
    if (!departmentToDeactivate) {
      return
    }

    setMessage('')
    setIsDeleting(true)
    const result = await dispatch(removeDepartment(departmentToDeactivate.id))
    setIsDeleting(false)
    setDepartmentToDeactivate(null)
    setMessage(
      result.ok
        ? 'Department deactivated.'
        : result.error ||
            'Unable to deactivate department. It may still be assigned to employees.',
    )
  }

  return (
    <AppShell currentPath="/departments">
      <div className="mt-3 min-h-0 flex-1 overflow-visible lg:mt-5 lg:overflow-y-auto">
        <PageHeader
          title="Departments"
          subtitle="Maintain the organizational groups employees use for discovery and reporting."
        />

        {departments.status === 'succeeded' ? (
          <section className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Total
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-950">
                {departments.items.length}
              </p>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Active
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-800">
                {activeCount}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Inactive
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-700">
                {inactiveCount}
              </p>
            </div>
          </section>
        ) : null}

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section>
            <DataState
              error={departments.error}
              isEmpty={
                departments.status === 'succeeded' &&
                departments.items.length === 0
              }
              isLoading={departments.status === 'loading'}
              loadingText="Loading departments..."
              emptyText="No departments have been created yet."
            />

            {departments.status === 'succeeded' && departments.items.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {departments.items.map((department) => (
                  <article
                    key={department.id}
                    className={`rounded-2xl border p-5 shadow-sm ${
                      department.is_active
                        ? 'border-slate-200 bg-white'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-950">
                          {department.name}
                        </h2>
                        <p className="mt-2 text-sm font-medium text-slate-500">
                          {department.description || 'No description provided.'}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          department.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {department.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {isAdmin ? (
                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                          onClick={() => {
                            setEditingDepartment(department)
                            setForm(department)
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-rose-200 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={!department.is_active}
                          onClick={() => setDepartmentToDeactivate(department)}
                        >
                          Deactivate
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : null}
          </section>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">
              {editingDepartment ? 'Edit Department' : 'Create Department'}
            </h2>
            {isAdmin ? (
              <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
                <Field
                  label="Name"
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
                <Field
                  label="Description"
                  value={form.description || ''}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                  {editingDepartment ? (
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600"
                      onClick={() => {
                        setEditingDepartment(null)
                        setForm(emptyDepartment)
                      }}
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </form>
            ) : (
              <p className="mt-3 text-sm font-medium text-slate-500">
                You can view departments. Department changes are limited to HR
                admins.
              </p>
            )}
            {message ? (
              <p
                className={`mt-4 rounded-xl p-3 text-sm font-semibold ${
                  messageTone === 'error'
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                {message}
              </p>
            ) : null}
          </aside>
        </div>

        {departmentToDeactivate ? (
          <div className="fixed inset-0 z-20 grid place-items-center bg-slate-950/30 p-4">
            <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
              <h2 className="text-lg font-bold text-slate-950">
                Deactivate Department
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Deactivate {departmentToDeactivate.name}? The backend will block
                this if employees are still assigned to the department.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                  onClick={() => setDepartmentToDeactivate(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                  disabled={isDeleting}
                  onClick={handleDelete}
                >
                  {isDeleting ? 'Deactivating...' : 'Deactivate'}
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}

export default DepartmentsPage
