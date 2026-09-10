function StatCard({ label, value }) {
  return (
    <div className="min-w-32 rounded-xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm">
      <p className="text-xl font-bold text-slate-950">{value}</p>
      <p className="mt-1 text-sm font-medium text-slate-500">{label}</p>
    </div>
  )
}

export default StatCard
