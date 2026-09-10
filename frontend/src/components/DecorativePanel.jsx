function DecorativePanel() {
  return (
    <section
      className="relative hidden min-h-[34rem] overflow-hidden border-l border-slate-200 pl-24 lg:flex lg:items-center"
      aria-label="Employee directory message"
    >
      <div
        aria-hidden="true"
        className="absolute -right-52 top-1/2 h-[38rem] w-[38rem] -translate-y-1/2 rounded-full bg-blue-100/60"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-28 right-4 h-96 w-96 rounded-full bg-blue-200/35"
      />
      <div className="relative max-w-xs">
        <h2 className="text-3xl font-bold leading-tight tracking-normal text-slate-500">
          People
          <br />
          Move Us Forward
        </h2>
        <div className="my-7 h-0.5 w-8 rounded-full bg-blue-500" />
        <p className="text-lg leading-8 text-slate-500">
          A connected team builds a brighter tomorrow.
        </p>
      </div>
    </section>
  )
}

export default DecorativePanel
