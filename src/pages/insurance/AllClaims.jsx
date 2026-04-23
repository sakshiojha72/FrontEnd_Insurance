// AllClaimsPage.jsx
// ADMIN: view all claims + approve/reject them
// HR: view all claims (read-only, no approve/reject buttons)
// GET /finsecure/insurance/claims?status=X
// PUT /finsecure/insurance/claims/status

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllClaims, updateClaimStatus } from './api'

export default function AllClaimsPage() {
  const userRole = localStorage.getItem('jwt_role') || ''
  const isAdmin = userRole.toUpperCase() === 'ADMIN'

  const [claims, setClaims] = useState([])
  const [filterStatus, setFilterStatus] = useState('')   // '', 'PENDING', 'APPROVED', 'REJECTED'

  // Approve/reject form fields
  const [claimId, setClaimId] = useState('')
  const [decision, setDecision] = useState('APPROVED')
  const [remarks, setRemarks] = useState('')
  const [msg, setMsg] = useState('')
  const [isError, setIsError] = useState(false)

  // Reload claims whenever filter changes
  useEffect(() => {
    getAllClaims(filterStatus || undefined)
      .then(setClaims)
      .catch(e => {
        console.warn('Failed to load claims:', e.message)
        setClaims([])
      })
  }, [filterStatus])

  async function handleDecision() {
    setMsg(''); setIsError(false)
    try {
      await updateClaimStatus(Number(claimId), decision, remarks)
      setMsg(`Claim ${decision.toLowerCase()} successfully!`)
      setClaimId(''); setRemarks('')
      // Refresh the table
      getAllClaims(filterStatus || undefined).then(setClaims).catch(() => {})
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
        <h1 className="text-2xl font-semibold text-slate-900">All Claims</h1>
        <p className="mt-1 text-sm text-slate-600">
          {isAdmin ? 'View and approve or reject claims.' : 'Read-only view of all claims.'}
        </p>
      </div>

      {/* ── Filter ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-700">Filter by status:</label>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
        >
          <option value="">All</option>
          <option value="PENDING">PENDING</option>
          <option value="APPROVED">APPROVED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
      </div>

      {/* ── Claims Table ─────────────────────────────────────────────────── */}
      <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
        {claims.length === 0 ? (
          <p className="text-sm text-slate-500">No claims found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100">
                  {['Claim ID', 'Employee', 'Plan', 'Amount', 'Status', 'Reason', 'Remarks'].map(h => (
                    <th key={h} className="border border-slate-200 px-3 py-2 text-left font-medium text-slate-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {claims.map((c, i) => (
                  <tr key={c.claimId} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-200 px-3 py-2">{c.claimId}</td>
                    <td className="border border-slate-200 px-3 py-2">{c.employeeName}</td>
                    <td className="border border-slate-200 px-3 py-2">{c.planName}</td>
                    <td className="border border-slate-200 px-3 py-2">₹{c.claimAmount}</td>
                    <td className="border border-slate-200 px-3 py-2">{c.status}</td>
                    <td className="border border-slate-200 px-3 py-2">{c.reason}</td>
                    <td className="border border-slate-200 px-3 py-2">{c.adminRemarks ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Approve / Reject Form — ADMIN only ───────────────────────────── */}
      {isAdmin && (
        <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Approve / Reject a Claim</h2>
          <div className="space-y-3">

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Claim ID</label>
              <input
                type="number"
                value={claimId}
                onChange={e => setClaimId(e.target.value)}
                placeholder="Claim ID from the table above"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Decision</label>
              <select
                value={decision}
                onChange={e => setDecision(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
              >
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Admin Remarks</label>
              <input
                type="text"
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Optional remarks"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleDecision}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Submit Decision
            </button>

            {msg && (
              <p className={`text-sm ${isError ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>
            )}
          </div>
        </section>
      )}
    </div>
  )
}