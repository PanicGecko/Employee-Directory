import apiClient from './apiClient'

export async function getFilterOptions() {
  const [departmentsResponse, officesResponse, skillsResponse] =
    await Promise.all([
      apiClient.get('/departments'),
      apiClient.get('/offices'),
      apiClient.get('/skills'),
    ])

  return {
    departments: departmentsResponse.data.data,
    offices: officesResponse.data.data,
    skills: skillsResponse.data.data,
  }
}
