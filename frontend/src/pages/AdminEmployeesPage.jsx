import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { listEmployees } from '../apis/employeesApi'
import AppShell from '../components/AppShell'
import Field from '../components/Field'
import PageHeader from '../components/PageHeader'
import SelectField from '../components/SelectField'
import {
  addEmployee,
  loadDepartments,
  loadOffices,
} from '../store/thunks/directoryThunks'
import { formatRole, getEmployeeName } from '../utils/employeeUtils'

const roleOptions = ['employee', 'manager', 'hr_admin']
const workModeOptions = ['remote', 'hybrid', 'in_office']
const collaborationOptions = ['open', 'busy', 'unavailable']

const emptyEmployee = {
  city: '',
  collaboration_status: 'open',
  country: '',
  department_id: '',
  email: '',
  first_name: '',
  last_name: '',
  manager_id: '',
  office_id: '',
  password: '',
  phone: '',
  role: 'employee',
  state: '',
  street_address: '',
  work_mode: 'remote',
  zip_code: '',
}

function cleanPayload(payload) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      value === '' ? null : value,
    ]),
  )
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function buildCreatePayload(form) {
  return cleanPayload({
    city: form.city,
    collaboration_status: form.collaboration_status,
    country: form.country,
    department_id: form.department_id,
    email: form.email.trim(),
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    manager_id: form.manager_id,
    office_id: form.office_id,
    password: form.password,
    phone: form.phone,
    role: form.role,
    state: form.state,
    street_address: form.street_address,
    work_mode: form.work_mode,
    zip_code: form.zip_code,
  })
}

function validateEmployee(form) {
  if (!form.first_name.trim() || !form.last_name.trim()) {
    return 'First name and last name are required.'
  }

  if (!isValidEmail(form.email)) {
    return 'Enter a valid email address.'
  }

  if (!form.password) {
    return 'Create the employee with a temporary password.'
  }

  return ''
}

function AdminEmployeesPage() {
  const dispatch = useDispatch()
  const { departments, offices } = useSelector((state) => state.directory)
  const [form, setForm] = useState(emptyEmployee)
  const [managers, setManagers] = useState([])
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    dispatch(loadDepartments())
    dispatch(loadOffices())
  }, [dispatch])

  useEffect(() => {
    let isMounted = true

    async function loadManagers() {
      try {
        const data = await listEmployees({
          is_active: true,
          page: 1,
          page_size: 100,
        })

        if (isMounted) {
          setManagers(
            (data.items || []).filter((employee) => employee.role === 'manager'),
          )
        }
      } catch {
        if (isMounted) {
          setManagers([])
        }
      }
    }

    loadManagers()

    return () => {
      isMounted = false
    }
  }, [])

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const validationMessage = validateEmployee(form)

    if (validationMessage) {
      setMessage(validationMessage)
      return
    }

    setIsSaving(true)
    setMessage('')

    const result = await dispatch(addEmployee(buildCreatePayload(form)))

    setIsSaving(false)

    if (!result.ok) {
      setMessage(result.error)
      return
    }

    setForm(emptyEmployee)
    setMessage('Employee profile created.')
  }

  return (
    <AppShell currentPath="/admin/employees">
      <div className="mt-3 min-h-0 flex-1 overflow-visible lg:mt-5 lg:overflow-y-auto">
        <PageHeader
          title="Create Employee"
          subtitle="Add a new employee profile and set the initial role, organization assignment, manager, and contact details."
        />

        <form
          className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          onSubmit={handleSubmit}
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field
              label="First name"
              required
              value={form.first_name}
              onChange={(event) => updateField('first_name', event.target.value)}
            />
            <Field
              label="Last name"
              required
              value={form.last_name}
              onChange={(event) => updateField('last_name', event.target.value)}
            />
            <Field
              label="Email"
              required
              type="email"
              value={form.email}
              onChange={(event) => updateField('email', event.target.value)}
            />
            <Field
              label="Temporary password"
              required
              type="password"
              value={form.password}
              onChange={(event) => updateField('password', event.target.value)}
            />
            <SelectField
              label="Role"
              value={form.role}
              onChange={(event) => updateField('role', event.target.value)}
            >
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {formatRole(role)}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Manager"
              value={form.manager_id}
              onChange={(event) => updateField('manager_id', event.target.value)}
            >
              <option value="">No manager</option>
              {managers.map((manager) => (
                <option key={manager.public_id} value={manager.id}>
                  {getEmployeeName(manager)}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Department"
              value={form.department_id}
              onChange={(event) =>
                updateField('department_id', event.target.value)
              }
            >
              <option value="">No department</option>
              {departments.items
                .filter((department) => department.is_active)
                .map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
            </SelectField>
            <SelectField
              label="Office"
              value={form.office_id}
              onChange={(event) => updateField('office_id', event.target.value)}
            >
              <option value="">No office</option>
              {offices.items
                .filter((office) => office.is_active)
                .map((office) => (
                  <option key={office.id} value={office.id}>
                    {office.name}
                  </option>
                ))}
            </SelectField>
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
              label="Collaboration"
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

          {message ? (
            <p className="mt-4 rounded-xl bg-blue-50 p-3 text-sm font-semibold text-blue-700">
              {message}
            </p>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 sm:w-auto"
              disabled={isSaving}
            >
              {isSaving ? 'Creating...' : 'Create employee'}
            </button>
            <a
              href="/directory"
              className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:text-blue-600 sm:w-auto"
            >
              Back to directory
            </a>
          </div>
        </form>
      </div>
    </AppShell>
  )
}

export default AdminEmployeesPage
