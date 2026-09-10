import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import AppShell from '../components/AppShell'
import DataState from '../components/DataState'
import Field from '../components/Field'
import PageHeader from '../components/PageHeader'
import {
  loadSkills,
  removeSkill,
  saveSkill,
} from '../store/thunks/directoryThunks'

const emptySkill = { description: '', name: '' }

function getMessageTone(message) {
  if (!message) {
    return 'info'
  }

  return /unable|cannot|failed|required|error/i.test(message) ? 'error' : 'info'
}

function SkillsPage() {
  const dispatch = useDispatch()
  const currentEmployee = useSelector((state) => state.auth.employee)
  const skills = useSelector((state) => state.directory.skills)
  const isAdmin = currentEmployee?.role === 'hr_admin'
  const [editingSkill, setEditingSkill] = useState(null)
  const [form, setForm] = useState(emptySkill)
  const [message, setMessage] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [skillToDelete, setSkillToDelete] = useState(null)
  const messageTone = getMessageTone(message)

  useEffect(() => {
    dispatch(loadSkills())
  }, [dispatch])

  async function handleSubmit(event) {
    event.preventDefault()
    setMessage('')

    const name = form.name.trim()

    if (!name) {
      setMessage('Skill name is required.')
      return
    }

    setIsSubmitting(true)

    const result = await dispatch(
      saveSkill(
        {
          description: form.description.trim() || null,
          name,
        },
        editingSkill?.id,
      ),
    )

    setIsSubmitting(false)
    setMessage(result.ok ? 'Skill saved.' : result.error)
    if (result.ok) {
      setEditingSkill(null)
      setForm(emptySkill)
    }
  }

  async function handleDelete() {
    if (!skillToDelete) {
      return
    }

    setMessage('')
    setIsDeleting(true)
    const result = await dispatch(removeSkill(skillToDelete.id))
    setIsDeleting(false)
    setSkillToDelete(null)
    setMessage(
      result.ok
        ? 'Skill deleted.'
        : result.error ||
            'Unable to delete skill. It may still be assigned to employees.',
    )
  }

  return (
    <AppShell currentPath="/skills">
      <div className="mt-3 min-h-0 flex-1 overflow-visible lg:mt-5 lg:overflow-y-auto">
        <PageHeader
          title="Skills"
          subtitle="Maintain the skills catalog used for expertise discovery and collaboration matching."
        />

        {skills.status === 'succeeded' ? (
          <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Catalog Skills
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-950">
              {skills.items.length}
            </p>
          </section>
        ) : null}

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
          <section>
            <DataState
              error={skills.error}
              isEmpty={skills.status === 'succeeded' && skills.items.length === 0}
              isLoading={skills.status === 'loading'}
              loadingText="Loading skills..."
              emptyText="No skills have been created yet."
            />

            {skills.status === 'succeeded' && skills.items.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-3">
                {skills.items.map((skill) => (
                  <article
                    key={skill.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <h2 className="text-lg font-bold text-slate-950">
                      {skill.name}
                    </h2>
                    <p className="mt-2 text-sm font-medium text-slate-500">
                      {skill.description || 'No description provided.'}
                    </p>

                    {isAdmin ? (
                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
                          onClick={() => {
                            setEditingSkill(skill)
                            setForm(skill)
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-rose-200 hover:text-rose-600"
                          onClick={() => setSkillToDelete(skill)}
                        >
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : null}
          </section>

          <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-950">
              {editingSkill ? 'Edit Skill' : 'Create Skill'}
            </h2>
            {isAdmin ? (
              <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
                <Field
                  label="Name"
                  required
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                />
                <Field
                  label="Description"
                  value={form.description || ''}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </button>
                  {editingSkill ? (
                    <button type="button" className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600" onClick={() => {
                      setEditingSkill(null)
                      setForm(emptySkill)
                    }}>Cancel</button>
                  ) : null}
                </div>
              </form>
            ) : (
              <p className="mt-3 text-sm font-medium text-slate-500">
                You can view skills. Skill catalog changes are limited to HR
                admins.
              </p>
            )}
            {message ? (
              <p
                className={`mt-4 rounded-xl p-3 text-sm font-semibold ${
                  messageTone === 'error'
                    ? 'bg-rose-50 text-rose-700'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                {message}
              </p>
            ) : null}
          </aside>
        </div>

        {skillToDelete ? (
          <div className="fixed inset-0 z-20 grid place-items-center bg-slate-950/30 p-4">
            <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
              <h2 className="text-lg font-bold text-slate-950">
                Delete Skill
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-500">
                Delete {skillToDelete.name}? The backend will block this if the
                skill is assigned to any employees.
              </p>
              <div className="mt-5 flex justify-end gap-3">
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-blue-200 hover:text-blue-600"
                  onClick={() => setSkillToDelete(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
                  disabled={isDeleting}
                  onClick={handleDelete}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </section>
          </div>
        ) : null}
      </div>
    </AppShell>
  )
}

export default SkillsPage
