function Field({ label, ...props }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <input
        {...props}
        className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      />
    </label>
  )
}

export default Field
