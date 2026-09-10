export function getEmployeeName(employee) {
  return `${employee.first_name} ${employee.last_name}`.trim()
}

export function getEmployeeInitials(employee) {
  return `${employee.first_name?.[0] || ''}${employee.last_name?.[0] || ''}`
    .toUpperCase()
    .trim()
}

export function formatRole(role) {
  if (!role) {
    return 'Employee'
  }

  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function getLocation(employee) {
  const city = employee.office?.city || employee.city
  const state = employee.office?.state || employee.state

  return [city, state].filter(Boolean).join(', ')
}

export function formatField(value) {
  if (value === null || value === undefined || value === '') {
    return 'Not listed'
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  return String(value)
}
