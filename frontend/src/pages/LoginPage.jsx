import { useDispatch, useSelector } from 'react-redux'
import BrandLogo from '../components/BrandLogo'
import DecorativePanel from '../components/DecorativePanel'
import LoginForm from '../components/LoginForm'
import { login } from '../store/thunks/authThunks'

const REDIRECT_PATH = import.meta.env.VITE_LOGIN_REDIRECT_PATH || '/organization'

function LoginPage() {
  const dispatch = useDispatch()
  const { error, status } = useSelector((state) => state.auth)
  const isSubmitting = status === 'loading'

  async function handleLogin({ email, password }) {
    const result = await dispatch(login({ email, password }))

    if (result.ok) {
      window.location.assign(REDIRECT_PATH)
    }
  }

  return (
    <main className="relative min-h-svh overflow-x-hidden bg-white text-slate-950">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-28 hidden h-96 w-96 rounded-full bg-blue-100/60 blur-2xl lg:block"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 hidden h-[32rem] w-[32rem] rounded-full bg-blue-100/60 blur-3xl lg:block"
      />

      <div className="relative mx-auto flex min-h-svh w-full max-w-7xl flex-col px-6 py-7 sm:px-10 lg:px-16">
        <div className="grid flex-1 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="mx-auto w-full max-w-md lg:mx-0 lg:justify-self-center">
            <BrandLogo />

            <div className="mb-8 sm:mb-10">
              <h1 className="text-3xl font-bold leading-tight tracking-normal text-slate-950 sm:text-5xl">
                Sign in
              </h1>
              <p className="mt-3 max-w-sm text-base leading-7 text-slate-500 sm:mt-4 sm:text-lg sm:leading-8">
                Welcome back. Please sign in to continue to the employee
                directory.
              </p>
            </div>

            <LoginForm
              error={error}
              isSubmitting={isSubmitting}
              onSubmit={handleLogin}
            />
          </section>

          <DecorativePanel />
        </div>

        <footer className="mt-10 text-sm text-slate-500">
          <p>© 2026 Acme. All rights reserved.</p>
        </footer>
      </div>
    </main>
  )
}

export default LoginPage
