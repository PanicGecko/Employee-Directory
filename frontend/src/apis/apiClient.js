import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
const AUTH_CHANGED_EVENT = 'employee-directory-auth-changed'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

let refreshPromise = null

function writeAuthData(authData) {
  localStorage.setItem('accessToken', authData.access_token)
  localStorage.setItem('refreshToken', authData.refresh_token)
  localStorage.setItem('tokenType', authData.token_type)
  localStorage.setItem('expiresIn', String(authData.expires_in))
  localStorage.setItem(
    'refreshTokenExpiresAt',
    authData.refresh_token_expires_at,
  )
  localStorage.setItem('employee', JSON.stringify(authData.employee))
  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT, { detail: authData }))
}

function clearAuthData() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('tokenType')
  localStorage.removeItem('expiresIn')
  localStorage.removeItem('refreshTokenExpiresAt')
  localStorage.removeItem('employee')
  window.dispatchEvent(new CustomEvent(AUTH_CHANGED_EVENT))
}

async function refreshAuthToken() {
  const refreshToken = localStorage.getItem('refreshToken')

  if (!refreshToken) {
    throw new Error('Missing refresh token')
  }

  const response = await apiClient.post('/auth/refresh', {
    refresh_token: refreshToken,
  })

  writeAuthData(response.data.data)

  return response.data.data.access_token
}

function redirectToLogin() {
  if (window.location.pathname !== '/login') {
    window.location.assign('/login')
  }
}

apiClient.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('accessToken')

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status
    const requestUrl = originalRequest?.url || ''
    const isAuthRequest = requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/refresh') ||
      requestUrl.includes('/auth/logout')

    if (
      status === 403 &&
      error.response?.data?.msg === 'Employee account is inactive'
    ) {
      clearAuthData()
      redirectToLogin()

      return Promise.reject(error)
    }

    if (
      !originalRequest ||
      status !== 401 ||
      isAuthRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    try {
      refreshPromise ||= refreshAuthToken().finally(() => {
        refreshPromise = null
      })

      const accessToken = await refreshPromise
      originalRequest.headers = originalRequest.headers || {}
      originalRequest.headers.Authorization = `Bearer ${accessToken}`

      return apiClient(originalRequest)
    } catch (refreshError) {
      clearAuthData()
      redirectToLogin()

      return Promise.reject(refreshError)
    }
  },
)

export { AUTH_CHANGED_EVENT, clearAuthData, writeAuthData }

export default apiClient
