// AllClaims.jsx  —  ADMIN + HR
// CHANGE FROM ORIGINAL:
//   Employee filter previously had a raw "Employee ID" text input.
//   Now replaced with a "Pick Employee" button that opens EmployeePickerModal.
//   After picking, a chip shows the name + ID, and claims load automatically.
//   Admin no longer needs to type or know any employee ID.

import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getAllClaims, updateClaimStatus, getEmployeeClaims } from './api'
import EmployeePickerModal from './EmployeePickerModal'   // ← NEW IMPORT

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatINR(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN')
}

// ─── STATUS BADGE ──────────────────────────────────────────────────────────────
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

// ─── ACTION PANEL ──────────────────────────────────────────────────────────────
// Opens below the row when Approve/Reject is clicked — unchanged from original
function ActionPanel({ claim, action, onClose, onDone }) {
  const [remarks, setRemarks] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isApproving = action === 'APPROVED'
  const accentColor = isApproving ? '#15803d' : '#b91c1c'
  const bgColor     = isApproving ? '#f0fdf4' : '#fef2f2'
  const borderColor = isApproving ? '#86efac' : '#fca5a5'

  async function handleConfirm() {
    if (!remarks.trim()) return setError('Remarks are required before submitting')
    setLoading(true); setError('')
    try {
      await updateClaimStatus(claim.claimId, action, remarks.trim())
      onDone(action)
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
          <div style={{ fontSize: '13px', color: accentColor, fontWeight: 700, marginBottom: '10px' }}>
            {isApproving ? '✅ Approving' : '❌ Rejecting'} Claim #{claim.claimId}
            <span style={{ marginLeft: '12px', fontWeight: 400, color: '#475569' }}>
              {claim.employeeName} · {formatINR(claim.claimAmount)} · {claim.planName}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
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
                onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                style={{
                  width: '100%', padding: '8px 12px', border: `1px solid ${borderColor}`,
                  borderRadius: '6px', fontSize: '13px', outline: 'none',
                  background: '#fff', boxSizing: 'border-box',
                }}
              />
            </div>

            <button onClick={handleConfirm} disabled={loading} style={{
              padding: '8px 16px', borderRadius: '6px', border: 'none',
              background: accentColor, color: '#fff',
              fontWeight: 700, fontSize: '13px', cursor: 'pointer',
            }}>
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
  const userRole = (localStorage.getItem('jwt_role') || '').toUpperCase()
  const isAdmin  = userRole === 'ADMIN'

  const [claims, setClaims]               = useState([])
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')
  const [statusFilter, setStatusFilter]   = useState('ALL')

  // NEW: instead of empIdInput + empIdActive (both strings),
  // we store a full employee object from the picker.
  // selectedEmp = { userId, fullName } | null
  const [selectedEmp, setSelectedEmp]     = useState(null)
  const [showEmpPicker, setShowEmpPicker] = useState(false)  // modal visibility

  const [filterCounts, setFilterCounts]   = useState({ all: 0, pending: 0, approved: 0, rejected: 0 })
  const [activePanel, setActivePanel]     = useState(null)
  const [toast, setToast]                 = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Fetch all-status counts for the filter buttons
  const fetchFilterCounts = useCallback(async () => {
    if (selectedEmp) return  // no counts when filtered by employee
    try {
      const [allData, pendingData, approvedData, rejectedData] = await Promise.all([
        getAllClaims(undefined, 0, 1000),
        getAllClaims('PENDING',  0, 1000),
        getAllClaims('APPROVED', 0, 1000),
        getAllClaims('REJECTED', 0, 1000),
      ])
      setFilterCounts({
        all:      allData?.length      || 0,
        pending:  pendingData?.length  || 0,
        approved: approvedData?.length || 0,
        rejected: rejectedData?.length || 0,
      })
    } catch {
      setFilterCounts({ all: 0, pending: 0, approved: 0, rejected: 0 })
    }
  }, [selectedEmp])

  const loadClaims = useCallback(() => {
    setLoading(true); setError('')

    // If an employee is selected, use getEmployeeClaims(id)
    // Otherwise use getAllClaims with optional status filter
    const fetcher = selectedEmp
      ? getEmployeeClaims(selectedEmp.userId)
      : getAllClaims(statusFilter === 'ALL' ? undefined : statusFilter)

    fetcher
      .then(data => setClaims(data || []))
      .catch(e => setError(e.message || 'Failed to load claims'))
      .finally(() => setLoading(false))

    fetchFilterCounts()
  }, [statusFilter, selectedEmp, fetchFilterCounts])

  useEffect(() => { loadClaims() }, [loadClaims])
  useEffect(() => { fetchFilterCounts() }, [fetchFilterCounts])

  // Called when admin picks an employee in the modal
  // Immediately loads that employee's claims
  function handleEmpPicked(emp) {
    setSelectedEmp(emp)           // { userId, fullName }
    setStatusFilter('ALL')        // reset status filter
    setActivePanel(null)          // close any open action panel
  }

  function clearEmpFilter() {
    setSelectedEmp(null)
    setActivePanel(null)
  }

  function handleActionDone(action) {
    setActivePanel(null)
    showToast(`Claim ${action === 'APPROVED' ? 'approved' : 'rejected'} successfully`)
    loadClaims()
  }

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
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

        {/* ── FILTERS ROW ── */}
        <div className="flex flex-wrap gap-4 items-end">

          {/* Status filter buttons — only shown when NOT filtering by employee */}
          {!selectedEmp && (
            <div className="flex gap-2">
              {[
                { key: 'ALL',      label: 'All',      count: filterCounts.all },
                { key: 'PENDING',  label: 'Pending',  count: filterCounts.pending },
                { key: 'APPROVED', label: 'Approved', count: filterCounts.approved },
                { key: 'REJECTED', label: 'Rejected', count: filterCounts.rejected },
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

          {/* ── EMPLOYEE FILTER — now uses picker modal ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>
              Filter by Employee:
            </span>

            {selectedEmp ? (
              // Show selected employee chip with × to clear
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#eff6ff', border: '1px solid #bfdbfe',
                borderRadius: '6px', padding: '6px 12px',
              }}>
                <span style={{ fontSize: '13px', color: '#1d4ed8', fontWeight: 600 }}>
                  {selectedEmp.fullName} (ID: {selectedEmp.userId})
                </span>
                <button onClick={clearEmpFilter} style={{
                  background: 'none', border: 'none', color: '#1d4ed8',
                  cursor: 'pointer', fontWeight: 700, fontSize: '16px', padding: 0, lineHeight: 1,
                }} title="Clear filter">×</button>
              </div>
            ) : (
              // Pick employee button
              <button
                onClick={() => setShowEmpPicker(true)}
                style={{
                  padding: '7px 14px', borderRadius: '6px', fontSize: '12px',
                  fontWeight: 600, cursor: 'pointer',
                  border: '1px solid #0ea5e9',
                  background: '#f0f9ff', color: '#0369a1',
                  whiteSpace: 'nowrap',
                }}
              >
                🔍 Pick Employee
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 rounded-lg p-4 shadow-lg transition-all duration-300 ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-lg">{toast.type === 'success' ? '✅' : '❌'}</span>
            <span className="font-medium">{toast.msg}</span>
          </div>
        </div>
      )}

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
                {['Claim ID', 'Employee', 'Plan', 'Amount', 'Status', 'Reason', 'Raised On',
                  isAdmin ? 'Actions' : 'Resolved By'].map(h => (
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
                        background: panelOpen
                          ? (panelAction === 'APPROVED' ? '#f0fdf4' : '#fef2f2')
                          : (i % 2 === 0 ? '#fff' : '#fafafa'),
                      }}
                    >
                      <td style={cell}>{claim.claimId}</td>

                      <td style={cell}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{claim.employeeName}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {claim.employeeId}</div>
                      </td>

                      <td style={{ ...cell, color: '#475569' }}>{claim.planName}</td>
                      <td style={{ ...cell, fontWeight: 600 }}>{formatINR(claim.claimAmount)}</td>
                      <td style={cell}><ClaimStatusBadge status={claim.status} /></td>

                      <td style={{ ...cell, color: '#64748b', maxWidth: '180px' }}>
                        <span title={claim.reason}>
                          {claim.reason?.length > 50 ? claim.reason.slice(0, 50) + '…' : claim.reason}
                        </span>
                      </td>

                      <td style={{ ...cell, color: '#64748b', whiteSpace: 'nowrap' }}>
                        {formatDate(claim.raisedAt)}
                      </td>

                      <td style={{ ...cell, whiteSpace: 'nowrap' }}>
                        {isAdmin ? (
                          isPending ? (
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => setActivePanel(
                                  panelOpen && panelAction === 'APPROVED'
                                    ? null
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
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            {claim.resolvedBy || '—'}
                          </span>
                        )}
                      </td>
                    </tr>

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

      {/* ── EMPLOYEE PICKER MODAL ── */}
      {showEmpPicker && (
        <EmployeePickerModal
          onSelect={handleEmpPicked}
          onClose={() => setShowEmpPicker(false)}
        />
      )}
    </div>
  )
}

// ─── SHARED CELL STYLE ────────────────────────────────────────────────────────
const cell = {
  padding: '11px 14px',
  color: '#334155',
  verticalAlign: 'middle',
}