import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AppShell from '../components/AppShell'
import DataState from '../components/DataState'
import Field from '../components/Field'
import PageHeader from '../components/PageHeader'
import SelectField from '../components/SelectField'
import SkillChips from '../components/SkillChips'
import { listDepartments } from '../apis/departmentsApi'
import {
  assignEmployeeManager,
  getDirectReports,
  getEmployee,
  getEmployeeDescendants,
  getEmployeeManager,
  listEmployees,
  updateEmployee,
  updateOwnProfile,
  updateSubordinateProfile,
} from '../apis/employeesApi'
import { listOffices } from '../apis/officesApi'
import {
  assignSkill,
  listSkills,
  removeSkillFromEmployee,
  updateSkillProficiency,
} from '../apis/skillsApi'
import { updateAuthenticatedEmployee } from '../store/authSlice'
import { getApiErrorMessage } from '../utils/apiError'
import {
  formatField,
  formatRole,
  getEmployeeInitials,
  getEmployeeName,
  getLocation,
} from '../utils/employeeUtils'

function getProfileIdFromPath() {
  const match = window.location.pathname.match(/^\/employees\/([^/]+)$/)

  return match?.[1] || ''
}

const roleOptions = ['employee', 'manager', 'hr_admin']
const workModeOptions = ['remote', 'hybrid', 'in_office']
const collaborationOptions = ['open', 'busy', 'unavailable']
const proficiencyOptions = ['beginner', 'intermediate', 'advanced', 'expert']

function buildEditForm(employee) {
  return {
    city: employee?.city || '',
    collaboration_status: employee?.collaboration_status || 'open',
    country: employee?.country || '',
    department_id: employee?.department_id || '',
    email: employee?.email || '',
    first_name: employee?.first_name || '',
    last_name: employee?.last_name || '',
    office_id: employee?.office_id || '',
    phone: employee?.phone || '',
    role: employee?.role || 'employee',
    state: employee?.state || '',
    street_address: employee?.street_address || '',
    work_mode: employee?.work_mode || 'remote',
    zip_code: employee?.zip_code || '',
  }
}

function cleanPayload(payload) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      value === '' ? null : value,
    ]),
  )
}

function getActiveOptionsWithCurrent(items, currentId) {
  return items.filter(
    (item) => item.is_active || String(item.id) === String(currentId),
  )
}

function pickSafeProfilePayload(form) {
  return cleanPayload({
    city: form.city,
    collaboration_status: form.collaboration_status,
    country: form.country,
    phone: form.phone,
    state: form.state,
    street_address: form.street_address,
    work_mode: form.work_mode,
    zip_code: form.zip_code,
  })
}

function pickAdminProfilePayload(form) {
  return cleanPayload({
    ...pickSafeProfilePayload(form),
    email: form.email,
    first_name: form.first_name,
    last_name: form.last_name,
    department_id: form.department_id,
    office_id: form.office_id,
    role: form.role,
  })
}

function DetailItem({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-semibold text-slate-800">
        {formatField(value)}
      </dd>
    </div>
  )
}

function EmployeeLinkCard({ employee, eyebrow }) {
  return (
    <a
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:bg-blue-50"
      href={`/employees/${employee.public_id}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {eyebrow}
      </p>
      <div className="mt-3 flex items-center gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700">
          {getEmployeeInitials(employee)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-950">
            {getEmployeeName(employee)}
          </p>
          <p className="truncate text-xs font-semibold text-slate-500">
            {formatRole(employee.role)}
          </p>
        </div>
      </div>
    </a>
  )
}

function Section({ children, title }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  )
}

function EditProfileForm({
  departments,
  employee,
  isAdmin,
  isSaving,
  message,
  offices,
  onCancel,
  onSubmit,
}) {
  const [form, setForm] = useState(buildEditForm(employee))
  const [formError, setFormError] = useState('')
  const departmentOptions = getActiveOptionsWithCurrent(
    departments,
    form.department_id,
  )
  const officeOptions = getActiveOptionsWithCurrent(offices, form.office_id)

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
    setFormError('')
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (isAdmin && (!form.first_name.trim() || !form.last_name.trim())) {
      setFormError('First name and last name are required.')
      return
    }

    if (isAdmin && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setFormError('Enter a valid email address.')
      return
    }

    onSubmit(form)
  }

  return (
    <form
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={handleSubmit}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Edit Profile</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Backend permissions are checked when you save.
          </p>
        </div>
        <button
          type="button"
          className="text-sm font-bold text-slate-500 transition hover:text-slate-900"
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {isAdmin ? (
          <>
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
              label="Department"
              value={form.department_id}
              onChange={(event) =>
                updateField('department_id', event.target.value)
              }
            >
              <option value="">No department</option>
              {departmentOptions.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                  {department.is_active ? '' : ' (inactive)'}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Office"
              value={form.office_id}
              onChange={(event) => updateField('office_id', event.target.value)}
            >
              <option value="">No office</option>
              {officeOptions.map((office) => (
                <option key={office.id} value={office.id}>
                  {office.name}
                  {office.is_active ? '' : ' (inactive)'}
                </option>
              ))}
            </SelectField>
          </>
        ) : null}

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

      {formError ? (
        <p className="mt-4 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">
          {formError}
        </p>
      ) : null}

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
  )
}

function ManagerAssignmentForm({ currentManager, employee, managers, onSubmit }) {
  const [managerPublicId, setManagerPublicId] = useState(
    currentManager?.public_id || '',
  )

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit(managerPublicId)
  }

  return (
    <form
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={handleSubmit}
    >
      <h2 className="text-lg font-bold text-slate-950">Assign Manager</h2>
      <div className="mt-4 grid gap-4">
        <SelectField
          label="Manager"
          required
          value={managerPublicId}
          onChange={(event) => setManagerPublicId(event.target.value)}
        >
          <option value="">Choose a manager</option>
          {managers
            .filter((manager) => manager.public_id !== employee.public_id)
            .map((manager) => (
              <option key={manager.public_id} value={manager.public_id}>
                {getEmployeeName(manager)}
              </option>
            ))}
        </SelectField>
        <button
          type="submit"
          className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          Save manager
        </button>
      </div>
    </form>
  )
}

function ManageSkillsPanel({
  catalogSkills,
  employee,
  isSaving,
  onAssignOrUpdate,
  onRemove,
}) {
  const [skillId, setSkillId] = useState('')
  const [proficiency, setProficiency] = useState('intermediate')

  function handleSubmit(event) {
    event.preventDefault()
    onAssignOrUpdate({
      proficiency,
      skill_id: skillId ? Number(skillId) : null,
    })
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">Manage Skills</h2>
      <form className="mt-4 grid gap-4 md:grid-cols-3" onSubmit={handleSubmit}>
        <SelectField
          label="Skill"
          required
          value={skillId}
          onChange={(event) => setSkillId(event.target.value)}
        >
          <option value="">Choose a skill</option>
          {catalogSkills.map((skill) => (
            <option key={skill.id} value={skill.id}>
              {skill.name}
            </option>
          ))}
        </SelectField>
        <SelectField
          label="Proficiency"
          value={proficiency}
          onChange={(event) => setProficiency(event.target.value)}
        >
          {proficiencyOptions.map((level) => (
            <option key={level} value={level}>
              {formatRole(level)}
            </option>
          ))}
        </SelectField>
        <div className="flex items-end">
          <button
            type="submit"
            className="h-11 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            disabled={isSaving}
          >
            Save skill
          </button>
        </div>
      </form>

      {employee.skills?.length > 0 ? (
        <div className="mt-5 grid gap-3">
          {employee.skills.map((skill) => (
            <div
              key={skill.skill_id}
              className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[minmax(0,1fr)_190px_auto]"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-950">
                  {skill.skill_name}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {skill.description || 'No description provided.'}
                </p>
              </div>
              <SelectField
                label="Proficiency"
                value={skill.proficiency}
                onChange={(event) =>
                  onAssignOrUpdate({
                    proficiency: event.target.value,
                    skill_id: skill.skill_id,
                  })
                }
              >
                {proficiencyOptions.map((level) => (
                  <option key={level} value={level}>
                    {formatRole(level)}
                  </option>
                ))}
              </SelectField>
              <div className="flex items-end">
                <button
                  type="button"
                  className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-rose-200 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isSaving}
                  onClick={() => onRemove(skill.skill_id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function EmployeeProfilePage() {
  const dispatch = useDispatch()
  const currentEmployee = useSelector((state) => state.auth.employee)
  const publicId = getProfileIdFromPath()
  const [profileState, setProfileState] = useState({
    directReports: [],
    employee: null,
    error: '',
    manager: null,
    status: 'idle',
  })
  const [descendantsCount, setDescendantsCount] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [managerOptions, setManagerOptions] = useState([])
  const [organizationOptions, setOrganizationOptions] = useState({
    departments: [],
    offices: [],
  })
  const [catalogSkills, setCatalogSkills] = useState([])
  const [managerCanEditProfile, setManagerCanEditProfile] = useState(false)
  const { directReports, employee, error, manager, status } = profileState

  const isOwnProfile = currentEmployee?.public_id === publicId
  const isAdmin = currentEmployee?.role === 'hr_admin'
  const isManager = currentEmployee?.role === 'manager'
  const isDirectManager = manager?.public_id === currentEmployee?.public_id
  const canEditProfile = isOwnProfile || managerCanEditProfile || isAdmin
  const canManageSkills = isAdmin || isDirectManager

  useEffect(() => {
    let isMounted = true

    async function loadProfile() {
      setProfileState((current) => ({
        ...current,
        error: '',
        status: 'loading',
      }))
      setDescendantsCount(null)

      try {
        const [employee, manager, directReports] = await Promise.all([
          getEmployee(publicId),
          getEmployeeManager(publicId),
          getDirectReports(publicId),
        ])

        if (!isMounted) {
          return
        }

        setProfileState({
          directReports,
          employee,
          error: '',
          manager,
          status: 'succeeded',
        })
        setIsEditing(false)
        setMessage('')

        if (directReports.length > 0) {
          try {
            const descendants = await getEmployeeDescendants(publicId)

            if (isMounted) {
              setDescendantsCount(descendants.length)
            }
          } catch {
            if (isMounted) {
              setDescendantsCount(null)
            }
          }
        }
      } catch (error) {
        if (isMounted) {
          setProfileState({
            directReports: [],
            employee: null,
            error: getApiErrorMessage(error, 'Unable to load employee profile.'),
            manager: null,
            status: 'failed',
          })
        }
      }
    }

    if (publicId) {
      loadProfile()
    }

    return () => {
      isMounted = false
    }
  }, [publicId])

  useEffect(() => {
    let isMounted = true

    async function loadManagers() {
      try {
        const [data, departments, offices] = await Promise.all([
          listEmployees({
            is_active: true,
            page: 1,
            page_size: 100,
          }),
          listDepartments(),
          listOffices(),
        ])

        if (isMounted) {
          setManagerOptions(
            data.items.filter((employee) => employee.role === 'manager'),
          )
          setOrganizationOptions({ departments, offices })
        }
      } catch {
        if (isMounted) {
          setManagerOptions([])
          setOrganizationOptions({ departments: [], offices: [] })
        }
      }
    }

    if (isAdmin) {
      loadManagers()
    }

    return () => {
      isMounted = false
    }
  }, [isAdmin])

  useEffect(() => {
    let isMounted = true

    async function checkManagerRelationship() {
      if (!isManager || isOwnProfile || !currentEmployee?.public_id) {
        setManagerCanEditProfile(false)
        return
      }

      try {
        const descendants = await getEmployeeDescendants(currentEmployee.public_id)
        const canEdit = descendants.some(
          (descendant) => descendant.public_id === publicId,
        )

        if (isMounted) {
          setManagerCanEditProfile(canEdit)
        }
      } catch {
        if (isMounted) {
          setManagerCanEditProfile(false)
        }
      }
    }

    checkManagerRelationship()

    return () => {
      isMounted = false
    }
  }, [currentEmployee, isManager, isOwnProfile, publicId])

  useEffect(() => {
    let isMounted = true

    async function loadCatalogSkills() {
      try {
        const skills = await listSkills()

        if (isMounted) {
          setCatalogSkills(skills)
        }
      } catch {
        if (isMounted) {
          setCatalogSkills([])
        }
      }
    }

    if (canManageSkills) {
      loadCatalogSkills()
    }

    return () => {
      isMounted = false
    }
  }, [canManageSkills])

  async function reloadProfile() {
    const [updatedEmployee, updatedManager, updatedDirectReports] =
      await Promise.all([
        getEmployee(publicId),
        getEmployeeManager(publicId),
        getDirectReports(publicId),
      ])

    setProfileState({
      directReports: updatedDirectReports,
      employee: updatedEmployee,
      error: '',
      manager: updatedManager,
      status: 'succeeded',
    })
  }

  async function handleProfileSubmit(form) {
    setIsSaving(true)
    setMessage('')

    try {
      const updatedEmployee = isAdmin
        ? await updateEmployee(publicId, pickAdminProfilePayload(form))
        : isOwnProfile
          ? await updateOwnProfile(pickSafeProfilePayload(form))
          : await updateSubordinateProfile(publicId, pickSafeProfilePayload(form))

      if (isOwnProfile) {
        dispatch(updateAuthenticatedEmployee(updatedEmployee))
      }

      await reloadProfile()
      setIsEditing(false)
      setMessage('Profile updated.')
    } catch (error) {
      setMessage(getApiErrorMessage(error, 'Unable to update profile.'))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleAssignManager(managerPublicId) {
    setMessage('')

    try {
      await assignEmployeeManager(publicId, managerPublicId)
      await reloadProfile()
      setMessage('Manager assigned.')
    } catch (error) {
      setMessage(getApiErrorMessage(error, 'Unable to assign manager.'))
    }
  }

  async function handleAssignOrUpdateSkill({ proficiency, skill_id: skillId }) {
    if (!skillId) {
      setMessage('Choose a skill before saving.')
      return
    }

    setIsSaving(true)
    setMessage('')

    try {
      const existingSkill = (profileState.employee?.skills || []).find(
        (skill) => Number(skill.skill_id) === Number(skillId),
      )

      if (existingSkill) {
        await updateSkillProficiency(publicId, skillId, proficiency)
      } else {
        await assignSkill({
          employee_public_id: publicId,
          proficiency,
          skill_id: skillId,
        })
      }

      await reloadProfile()
      setMessage('Skill saved for employee.')
    } catch (error) {
      setMessage(getApiErrorMessage(error, 'Unable to save skill for employee.'))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRemoveSkill(skillId) {
    setIsSaving(true)
    setMessage('')

    try {
      await removeSkillFromEmployee(publicId, skillId)
      await reloadProfile()
      setMessage('Skill removed from employee.')
    } catch (error) {
      setMessage(getApiErrorMessage(error, 'Unable to remove skill from employee.'))
    } finally {
      setIsSaving(false)
    }
  }

  const address = useMemo(
    () =>
      employee
        ? [
            employee.street_address,
            employee.city,
            employee.state,
            employee.zip_code,
            employee.country,
          ]
            .filter(Boolean)
            .join(', ')
        : '',
    [employee],
  )
  const officeAddress = useMemo(
    () =>
      employee?.office
        ? [
            employee.office.street_address,
            employee.office.city,
            employee.office.state,
            employee.office.zip_code,
            employee.office.country,
          ]
            .filter(Boolean)
            .join(', ')
        : '',
    [employee],
  )

  return (
    <AppShell currentPath="/directory">
      <div className="mt-3 min-h-0 flex-1 overflow-visible lg:mt-5 lg:overflow-y-auto">
        <PageHeader
          title="Employee Profile"
          subtitle="Contact information, reporting relationships, and skills."
        />

        <DataState
          error={error}
          isEmpty={status === 'succeeded' && !employee}
          isLoading={status === 'loading'}
          loadingText="Loading employee profile..."
          emptyText="Employee profile not found."
        />

        {status === 'succeeded' && employee ? (
          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="grid gap-5">
              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blue-600 text-base font-bold text-white sm:h-16 sm:w-16 sm:text-lg">
                      {getEmployeeInitials(employee)}
                    </div>
                    <div className="min-w-0">
                      <h1 className="break-words text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">
                        {getEmployeeName(employee)}
                      </h1>
                      <p className="mt-2 text-sm font-semibold text-slate-500 sm:text-base">
                        {formatRole(employee.role)} ·{' '}
                        {employee.department?.name || 'No department'}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div
                      className={`w-fit rounded-full px-3 py-1 text-sm font-bold ${
                        employee.is_active
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {employee.is_active ? 'Active' : 'Inactive'}
                    </div>
                    {canEditProfile ? (
                      <button
                        type="button"
                        className="w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700 sm:w-auto"
                        onClick={() => setIsEditing(true)}
                      >
                        Edit profile
                      </button>
                    ) : null}
                  </div>
                </div>
              </section>

              {isEditing ? (
                <EditProfileForm
                  departments={organizationOptions.departments}
                  employee={employee}
                  isAdmin={isAdmin}
                  isSaving={isSaving}
                  message={message}
                  offices={organizationOptions.offices}
                  onCancel={() => setIsEditing(false)}
                  onSubmit={handleProfileSubmit}
                />
              ) : null}

              <Section title="Contact">
                <dl className="grid gap-3 md:grid-cols-2">
                  <DetailItem label="Email" value={employee.email} />
                  <DetailItem label="Phone" value={employee.phone} />
                  <DetailItem label="Location" value={getLocation(employee)} />
                  <DetailItem label="Address" value={address} />
                </dl>
              </Section>

              <Section title="Organization">
                <dl className="grid gap-3 md:grid-cols-2">
                  <DetailItem label="Role" value={formatRole(employee.role)} />
                  <DetailItem
                    label="Department"
                    value={employee.department?.name}
                  />
                  <DetailItem label="Office" value={employee.office?.name} />
                  <DetailItem label="Office address" value={officeAddress} />
                  <DetailItem label="Work mode" value={employee.work_mode} />
                  <DetailItem
                    label="Collaboration"
                    value={employee.collaboration_status}
                  />
                </dl>
              </Section>

              <Section title="Skills">
                <SkillChips skills={employee.skills || []} />
              </Section>

              {canManageSkills ? (
                <ManageSkillsPanel
                  catalogSkills={catalogSkills}
                  employee={employee}
                  isSaving={isSaving}
                  onAssignOrUpdate={handleAssignOrUpdateSkill}
                  onRemove={handleRemoveSkill}
                />
              ) : null}
            </div>

            <aside className="grid content-start gap-5">
              {manager ? (
                <EmployeeLinkCard employee={manager} eyebrow="Manager" />
              ) : (
                <section className="rounded-xl border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-500 shadow-sm">
                  No manager listed.
                </section>
              )}

              <Section title="Direct Reports">
                {directReports.length > 0 ? (
                  <div className="grid gap-3">
                    {directReports.map((report) => (
                      <EmployeeLinkCard
                        key={report.public_id}
                        employee={report}
                        eyebrow="Reports to this employee"
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-slate-500">
                    No direct reports.
                  </p>
                )}
              </Section>

              {descendantsCount !== null ? (
                <section className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-700">
                  {descendantsCount} total reporting descendant
                  {descendantsCount === 1 ? '' : 's'}.
                </section>
              ) : null}

              {isAdmin ? (
                <ManagerAssignmentForm
                  currentManager={manager}
                  employee={employee}
                  managers={managerOptions}
                  onSubmit={handleAssignManager}
                />
              ) : null}

              {!isEditing && message ? (
                <p className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-700">
                  {message}
                </p>
              ) : null}
            </aside>
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}

export default EmployeeProfilePage
