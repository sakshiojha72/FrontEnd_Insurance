// AllTopUpsPage.jsx  —  ADMIN + HR
// CHANGE FROM ORIGINAL:
//   "View Employee Top-Ups" section previously had a raw Employee ID number input.
//   Now replaced with a "Pick Employee" button that opens EmployeePickerModal.
//   After selection, the employee's name is shown and their top-ups load automatically.
//   Admin no longer needs to type or remember any employee ID.

import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getAllTopUpPlans, createTopUpPlan, deleteTopUpPlan, getEmployeeTopUps } from './api'
import EmployeePickerModal from './EmployeePickerModal'   // ← NEW IMPORT

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatINR(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN')
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
function StatusBadge({ isActive }) {
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: '999px',
      fontSize: '12px', fontWeight: 600,
      background: isActive ? '#dcfce7' : '#fee2e2',
      color: isActive ? '#15803d' : '#b91c1c',
      border: `1px solid ${isActive ? '#bbf7d0' : '#fecaca'}`,
    }}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

// ─── CREATE TOP-UP MODAL ──────────────────────────────────────────────────────
function CreateTopUpModal({ onClose, onCreated }) {
  const [name, setName]         = useState('')
  const [coverage, setCoverage] = useState('')
  const [price, setPrice]       = useState('')
  const [description, setDesc]  = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSubmit() {
    if (!name.trim())                       return setError('Plan name is required')
    if (!coverage || Number(coverage) <= 0) return setError('Additional coverage must be > 0')
    if (!price || Number(price) < 0)        return setError('Price cannot be negative')

    setLoading(true); setError('')
    try {
      await createTopUpPlan(name.trim(), description.trim(), Number(price), Number(coverage))
      onCreated()
      onClose()
    } catch (e) {
      setError(e.message || 'Failed to create top-up plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: '12px', padding: '28px 32px',
        width: '100%', maxWidth: '460px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
          Create Top-Up Plan
        </h2>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
            borderRadius: '6px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <label style={labelStyle}>Plan Name *</label>
        <input style={inputStyle} placeholder="e.g. Extra ₹50k Coverage"
          value={name} onChange={e => setName(e.target.value)} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Additional Coverage (₹) *</label>
            <input style={inputStyle} type="number" placeholder="e.g. 50000"
              value={coverage} onChange={e => setCoverage(e.target.value)} />
          </div>
          <div>
            <label style={labelStyle}>Price (₹) *</label>
            <input style={inputStyle} type="number" placeholder="e.g. 2000"
              value={price} onChange={e => setPrice(e.target.value)} />
          </div>
        </div>

        <label style={labelStyle}>Description (optional)</label>
        <input style={inputStyle} placeholder="Brief description of this top-up"
          value={description} onChange={e => setDesc(e.target.value)} />

        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={handleSubmit} disabled={loading} style={primaryBtn}>
            {loading ? 'Creating…' : 'Create Top-Up Plan'}
          </button>
          <button onClick={onClose} style={secondaryBtn}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function AllTopUpsPage() {
  const userRole = (localStorage.getItem('jwt_role') || '').toUpperCase()
  const isAdmin  = userRole === 'ADMIN'

  const [plans, setPlans]               = useState([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  // NEW: employee top-up drill-down uses picker instead of ID input
  // selectedEmpForTopUp stores { userId, fullName } when admin picks an employee
  const [selectedEmpForTopUp, setSelectedEmpForTopUp] = useState(null)  // picked employee object
  const [showEmpPicker, setShowEmpPicker]             = useState(false)  // modal visibility
  const [empTopUps, setEmpTopUps]                     = useState([])
  const [empLoading, setEmpLoading]                   = useState(false)

  const [showCreate, setShowCreate] = useState(false)
  const [toast, setToast]           = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadPlans = useCallback(() => {
    setLoading(true); setError('')
    getAllTopUpPlans()
      .then(data => setPlans(data || []))
      .catch(e => setError(e.message || 'Failed to load top-up plans'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadPlans() }, [loadPlans])

  // Called when admin picks an employee in the modal
  // Immediately fetches that employee's top-ups so admin sees results right away
  function handleEmpPicked(emp) {
    setSelectedEmpForTopUp(emp)                // store { userId, fullName }
    setEmpLoading(true)
    getEmployeeTopUps(emp.userId)
      .then(data => setEmpTopUps(data || []))
      .catch(e => showToast(e.message || 'Failed to load employee top-ups', 'error'))
      .finally(() => setEmpLoading(false))
  }

  function clearEmpFilter() {
    setSelectedEmpForTopUp(null)
    setEmpTopUps([])
  }

  async function handleDeactivate(plan) {
    const id = plan.topUpPlanId ?? plan.id
    if (!window.confirm(`Deactivate "${plan.topUpName}"? Existing purchases stay active.`)) return
    try {
      await deleteTopUpPlan(id)
      showToast(`"${plan.topUpName}" deactivated`)
      loadPlans()
    } catch (e) {
      showToast(e.message || 'Failed to deactivate', 'error')
    }
  }

  const activeCount   = plans.filter(p => p.isActive).length
  const inactiveCount = plans.filter(p => !p.isActive).length

  const visiblePlans = plans.filter(p => {
    if (statusFilter === 'ACTIVE')   return p.isActive
    if (statusFilter === 'INACTIVE') return !p.isActive
    return true
  })

  return (
    <div style={{ padding: '24px', fontFamily: "'DM Sans', sans-serif", maxWidth: '1100px', margin: '0 auto' }}>

      <Link to="/insurance" style={{
        display: 'inline-block', marginBottom: '16px', padding: '8px 12px',
        border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: '#fff',
        fontSize: '14px', fontWeight: 500, color: '#475569', textDecoration: 'none'
      }}>
        ← Back to Insurance
      </Link>

      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: toast.type === 'success' ? '#15803d' : '#b91c1c',
          color: '#fff', borderRadius: '8px', padding: '12px 20px',
          fontSize: '14px', fontWeight: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>{toast.msg}</div>
      )}

      {/* ── HEADER ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>
            Top-Up Plans
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            {activeCount} active · {inactiveCount} inactive · {plans.length} total
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)}
            style={{ ...primaryBtn, fontSize: '14px', padding: '10px 18px' }}>
            + Create Top-Up Plan
          </button>
        )}
      </div>

      {/* ── FILTERS ROW ── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px',
        flexWrap: 'wrap', alignItems: 'flex-end' }}>

        {/* Status toggle buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { key: 'ALL',      label: `All (${plans.length})` },
            { key: 'ACTIVE',   label: `Active (${activeCount})` },
            { key: 'INACTIVE', label: `Inactive (${inactiveCount})` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setStatusFilter(key)} style={{
              padding: '7px 13px', borderRadius: '6px', fontSize: '12px',
              fontWeight: 600, cursor: 'pointer', border: '1px solid',
              background: statusFilter === key ? '#0f172a' : '#fff',
              color: statusFilter === key ? '#fff' : '#475569',
              borderColor: statusFilter === key ? '#0f172a' : '#cbd5e1',
            }}>{label}</button>
          ))}
        </div>

        {/* ── EMPLOYEE TOP-UPS DRILL-DOWN ──
            CHANGED: replaced raw ID input with a "Pick Employee" button.
            Shows the selected employee's name + a clear (×) button.
            Top-ups auto-load the moment an employee is picked. */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', whiteSpace: 'nowrap' }}>
            View Employee Top-Ups:
          </span>

          {selectedEmpForTopUp ? (
            // Chip showing selected employee — click × to clear
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              background: '#eff6ff', border: '1px solid #bfdbfe',
              borderRadius: '6px', padding: '6px 12px',
            }}>
              <span style={{ fontSize: '13px', color: '#1d4ed8', fontWeight: 600 }}>
                {selectedEmpForTopUp.fullName} (ID: {selectedEmpForTopUp.userId})
              </span>
              <button onClick={clearEmpFilter} style={{
                background: 'none', border: 'none', color: '#1d4ed8',
                cursor: 'pointer', fontWeight: 700, fontSize: '16px', padding: 0, lineHeight: 1,
              }} title="Clear selection">×</button>
            </div>
          ) : (
            // Pick Employee button
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

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
          borderRadius: '8px', padding: '12px 16px', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* ── EMPLOYEE TOP-UPS TABLE — shown when employee is selected ── */}
      {selectedEmpForTopUp && (
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
            Top-Ups for {selectedEmpForTopUp.fullName}
            <span style={{ fontSize: '12px', fontWeight: 400, color: '#94a3b8', marginLeft: '8px' }}>
              ID: {selectedEmpForTopUp.userId}
            </span>
          </h2>
          <div style={{ background: '#fff', borderRadius: '10px',
            border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            {empLoading ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                Loading…
              </div>
            ) : empTopUps.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                No top-ups found for this employee.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: '#f0f9ff', borderBottom: '1px solid #bae6fd' }}>
                    {['Top-Up Name', 'Additional Coverage', 'Status', 'Purchased On', 'Expiry Date'].map(h => (
                      <th key={h} style={{
                        padding: '10px 14px', textAlign: 'left', fontWeight: 600,
                        color: '#0369a1', fontSize: '12px', textTransform: 'uppercase',
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {empTopUps.map((t, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9',
                      background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ ...cell, fontWeight: 600, color: '#0f172a' }}>{t.topUpName}</td>
                      <td style={cell}>{formatINR(t.additionalCoverage)}</td>
                      <td style={cell}><StatusBadge isActive={t.status === 'ACTIVE' || t.status === 'Active'} /></td>
                      <td style={{ ...cell, color: '#64748b' }}>{t.purchasedAt ?? t.assignedDate ?? '—'}</td>
                      <td style={{ ...cell, color: '#64748b' }}>{t.expiryDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── MAIN TOP-UP PLANS TABLE ── */}
      <div style={{ background: '#fff', borderRadius: '10px',
        border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            Loading top-up plans…
          </div>
        ) : visiblePlans.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            No plans match your filter.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Plan ID', 'Plan Name', 'Additional Coverage', 'Price', 'Description', 'Status',
                  isAdmin ? 'Actions' : ''].filter(Boolean).map(h => (
                  <th key={h} style={{
                    padding: '11px 14px', textAlign: 'left', fontWeight: 600,
                    color: '#475569', fontSize: '12px',
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visiblePlans.map((plan, i) => {
                const planId = plan.topUpPlanId ?? plan.id
                return (
                  <tr key={planId} style={{
                    borderBottom: '1px solid #f1f5f9',
                    background: i % 2 === 0 ? '#fff' : '#fafafa',
                  }}>
                    <td style={cell}>{planId}</td>
                    <td style={{ ...cell, fontWeight: 600, color: '#0f172a' }}>{plan.topUpName}</td>
                    <td style={cell}>{formatINR(plan.additionalCoverage)}</td>
                    <td style={cell}>{formatINR(plan.price)}</td>
                    <td style={{ ...cell, color: '#64748b' }}>{plan.description || '—'}</td>
                    <td style={cell}><StatusBadge isActive={plan.isActive} /></td>
                    {isAdmin && (
                      <td style={{ ...cell, whiteSpace: 'nowrap' }}>
                        {plan.isActive ? (
                          <button onClick={() => handleDeactivate(plan)} style={{
                            padding: '5px 10px', borderRadius: '5px', fontSize: '12px',
                            fontWeight: 600, cursor: 'pointer',
                            border: '1px solid #fca5a5',
                            background: '#fef2f2', color: '#b91c1c',
                          }}>
                            Deactivate
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                            No actions
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── CREATE MODAL ── */}
      {showCreate && (
        <CreateTopUpModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            showToast('Top-up plan created successfully')
            loadPlans()
          }}
        />
      )}

      {/* ── EMPLOYEE PICKER MODAL ── */}
      {showEmpPicker && (
        <EmployeePickerModal
          onSelect={handleEmpPicked}        // auto-loads top-ups after selection
          onClose={() => setShowEmpPicker(false)}
        />
      )}
    </div>
  )
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const labelStyle = {
  display: 'block', fontSize: '12px', fontWeight: 600,
  color: '#475569', marginBottom: '4px', marginTop: '12px',
}
const inputStyle = {
  display: 'block', width: '100%', padding: '8px 12px',
  border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px',
  outline: 'none', color: '#0f172a', background: '#fff', boxSizing: 'border-box',
}
const primaryBtn = {
  padding: '8px 14px', borderRadius: '6px', border: 'none',
  background: '#0f172a', color: '#fff', fontWeight: 600,
  fontSize: '13px', cursor: 'pointer',
}
const secondaryBtn = {
  padding: '8px 14px', borderRadius: '6px',
  border: '1px solid #cbd5e1', background: '#fff',
  color: '#475569', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
}
const cell = {
  padding: '11px 14px', color: '#334155', verticalAlign: 'middle',
}