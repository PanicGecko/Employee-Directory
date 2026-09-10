import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Background,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import AppShell from '../components/AppShell'
import EmployeeFlowNode from '../components/EmployeeFlowNode'
import ProfilePanel from '../components/ProfilePanel'
import StatCard from '../components/StatCard'
import { getFilterOptions } from '../apis/filterOptionsApi'
import { loadHierarchy } from '../store/thunks/hierarchyThunks'
import {
  buildHierarchyGraph,
  findEmployeeById,
  getFirstEmployee,
  getHierarchyStats,
} from '../utils/hierarchyGraph'
import { getEmployeeName } from '../utils/employeeUtils'

const nodeTypes = {
  employeeCard: EmployeeFlowNode,
}

const proficiencyOptions = ['beginner', 'intermediate', 'advanced', 'expert']
const collaborationOptions = [
  {
    label: 'Open to collaborate',
    value: 'open',
  },
]

function getEmployeesFromHierarchy(hierarchyNodes) {
  const employees = []

  function collect(node) {
    employees.push(node.employee)
    ;(node.direct_reports || []).forEach(collect)
  }

  hierarchyNodes.forEach(collect)

  return employees
}

function employeeMatchesFilters(employee, filters) {
  const searchTerm = filters.search.trim().toLowerCase()
  const searchableEmployeeText = `${getEmployeeName(employee)} ${employee.email}`
    .toLowerCase()
  const searchMatches =
    !searchTerm || searchableEmployeeText.includes(searchTerm)
  const departmentMatches =
    !filters.department || employee.department?.name === filters.department
  const officeMatches = !filters.office || employee.office?.name === filters.office
  const skillMatches =
    !filters.skill ||
    (employee.skills || []).some((skill) => skill.skill_name === filters.skill)
  const proficiencyMatches =
    !filters.proficiency ||
    (employee.skills || []).some((skill) => {
      const skillNameMatches =
        !filters.skill || skill.skill_name === filters.skill

      return skillNameMatches && skill.proficiency === filters.proficiency
    })

  const collaborationMatches =
    !filters.collaboration ||
    employee.collaboration_status === filters.collaboration

  return (
    searchMatches &&
    departmentMatches &&
    officeMatches &&
    skillMatches &&
    proficiencyMatches &&
    collaborationMatches
  )
}

function FilterSelect({ getOptionLabel, label, onChange, options, value }) {
  return (
    <label className="w-full min-w-0 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:w-auto sm:min-w-40">
      {label}
      <select
        className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-700 shadow-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">All {label.toLowerCase()}</option>
        {options.map((option) => {
          const optionValue =
            typeof option === 'string' ? option : option.value
          const optionLabel = getOptionLabel
            ? getOptionLabel(option)
            : optionValue

          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          )
        })}
      </select>
    </label>
  )
}

function HierarchyFlow({
  focusedEmployeeIds,
  hasActiveFilters,
  hierarchyNodes,
  onSelectEmployee,
}) {
  const { fitView } = useReactFlow()
  const graph = useMemo(
    () => buildHierarchyGraph(hierarchyNodes),
    [hierarchyNodes],
  )
  const nodes = useMemo(
    () =>
      graph.nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isDimmed: hasActiveFilters && !focusedEmployeeIds.has(node.id),
        },
      })),
    [focusedEmployeeIds, graph.nodes, hasActiveFilters],
  )
  const edges = useMemo(
    () =>
      graph.edges.map((edge) => {
        const edgeFocused =
          focusedEmployeeIds.has(edge.source) || focusedEmployeeIds.has(edge.target)

        return {
          ...edge,
          animated: hasActiveFilters && edgeFocused,
          style: {
            ...edge.style,
            opacity: hasActiveFilters && !edgeFocused ? 0.18 : 1,
            stroke: hasActiveFilters && edgeFocused ? '#2563eb' : edge.style.stroke,
          },
        }
      }),
    [focusedEmployeeIds, graph.edges, hasActiveFilters],
  )

  useEffect(() => {
    window.requestAnimationFrame(() => {
      fitView({ padding: 0.18, duration: 0 })
    })
  }, [fitView, graph.nodes.length, hasActiveFilters, focusedEmployeeIds])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable
      panOnScroll
      onNodeClick={(_event, node) => onSelectEmployee(node.data.employee)}
      onNodeDoubleClick={(_event, node) => {
        window.location.href = `/employees/${node.data.employee.public_id}`
      }}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#e2e8f0" gap={28} size={1} />
    </ReactFlow>
  )
}

function HomePage() {
  const dispatch = useDispatch()
  const { error, nodes, status } = useSelector((state) => state.hierarchy)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null)
  const [filters, setFilters] = useState({
    collaboration: '',
    department: '',
    office: '',
    proficiency: '',
    search: '',
    skill: '',
  })
  const [filterOptions, setFilterOptions] = useState({
    departments: [],
    offices: [],
    skills: [],
  })
  const stats = useMemo(() => getHierarchyStats(nodes), [nodes])
  const employees = useMemo(() => getEmployeesFromHierarchy(nodes), [nodes])
  const hasActiveFilters = Boolean(
    filters.collaboration ||
      filters.department ||
      filters.office ||
      filters.proficiency ||
      filters.search.trim() ||
      filters.skill,
  )
  const focusedEmployeeIds = useMemo(
    () =>
      new Set(
        employees
          .filter((nextEmployee) =>
            employeeMatchesFilters(nextEmployee, filters),
          )
          .map((nextEmployee) => nextEmployee.public_id),
      ),
    [employees, filters],
  )

  useEffect(() => {
    dispatch(loadHierarchy())
  }, [dispatch])

  useEffect(() => {
    let isMounted = true

    async function loadFilterOptions() {
      try {
        const result = await getFilterOptions()

        if (!isMounted) {
          return
        }

        setFilterOptions({
          departments: result.departments
            .map((department) => department.name)
            .filter(Boolean)
            .sort(),
          offices: result.offices
            .map((office) => office.name)
            .filter(Boolean)
            .sort(),
          skills: result.skills
            .map((skill) => skill.name)
            .filter(Boolean)
            .sort(),
        })
      } catch {
        if (isMounted) {
          setFilterOptions({ departments: [], offices: [], skills: [] })
        }
      }
    }

    loadFilterOptions()

    return () => {
      isMounted = false
    }
  }, [])

  const selectedFromHierarchy =
    selectedEmployeeId && findEmployeeById(nodes, selectedEmployeeId)
  const selectedEmployee = selectedFromHierarchy || getFirstEmployee(nodes)

  return (
    <AppShell currentPath="/organization">
      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-4 overflow-visible lg:mt-5 xl:flex-row xl:overflow-hidden">
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <div className="shrink-0">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h1 className="text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">
                      Our Organization
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 sm:text-base">
                      People, teams, and ideas - all connected.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm">
                    {hasActiveFilters
                      ? `${focusedEmployeeIds.size} matching`
                      : 'All Employees'}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-end gap-3">
                  <StatCard label="Employees" value={stats.employees} />
                  <StatCard label="Departments" value={stats.departments} />
                  <StatCard label="Managers" value={stats.managers} />
                  <label className="w-full min-w-0 text-xs font-semibold uppercase tracking-wide text-slate-400 sm:w-auto sm:min-w-64">
                    Name or email
                    <input
                      className="mt-1 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold normal-case tracking-normal text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      placeholder="Search name or email"
                      value={filters.search}
                      onChange={(event) =>
                        setFilters((current) => ({
                          ...current,
                          search: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <FilterSelect
                    label="Departments"
                    options={filterOptions.departments}
                    value={filters.department}
                    onChange={(department) =>
                      setFilters((current) => ({ ...current, department }))
                    }
                  />
                  <FilterSelect
                    label="Offices"
                    options={filterOptions.offices}
                    value={filters.office}
                    onChange={(office) =>
                      setFilters((current) => ({ ...current, office }))
                    }
                  />
                  <FilterSelect
                    label="Skills"
                    options={filterOptions.skills}
                    value={filters.skill}
                    onChange={(skill) =>
                      setFilters((current) => ({ ...current, skill }))
                    }
                  />
                  <FilterSelect
                    label="Proficiency"
                    options={proficiencyOptions}
                    value={filters.proficiency}
                    onChange={(proficiency) =>
                      setFilters((current) => ({ ...current, proficiency }))
                    }
                  />
                  <FilterSelect
                    label="Collaboration"
                    options={collaborationOptions}
                    value={filters.collaboration}
                    getOptionLabel={(option) => option.label}
                    onChange={(collaboration) =>
                      setFilters((current) => ({ ...current, collaboration }))
                    }
                  />
                  {hasActiveFilters ? (
                    <button
                      type="button"
                      className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-blue-200 hover:text-blue-600"
                      onClick={() =>
                        setFilters({
                          collaboration: '',
                          department: '',
                          office: '',
                          proficiency: '',
                          search: '',
                          skill: '',
                        })
                      }
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>

              <section className="mt-4 min-h-[520px] flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-inner shadow-slate-100 xl:min-h-0">
                {status === 'loading' ? (
                  <div className="grid h-full place-items-center text-sm font-semibold text-slate-500">
                    Loading organization hierarchy...
                  </div>
                ) : null}

                {status === 'failed' ? (
                  <div className="grid h-full place-items-center px-6 text-center">
                    <div>
                      <p className="text-lg font-bold text-slate-950">
                        Unable to load hierarchy
                      </p>
                      <p className="mt-2 max-w-md text-sm text-slate-500">
                        {error}
                      </p>
                    </div>
                  </div>
                ) : null}

                {status === 'succeeded' && nodes.length === 0 ? (
                  <div className="grid h-full place-items-center text-sm font-semibold text-slate-500">
                    No employees are available in the hierarchy yet.
                  </div>
                ) : null}

                {status === 'succeeded' && nodes.length > 0 ? (
                  <ReactFlowProvider>
                    <HierarchyFlow
                      focusedEmployeeIds={focusedEmployeeIds}
                      hasActiveFilters={hasActiveFilters}
                      hierarchyNodes={nodes}
                      onSelectEmployee={(nextEmployee) =>
                        setSelectedEmployeeId(nextEmployee.public_id)
                      }
                    />
                  </ReactFlowProvider>
                ) : null}
              </section>
            </div>

            <div className="grid content-start gap-3">
              <ProfilePanel employee={selectedEmployee} />
              {selectedEmployee ? (
                <a
                  className="rounded-2xl bg-blue-600 px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-blue-700"
                  href={`/employees/${selectedEmployee.public_id}`}
                >
                  View full profile
                </a>
              ) : null}
            </div>
      </div>
    </AppShell>
  )
}

export default HomePage
