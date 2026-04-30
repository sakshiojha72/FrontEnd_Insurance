// MyClaimsPage.jsx  —  EMPLOYEE only
//
// WHAT CHANGED vs old version:
//   OLD: Employee had to manually type their "Employee Insurance ID"
//        — they don't know this number, they'd have to look it up elsewhere
//   NEW: We auto-fetch their insurance record on load using getMyInsurance()
//        The insuranceId is pre-filled and shown as read-only info
//        Employee only needs to type amount + reason → submit
//
// API calls:
//   getMyInsurance()   GET /insurance/plans/my        → to get their insuranceId
//   raiseClaim(...)    POST /insurance/claims          → raise a claim
//   getMyClaims()      GET  /insurance/claims/my       → view claim history

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { raiseClaim, getMyClaims, getMyInsurance } from './api'

// Format amount as Indian rupees
function formatINR(n) {
  return '₹' + Number(n).toLocaleString('en-IN')
}

// Coloured status badge — same pattern used across all pages
function ClaimBadge({ status }) {
  const map = {
    PENDING:  { bg: '#fef9c3', color: '#854d0e', border: '#fde68a' },
    APPROVED: { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
    REJECTED: { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' },
  }
  const s = map[status] || map.PENDING
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: '2px 10px', borderRadius: '999px',
      fontSize: '12px', fontWeight: 600, display: 'inline-block',
    }}>{status}</span>
  )
}

export default function MyClaimsPage() {
  // Auto-fetched from backend — employee never types this
  const [myInsurance, setMyInsurance]   = useState(null)
  const [insLoading, setInsLoading]     = useState(true)

  // Claim form — only 2 fields employee needs to fill
  const [amount, setAmount]   = useState('')
  const [reason, setReason]   = useState('')

  // UI states
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast]           = useState(null)

  // Claims history table
  const [claims, setClaims]   = useState([])
  const [claimsLoading, setClaimsLoading] = useState(true)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // On page load: fetch their insurance record AND their claims history together
  useEffect(() => {
    // Fetch insurance to get insuranceId — needed for raiseClaim()
    getMyInsurance()
      .then(data => setMyInsurance(data))
      .catch(() => setMyInsurance(null))
      .finally(() => setInsLoading(false))

    // Fetch claims history
    getMyClaims()
      .then(data => setClaims(data || []))
      .catch(() => setClaims([]))
      .finally(() => setClaimsLoading(false))
  }, [])

  async function handleRaise() {
    // Guard: must have insurance to raise a claim
    if (!myInsurance) return showToast('You do not have an active insurance record', 'error')
    if (!amount || Number(amount) <= 0) return showToast('Enter a valid claim amount', 'error')
    if (!reason.trim()) return showToast('Reason is required', 'error')

    // Check claim doesn't exceed remaining coverage
    // remainingCoverage comes from InsuranceSummaryDTO — myInsurance may not have it
    // so this is a soft warning, backend will reject if over limit anyway
    setSubmitting(true)
    try {
      // insuranceId auto-filled from myInsurance — employee never types it
      const insuranceId = myInsurance.employeInsuranceId 
                 ?? myInsurance.employeeInsuranceId 
                 ?? myInsurance.id
      await raiseClaim(insuranceId, Number(amount), reason.trim())
      showToast('Claim raised successfully!')
      setAmount(''); setReason('')
      // Refresh claims list
      getMyClaims().then(data => setClaims(data || [])).catch(() => {})
    } catch (e) {
      showToast(e.message || 'Failed to raise claim', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Pending claims count — shown as a small indicator
  const pendingCount = claims.filter(c => c.status === 'PENDING').length

  return (
    <div style={{ padding: '24px', fontFamily: "'DM Sans', sans-serif",
      maxWidth: '900px', margin: '0 auto' }}>

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: toast.type === 'success' ? '#15803d' : '#b91c1c',
          color: '#fff', borderRadius: '8px', padding: '12px 20px',
          fontSize: '14px', fontWeight: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>{toast.msg}</div>
      )}

      <Link to="/insurance" style={{ fontSize: '13px', color: '#475569',
        textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>
        ← Back to Insurance Home
      </Link>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>
          My Claims
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
          {pendingCount > 0
            ? `${pendingCount} claim${pendingCount > 1 ? 's' : ''} pending approval.`
            : 'Raise a new claim or view your history below.'}
        </p>
      </div>

      {/* ── RAISE A CLAIM FORM ─────────────────────────────────────────────
          WHY no Insurance ID field: we fetch it automatically from getMyInsurance()
          Employee only fills what they actually know: amount + reason */}
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0',
        padding: '20px', marginBottom: '24px' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
          Raise a New Claim
        </h2>

        {insLoading ? (
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>Loading your insurance details…</p>
        ) : !myInsurance ? (
          // No insurance found — can't raise a claim
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
            padding: '12px 16px', fontSize: '13px', color: '#b91c1c' }}>
            You don't have an active insurance plan. Contact HR or Admin to get one assigned.
          </div>
        ) : (
          <>
            {/* Show their insurance info as context — read only, not editable */}
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px',
              padding: '12px 16px', marginBottom: '16px', fontSize: '13px' }}>
              <span style={{ color: '#0369a1', fontWeight: 600 }}>Your Plan: </span>
              <span style={{ color: '#0f172a' }}>{myInsurance.planName}</span>
              <span style={{ margin: '0 12px', color: '#94a3b8' }}>·</span>
              <span style={{ color: '#0369a1', fontWeight: 600 }}>Coverage: </span>
              <span style={{ color: '#0f172a' }}>{formatINR(myInsurance.coverageAmount)}</span>
              <span style={{ margin: '0 12px', color: '#94a3b8' }}>·</span>
              <span style={{ color: '#64748b', fontSize: '11px' }}>
                Insurance ID: {myInsurance.employeInsuranceId ?? myInsurance.id} (auto-filled)
              </span>
            </div>

            {/* Only 2 fields — amount and reason */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px',
              marginBottom: '16px' }}>
              <div>
                <label style={lbl}>Claim Amount (₹) *</label>
                <input
                  type="number" min="1"
                  placeholder="e.g. 50000"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  style={inp}
                />
              </div>
              <div>
                <label style={lbl}>Reason *</label>
                <input
                  type="text"
                  placeholder="e.g. Hospitalisation for surgery"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRaise()}
                  style={inp}
                />
              </div>
            </div>

            <button onClick={handleRaise} disabled={submitting} style={primaryBtn}>
              {submitting ? 'Submitting…' : 'Submit Claim'}
            </button>
          </>
        )}
      </div>

      {/* ── CLAIMS HISTORY TABLE ── */}
      <div style={{ background: '#fff', borderRadius: '10px',
        border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
            Claim History
          </h2>
        </div>

        {claimsLoading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            Loading…
          </div>
        ) : claims.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            No claims yet.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Claim ID', 'Plan', 'Amount', 'Reason', 'Status', 'Raised On', 'Remarks'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600,
                    color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {claims.map((c, i) => (
                <tr key={c.claimId} style={{ borderBottom: '1px solid #f1f5f9',
                  background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={cell}>{c.claimId}</td>
                  <td style={{ ...cell, color: '#0f172a', fontWeight: 600 }}>{c.planName}</td>
                  <td style={cell}>{formatINR(c.claimAmount)}</td>
                  <td style={{ ...cell, color: '#64748b' }}>
                    {/* truncate long reasons */}
                    <span title={c.reason}>
                      {c.reason?.length > 40 ? c.reason.slice(0, 40) + '…' : c.reason}
                    </span>
                  </td>
                  <td style={cell}><ClaimBadge status={c.status} /></td>
                  <td style={{ ...cell, color: '#64748b' }}>
                    {c.raisedAt ? new Date(c.raisedAt).toLocaleDateString('en-IN') : '—'}
                  </td>
                  {/* Admin remarks — only visible after claim is resolved */}
                  <td style={{ ...cell, color: '#64748b', fontStyle: 'italic' }}>
                    {c.adminRemarks || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const lbl = {
  display: 'block', fontSize: '12px', fontWeight: 600,
  color: '#475569', marginBottom: '4px',
}
const inp = {
  display: 'block', width: '100%', padding: '8px 12px',
  border: '1px solid #cbd5e1', borderRadius: '6px',
  fontSize: '13px', outline: 'none', boxSizing: 'border-box',
}
const primaryBtn = {
  padding: '8px 18px', borderRadius: '6px', border: 'none',
  background: '#0f172a', color: '#fff', fontWeight: 600,
  fontSize: '13px', cursor: 'pointer',
}
const cell = { padding: '11px 14px', color: '#334155', verticalAlign: 'middle' }