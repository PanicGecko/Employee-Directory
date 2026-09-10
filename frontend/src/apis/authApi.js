import apiClient from './apiClient'

export async function loginEmployee({ email, password }) {
  const response = await apiClient.post('/auth/login', {
    email,
    password,
  })

  return response.data
}

export async function refreshEmployeeTokens({ refreshToken }) {
  const response = await apiClient.post('/auth/refresh', {
    refresh_token: refreshToken,
  })

  return response.data
}

export async function logoutEmployee({ refreshToken }) {
  const response = await apiClient.post('/auth/logout', {
    refresh_token: refreshToken,
  })

  return response.data
}
