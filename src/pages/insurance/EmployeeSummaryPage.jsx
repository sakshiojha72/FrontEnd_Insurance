// EmployeeSummaryPage.jsx
// ADMIN+HR: view any employee summary
// GET /finsecure/insurance/summary/{employeeId}

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEmployeeSummary } from './api'

export default function EmployeeSummaryPage() {
  const { employeeId } = useParams()
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (employeeId) {
      getEmployeeSummary(employeeId)
        .then(data => {
          setSummary(data)
          setLoading(false)
        })
        .catch(e => {
          console.warn('Failed to load employee summary:', e.message)
          setSummary(null)
          setError('Failed to load employee summary')
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
        <h1 className="text-2xl font-semibold text-slate-900">Employee Insurance Summary</h1>
        <p className="mt-1 text-sm text-slate-600">Complete coverage summary for Employee ID: {employeeId}</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading summary...</p>
      ) : summary ? (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Coverage Details */}
          <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Coverage Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Plan Name:</span>
                <span className="font-medium text-slate-900">{summary.planName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Base Coverage:</span>
                <span className="font-medium text-slate-900">₹{summary.coverageAmount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Top-up Coverage:</span>
                <span className="font-medium text-slate-900">₹{summary.topUpCoverage?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Approved Claims:</span>
                <span className="font-medium text-red-600">-₹{summary.approvedClaimsTotal?.toLocaleString()}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between">
                <span className="text-sm font-medium text-slate-700">Remaining Coverage:</span>
                <span className="text-lg font-bold text-green-600">₹{summary.remainingCoverage?.toLocaleString()}</span>
              </div>
            </div>
          </section>

          {/* Status & Dates */}
          <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">Status & Validity</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Insurance Status:</span>
                <span className={`font-medium ${
                  summary.insuranceStatus === 'Active' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {summary.insuranceStatus}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Expiry Date:</span>
                <span className="font-medium text-slate-900">{summary.expiryDate}</span>
              </div>
            </div>
          </section>
        </div>
      ) : (
        <p className="text-sm text-slate-500">No summary found for this employee.</p>
      )}
    </div>
  )
}