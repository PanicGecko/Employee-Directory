import apiClient from './apiClient'

export async function listEmployees(params = {}) {
  const response = await apiClient.get('/employees', { params })

  return response.data.data
}

export async function getEmployee(publicId) {
  const response = await apiClient.get(`/employees/${publicId}`)

  return response.data.data
}

export async function createEmployee(employee) {
  const response = await apiClient.post('/admin/employees', employee)

  return response.data.data
}

export async function updateOwnProfile(profile) {
  const response = await apiClient.patch('/employees/me', profile)

  return response.data.data
}

export async function updateEmployee(publicId, profile) {
  const response = await apiClient.patch(`/employees/${publicId}`, profile)

  return response.data.data
}

export async function updateSubordinateProfile(publicId, profile) {
  const response = await apiClient.patch(`/employees/${publicId}/profile`, profile)

  return response.data.data
}

export async function activateEmployee(publicId) {
  const response = await apiClient.patch(`/employees/${publicId}/activate`)

  return response.data.data
}

export async function deactivateEmployee(publicId) {
  const response = await apiClient.patch(`/employees/${publicId}/deactivate`)

  return response.data.data
}

export async function assignEmployeeManager(publicId, managerPublicId) {
  const response = await apiClient.patch(`/employees/${publicId}/manager`, {
    manager_public_id: managerPublicId,
  })

  return response.data.data
}

export async function getDirectReports(publicId) {
  const response = await apiClient.get(`/employees/${publicId}/direct-reports`)

  return response.data.data
}

export async function getEmployeeManager(publicId) {
  const response = await apiClient.get(`/employees/${publicId}/manager`)

  return response.data.data
}

export async function getEmployeeDescendants(publicId) {
  const response = await apiClient.get(`/employees/${publicId}/descendants`)

  return response.data.data
}
