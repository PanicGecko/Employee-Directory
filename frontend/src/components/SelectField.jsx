function SelectField({ children, label, ...props }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      <select
        {...props}
        className="mt-1 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
      >
        {children}
      </select>
    </label>
  )
}

export default SelectField
