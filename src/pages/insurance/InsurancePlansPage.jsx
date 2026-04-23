// InsurancePlansPage.jsx
// ADMIN and HR can view all insurance plans
// GET /finsecure/insurance/plans

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllPlans } from './api'

export default function InsurancePlansPage() {
  const [plans, setPlans] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    getAllPlans()
      .then(setPlans)
      .catch(e => {
        console.warn('Failed to load plans:', e.message)
        setPlans([])
        setError('Failed to load insurance plans')
      })
  }, [])

  return (
    <div className="space-y-8 p-6">
      <Link
        to="/insurance"
        className="inline-block rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
      >
        Back to Insurance Home
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">All Insurance Plans</h1>
        <p className="mt-1 text-sm text-slate-600">View all available insurance plans.</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
        {plans.length === 0 && !error ? (
          <p className="text-sm text-slate-500">Loading plans...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100">
                  {['Plan ID', 'Plan Name', 'Coverage Amount', 'Description', 'Status'].map(h => (
                    <th key={h} className="border border-slate-200 px-3 py-2 text-left font-medium text-slate-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plans.map((p, i) => (
                  <tr key={p.planId ?? p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-200 px-3 py-2">{p.planId ?? p.id}</td>
                    <td className="border border-slate-200 px-3 py-2">{p.planName}</td>
                    <td className="border border-slate-200 px-3 py-2">₹{p.coverageAmount}</td>
                    <td className="border border-slate-200 px-3 py-2">{p.description ?? '—'}</td>
                    {/* isActive is a boolean from backend — show Active or Inactive */}
                    <td className="border border-slate-200 px-3 py-2">{p.isActive ? 'Active' : 'Inactive'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}