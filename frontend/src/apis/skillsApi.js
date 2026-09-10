import apiClient from './apiClient'

export async function listSkills() {
  const response = await apiClient.get('/skills')

  return response.data.data
}

export async function searchSkills(name) {
  const response = await apiClient.get('/skills/search', {
    params: { name },
  })

  return response.data.data
}

export async function getEmployeeSkills(employeePublicId) {
  const response = await apiClient.get(`/skills/employee/${employeePublicId}`)

  return response.data.data
}

export async function createSkill(skill) {
  const response = await apiClient.post('/skills', skill)

  return response.data.data
}

export async function updateSkill(skillId, skill) {
  const response = await apiClient.put(`/skills/${skillId}`, skill)

  return response.data.data
}

export async function deleteSkill(skillId) {
  const response = await apiClient.delete(`/skills/${skillId}`)

  return response.data.data
}

export async function assignSkill(assignRequest) {
  const response = await apiClient.post('/skills/assign', assignRequest)

  return response.data.data
}

export async function updateSkillProficiency(employeePublicId, skillId, proficiency) {
  const response = await apiClient.put(
    `/skills/${employeePublicId}/proficiency/${skillId}`,
    { proficiency },
  )

  return response.data.data
}

export async function removeSkillFromEmployee(employeePublicId, skillId) {
  const response = await apiClient.delete(
    `/skills/${employeePublicId}/proficiency/${skillId}`,
  )

  return response.data.data
}
