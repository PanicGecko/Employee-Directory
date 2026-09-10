import { useEffect, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AppShell from '../components/AppShell'
import DataState from '../components/DataState'
import PageHeader from '../components/PageHeader'
import StatCard from '../components/StatCard'
import { loadHierarchy } from '../store/thunks/hierarchyThunks'
import { getHierarchyStats } from '../utils/hierarchyGraph'
import { formatRole } from '../utils/employeeUtils'

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
    const key = getKey(item) || 'Not listed'
    totals[key] = (totals[key] || 0) + 1

    return totals
  }, {})
}

function BarList({ items, title, total }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-slate-950">{title}</h2>
      <div className="mt-4 grid gap-4">
        {items.map(([label, value]) => (
          <div key={label}>
            <div className="mb-1 flex items-center justify-between gap-3 text-sm">
              <span className="font-semibold text-slate-700">{label}</span>
              <span className="font-bold text-slate-950">{value}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100">
              <div
                className="h-2 rounded-full bg-blue-600"
                style={{ width: `${total ? (value / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function toSortedEntries(totals) {
  return Object.entries(totals).sort((first, second) => second[1] - first[1])
}

function AnalyticsPage() {
  const dispatch = useDispatch()
  const { error, nodes, status } = useSelector((state) => state.hierarchy)
  const employees = useMemo(() => flattenHierarchy(nodes), [nodes])
  const stats = useMemo(() => getHierarchyStats(nodes), [nodes])
  const departmentTotals = useMemo(
    () => toSortedEntries(countBy(employees, (employee) => employee.department?.name)),
    [employees],
  )
  const officeTotals = useMemo(
    () => toSortedEntries(countBy(employees, (employee) => employee.office?.name)),
    [employees],
  )
  const roleTotals = useMemo(
    () =>
      toSortedEntries(countBy(employees, (employee) => formatRole(employee.role))),
    [employees],
  )
  const collaborationTotals = useMemo(
    () =>
      toSortedEntries(
        countBy(employees, (employee) => formatRole(employee.collaboration_status)),
      ),
    [employees],
  )
  const skillTotals = useMemo(() => {
    const totals = {}

    employees.forEach((employee) => {
      ;(employee.skills || []).forEach((skill) => {
        totals[skill.skill_name] = (totals[skill.skill_name] || 0) + 1
      })
    })

    return toSortedEntries(totals).slice(0, 8)
  }, [employees])

  useEffect(() => {
    dispatch(loadHierarchy())
  }, [dispatch])

  return (
    <AppShell currentPath="/analytics">
      <div className="mt-3 min-h-0 flex-1 overflow-visible lg:mt-5 lg:overflow-y-auto">
        <PageHeader
          title="Analytics"
          subtitle="See how employees are distributed across departments, offices, roles, collaboration status, and skills."
        />

        <DataState
          error={error}
          isEmpty={status === 'succeeded' && employees.length === 0}
          isLoading={status === 'loading'}
          loadingText="Loading analytics..."
          emptyText="No employees are available for analytics yet."
        />

        {status === 'succeeded' && employees.length > 0 ? (
          <>
            <section className="mt-5 grid gap-3 md:grid-cols-3">
              <StatCard label="Employees" value={stats.employees} />
              <StatCard label="Departments" value={stats.departments} />
              <StatCard label="Managers" value={stats.managers} />
            </section>

            <section className="mt-5 grid gap-5 xl:grid-cols-2">
              <BarList
                items={departmentTotals}
                title="Employees by Department"
                total={employees.length}
              />
              <BarList
                items={officeTotals}
                title="Employees by Office"
                total={employees.length}
              />
              <BarList
                items={roleTotals}
                title="Employees by Role"
                total={employees.length}
              />
              <BarList
                items={collaborationTotals}
                title="Collaboration Status"
                total={employees.length}
              />
              <BarList
                items={skillTotals}
                title="Top Skills"
                total={Math.max(...skillTotals.map(([, value]) => value), 1)}
              />
            </section>
          </>
        ) : null}
      </div>
    </AppShell>
  )
}

export default AnalyticsPage
