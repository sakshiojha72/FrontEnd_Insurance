// AllTopUpsPage.jsx
// ADMIN and HR can view all top-up plans
// GET /finsecure/insurance/topups/plans

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllTopUpPlans } from './api'

export default function AllTopUpsPage() {
  const [topUpPlans, setTopUpPlans] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    getAllTopUpPlans()
      .then(setTopUpPlans)
      .catch(e => {
        console.warn('Failed to load top-up plans:', e.message)
        setTopUpPlans([])
        setError('Failed to load top-up plans')
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
        <h1 className="text-2xl font-semibold text-slate-900">All Top-Up Plans</h1>
        <p className="mt-1 text-sm text-slate-600">View all available top-up plans.</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
        {topUpPlans.length === 0 && !error ? (
          <p className="text-sm text-slate-500">Loading top-up plans...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100">
                  {['Plan ID', 'Name', 'Extra Coverage', 'Price', 'Description', 'Status'].map(h => (
                    <th key={h} className="border border-slate-200 px-3 py-2 text-left font-medium text-slate-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topUpPlans.map((p, i) => (
                  <tr key={p.topUpPlanId ?? p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-200 px-3 py-2">{p.topUpPlanId ?? p.id}</td>
                    <td className="border border-slate-200 px-3 py-2">{p.topUpName}</td>
                    <td className="border border-slate-200 px-3 py-2">₹{p.additionalCoverage?.toLocaleString()}</td>
                    <td className="border border-slate-200 px-3 py-2">₹{p.price?.toLocaleString()}</td>
                    <td className="border border-slate-200 px-3 py-2">{p.description ?? '—'}</td>
                    {/* Assuming isActive exists like insurance plans */}
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