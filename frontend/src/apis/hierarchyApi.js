import apiClient from './apiClient'

export async function getEmployeeHierarchy() {
  const response = await apiClient.get('/employees/hierarchy')

  return response.data
}
