// Employee views their own insurance summary
// Calls GET /finsecure/insurance/summary/my

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyInsurance } from './api'

export default function MySummaryPage() {
  const [summary, setSummary] = useState(null)  // holds the summary object from backend
  const [error, setError] = useState('')         // holds error message if API call fails
  const [loading, setLoading] = useState(true)

  // Fetch summary when the page loads      
useEffect(() => {

  getMyInsurance()
    .then(data => {
      if (!data) {
        setSummary(null)
      } else {
        setSummary({
          planName: data.planName,
          baseAmount: data.coverageAmount ?? 0,
          claimAmount: data.approvedClaimAmount ?? data.approvedClaimsAmount ?? 0,          topUpCoverage: data.topUpCoverage ?? 0,
          remainingCoverage: data.remainingCoverage,
          insuranceStatus: data.status ?? data.insuranceStatus,
          expiryDate: data.expiryDate,
        })
      }
      setLoading(false)
    })
    .catch(e => {
      setError('Failed to load insurance summary')
      setLoading(false)
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
        <h1 className="text-2xl font-semibold text-slate-900">My Insurance Summary</h1>
        <p className="mt-1 text-sm text-slate-600">Your current insurance coverage details.</p>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && !error && (
        <p className="text-sm text-slate-500">Loading...</p>
      )}

      {/* Summary cards — same grid style as BankManagementPage */}
      {summary && (
        <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Coverage Details</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Plan Name</p>
              <p className="mt-1 font-medium text-slate-900">{summary.planName ?? '—'}</p>
            </div>

            
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Initial Base Amount</p>
              <p className="mt-1 font-medium text-slate-900">₹{summary.baseAmount ?? 0}</p>
            </div>

            {/* remainingCoverage = coverageAmount + topUpCoverage - approvedClaimsTotal */}
            <div className="rounded-md border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-600">Remaining Coverage</p>
              <p className="mt-1 font-medium text-blue-900">₹{summary.remainingCoverage ?? 0}</p>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Status</p>
              <p className="mt-1 font-medium text-slate-900">{summary.insuranceStatus ?? '—'}</p>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Expiry Date</p>
              <p className="mt-1 font-medium text-slate-900">{summary.expiryDate ?? '—'}</p>
            </div>

          </div>
        </section>
      )}
    </div>
  )
}