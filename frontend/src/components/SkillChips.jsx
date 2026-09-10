const proficiencyStyles = {
  advanced: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  beginner: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  expert: 'border-purple-200 bg-purple-50 text-purple-700',
  intermediate: 'border-amber-200 bg-amber-50 text-amber-700',
}

function getSkillStyle(proficiency) {
  return (
    proficiencyStyles[proficiency] ||
    'border-slate-200 bg-slate-50 text-slate-600'
  )
}

function SkillChips({ compact = false, skills = [] }) {
  if (skills.length === 0) {
    return (
      <span className="inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-500">
        No skills listed
      </span>
    )
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {skills.map((skill) => (
        <span
          key={`${skill.skill_id}-${skill.skill_name}`}
          className={`inline-flex rounded-lg border px-2.5 py-1 text-xs font-semibold ${getSkillStyle(
            skill.proficiency,
          )}`}
          title={`${skill.skill_name} - ${skill.proficiency}`}
        >
          {skill.skill_name}
          {compact ? null : (
            <span className="ml-1 opacity-70">· {skill.proficiency}</span>
          )}
        </span>
      ))}
    </div>
  )
}

export default SkillChips
