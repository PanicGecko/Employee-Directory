import apiClient from './apiClient'

export async function listAuditLogs(params = {}) {
  const response = await apiClient.get('/audit-logs', { params })

  return response.data.data
}
