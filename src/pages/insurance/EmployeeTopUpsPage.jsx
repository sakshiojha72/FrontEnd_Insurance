// EmployeeTopUpsPage.jsx
// ADMIN+HR: view employee's top-ups
// GET /finsecure/insurance/topups/employee/{id}

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEmployeeTopUps } from './api'

export default function EmployeeTopUpsPage() {
  const { employeeId } = useParams()
  const [topUps, setTopUps] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (employeeId) {
      getEmployeeTopUps(employeeId)
        .then(data => {
          setTopUps(data)
          setLoading(false)
        })
        .catch(e => {
          console.warn('Failed to load employee top-ups:', e.message)
          setTopUps([])
          setError('Failed to load employee top-ups')
          setLoading(false)
        })
    }
  }, [employeeId])

  return (
    <div className="space-y-8 p-6">
      <Link
        to="/insurance"
        className="inline-block rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
      >
        Back to Insurance Home
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Employee Top-Ups</h1>
        <p className="mt-1 text-sm text-slate-600">Top-up coverage for Employee ID: {employeeId}</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Loading top-ups...</p>
        ) : topUps.length === 0 ? (
          <p className="text-sm text-slate-500">No top-ups found for this employee.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-2 text-left font-medium text-slate-700">Top-Up Name</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-700">Coverage Amount</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-700">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-700">Purchased Date</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-700">Expiry Date</th>
                </tr>
              </thead>
              <tbody>
                {topUps.map((topUp) => (
                  <tr key={topUp.id} className="border-b border-slate-100">
                    <td className="px-4 py-2 font-medium text-slate-900">{topUp.topUpName}</td>
                    <td className="px-4 py-2 text-slate-700">₹{topUp.coverageAmount?.toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                        topUp.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {topUp.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-700">{topUp.purchasedAt}</td>
                    <td className="px-4 py-2 text-slate-700">{topUp.expiryDate}</td>
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