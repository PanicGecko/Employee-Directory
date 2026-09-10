import AppShell from '../components/AppShell'
import PageHeader from '../components/PageHeader'

function HelpPage() {
  return (
    <AppShell currentPath="/help">
      <div className="mt-3 min-h-0 flex-1 overflow-visible lg:mt-5 lg:overflow-y-auto">
        <PageHeader
          title="Help"
          subtitle="Use the directory to find colleagues, reporting lines, contact details, availability, and expertise."
        />

        <section className="mt-5 grid gap-4 md:grid-cols-2">
          {[
            ['Find people', 'Use Directory filters to search by name, email, department, office, availability, skills, and proficiency.'],
            ['Understand hierarchy', 'Use Home to inspect the organization tree and select employees for full profile details.'],
            ['Maintain data', 'HR admins can manage employees, departments, offices, and skills from their dedicated pages.'],
            ['Update yourself', 'Use Settings to keep your own contact, work mode, and collaboration status current.'],
          ].map(([title, description]) => (
            <article
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-bold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm font-medium text-slate-500">
                {description}
              </p>
            </article>
          ))}
        </section>
      </div>
    </AppShell>
  )
}

export default HelpPage
