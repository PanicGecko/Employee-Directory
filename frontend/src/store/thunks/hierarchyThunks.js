import { getEmployeeHierarchy } from '../../apis/hierarchyApi'
import {
  hierarchyFailed,
  hierarchyStarted,
  hierarchySucceeded,
} from '../hierarchySlice'
import { getApiErrorMessage } from '../../utils/apiError'

export function loadHierarchy() {
  return async (dispatch) => {
    dispatch(hierarchyStarted())

    try {
      const result = await getEmployeeHierarchy()
      dispatch(hierarchySucceeded(result.data))

      return {
        ok: true,
        data: result.data,
      }
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        'Unable to load the organization hierarchy. Please try again.',
      )
      dispatch(hierarchyFailed(message))

      return {
        ok: false,
        error: message,
      }
    }
  }
}
