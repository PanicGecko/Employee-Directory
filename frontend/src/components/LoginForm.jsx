import { useState } from 'react'
import FormField from './FormField'

function EmailIcon() {
  return (
    <svg
      aria-hidden="true"
      className="mr-4 h-6 w-6 flex-none text-slate-500"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M4 6.5h16v11H4z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path
        d="m4.5 7 7.5 6 7.5-6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      className="mr-4 h-6 w-6 flex-none text-slate-500"
      fill="none"
      viewBox="0 0 24 24"
    >
      <rect
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
        width="14"
        x="5"
        y="10"
      />
      <path
        d="M8 10V7.8a4 4 0 0 1 8 0V10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function VisibilityIcon({ visible }) {
  if (visible) {
    return (
      <svg
        aria-hidden="true"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          d="M3.5 12s3-5 8.5-5 8.5 5 8.5 5-3 5-8.5 5-8.5-5-8.5-5Z"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
        <circle
          cx="12"
          cy="12"
          r="2.5"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </svg>
    )
  }

  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="m4 4 16 16"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path
        d="M9.5 5.6A9.6 9.6 0 0 1 12 5c5.5 0 8.5 5 8.5 5a13.2 13.2 0 0 1-2.1 2.6M15 14.1A3 3 0 0 1 9.9 9M6.6 7.4A13.3 13.3 0 0 0 3.5 12s3 5 8.5 5a9.7 9.7 0 0 0 3.7-.7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      viewBox="0 0 24 24"
    >
      <path
        d="M5 12h14m-6-6 6 6-6 6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  )
}

function LoginForm({ error, isSubmitting, onSubmit }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit({ email, password })
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      <FormField
        autoComplete="email"
        disabled={isSubmitting}
        icon={<EmailIcon />}
        id="email"
        label="Email"
        name="email"
        onChange={(event) => setEmail(event.target.value)}
        placeholder="name@company.com"
        required
        type="email"
        value={email}
      />

      <FormField
        autoComplete="current-password"
        disabled={isSubmitting}
        icon={<LockIcon />}
        id="password"
        label="Password"
        name="password"
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Enter your password"
        required
        rightControl={
          <button
            type="button"
            className="ml-3 grid h-10 w-10 flex-none place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => setShowPassword((value) => !value)}
            disabled={isSubmitting}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
          >
            <VisibilityIcon visible={showPassword} />
          </button>
        }
        type={showPassword ? 'text' : 'password'}
        value={password}
      />

      {error ? (
        <p
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="flex min-h-14 w-full items-center justify-center gap-3 rounded-lg bg-blue-600 px-6 text-lg font-semibold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-blue-400 disabled:shadow-none"
        disabled={isSubmitting}
      >
        <span>{isSubmitting ? 'Signing in...' : 'Sign in'}</span>
        {isSubmitting ? (
          <span
            aria-hidden="true"
            className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white"
          />
        ) : (
          <ArrowIcon />
        )}
      </button>
    </form>
  )
}

export default LoginForm
