import {
  formatField,
  formatRole,
  getEmployeeName,
  getLocation,
} from '../utils/employeeUtils'
import SkillChips from './SkillChips'

function DetailItem({ label, value }) {
  return (
    <p className="rounded-xl bg-slate-50 px-4 py-3">
      <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </span>
      <span className="mt-1 block break-words text-base font-semibold text-slate-800">
        {formatField(value)}
      </span>
    </p>
  )
}

function DetailSection({ children, title }) {
  return (
    <section className="mt-6 border-t border-slate-200 pt-5">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </h3>
      <div className="grid gap-3">{children}</div>
    </section>
  )
}

function ProfilePanel({ employee }) {
  if (!employee) {
    return (
      <aside className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 xl:w-96">
        <p className="text-sm font-medium text-slate-500">
          Select an employee to view details.
        </p>
      </aside>
    )
  }

  const location = getLocation(employee) || 'Location not listed'
  const isActive = employee.is_active
  const address = [
    employee.street_address,
    employee.city,
    employee.state,
    employee.zip_code,
    employee.country,
  ]
    .filter(Boolean)
    .join(', ')
  const officeAddress = employee.office
    ? [
        employee.office.street_address,
        employee.office.city,
        employee.office.state,
        employee.office.zip_code,
        employee.office.country,
      ]
        .filter(Boolean)
        .join(', ')
    : ''

  return (
    <aside className="w-full shrink-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 xl:max-h-[calc(100svh-3rem)] xl:w-96 xl:overflow-y-auto">
      <div
        className={`rounded-2xl p-5 ${
          isActive ? 'bg-blue-50' : 'border border-rose-200 bg-rose-50'
        }`}
      >
        <h2 className="break-words text-xl font-bold text-slate-950 sm:text-2xl">
          {getEmployeeName(employee)}
        </h2>
        <p className="mt-2 text-base font-medium text-slate-600 sm:text-lg">
          {formatRole(employee.role)}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700">
            {employee.department?.name || 'No department'}
          </span>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
            {location}
          </span>
          {!isActive ? (
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">
              Inactive
            </span>
          ) : null}
        </div>
      </div>

      <DetailSection title="Contact">
        <DetailItem label="Email" value={employee.email} />
        <DetailItem label="Phone" value={employee.phone} />
        <DetailItem label="Address" value={address} />
      </DetailSection>

      <DetailSection title="Organization">
        <DetailItem label="Role" value={formatRole(employee.role)} />
        <DetailItem label="Department" value={employee.department?.name} />
        <DetailItem label="Office" value={employee.office?.name} />
        <DetailItem label="Office address" value={officeAddress} />
      </DetailSection>

      <DetailSection title="Work Status">
        <DetailItem label="Work mode" value={employee.work_mode} />
        <DetailItem
          label="Collaboration"
          value={employee.collaboration_status}
        />
        <DetailItem label="Active" value={employee.is_active} />
      </DetailSection>

      <DetailSection title="Skills">
        <div>
          <SkillChips skills={employee.skills || []} />
        </div>
      </DetailSection>
    </aside>
  )
}

export default ProfilePanel
