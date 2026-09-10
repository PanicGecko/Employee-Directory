import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AppShell from '../components/AppShell'
import Field from '../components/Field'
import PageHeader from '../components/PageHeader'
import SelectField from '../components/SelectField'
import { updateAuthenticatedEmployee } from '../store/authSlice'
import { saveOwnProfile } from '../store/thunks/directoryThunks'
import { formatRole, getEmployeeName } from '../utils/employeeUtils'

const workModeOptions = ['remote', 'hybrid', 'in_office']
const collaborationOptions = ['open', 'busy', 'unavailable']

function buildProfileForm(employee) {
  return {
    city: employee?.city || '',
    collaboration_status: employee?.collaboration_status || 'open',
    country: employee?.country || '',
    phone: employee?.phone || '',
    state: employee?.state || '',
    street_address: employee?.street_address || '',
    work_mode: employee?.work_mode || 'remote',
    zip_code: employee?.zip_code || '',
  }
}

function SettingsPage() {
  const dispatch = useDispatch()
  const employee = useSelector((state) => state.auth.employee)
  const [form, setForm] = useState(buildProfileForm(employee))
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setIsSaving(true)

    const payload = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, value || null]),
    )
    const result = await dispatch(saveOwnProfile(payload))

    setIsSaving(false)

    if (!result.ok) {
      setMessage(result.error)
      return
    }

    dispatch(updateAuthenticatedEmployee(result.data))
    setMessage('Your profile was updated.')
  }

  return (
    <AppShell currentPath="/profile">
      <div className="mt-3 min-h-0 flex-1 overflow-visible lg:mt-5 lg:overflow-y-auto">
        <PageHeader
          title="Settings"
          subtitle="Update your contact details and availability so the directory stays useful."
        />

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <form
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            onSubmit={handleSubmit}
          >
            <h2 className="text-lg font-bold text-slate-950">My Profile</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field
                label="Phone"
                value={form.phone}
                onChange={(event) => updateField('phone', event.target.value)}
              />
              <SelectField
                label="Work mode"
                value={form.work_mode}
                onChange={(event) => updateField('work_mode', event.target.value)}
              >
                {workModeOptions.map((mode) => (
                  <option key={mode} value={mode}>
                    {formatRole(mode)}
                  </option>
                ))}
              </SelectField>
              <SelectField
                label="Collaboration status"
                value={form.collaboration_status}
                onChange={(event) =>
                  updateField('collaboration_status', event.target.value)
                }
              >
                {collaborationOptions.map((status) => (
                  <option key={status} value={status}>
                    {formatRole(status)}
                  </option>
                ))}
              </SelectField>
              <Field
                label="Street address"
                value={form.street_address}
                onChange={(event) =>
                  updateField('street_address', event.target.value)
                }
              />
              <Field
                label="City"
                value={form.city}
                onChange={(event) => updateField('city', event.target.value)}
              />
              <Field
                label="State"
                value={form.state}
                onChange={(event) => updateField('state', event.target.value)}
              />
              <Field
                label="Zip code"
                value={form.zip_code}
                onChange={(event) => updateField('zip_code', event.target.value)}
              />
              <Field
                label="Country"
                value={form.country}
                onChange={(event) => updateField('country', event.target.value)}
              />
            </div>

            <button
              type="submit"
              className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save profile'}
            </button>
            {message ? (
              <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-700">
                {message}
              </p>
            ) : null}
          </form>

          <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">Account</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              {[
                ['Name', employee ? getEmployeeName(employee) : 'Not listed'],
                ['Email', employee?.email],
                ['Role', formatRole(employee?.role)],
                ['Department', employee?.department?.name],
                ['Office', employee?.office?.name],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 px-4 py-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {label}
                  </dt>
                  <dd className="mt-1 font-semibold text-slate-800">
                    {value || 'Not listed'}
                  </dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </div>
    </AppShell>
  )
}

export default SettingsPage
