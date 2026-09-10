import { createSlice } from '@reduxjs/toolkit'

function readStoredEmployee() {
  const storedEmployee = localStorage.getItem('employee')

  if (!storedEmployee) {
    return null
  }

  try {
    return JSON.parse(storedEmployee)
  } catch {
    localStorage.removeItem('employee')
    return null
  }
}

function clearStoredAuthData() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('tokenType')
  localStorage.removeItem('expiresIn')
  localStorage.removeItem('refreshTokenExpiresAt')
  localStorage.removeItem('employee')
}

const initialState = {
  accessToken: localStorage.getItem('accessToken'),
  refreshToken: localStorage.getItem('refreshToken'),
  tokenType: localStorage.getItem('tokenType'),
  expiresIn: localStorage.getItem('expiresIn'),
  refreshTokenExpiresAt: localStorage.getItem('refreshTokenExpiresAt'),
  employee: readStoredEmployee(),
  error: '',
  status:
    localStorage.getItem('accessToken') || localStorage.getItem('refreshToken')
      ? 'authenticated'
      : 'idle',
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = ''
    },
    loginFailed(state, action) {
      state.status = 'failed'
      state.error = action.payload || 'Sign in failed. Please try again.'
    },
    loginStarted(state) {
      state.status = 'loading'
      state.error = ''
    },
    loginSucceeded(state, action) {
      state.status = 'authenticated'
      state.accessToken = action.payload.access_token
      state.refreshToken = action.payload.refresh_token
      state.tokenType = action.payload.token_type
      state.expiresIn = String(action.payload.expires_in)
      state.refreshTokenExpiresAt = action.payload.refresh_token_expires_at
      state.employee = action.payload.employee
    },
    refreshSucceeded(state, action) {
      state.status = 'authenticated'
      state.accessToken = action.payload.access_token
      state.refreshToken = action.payload.refresh_token
      state.tokenType = action.payload.token_type
      state.expiresIn = String(action.payload.expires_in)
      state.refreshTokenExpiresAt = action.payload.refresh_token_expires_at
      state.employee = action.payload.employee
      state.error = ''
    },
    logout(state) {
      clearStoredAuthData()
      state.accessToken = null
      state.refreshToken = null
      state.tokenType = null
      state.expiresIn = null
      state.refreshTokenExpiresAt = null
      state.employee = null
      state.error = ''
      state.status = 'idle'
    },
    setAuthError(state, action) {
      state.error = action.payload
    },
    updateAuthenticatedEmployee(state, action) {
      state.employee = action.payload
      localStorage.setItem('employee', JSON.stringify(action.payload))
    },
  },
})

export const {
  clearAuthError,
  loginFailed,
  loginStarted,
  loginSucceeded,
  logout,
  refreshSucceeded,
  setAuthError,
  updateAuthenticatedEmployee,
} = authSlice.actions

export default authSlice.reducer
