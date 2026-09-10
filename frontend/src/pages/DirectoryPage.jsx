import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AppShell from '../components/AppShell'
import DataState from '../components/DataState'
import PageHeader from '../components/PageHeader'
import SelectField from '../components/SelectField'
import SkillChips from '../components/SkillChips'
import { getEmployee } from '../apis/employeesApi'
import {
  assignEmployeeSkill,
  loadDepartments,
  loadEmployees,
  loadOffices,
  loadSkills,
  saveEmployeeSkillProficiency,
  setEmployeeActive,
} from '../store/thunks/directoryThunks'
import { getApiErrorMessage } from '../utils/apiError'
import {
  formatField,
  formatRole,
  getEmployeeInitials,
  getEmployeeName,
  getLocation,
} from '../utils/employeeUtils'

const workModeOptions = ['remote', 'hybrid', 'in_office']
const collaborationOptions = ['open', 'busy', 'unavailable']
const proficiencyOptions = ['beginner', 'intermediate', 'advanced', 'expert']

function findById(items, id) {
  return items.find((item) => String(item.id) === String(id)) || null
}

function enrichEmployee(employee, departments, offices) {
  return {
    ...employee,
    department:
      employee.department || findById(departments, employee.department_id),
    office: employee.office || findById(offices, employee.office_id),
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

function buildEmployeeParams(filters, pagination) {
  return cleanPayload({
    collaboration_status: filters.collaboration_status,
    department_id: filters.department_id,
    is_active: filters.is_active,
    office_id: filters.office_id,
    page: pagination.page,
    page_size: pagination.pageSize,
    proficiency: filters.proficiency,
    search: filters.search.trim(),
    skill_id: filters.skill_id,
    work_mode: filters.work_mode,
  })
}

function CompactFilterField({ label, ...props }) {
  return (
    <label className="block text-xs font-bold text-slate-700">
      {label}
      <input
        {...props}
        className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  )
}

function CompactFilterSelect({ children, label, ...props }) {
  return (
    <label className="block text-xs font-bold text-slate-700">
      {label}
      <select
        {...props}
        className="mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      >
        {children}
      </select>
    </label>
  )
}

function EmployeeSummary({ employee, isSelected, onSelect }) {
  const inactiveClasses = employee.is_active
    ? ''
    : 'border-rose-200 bg-rose-50 hover:border-rose-300 hover:bg-rose-50'
  const activeClasses = isSelected
    ? 'border-blue-300 bg-blue-50 shadow-sm'
    : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50'

  return (
    <article
      className={`w-full rounded-2xl border p-4 text-left transition ${
        employee.is_active ? activeClasses : inactiveClasses
      }`}
    >
      <button
        type="button"
        className="flex w-full items-start gap-3 text-left"
        onClick={() => onSelect(employee)}
      >
        <div
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-sm font-bold ${
            employee.is_active
              ? 'bg-blue-100 text-blue-700'
              : 'bg-rose-100 text-rose-700'
          }`}
        >
          {getEmployeeInitials(employee)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-base font-bold text-slate-950">
              {getEmployeeName(employee)}
            </p>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                employee.is_active
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
              }`}
            >
              {employee.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="mt-1 truncate text-sm font-medium text-slate-500">
            {employee.email}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
              {formatRole(employee.role)}
            </span>
            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
              {employee.department?.name || 'No department'}
            </span>
            <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">
              {getLocation(employee) || 'No location'}
            </span>
          </div>
        </div>
      </button>
      <a
        className="mt-4 inline-flex text-sm font-bold text-blue-600 transition hover:text-blue-800"
        href={`/employees/${employee.public_id}`}
      >
        View profile
      </a>
    </article>
  )
}

function EmployeeDetail({
  employee,
  isAdmin,
  onCancelStatusChange,
  onConfirmStatusChange,
  onRequestStatusChange,
  pendingStatusChange,
}) {
  if (!employee) {
    return (
      <aside className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-sm font-semibold text-slate-500">
          Select an employee to view their contact details, skills, and work status.
        </p>
      </aside>
    )
  }

  return (
    <aside
      className={`rounded-2xl border p-5 ${
        employee.is_active
          ? 'border-slate-200 bg-white'
          : 'border-rose-200 bg-rose-50'
      }`}
    >
      <div className="flex items-start gap-4">
        <div
          className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-base font-bold text-white ${
            employee.is_active ? 'bg-blue-600' : 'bg-rose-600'
          }`}
        >
          {getEmployeeInitials(employee)}
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-slate-950">
            {getEmployeeName(employee)}
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {formatRole(employee.role)} · {employee.department?.name || 'No department'}
          </p>
        </div>
      </div>

      <dl className="mt-6 grid gap-3 text-sm">
        {[
          ['Email', employee.email],
          ['Phone', employee.phone],
          ['Office', employee.office?.name],
          ['Location', getLocation(employee)],
          ['Work mode', employee.work_mode],
          ['Collaboration', employee.collaboration_status],
          ['Address', [employee.street_address, employee.city, employee.state, employee.zip_code, employee.country].filter(Boolean).join(', ')],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-slate-50 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {label}
            </dt>
            <dd className="mt-1 break-words font-semibold text-slate-800">
              {formatField(value)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Skills
        </p>
        <SkillChips skills={employee.skills || []} />
      </div>

      {isAdmin ? (
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`/employees/${employee.public_id}`}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Edit profile
          </a>
          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
            onClick={() => onRequestStatusChange(employee)}
          >
            {employee.is_active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      ) : null}

      {pendingStatusChange?.public_id === employee.public_id ? (
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-950">
            Deactivate {getEmployeeName(employee)}?
          </p>
          <p className="mt-2 text-sm font-semibold text-amber-800">
            If this employee manages direct reports, the backend will reassign
            those reports to this employee’s current manager when possible.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700"
              onClick={() => onConfirmStatusChange(employee, false)}
            >
              Deactivate employee
            </button>
            <button
              type="button"
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-slate-300"
              onClick={onCancelStatusChange}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </aside>
  )
}

function SkillAssignmentForm({ employee, onSubmit, skills }) {
  const [skillId, setSkillId] = useState('')
  const [proficiency, setProficiency] = useState('intermediate')

  if (!employee) {
    return null
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({
      employee_public_id: employee.public_id,
      proficiency,
      skill_id: skillId ? Number(skillId) : null,
    })
  }

  return (
    <form
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
      onSubmit={handleSubmit}
    >
      <h2 className="text-lg font-bold text-slate-950">Assign Skill</h2>
      <p className="mt-1 text-sm font-medium text-slate-500">
        Add or update a skill proficiency for {getEmployeeName(employee)}.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Skill"
          required
          value={skillId}
          onChange={(event) => setSkillId(event.target.value)}
        >
          <option value="">Choose a skill</option>
          {skills.map((skill) => (
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
      </div>
      <button
        type="submit"
        className="mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
      >
        Save skill
      </button>
    </form>
  )
}

function DirectoryPage() {
  const dispatch = useDispatch()
  const currentEmployee = useSelector((state) => state.auth.employee)
  const { departments, employees, offices, skills } = useSelector(
    (state) => state.directory,
  )
  const isAdmin = currentEmployee?.role === 'hr_admin'
  const canManageSkills =
    currentEmployee?.role === 'hr_admin' || currentEmployee?.role === 'manager'
  const defaultFilters = {
    collaboration_status: '',
    department_id: '',
    is_active: 'true',
    office_id: '',
    proficiency: '',
    search: '',
    skill_id: '',
    work_mode: '',
  }
  const [filters, setFilters] = useState({
    ...defaultFilters,
  })
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
  })
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)
  const [formMessage, setFormMessage] = useState('')
  const [pendingStatusChange, setPendingStatusChange] = useState(null)
  const params = useMemo(
    () => buildEmployeeParams(filters, pagination),
    [filters, pagination],
  )
  const enrichedEmployees = useMemo(
    () =>
      employees.items.map((employee) =>
        enrichEmployee(employee, departments.items, offices.items),
      ),
    [departments.items, employees.items, offices.items],
  )
  const selectedEmployee = useMemo(
    () =>
      enrichedEmployees.find(
        (employee) => employee.public_id === selectedEmployeeId,
      ) ||
      enrichedEmployees[0] ||
      null,
    [enrichedEmployees, selectedEmployeeId],
  )
  const totalPages = Math.max(
    1,
    Math.ceil(employees.total / employees.pageSize),
  )

  useEffect(() => {
    dispatch(loadDepartments())
    dispatch(loadOffices())
    dispatch(loadSkills())
  }, [dispatch])

  useEffect(() => {
    dispatch(loadEmployees(params))
  }, [dispatch, params])

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }))
    setPagination((current) => ({ ...current, page: 1 }))
  }

  async function handleSetActive(employee, isActive) {
    setFormMessage('')

    const result = await dispatch(
      setEmployeeActive(employee.public_id, isActive, params),
    )

    setPendingStatusChange(null)
    setFormMessage(result.ok ? 'Employee status updated.' : result.error)
  }

  function handleRequestStatusChange(employee) {
    if (employee.is_active) {
      setPendingStatusChange(employee)
      return
    }

    handleSetActive(employee, true)
  }

  async function handleAssignSkill(assignRequest) {
    setFormMessage('')
    const selectedSkillId = assignRequest.skill_id

    if (!selectedSkillId) {
      setFormMessage('Choose a skill before saving.')
      return
    }

    try {
      const detailedEmployee = await getEmployee(assignRequest.employee_public_id)
      const existingSkill = (detailedEmployee.skills || []).find(
        (skill) => Number(skill.skill_id) === Number(selectedSkillId),
      )

      const result = existingSkill
        ? await dispatch(
            saveEmployeeSkillProficiency(
              assignRequest.employee_public_id,
              selectedSkillId,
              assignRequest.proficiency,
              params,
            ),
          )
        : await dispatch(assignEmployeeSkill(assignRequest, params))

      setFormMessage(
        result.ok ? 'Skill saved for employee.' : result.error,
      )
    } catch (error) {
      setFormMessage(
        getApiErrorMessage(
          error,
          'Unable to check the employee skills before saving.',
        ),
      )
    }
  }

  return (
    <AppShell currentPath="/directory">
      <div className="mt-3 grid min-h-0 flex-1 gap-5 overflow-visible lg:mt-5 xl:grid-cols-[minmax(0,1fr)_420px] xl:overflow-hidden">
        <div className="flex min-h-0 flex-col xl:min-h-0">
          <PageHeader
            title="Directory"
            subtitle="Search employees by name, contact details, department, office, availability, and skills."
          />

          <section className="mt-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
              <CompactFilterField
                label="Search"
                placeholder="Name or email"
                value={filters.search}
                onChange={(event) => updateFilter('search', event.target.value)}
              />
              <CompactFilterSelect
                label="Department"
                value={filters.department_id}
                onChange={(event) =>
                  updateFilter('department_id', event.target.value)
                }
              >
                <option value="">All departments</option>
                {departments.items.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </CompactFilterSelect>
              <CompactFilterSelect
                label="Office"
                value={filters.office_id}
                onChange={(event) => updateFilter('office_id', event.target.value)}
              >
                <option value="">All offices</option>
                {offices.items.map((office) => (
                  <option key={office.id} value={office.id}>
                    {office.name}
                  </option>
                ))}
              </CompactFilterSelect>
              <CompactFilterSelect
                label="Skill"
                value={filters.skill_id}
                onChange={(event) => updateFilter('skill_id', event.target.value)}
              >
                <option value="">All skills</option>
                {skills.items.map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </CompactFilterSelect>
              <CompactFilterSelect
                label="Proficiency"
                value={filters.proficiency}
                onChange={(event) =>
                  updateFilter('proficiency', event.target.value)
                }
              >
                <option value="">Any level</option>
                {proficiencyOptions.map((proficiency) => (
                  <option key={proficiency} value={proficiency}>
                    {formatRole(proficiency)}
                  </option>
                ))}
              </CompactFilterSelect>
              <CompactFilterSelect
                label="Work mode"
                value={filters.work_mode}
                onChange={(event) => updateFilter('work_mode', event.target.value)}
              >
                <option value="">Any mode</option>
                {workModeOptions.map((mode) => (
                  <option key={mode} value={mode}>
                    {formatRole(mode)}
                  </option>
                ))}
              </CompactFilterSelect>
              <CompactFilterSelect
                label="Availability"
                value={filters.collaboration_status}
                onChange={(event) =>
                  updateFilter('collaboration_status', event.target.value)
                }
              >
                <option value="">Any status</option>
                {collaborationOptions.map((status) => (
                  <option key={status} value={status}>
                    {formatRole(status)}
                  </option>
                ))}
              </CompactFilterSelect>
              <CompactFilterSelect
                label="Status"
                value={filters.is_active}
                onChange={(event) => updateFilter('is_active', event.target.value)}
              >
                <option value="">Any status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </CompactFilterSelect>
              <div className="flex items-end">
                <button
                  type="button"
                  className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
                  onClick={() => {
                    setFilters({ ...defaultFilters })
                    setPagination((current) => ({ ...current, page: 1 }))
                  }}
                >
                  Clear filters
                </button>
              </div>
            </div>
          </section>

          <section className="mt-5 flex min-h-0 flex-1 flex-col">
            <DataState
              error={employees.error}
              isEmpty={employees.status === 'succeeded' && employees.items.length === 0}
              isLoading={employees.status === 'loading'}
              loadingText="Loading employees..."
              emptyText="No employees match the current filters."
            />

            {employees.status === 'succeeded' && enrichedEmployees.length > 0 ? (
              <>
                <div className="min-h-0 flex-1 overflow-visible xl:overflow-y-auto xl:pr-1">
                  <div className="grid gap-3 md:grid-cols-2">
                    {enrichedEmployees.map((employee) => (
                      <EmployeeSummary
                        key={employee.public_id}
                        employee={employee}
                        isSelected={selectedEmployee?.public_id === employee.public_id}
                        onSelect={(nextEmployee) =>
                          setSelectedEmployeeId(nextEmployee.public_id)
                        }
                      />
                    ))}
                  </div>
                </div>
                <div className="sticky bottom-2 mt-4 flex shrink-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 text-sm font-semibold text-slate-600 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between xl:bottom-0">
                  <p>
                    Page {employees.page} of {totalPages} · {employees.total}{' '}
                    employee{employees.total === 1 ? '' : 's'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      className="rounded-xl border border-slate-200 px-3 py-2 transition hover:border-blue-200 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={employees.page <= 1}
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
                      disabled={employees.page >= totalPages}
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
                </div>
              </>
            ) : null}
          </section>
        </div>

        <aside className="grid min-h-0 gap-5 xl:overflow-y-auto">
          <EmployeeDetail
            employee={selectedEmployee}
            isAdmin={isAdmin}
            onCancelStatusChange={() => setPendingStatusChange(null)}
            onConfirmStatusChange={handleSetActive}
            onRequestStatusChange={handleRequestStatusChange}
            pendingStatusChange={pendingStatusChange}
          />

          {canManageSkills ? (
            <SkillAssignmentForm
              employee={selectedEmployee}
              onSubmit={handleAssignSkill}
              skills={skills.items}
            />
          ) : null}

          {formMessage ? (
            <p className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-semibold text-blue-700">
              {formMessage}
            </p>
          ) : null}
        </aside>
      </div>
    </AppShell>
  )
}

export default DirectoryPage
