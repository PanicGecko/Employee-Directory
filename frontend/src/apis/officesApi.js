import apiClient from './apiClient'

export async function listOffices() {
  const response = await apiClient.get('/offices')

  return response.data.data
}

export async function listActiveOffices() {
  const response = await apiClient.get('/offices/active')

  return response.data.data
}

export async function createOffice(office) {
  const response = await apiClient.post('/offices', office)

  return response.data.data
}

export async function updateOffice(officeId, office) {
  const response = await apiClient.patch(`/offices/${officeId}`, office)

  return response.data.data
}

export async function deleteOffice(officeId) {
  const response = await apiClient.delete(`/offices/${officeId}`)

  return response.data.data
}

export async function reactivateOffice(officeId) {
  const response = await apiClient.patch(`/offices/${officeId}/activate`)

  return response.data.data
}
