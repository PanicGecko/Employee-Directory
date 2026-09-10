import { writeAuthData } from '../../apis/apiClient'
import { loginEmployee, logoutEmployee } from '../../apis/authApi'
import { getEmployee } from '../../apis/employeesApi'
import { getApiErrorMessage } from '../../utils/apiError'
import {
  loginFailed,
  loginStarted,
  loginSucceeded,
  logout,
  setAuthError,
} from '../authSlice'

function getLoginError(error) {
  return getApiErrorMessage(error, 'Sign in failed. Please try again.')
}

export function login({ email, password }) {
  return async (dispatch) => {
    const trimmedEmail = email.trim()

    if (!trimmedEmail) {
      dispatch(setAuthError('Please enter your email address.'))
      return { ok: false }
    }

    if (!password) {
      dispatch(setAuthError('Please enter your password.'))
      return { ok: false }
    }

    dispatch(loginStarted())

    try {
      const result = await loginEmployee({
        email: trimmedEmail,
        password,
      })
      const authData = result.data
      writeAuthData(authData)

      const fullEmployee = await getEmployee(authData.employee.public_id)
      const hydratedAuthData = {
        ...authData,
        employee: fullEmployee,
      }

      writeAuthData(hydratedAuthData)
      dispatch(loginSucceeded(hydratedAuthData))

      return {
        ok: true,
        data: hydratedAuthData,
      }
    } catch (error) {
      const message = getLoginError(error)
      dispatch(loginFailed(message))

      return {
        ok: false,
        error: message,
      }
    }
  }
}

export function logoutSession() {
  return async (dispatch, getState) => {
    const refreshToken =
      getState().auth.refreshToken || localStorage.getItem('refreshToken')

    try {
      if (refreshToken) {
        await logoutEmployee({ refreshToken })
      }

      dispatch(logout())

      return { ok: true }
    } catch (error) {
      dispatch(logout())

      return {
        ok: false,
        error: getApiErrorMessage(error, 'Signed out locally.'),
      }
    }
  }
}
