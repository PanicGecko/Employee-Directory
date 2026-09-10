import AppShell from '../components/AppShell'
import PageHeader from '../components/PageHeader'

function ForbiddenPage() {
  return (
    <AppShell currentPath="">
      <div className="mt-3 min-h-0 flex-1 overflow-visible lg:mt-5 lg:overflow-y-auto">
        <PageHeader
          title="Access Denied"
          subtitle="This area is only available to people with the right role."
        />
        <section className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800 shadow-sm">
          <h2 className="text-lg font-bold">You do not have permission</h2>
          <p className="mt-2 text-sm font-semibold">
            The backend remains the source of truth for access. Head back to the
            organization page or sign in with an admin account.
          </p>
          <a
            className="mt-5 inline-flex rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700"
            href="/organization"
          >
            Go to Organization
          </a>
        </section>
      </div>
    </AppShell>
  )
}

export default ForbiddenPage
