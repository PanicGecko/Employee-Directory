function FormField({
  autoComplete,
  disabled,
  icon,
  id,
  label,
  name,
  onChange,
  placeholder,
  required = false,
  rightControl,
  type,
  value,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-3 block text-base font-semibold text-slate-950"
      >
        {label}
      </label>
      <div className="flex min-h-14 items-center rounded-lg border border-slate-300 bg-white px-4 shadow-sm shadow-slate-200/30 transition focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-100">
        {icon}
        <input
          id={id}
          name={name}
          type={type}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="h-14 w-full bg-transparent text-base text-slate-950 outline-none placeholder:text-slate-400"
          disabled={disabled}
          required={required}
        />
        {rightControl}
      </div>
    </div>
  )
}

export default FormField
