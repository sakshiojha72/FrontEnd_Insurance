// MyClaimsPage.jsx
// Employee can: raise a new claim + view their own claims history
// POST /finsecure/insurance/claims  (raise)
// GET  /finsecure/insurance/claims/my  (view own)

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { raiseClaim, getMyClaims } from './api'

export default function MyClaimsPage() {
  // Form fields for raising a claim
  const [insId, setInsId] = useState('')        // employeeInsuranceId
  const [amount, setAmount] = useState('')      // claimAmount
  const [reason, setReason] = useState('')      // reason

  // UI feedback
  const [msg, setMsg] = useState('')
  const [isError, setIsError] = useState(false)

  // Table data
  const [claims, setClaims] = useState([])

  // Load existing claims on page mount
  useEffect(() => {
    getMyClaims()
      .then(setClaims)
      .catch(e => {
        console.warn('Failed to load claims:', e.message)
        setClaims([])
      })
  }, [])

  async function handleRaise() {
    setMsg(''); setIsError(false)
    try {
      // employeeInsuranceId and claimAmount must be numbers
      await raiseClaim(Number(insId), Number(amount), reason)
      setMsg('Claim raised successfully!')
      setInsId(''); setAmount(''); setReason('')
      // Refresh the claims list
      getMyClaims().then(setClaims).catch(() => {})
    } catch (e) {
      setMsg(e.message)
      setIsError(true)
    }
  }

  return (
    <div className="space-y-8 p-6">
      <Link
        to="/insurance"
        className="inline-block rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
      >
        Back to Insurance Home
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My Claims</h1>
        <p className="mt-1 text-sm text-slate-600">Raise a new claim or view your claim history.</p>
      </div>

      {/* ── Raise Claim Form ─────────────────────────────────────────────── */}
      <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Raise a Claim</h2>
        <div className="space-y-3">

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Employee Insurance ID
            </label>
            {/* This is the ID of your insurance record, not your employee ID */}
            <input
              type="number"
              value={insId}
              onChange={e => setInsId(e.target.value)}
              placeholder="Your insurance record ID"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Claim Amount (₹)
            </label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Amount to claim"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Reason for the claim"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleRaise}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Submit Claim
          </button>

          {/* Success / Error message */}
          {msg && (
            <p className={`text-sm ${isError ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>
          )}
        </div>
      </section>

      {/* ── My Claims Table ──────────────────────────────────────────────── */}
      <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Claim History</h2>
        {claims.length === 0 ? (
          <p className="text-sm text-slate-500">No claims found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100">
                  {['Claim ID', 'Plan', 'Amount', 'Status', 'Reason', 'Raised At'].map(h => (
                    <th key={h} className="border border-slate-200 px-3 py-2 text-left font-medium text-slate-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {claims.map((c, i) => (
                  <tr key={c.claimId} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-200 px-3 py-2">{c.claimId}</td>
                    <td className="border border-slate-200 px-3 py-2">{c.planName}</td>
                    <td className="border border-slate-200 px-3 py-2">₹{c.claimAmount}</td>
                    <td className="border border-slate-200 px-3 py-2">{c.status}</td>
                    <td className="border border-slate-200 px-3 py-2">{c.reason}</td>
                    {/* Slice to show only date part of the timestamp */}
                    <td className="border border-slate-200 px-3 py-2">{c.raisedAt?.slice(0, 10) ?? '—'}</td>
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