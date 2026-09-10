const NODE_WIDTH = 360
const HORIZONTAL_SPACING = 420
const VERTICAL_SPACING = 380

function walkHierarchy(node, depth, parentId, graph, leafIndexRef) {
  const employee = node.employee
  const nodeId = employee.public_id
  const directReports = node.direct_reports || []

  const childPositions = directReports.map((child) =>
    walkHierarchy(child, depth + 1, nodeId, graph, leafIndexRef),
  )

  let xPosition

  if (childPositions.length > 0) {
    xPosition =
      (Math.min(...childPositions) + Math.max(...childPositions)) / 2
  } else {
    xPosition = leafIndexRef.current * HORIZONTAL_SPACING
    leafIndexRef.current += 1
  }

  graph.nodes.push({
    id: nodeId,
    type: 'employeeCard',
    position: {
      x: xPosition,
      y: depth * VERTICAL_SPACING,
    },
    data: {
      employee,
      directReportsCount: directReports.length,
      isRoot: !parentId,
    },
  })

  if (parentId) {
    graph.edges.push({
      id: `${parentId}-${nodeId}`,
      source: parentId,
      target: nodeId,
      type: 'smoothstep',
      style: {
        stroke: '#9aa9c3',
        strokeWidth: 1.4,
      },
    })
  }

  return xPosition
}

export function buildHierarchyGraph(hierarchyNodes) {
  const graph = {
    edges: [],
    nodes: [],
  }
  const leafIndexRef = { current: 0 }

  hierarchyNodes.forEach((node) =>
    walkHierarchy(node, 0, null, graph, leafIndexRef),
  )

  if (graph.nodes.length === 0) {
    return graph
  }

  const minX = Math.min(...graph.nodes.map((node) => node.position.x))

  return {
    edges: graph.edges,
    nodes: graph.nodes.map((node) => ({
      ...node,
      position: {
        x: node.position.x - minX + 40,
        y: node.position.y + 35,
      },
    })),
  }
}

export function getHierarchyStats(hierarchyNodes) {
  const employees = []

  function collect(node) {
    employees.push(node.employee)
    ;(node.direct_reports || []).forEach(collect)
  }

  hierarchyNodes.forEach(collect)

  const departments = new Set(
    employees
      .map((employee) => employee.department?.name)
      .filter(Boolean),
  )
  const managers = employees.filter(
    (employee) => employee.role === 'manager' || employee.role === 'hr_admin',
  )

  return {
    departments: departments.size,
    employees: employees.length,
    managers: managers.length,
  }
}

export function getFirstEmployee(hierarchyNodes) {
  return hierarchyNodes[0]?.employee || null
}

export function findEmployeeById(hierarchyNodes, publicId) {
  let foundEmployee = null

  function visit(node) {
    if (foundEmployee) {
      return
    }

    if (node.employee.public_id === publicId) {
      foundEmployee = node.employee
      return
    }

    ;(node.direct_reports || []).forEach(visit)
  }

  hierarchyNodes.forEach(visit)

  return foundEmployee
}

export { NODE_WIDTH }
