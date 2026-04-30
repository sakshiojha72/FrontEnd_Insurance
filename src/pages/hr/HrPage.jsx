import { Link } from 'react-router-dom'

export default function HrPage() {
  return (
    <div className="space-y-8 p-6">
      <Link
        to="/"
        className="inline-block rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
      >
        ← Back
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Human Resources</h1>
        <p className="mt-1 text-sm text-slate-600">HR management and employee services</p>
      </div>

      <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-600">HR module coming soon...</p>
      </section>
    </div>
  )
}
