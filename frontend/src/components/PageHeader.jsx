function PageHeader({ action, eyebrow, subtitle, title }) {
  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-600">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="break-words text-2xl font-bold tracking-normal text-slate-950 sm:text-3xl">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 max-w-3xl text-sm text-slate-500 sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="w-full sm:w-auto">{action}</div> : null}
    </div>
  )
}

export default PageHeader
