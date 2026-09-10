import AppShell from '../components/AppShell'
import PageHeader from '../components/PageHeader'

function NotFoundPage() {
  return (
    <AppShell currentPath="">
      <div className="mt-3 min-h-0 flex-1 overflow-visible lg:mt-5 lg:overflow-y-auto">
        <PageHeader
          title="Page Not Found"
          subtitle="That page does not exist in the employee directory."
        />
        <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            Nothing lives here yet
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Use the main navigation or return to the organization homepage.
          </p>
          <a
            className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
            href="/organization"
          >
            Go to Organization
          </a>
        </section>
      </div>
    </AppShell>
  )
}

export default NotFoundPage
