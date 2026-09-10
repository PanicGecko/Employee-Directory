const NETWORK_ERROR_MESSAGE =
  'We could not reach the employee directory. Please try again.'

const STATUS_MESSAGES = {
  400: 'Please check the information and try again.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to do that.',
  404: 'We could not find that record.',
  409: 'That change conflicts with existing directory data.',
  422: 'Please fix the highlighted fields and try again.',
}

function formatPath(location = []) {
  return location
    .filter((part) => part !== 'body' && part !== 'query' && part !== 'path')
    .join('.')
}

function normalizeValidationErrors(data) {
  const rawErrors = Array.isArray(data)
    ? data
    : Array.isArray(data?.detail)
      ? data.detail
      : Array.isArray(data?.errors)
        ? data.errors
        : []

  return rawErrors
    .map((item) => {
      if (typeof item === 'string') {
        return { field: '', message: item }
      }

      return {
        field: formatPath(item.loc || item.location || item.field || []),
        message: item.msg || item.message || 'Invalid value.',
      }
    })
    .filter((item) => item.message)
}

function buildValidationMessage(errors, fallback) {
  if (!errors.length) {
    return fallback
  }

  return errors
    .slice(0, 3)
    .map((item) => (item.field ? `${item.field}: ${item.message}` : item.message))
    .join(' ')
}

export function getApiErrorDetails(error, fallback = 'Something went wrong.') {
  if (!error?.response) {
    return {
      fieldErrors: {},
      message: NETWORK_ERROR_MESSAGE,
      status: 0,
      validationErrors: [],
    }
  }

  const status = error.response.status
  const body = error.response.data
  const backendMessage = typeof body?.msg === 'string' ? body.msg : ''
  const validationErrors = status === 422 ? normalizeValidationErrors(body?.data || body) : []
  const fieldErrors = Object.fromEntries(
    validationErrors
      .filter((item) => item.field)
      .map((item) => [item.field, item.message]),
  )
  const message =
    backendMessage ||
    (status === 422
      ? buildValidationMessage(validationErrors, STATUS_MESSAGES[422])
      : STATUS_MESSAGES[status]) ||
    (status >= 500
      ? 'The server had trouble completing that request. Please try again.'
      : fallback)

  return {
    fieldErrors,
    message,
    status,
    validationErrors,
  }
}

export function getApiErrorMessage(error, fallback) {
  return getApiErrorDetails(error, fallback).message
}
