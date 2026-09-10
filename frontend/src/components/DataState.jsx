function DataState({ error, isEmpty, isLoading, loadingText = 'Loading...', emptyText }) {
  if (isLoading) {
    return (
      <div className="grid min-h-64 place-items-center rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-500">
        {loadingText}
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid min-h-64 place-items-center rounded-2xl border border-rose-200 bg-rose-50 px-6 text-center">
        <div>
          <p className="text-lg font-bold text-rose-950">Something went wrong</p>
          <p className="mt-2 max-w-lg text-sm font-medium text-rose-700">
            {error}
          </p>
        </div>
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="grid min-h-64 place-items-center rounded-2xl border border-slate-200 bg-white px-6 text-center text-sm font-semibold text-slate-500">
        {emptyText || 'No records found.'}
      </div>
    )
  }

  return null
}

export default DataState
