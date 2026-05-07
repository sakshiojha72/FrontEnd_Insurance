// AllClaims.jsx  —  ADMIN + HR

import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getAllClaims, updateClaimStatus, getEmployeeClaims } from './api'

// ─── HELPERS ──────────────────────────────────────────────────────────────────

// Format ISO datetime → "27 Apr 2026, 11:03 AM"
// Raw ISO strings like "2026-04-27T11:03:14" are unreadable for an admin
function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Format number as Indian rupees: 500000 → ₹5,00,000
function formatINR(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN')
}

// ─── STATUS BADGE ──────────────────────────────────────────────────────────────
// Coloured pill — green for APPROVED, red for REJECTED, yellow for PENDING
// status comes from backend as uppercase string: "PENDING" | "APPROVED" | "REJECTED"
function ClaimStatusBadge({ status }) {
  const styles = {
    PENDING:  { background: '#fef9c3', color: '#854d0e', border: '1px solid #fde68a' },
    APPROVED: { background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' },
    REJECTED: { background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' },
  }
  const s = styles[status] || styles.PENDING
  return (
    <span style={{
      ...s, display: 'inline-block', padding: '2px 10px',
      borderRadius: '999px', fontSize: '12px', fontWeight: 600,
    }}>
      {status}
    </span>
  )
}

// ─── ACTION PANEL (opens below the row when Approve/Reject clicked) ────────────
// WHY: Admin should not have to scroll away from the claim to act on it.
// They see the claim details, click a button, type remarks, confirm — all in context.
//
// Props:
//   claim     — the full claim object (so panel shows context: employee, amount, reason)
//   action    — 'APPROVED' | 'REJECTED'  (pre-set based on which button was clicked)
//   onClose   — closes the panel without doing anything
//   onDone    — called after successful update → triggers table refresh + toast
function ActionPanel({ claim, action, onClose, onDone }) {
  const [remarks, setRemarks] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isApproving = action === 'APPROVED'
  const accentColor = isApproving ? '#15803d' : '#b91c1c'
  const bgColor     = isApproving ? '#f0fdf4' : '#fef2f2'
  const borderColor = isApproving ? '#86efac' : '#fca5a5'

  async function handleConfirm() {
    // adminRemarks is @NotBlank on backend — enforce it here too
    if (!remarks.trim()) return setError('Remarks are required before submitting')

    setLoading(true); setError('')
    try {
      // updateClaimStatus(claimId, status, adminRemarks)
      // resolvedBy is set server-side from Principal — we do NOT send it
      await updateClaimStatus(claim.claimId, action, remarks.trim())
      onDone(action) // tell parent: refresh table + show toast
    } catch (e) {
      setError(e.message || 'Failed to update claim')
    } finally {
      setLoading(false)
    }
  }

  return (
    <tr>
      <td colSpan={8} style={{ padding: 0 }}>
        <div style={{
          padding: '14px 20px', background: bgColor,
          borderTop: `2px solid ${accentColor}`,
          borderBottom: `1px solid ${borderColor}`,
        }}>
          {/* Context row — shows what the admin is deciding on */}
          <div style={{ fontSize: '13px', color: accentColor, fontWeight: 700, marginBottom: '10px' }}>
            {isApproving ? '✅ Approving' : '❌ Rejecting'} Claim #{claim.claimId}
            <span style={{ marginLeft: '12px', fontWeight: 400, color: '#475569' }}>
              {claim.employeeName} · {formatINR(claim.claimAmount)} · {claim.planName}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
            {/* Remarks input — @NotBlank on backend so we require it here too */}
            <div style={{ flex: 1, minWidth: '240px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600,
                color: '#475569', marginBottom: '4px' }}>
                Admin Remarks *
              </label>
              <input
                autoFocus
                type="text"
                placeholder={isApproving ? 'e.g. Claim verified and approved' : 'e.g. Insufficient documentation'}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                // pressing Enter submits — saves a click
                onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                style={{
                  width: '100%', padding: '8px 12px', border: `1px solid ${borderColor}`,
                  borderRadius: '6px', fontSize: '13px', outline: 'none',
                  background: '#fff', boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Confirm button — colour matches action (green/red) */}
            <button
              onClick={handleConfirm}
              disabled={loading}
              style={{
                padding: '8px 16px', borderRadius: '6px', border: 'none',
                background: accentColor, color: '#fff',
                fontWeight: 700, fontSize: '13px', cursor: 'pointer',
              }}
            >
              {loading ? 'Submitting…' : `Confirm ${isApproving ? 'Approve' : 'Reject'}`}
            </button>

            <button onClick={onClose} style={{
              padding: '8px 14px', borderRadius: '6px',
              border: '1px solid #cbd5e1', background: '#fff',
              color: '#475569', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
            }}>
              Cancel
            </button>
          </div>

          {error && (
            <div style={{
              marginTop: '10px', fontSize: '13px', color: '#b91c1c',
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '6px', padding: '8px 12px', display: 'inline-block',
            }}>
              {error}
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function AllClaims() {
  // Role check — ADMIN can approve/reject, HR is read-only
  // 'jwt_role' must be saved to localStorage at login time
  const userRole = (localStorage.getItem('jwt_role') || '').toUpperCase()
  const isAdmin  = userRole === 'ADMIN'

  const [claims, setClaims]           = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')

  // Status filter — 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  // Clicking a button re-fetches from backend with ?status= param
  // WHY backend filter (not client-side)? Claims can be thousands — server filters first
  const [statusFilter, setStatusFilter] = useState('ALL')

  // Employee ID filter — when set, fetches only that employee's claims
  // Admin types an employee ID to drill down (replaces EmployeeClaimsPage)
  const [empIdInput, setEmpIdInput]   = useState('')  // what's typed in the box
  const [empIdActive, setEmpIdActive] = useState('')  // what's actually being filtered

  // Separate state for filter counts that don't change with filtering
  const [filterCounts, setFilterCounts] = useState({
    all: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  })

  // Which claim row has the action panel open, and which action (APPROVED/REJECTED)
  // Format: { claimId: 5, action: 'APPROVED' }  or  null
  const [activePanel, setActivePanel] = useState(null)

  // Toast notification — appears top-right, disappears after 3s
  const [toast, setToast] = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── FETCH FILTER COUNTS ────────────────────────────────────────────────────
  // Fetch counts for all statuses to show consistent filter button counts
  const fetchFilterCounts = useCallback(async () => {
    if (empIdActive) return // Don't fetch counts when filtering by employee

    try {
      const [allData, pendingData, approvedData, rejectedData] = await Promise.all([
        getAllClaims(undefined, 0, 1000), // Get more data for accurate counts
        getAllClaims('PENDING', 0, 1000),
        getAllClaims('APPROVED', 0, 1000),
        getAllClaims('REJECTED', 0, 1000)
      ])

      setFilterCounts({
        all: allData?.length || 0,
        pending: pendingData?.length || 0,
        approved: approvedData?.length || 0,
        rejected: rejectedData?.length || 0
      })
    } catch (error) {
      console.error('Failed to fetch filter counts:', error)
      // Fallback to basic counts if API fails
      setFilterCounts({ all: 0, pending: 0, approved: 0, rejected: 0 })
    }
  }, [empIdActive])

  // useCallback so we can call this after approve/reject to refresh the table
  const loadClaims = useCallback(() => {
    setLoading(true); setError('')

    // If an employee ID is active, use getEmployeeClaims (different endpoint)
    // Otherwise use getAllClaims with optional status filter
    const fetcher = empIdActive
      ? getEmployeeClaims(empIdActive)
      : getAllClaims(statusFilter === 'ALL' ? undefined : statusFilter)

    fetcher
      .then(data => setClaims(data || []))
      .catch(e => setError(e.message || 'Failed to load claims'))
      .finally(() => setLoading(false))

    // Also refresh filter counts
    fetchFilterCounts()
  }, [statusFilter, empIdActive, fetchFilterCounts])

  // ── FETCH CLAIMS ──────────────────────────────────────────────────────────
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true); setError('')

    // If an employee ID is active, use getEmployeeClaims (different endpoint)
    // Otherwise use getAllClaims with optional status filter
    const fetcher = empIdActive
      ? getEmployeeClaims(empIdActive)
      : getAllClaims(statusFilter === 'ALL' ? undefined : statusFilter)

    fetcher
      .then(data => setClaims(data || []))
      .catch(e => setError(e.message || 'Failed to load claims'))
      .finally(() => setLoading(false))

    // Also refresh filter counts
    fetchFilterCounts()
  }, [statusFilter, empIdActive, fetchFilterCounts])

  // Fetch filter counts when component mounts or when employee filter changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFilterCounts()
  }, [fetchFilterCounts])

  // ── APPLY EMPLOYEE FILTER ─────────────────────────────────────────────────
  function applyEmpFilter() {
    const id = empIdInput.trim()
    if (!id || isNaN(Number(id))) return setError('Enter a valid numeric Employee ID')
    setEmpIdActive(id)
    setStatusFilter('ALL') // reset status filter when drilling into one employee
  }

  function clearEmpFilter() {
    setEmpIdInput('')
    setEmpIdActive('')
  }

  // ── AFTER APPROVE/REJECT SUCCEEDS ─────────────────────────────────────────
  function handleActionDone(action) {
    setActivePanel(null)
    showToast(`Claim ${action === 'APPROVED' ? 'approved' : 'rejected'} successfully`)
    loadClaims() // refresh so status changes immediately
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">📝</span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Insurance Claims Management</h1>
              <p className="text-slate-600 mt-1">
                {isAdmin ? 'Review, approve, or reject insurance claims' : 'Read-only view of all claims'}
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  {claims.length} claim{claims.length !== 1 ? 's' : ''}
                </span>
              </p>
            </div>
          </div>
          <Link
            to="/insurance"
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-medium transition-colors"
          >
            <span>←</span>
            Back to Insurance
          </Link>
        </div>

        {/* Enhanced Filters Row */}
        <div className="flex flex-wrap gap-4 items-end">
          {/* Status Filter Buttons */}
          {!empIdActive && (
            <div className="flex gap-2">
              {[
                { key: 'ALL', label: `All`, count: filterCounts.all },
                { key: 'PENDING', label: `Pending`, count: filterCounts.pending },
                { key: 'APPROVED', label: `Approved`, count: filterCounts.approved },
                { key: 'REJECTED', label: `Rejected`, count: filterCounts.rejected },
              ].map(({ key, label, count }) => (
                <button
                  key={key}
                  onClick={() => { setStatusFilter(key); setActivePanel(null) }}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    statusFilter === key
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {label} ({count})
                </button>
              ))}
            </div>
          )}

          {/* Employee Filter */}
          <div className="flex gap-2">
            <div className="flex">
              <input
                type="text"
                placeholder="Employee ID"
                value={empIdInput}
                onChange={(e) => setEmpIdInput(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                onClick={applyEmpFilter}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 font-medium text-sm transition-colors"
              >
                Filter
              </button>
            </div>
            {empIdActive && (
              <button
                onClick={clearEmpFilter}
                className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 font-medium text-sm transition-colors"
              >
                Clear ({empIdActive})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 rounded-lg p-4 shadow-lg transition-all duration-300 ${
          toast.type === 'success'
            ? 'bg-green-600 text-white'
            : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-lg">
              {toast.type === 'success' ? '✅' : '❌'}
            </span>
            <span className="font-medium">{toast.msg}</span>
          </div>
        </div>
      )}

      {/* ── ERROR ── */}
      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
          borderRadius: '8px', padding: '12px 16px', fontSize: '13px', marginBottom: '16px',
        }}>
          {error}
        </div>
      )}

      {/* ── CLAIMS TABLE ── */}
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            Loading claims…
          </div>
        ) : claims.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            No claims found.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Claim ID', 'Employee', 'Plan', 'Amount', 'Status', 'Reason', 'Raised On', isAdmin ? 'Actions' : 'Resolved By'].map(h => (
                  <th key={h} style={{
                    padding: '11px 14px', textAlign: 'left', fontWeight: 600,
                    color: '#475569', fontSize: '12px',
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {claims.map((claim, i) => {
                const isPending   = claim.status === 'PENDING'
                const panelOpen   = activePanel?.claimId === claim.claimId
                const panelAction = activePanel?.action

                return (
                  <>
                    <tr
                      key={claim.claimId}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        // highlight the row when its panel is open
                        background: panelOpen
                          ? (panelAction === 'APPROVED' ? '#f0fdf4' : '#fef2f2')
                          : (i % 2 === 0 ? '#fff' : '#fafafa'),
                      }}
                    >
                      {/* Claim ID */}
                      <td style={cell}>{claim.claimId}</td>

                      {/* Employee name + ID — clicking filters to their claims */}
                      <td style={cell}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{claim.employeeName}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {claim.employeeId}</div>
                      </td>

                      {/* Plan name */}
                      <td style={{ ...cell, color: '#475569' }}>{claim.planName}</td>

                      {/* Claim amount */}
                      <td style={{ ...cell, fontWeight: 600 }}>{formatINR(claim.claimAmount)}</td>

                      {/* Status badge */}
                      <td style={cell}><ClaimStatusBadge status={claim.status} /></td>

                      {/* Reason — truncated if long */}
                      <td style={{ ...cell, color: '#64748b', maxWidth: '180px' }}>
                        <span title={claim.reason}>
                          {claim.reason?.length > 50
                            ? claim.reason.slice(0, 50) + '…'
                            : claim.reason}
                        </span>
                      </td>

                      {/* Raised date — formatted */}
                      <td style={{ ...cell, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {formatDate(claim.raisedAt)}
                      </td>

                      {/* Last column: action buttons for ADMIN, resolvedBy for HR */}
                      <td style={{ ...cell, whiteSpace: 'nowrap' }}>
                        {isAdmin ? (
                          isPending ? (
                            // PENDING claims: show Approve + Reject buttons
                            // Clicking one opens the ActionPanel below this row
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => setActivePanel(
                                  panelOpen && panelAction === 'APPROVED'
                                    ? null  // toggle off if already open
                                    : { claimId: claim.claimId, action: 'APPROVED' }
                                )}
                                style={{
                                  padding: '5px 10px', borderRadius: '5px', fontSize: '12px',
                                  fontWeight: 600, cursor: 'pointer',
                                  border: '1px solid #86efac',
                                  background: panelOpen && panelAction === 'APPROVED' ? '#15803d' : '#f0fdf4',
                                  color: panelOpen && panelAction === 'APPROVED' ? '#fff' : '#15803d',
                                }}
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => setActivePanel(
                                  panelOpen && panelAction === 'REJECTED'
                                    ? null
                                    : { claimId: claim.claimId, action: 'REJECTED' }
                                )}
                                style={{
                                  padding: '5px 10px', borderRadius: '5px', fontSize: '12px',
                                  fontWeight: 600, cursor: 'pointer',
                                  border: '1px solid #fca5a5',
                                  background: panelOpen && panelAction === 'REJECTED' ? '#b91c1c' : '#fef2f2',
                                  color: panelOpen && panelAction === 'REJECTED' ? '#fff' : '#b91c1c',
                                }}
                              >
                                ✕ Reject
                              </button>
                            </div>
                          ) : (
                            // Already resolved — show who resolved it and when
                            <div>
                              <div style={{ fontSize: '12px', color: '#64748b' }}>
                                by {claim.resolvedBy || '—'}
                              </div>
                              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                {formatDate(claim.resolvedAt)}
                              </div>
                              {claim.adminRemarks && (
                                <div style={{ fontSize: '11px', color: '#475569', fontStyle: 'italic', marginTop: '2px' }}>
                                  "{claim.adminRemarks}"
                                </div>
                              )}
                            </div>
                          )
                        ) : (
                          // HR role — just show resolvedBy
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            {claim.resolvedBy || '—'}
                          </span>
                        )}
                      </td>
                    </tr>

                    {/* ── ACTION PANEL — expands below row when Approve/Reject clicked ── */}
                    {panelOpen && (
                      <ActionPanel
                        key={`panel-${claim.claimId}`}
                        claim={claim}
                        action={panelAction}
                        onClose={() => setActivePanel(null)}
                        onDone={handleActionDone}
                      />
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ─── SHARED CELL STYLE ────────────────────────────────────────────────────────
const cell = {
  padding: '11px 14px',
  color: '#334155',
  verticalAlign: 'middle',
}