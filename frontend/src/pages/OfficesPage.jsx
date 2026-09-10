import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AppShell from '../components/AppShell'
import DataState from '../components/DataState'
import Field from '../components/Field'
import PageHeader from '../components/PageHeader'
import {
  loadOffices,
  removeOffice,
  saveOffice,
} from '../store/thunks/directoryThunks'

const emptyOffice = {
  city: '',
  country: '',
  name: '',
  state: '',
  street_address: '',
  zip_code: '',
}

function getMessageTone(message) {
  if (!message) {
    return 'info'
  }

  return /unable|cannot|failed|required|error/i.test(message) ? 'error' : 'info'
}

function OfficesPage() {
  const dispatch = useDispatch()
  const currentEmployee = useSelector((state) => state.auth.employee)
  const offices = useSelector((state) => state.directory.offices)
  const isAdmin = currentEmployee?.role === 'hr_admin'
  const [editingOffice, setEditingOffice] = useState(null)
  const [form, setForm] = useState(emptyOffice)
  const [message, setMessage] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [officeToDeactivate, setOfficeToDeactivate] = useState(null)
  const activeCount = offices.items.filter((office) => office.is_active).length
  const inactiveCount = offices.items.length - activeCount
  const messageTone = getMessageTone(message)

  useEffect(() => {
    dispatch(loadOffices())
  }, [dispatch])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    const requiredFields = [
      ['name', 'Office name is required.'],
      ['street_address', 'Street address is required.'],
      ['city', 'City is required.'],
      ['country', 'Country is required.'],
    ]
    const missingField = requiredFields.find(([field]) => !form[field].trim())

    if (missingField) {
      setMessage(missingField[1])
      return
    }

    setIsSubmitting(true)

    const result = await dispatch(
      saveOffice(
        {
          city: form.city.trim(),
          country: form.country.trim(),
          name: form.name.trim(),
          state: form.state.trim() || null,
          street_address: form.street_address.trim(),
          zip_code: form.zip_code.trim() || null,
        },
        editingOffice?.id,
      ),
    )

    setIsSubmitting(false)
    setMessage(result.ok ? 'Office saved.' : result.error)
    if (result.ok) {
      setEditingOffice(null)
      setForm(emptyOffice)
    }
  }

  async function handleDelete() {
    if (!officeToDeactivate) {
      return
    }

    setMessage('')
    setIsDeleting(true)
    const result = await dispatch(removeOffice(officeToDeactivate.id))
    setIsDeleting(false)
    setOfficeToDeactivate(null)
    setMessage(
      result.ok
        ? 'Office deactivated.'
        : result.error ||
            'Unable to deactivate office. It may still be assigned to employees.',
    )
  }

  return (
    <AppShell currentPath="/offices">
      <div className="mt-3 min-h-0 flex-1 overflow-visible lg:mt-5 lg:overflow-y-auto">
        <PageHeader
          title="Offices"
          subtitle="Manage locations so employees can be found by city, office, and working arrangement."
        />

        {offices.status === 'succeeded' ? (
          <section className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Total
              </p>
              <p className="mt-1 text-2xl font-bold text-slate-950">
                {offices.items.length}
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
              error={offices.error}
              isEmpty={offices.status === 'succeeded' && offices.items.length === 0}
              isLoading={offices.status === 'loading'}
              loadingText="Loading offices..."
              emptyText="No offices have been created yet."
            />

            {offices.status === 'succeeded' && offices.items.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {offices.items.map((office) => (
                  <article
                    key={office.id}
                    className={`rounded-2xl border p-5 shadow-sm ${
                      office.is_active
                        ? 'border-slate-200 bg-white'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-slate-950">
                          {office.name}
                        </h2>
                        <p className="mt-2 text-sm font-medium text-slate-500">
                          {[office.street_address, office.city, office.state, office.zip_code, office.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          office.is_active
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {office.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {isAdmin ? (
                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                          onClick={() => {
                            setEditingOffice(office)
                            setForm(office)
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-rose-200 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={!office.is_active}
                          onClick={() => setOfficeToDeactivate(office)}
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
              {editingOffice ? 'Edit Office' : 'Create Office'}
            </h2>
            {isAdmin ? (
              <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
                <Field label="Name" required value={form.name} onChange={(event) => updateField('name', event.target.value)} />
                <Field label="Street address" required value={form.street_address} onChange={(event) => updateField('street_address', event.target.value)} />
                <Field label="City" required value={form.city} onChange={(event) => updateField('city', event.target.value)} />
                <Field label="State" value={form.state || ''} onChange={(event) => updateField('state', event.target.value)} />
                <Field label="Zip code" value={form.zip_code || ''} onChange={(event) => updateField('zip_code', event.target.value)} />
                <Field label="Country" required value={form.country} onChange={(event) => updateField('country', event.target.value)} />
                <div className="flex flex-wrap gap-3">
                  <button type="submit" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</button>
                  {editingOffice ? (
                    <button type="button" className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600" onClick={() => {
                      setEditingOffice(null)
                      setForm(emptyOffice)
                    }}>Cancel</button>
                  ) : null}
                </div>
              </form>
            ) : (
              <p className="mt-3 text-sm font-medium text-slate-500">
                You can view offices. Office changes are limited to HR admins.
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

        {officeToDeactivate ? (
          <div className="fixed inset-0 z-20 grid place-items-center bg-slate-950/30 p-4">
            <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
              <h2 className="text-lg font-bold text-slate-950">
                Deactivate Office
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Deactivate {officeToDeactivate.name}? The backend will block
                this if employees are still assigned to the office.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                  onClick={() => setOfficeToDeactivate(null)}
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

export default OfficesPage
