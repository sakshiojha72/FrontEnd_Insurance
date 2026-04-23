// EmployeeClaimsPage.jsx
// ADMIN+HR: view specific employee's claims
// GET /finsecure/insurance/claims/employee/{id}

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEmployeeClaims } from './api'

export default function EmployeeClaimsPage() {
  const { employeeId } = useParams()
  const [claims, setClaims] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (employeeId) {
      getEmployeeClaims(employeeId)
        .then(data => {
          setClaims(data)
          setLoading(false)
        })
        .catch(e => {
          console.warn('Failed to load employee claims:', e.message)
          setClaims([])
          setError('Failed to load employee claims')
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
        <h1 className="text-2xl font-semibold text-slate-900">Employee Claims</h1>
        <p className="mt-1 text-sm text-slate-600">Claims history for Employee ID: {employeeId}</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Loading claims...</p>
        ) : claims.length === 0 ? (
          <p className="text-sm text-slate-500">No claims found for this employee.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-4 py-2 text-left font-medium text-slate-700">Claim ID</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-700">Plan</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-700">Amount</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-700">Status</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-700">Reason</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-700">Raised Date</th>
                  <th className="px-4 py-2 text-left font-medium text-slate-700">Approved Date</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr key={claim.claimId} className="border-b border-slate-100">
                    <td className="px-4 py-2 font-medium text-slate-900">{claim.claimId}</td>
                    <td className="px-4 py-2 text-slate-700">{claim.planName}</td>
                    <td className="px-4 py-2 text-slate-700">₹{claim.claimAmount?.toLocaleString()}</td>
                    <td className="px-4 py-2">
                      <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                        claim.status === 'Approved'
                          ? 'bg-green-100 text-green-800'
                          : claim.status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-slate-700">{claim.reason}</td>
                    <td className="px-4 py-2 text-slate-700">{claim.raisedAt}</td>
                    <td className="px-4 py-2 text-slate-700">{claim.approvedAt || '-'}</td>
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