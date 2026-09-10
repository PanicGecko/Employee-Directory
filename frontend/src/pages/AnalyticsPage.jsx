import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AppShell from '../components/AppShell'
import DataState from '../components/DataState'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import { loadHierarchy } from '../store/thunks/hierarchyThunks'
import { formatField, getLocation } from '../utils/employeeUtils'

const chartColors = [
  '#2563eb',
  '#7c3aed',
  '#059669',
  '#ea580c',
  '#db2777',
  '#0f766e',
  '#ca8a04',
  '#475569',
]

function flattenHierarchy(nodes) {
  const employees = []

  function collect(node) {
    employees.push(node.employee)
    ;(node.direct_reports || []).forEach(collect)
  }

  nodes.forEach(collect)

  return employees
}

function countBy(items, getKey) {
  return items.reduce((totals, item) => {
    const key = formatField(getKey(item))
    totals[key] = (totals[key] || 0) + 1

    return totals
  }, {})
}

function getPercent(value, total) {
  if (!total) {
    return 0
  }

  return Math.round((value / total) * 100)
}

function DistributionCard({ emptyText, items, title, total }) {
  const visibleItems = items.slice(0, 8)
  const remainingTotal = items
    .slice(8)
    .reduce((sum, [, value]) => sum + value, 0)
  const chartItems =
    remainingTotal > 0
      ? [...visibleItems, ['Other', remainingTotal]]
      : visibleItems

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {items.length} group{items.length === 1 ? '' : 's'} represented
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
          {total} employee{total === 1 ? '' : 's'}
        </span>
      </div>

      {chartItems.length > 0 ? (
        <>
          <div className="mt-5 flex h-4 overflow-hidden rounded-full bg-slate-100">
            {chartItems.map(([label, value], index) => (
              <div
                key={label}
                className="h-full"
                style={{
                  backgroundColor: chartColors[index % chartColors.length],
                  width: `${getPercent(value, total)}%`,
                }}
                title={`${label}: ${value}`}
              />
            ))}
          </div>

          <div className="mt-5 grid gap-4">
            {chartItems.map(([label, value], index) => {
              const percent = getPercent(value, total)

              return (
                <div key={label}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            chartColors[index % chartColors.length],
                        }}
                      />
                      <span className="truncate font-semibold text-slate-700">
                        {label}
                      </span>
                    </div>
                    <span className="shrink-0 font-bold text-slate-950">
                      {value} · {percent}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        backgroundColor: chartColors[index % chartColors.length],
                        width: `${percent}%`,
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
          {emptyText}
        </p>
      )}
    </section>
  )
}

function HighlightCard({ label, value }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-sm font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-slate-950">{value}</p>
    </section>
  )
}

function DistributionTable({ departmentItems, locationItems }) {
  const rowCount = Math.max(departmentItems.length, locationItems.length)
  const rows = Array.from({ length: rowCount }, (_, index) => ({
    department: departmentItems[index],
    location: locationItems[index],
  }))

  if (rows.length === 0) {
    return null
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-4 sm:p-5">
        <h2 className="text-lg font-bold text-slate-950">
          Distribution Breakdown
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-4 py-3">Department</th>
              <th className="px-4 py-3 text-right">Employees</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3 text-right">Employees</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row, index) => (
              <tr key={index}>
                <td className="px-4 py-3 font-semibold text-slate-700">
                  {row.department?.[0] || ''}
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-950">
                  {row.department?.[1] || ''}
                </td>
                <td className="px-4 py-3 font-semibold text-slate-700">
                  {row.location?.[0] || ''}
                </td>
                <td className="px-4 py-3 text-right font-bold text-slate-950">
                  {row.location?.[1] || ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function toSortedEntries(totals) {
  return Object.entries(totals).sort((first, second) => {
    if (second[1] !== first[1]) {
      return second[1] - first[1]
    }

    return first[0].localeCompare(second[0])
  })
}

function getTopLabel(items) {
  if (items.length === 0) {
    return 'Not listed'
  }

  const [label, count] = items[0]

  return `${label} (${count})`
}

function getActiveEmployees(employees) {
  return employees.filter((employee) => employee.is_active !== false)
}

function getUniqueCount(items, getKey) {
  return new Set(items.map(getKey).filter(Boolean)).size
}

function AnalyticsPage() {
  const dispatch = useDispatch()
  const { error, nodes, status } = useSelector((state) => state.hierarchy)
  const employees = useMemo(
    () => getActiveEmployees(flattenHierarchy(nodes)),
    [nodes],
  )
  const departmentTotals = useMemo(
    () =>
      toSortedEntries(
        countBy(employees, (employee) => employee.department?.name),
      ),
    [employees],
  )
  const locationTotals = useMemo(
    () => toSortedEntries(countBy(employees, getLocation)),
    [employees],
  )
  const summary = useMemo(
    () => ({
      departments: getUniqueCount(
        employees,
        (employee) => employee.department?.name,
      ),
      employees: employees.length,
      locations: getUniqueCount(employees, getLocation),
      noDepartment: employees.filter((employee) => !employee.department?.name)
        .length,
      noLocation: employees.filter((employee) => !getLocation(employee)).length,
    }),
    [employees],
  )

  useEffect(() => {
    dispatch(loadHierarchy())
  }, [dispatch])

  return (
    <AppShell currentPath="/analytics">
      <div className="mt-3 min-h-0 flex-1 overflow-visible lg:mt-5 lg:overflow-y-auto">
        <PageHeader
          title="Analytics"
          subtitle="Track how active employees are distributed across departments and locations."
        />

        <DataState
          error={error}
          isEmpty={status === 'succeeded' && employees.length === 0}
          isLoading={status === 'loading'}
          loadingText="Loading analytics..."
          emptyText="No active employees are available for analytics yet."
        />

        {status === 'succeeded' && employees.length > 0 ? (
          <>
            <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Active Employees" value={summary.employees} />
              <StatCard label="Departments" value={summary.departments} />
              <StatCard label="Locations" value={summary.locations} />
              <StatCard
                label="Missing Org Data"
                value={summary.noDepartment + summary.noLocation}
              />
            </section>

            <section className="mt-5 grid gap-3 xl:grid-cols-2">
              <HighlightCard
                label="Largest Department"
                value={getTopLabel(departmentTotals)}
              />
              <HighlightCard
                label="Largest Location"
                value={getTopLabel(locationTotals)}
              />
            </section>

            <section className="mt-5 grid gap-5 xl:grid-cols-2">
              <DistributionCard
                emptyText="No department data is available yet."
                items={departmentTotals}
                title="Employees by Department"
                total={employees.length}
              />
              <DistributionCard
                emptyText="No location data is available yet."
                items={locationTotals}
                title="Employees by Location"
                total={employees.length}
              />
            </section>

            <div className="mt-5">
              <DistributionTable
                departmentItems={departmentTotals}
                locationItems={locationTotals}
              />
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  )
}

export default AnalyticsPage
