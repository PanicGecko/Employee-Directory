import apiClient from './apiClient'

export async function listDepartments() {
  const response = await apiClient.get('/departments')

  return response.data.data
}

export async function listActiveDepartments() {
  const response = await apiClient.get('/departments/active')

  return response.data.data
}

export async function createDepartment(department) {
  const response = await apiClient.post('/departments', department)

  return response.data.data
}

export async function updateDepartment(departmentId, department) {
  const response = await apiClient.patch(`/departments/${departmentId}`, department)

  return response.data.data
}

export async function deleteDepartment(departmentId) {
  const response = await apiClient.delete(`/departments/${departmentId}`)

  return response.data.data
}

export async function reactivateDepartment(departmentId) {
  const response = await apiClient.patch(`/departments/${departmentId}/activate`)

  return response.data.data
}
