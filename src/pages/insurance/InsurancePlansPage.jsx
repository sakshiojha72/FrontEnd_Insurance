// InsurancePlansPage.jsx  — ADMIN/HR

// TOKEN: localStorage key 'jwt_token' — handled inside api.js already

import { useEffect, useState, useCallback } from 'react'
import { getAllPlans, createPlan, deletePlan, assignInsurance, setDefaultPlan } from './api'
import { Link } from 'react-router-dom'

// ─── tiny helper: format rupee amounts nicely ─────────────────────────────────
// e.g. 500000 → "₹5,00,000"  (Indian number format)
function formatINR(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN')
}

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
// isActive is a boolean that comes directly from the backend response
function StatusBadge({ isActive }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 600,
        background: isActive ? '#dcfce7' : '#fee2e2',
        color: isActive ? '#15803d' : '#b91c1c',
        border: `1px solid ${isActive ? '#bbf7d0' : '#fecaca'}`,
      }}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

// ─── CREATE PLAN MODAL ────────────────────────────────────────────────────────
function CreatePlanModal({ onClose, onCreated }) {
  const [planName, setPlanName] = useState('')
  const [coverage, setCoverage] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    // basic front-end guard so we don't hit the backend with empty data
    if (!planName.trim()) return setError('Plan name is required')
    if (!coverage || Number(coverage) <= 0) return setError('Coverage must be greater than 0')

    setLoading(true); setError('') //start api call 
    try {
      await createPlan({
  planName: planName.trim(),
  coverageAmount: Number(coverage),
  description: description.trim()
})
      onCreated() // tell parent to reload the plans table
      onClose()   // close this modal
    } catch (e) {
      setError(e.message || 'Failed to create plan')
    } finally {
      setLoading(false)
    }
  }

  

  // clicking the dark overlay closes the modal (same UX as every modal ever)
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      {/* stop click from bubbling so clicking the form itself doesn't close */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '12px', padding: '28px 32px',
          width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
          Create Insurance Plan
        </h2>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
            borderRadius: '6px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* Plan Name */}
        <label style={labelStyle}>Plan Name *</label>
        <input
          style={inputStyle}
          placeholder="e.g. Basic Health Plan"
          value={planName}
          onChange={e => setPlanName(e.target.value)}
        />

        {/* Coverage Amount */}
        <label style={labelStyle}>Coverage Amount (₹) *</label>
        <input
          style={inputStyle}
          type="number"
          placeholder="e.g. 500000"
          value={coverage}
          onChange={e => setCoverage(e.target.value)}
        />

        {/* Description — optional */}
        <label style={labelStyle}>Description (optional)</label>
        <input
          style={inputStyle}
          placeholder="Brief description of the plan"
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button onClick={handleSubmit} disabled={loading} style={primaryBtn}>
            {loading ? 'Creating…' : 'Create Plan'}
          </button>
          <button onClick={onClose} style={secondaryBtn}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── ASSIGN PLAN PANEL ────────────────────────────────────────────────────────

function AssignPanel({ plan, onClose, onAssigned }) {
  const [employeeId, setEmployeeId] = useState('')   // admin types the employee's userId
  const [expiryDate, setExpiryDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // tomorrow's date string — used as the min value on the date picker
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  async function handleAssign() {
    // front-end guards
    if (!employeeId || isNaN(Number(employeeId)) || Number(employeeId) <= 0)
      return setError('Enter a valid Employee ID (a positive number)')
    if (!expiryDate)
      return setError('Please select an expiry date')

    setLoading(true); setError('')
    try {
      // assignInsurance(employeeId, planId, expiryDate)
      // planId comes from the plan prop — admin never types it
      await assignInsurance(Number(employeeId), plan.planId ?? plan.id, expiryDate)
      onAssigned() // triggers toast + table refresh in parent
      onClose()
    } catch (e) {
      // backend error message shown directly — e.g. "Employee already has an active insurance"
      setError(e.message || 'Assignment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <tr>
      <td colSpan={6} style={{ padding: 0 }}>
        <div style={{
          padding: '14px 20px',
          background: '#f0f9ff',
          borderTop: '2px solid #0ea5e9',
          borderBottom: '1px solid #bae6fd',
        }}>

          {/* Header row — shows which plan is being assigned */}
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0369a1', marginBottom: '12px' }}>
            📋 Assigning: <span style={{ color: '#0f172a' }}>{plan.planName}</span>
            <span style={{ marginLeft: '10px', fontSize: '12px', color: '#64748b', fontWeight: 400 }}>
              Plan ID: {plan.planId ?? plan.id} · Coverage: {formatINR(plan.coverageAmount)}
            </span>
          </div>

          {/* Input row */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>

            {/* Employee ID — manual input since /employee/employees is in another module */}
            <div>
              <label style={{ ...labelStyle, marginTop: 0 }}>Employee ID *</label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 3"
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                style={{ ...inputStyle, width: '140px', margin: 0 }}
              />
            </div>

            {/* Expiry date — min is tomorrow to pass backend @Future check */}
            <div>
              <label style={{ ...labelStyle, marginTop: 0 }}>Expiry Date *</label>
              <input
                type="date"
                min={minDateStr}
                value={expiryDate}
                onChange={e => setExpiryDate(e.target.value)}
                style={{ ...inputStyle, width: '160px', margin: 0 }}
              />
            </div>

            {/* Action buttons */}
            <button onClick={handleAssign} disabled={loading} style={{ ...primaryBtn, background: '#0369a1' }}>
              {loading ? 'Assigning…' : 'Confirm Assign'}
            </button>
            <button onClick={onClose} style={secondaryBtn}>Cancel</button>
          </div>

          {/* Error message from backend or front-end validation */}
          {error && (
            <div style={{
              marginTop: '10px', fontSize: '13px', color: '#b91c1c',
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '6px', padding: '8px 12px', display: 'inline-block'
            }}>
              {error}
            </div>
          )}
        </div>
      </td>
    </tr>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function InsurancePlansPage() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // filter state
  const [search, setSearch] = useState('')         // live text search by plan name
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL' | 'ACTIVE' | 'INACTIVE'

  // which plan row has the assign panel open (by planId), null = none
  const [assigningPlanId, setAssigningPlanId] = useState(null)

  // whether the Create Plan modal is open
  const [showCreateModal, setShowCreateModal] = useState(false)

  // toast notification (success/error message that auto-disappears)
  const [toast, setToast] = useState(null) // { msg, type: 'success'|'error' }

    const [deactivateResult, setDeactivateResult] = useState(null)


  // load plans — wrapped in useCallback so we can call it after create/delete too
  const loadPlans = useCallback(() => {
    setLoading(true); setError('')
    getAllPlans()
      .then(data => setPlans(data || []))
      .catch(e => setError(e.message || 'Failed to load plans'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setLoading(true); setError('')
    getAllPlans()
      .then(data => setPlans(data || []))
      .catch(e => setError(e.message || 'Failed to load plans'))
      .finally(() => setLoading(false))
  }, [])

  // show a toast message for 3 seconds then clear it
  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // deactivate a plan directly from the row button
async function handleDeactivate(plan) {
    const planId = plan.id ?? plan.planId
    if (!window.confirm(
      `Deactivate "${plan.planName}"? Affected employees will be auto-moved to the default plan.`
    )) return

    try {
      // deletePlan now returns DeactivatePlanResponseDTO from backend
      const result = await deletePlan(planId)
      setDeactivateResult(result) // open the result modal
      loadPlans()
    } catch (e) {
      showToast(e.message || 'Failed to deactivate plan', 'error')
    }
  }

  async function handleSetDefault(plan) {
    const planId = plan.id ?? plan.planId
    if (!window.confirm(
      `Mark "${plan.planName}" as the default plan? Employees will be auto-assigned here when any plan is deactivated.`
    )) return

    try {
      await setDefaultPlan(planId)
      showToast(`"${plan.planName}" is now the default plan`)
      loadPlans()
    } catch (e) {
      showToast(e.message || 'Failed to set default plan', 'error')
    }
  }
  // ── filters client-side ──
  const visiblePlans = plans.filter(p => {
    const matchesSearch = p.planName?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && p.isActive) ||
      (statusFilter === 'INACTIVE' && !p.isActive)
    return matchesSearch && matchesStatus
  })

  const activeCount   = plans.filter(p => p.isActive).length
  const inactiveCount = plans.filter(p => !p.isActive).length

  return (
    <div style={{ padding: '24px', fontFamily: "'DM Sans', sans-serif", maxWidth: '1100px', margin: '0 auto' }}>

      <Link
        to="/insurance"
        style={{
          display: 'inline-block', marginBottom: '18px', padding: '8px 12px',
          border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff',
          color: '#0f172a', textDecoration: 'none', fontSize: '13px', fontWeight: 600,
        }}
      >
        ← Back to Insurance
      </Link>

      {/* ── TOAST NOTIFICATION ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: toast.type === 'success' ? '#15803d' : '#b91c1c',
          color: '#fff', borderRadius: '8px', padding: '12px 20px',
          fontSize: '14px', fontWeight: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── HEADER ROW ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>
            Insurance Plans
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            {activeCount} active · {inactiveCount} inactive · {plans.length} total
          </p>
        </div>

        {/* Create Plan button — opens modal, admin never leaves this page */}
        <button
          onClick={() => setShowCreateModal(true)}
          style={{ ...primaryBtn, fontSize: '14px', padding: '10px 18px' }}
        >
          + Create Plan
        </button>
      </div>

      {/* ── FILTERS ROW ── */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>

        {/* Search bar */}
        <input
          type="text"
          placeholder="Search by plan name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 14px',
            fontSize: '13px', outline: 'none', minWidth: '220px', color: '#0f172a',
          }}
        />

        {/* Status toggle buttons — one click, no dropdown needed */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'ACTIVE', 'INACTIVE'].map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              style={{
                padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', border: '1px solid',
                background: statusFilter === f ? '#0f172a' : '#fff',
                color: statusFilter === f ? '#fff' : '#475569',
                borderColor: statusFilter === f ? '#0f172a' : '#cbd5e1',
              }}
            >
              {f === 'ALL' ? `All (${plans.length})` : f === 'ACTIVE' ? `Active (${activeCount})` : `Inactive (${inactiveCount})`}
            </button>
          ))}
        </div>
      </div>

      {/* ── ERROR ── */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
          borderRadius: '8px', padding: '12px 16px', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* ── PLANS TABLE ── */}
      <div style={{ background: '#fff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            Loading plans…
          </div>
        ) : visiblePlans.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            No plans match your filters.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Plan ID', 'Plan Name', 'Coverage Amount', 'Description', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '11px 14px', textAlign: 'left', fontWeight: 600,
                    color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {visiblePlans.map((plan, i) => {
                const planId = plan.id ?? plan.planId
                const isAssigning = assigningPlanId === planId

                return (
                  <>
                    {/* ── PLAN ROW ── */}
                    <tr
                      key={planId}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: isAssigning ? '#f0f9ff' : (i % 2 === 0 ? '#fff' : '#fafafa'),
                      }}
                    >
                      <td style={cellStyle}>{planId}</td>
                      <td style={{ ...cellStyle, fontWeight: 600, color: '#0f172a' }}>{plan.planName}</td>
                      <td style={cellStyle}>{formatINR(plan.coverageAmount)}</td>
                      <td style={{ ...cellStyle, color: '#64748b' }}>{plan.description || '—'}</td>
                      <td style={cellStyle}><StatusBadge isActive={plan.isActive} /></td>

                      {/* ACTION BUTTONS — inline, no navigation */}
                      <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {plan.isActive && (
                            <button
                              onClick={() => setAssigningPlanId(isAssigning ? null : planId)}
                              style={{
                                padding: '5px 10px', borderRadius: '5px', fontSize: '12px',
                                fontWeight: 600, cursor: 'pointer', border: '1px solid #0ea5e9',
                                background: isAssigning ? '#0ea5e9' : '#f0f9ff',
                                color: isAssigning ? '#fff' : '#0369a1',
                              }}
                            >
                              {isAssigning ? 'Cancel' : 'Assign'}
                            </button>
                          )}

                          {/* DEACTIVATE button — only shown for active plans */}
                          {plan.isActive && (
                            <button
                              onClick={() => handleDeactivate(plan)}
                              style={{
                                padding: '5px 10px', borderRadius: '5px', fontSize: '12px',
                                fontWeight: 600, cursor: 'pointer',
                                border: '1px solid #fca5a5',
                                background: '#fef2f2', color: '#b91c1c',
                              }}
                            >
                              Deactivate
                            </button>
                          )}

{/* Set Default button — only for active, non-default plans */}
                          {plan.isActive && !plan.isDefault && (
                            <button
                              onClick={() => handleSetDefault(plan)}
                              style={{
                                padding: '5px 10px', borderRadius: '5px', fontSize: '12px',
                                fontWeight: 600, cursor: 'pointer',
                                border: '1px solid #a3e635',
                                background: '#f7fee7', color: '#3f6212',
                              }}
                            >
                              Set Default
                            </button>
                          )}

                          {/* Default badge — shown instead of button if already default */}
                          {plan.isDefault && (
                            <span style={{
                              padding: '5px 10px', borderRadius: '5px', fontSize: '12px',
                              fontWeight: 700, border: '1px solid #a3e635',
                              background: '#f7fee7', color: '#3f6212',
                            }}>
                              ★ Default
                            </span>
                          )}

                          {/* If inactive, show a disabled label so row isn't empty */}
                          {!plan.isActive && (
                            <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                              No actions
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* ── ASSIGN PANEL (expands below the row when Assign is clicked) ── */}
                    {isAssigning && (
                      <AssignPanel
                        key={`assign-${planId}`}
                        plan={plan}
                        onClose={() => setAssigningPlanId(null)}
                        onAssigned={() => {
                          setAssigningPlanId(null)
                          showToast(`Plan "${plan.planName}" assigned successfully`)
                          loadPlans()
                        }}
                      />
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── DEACTIVATION RESULT MODAL ── */}
      {/* Shows after admin deactivates a plan — lists who was reassigned and to which plan */}
      {deactivateResult && (
        <div
          onClick={() => setDeactivateResult(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: '12px', padding: '28px 32px',
              width: '100%', maxWidth: '460px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}
          >
            <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              Plan Deactivated ✓
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
              {deactivateResult.message}
            </p>

            {/* Summary box — old plan → new plan */}
            <div style={{
              background: '#f8fafc', border: '1px solid #e2e8f0',
              borderRadius: '8px', padding: '12px 16px', marginBottom: '16px', fontSize: '13px',
            }}>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>Deactivated: </span>
                <span style={{ color: '#b91c1c', fontWeight: 700 }}>{deactivateResult.deactivatedPlanName}</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>Moved to: </span>
                <span style={{ color: '#15803d', fontWeight: 700 }}>{deactivateResult.defaultPlanAssigned}</span>
              </div>
            </div>

            {/* Affected employee list */}
            {deactivateResult.affectedEmployeeCount > 0 && (
              <>
                <p style={{ margin: '0 0 8px', fontSize: '12px', fontWeight: 700, color: '#b91c1c' }}>
                  Reassigned Employees ({deactivateResult.affectedEmployeeCount}):
                </p>
                <div style={{
                  maxHeight: '140px', overflowY: 'auto',
                  border: '1px solid #e2e8f0', borderRadius: '6px',
                  padding: '8px 12px', marginBottom: '16px',
                }}>
                  {deactivateResult.affectedEmployeeNames.map((name, i) => (
                    <div key={i} style={{ fontSize: '13px', color: '#334155', padding: '3px 0' }}>
                      · {name}
                    </div>
                  ))}
                </div>
              </>
            )}

            <button
              onClick={() => setDeactivateResult(null)}
              style={{ ...primaryBtn, width: '100%', padding: '10px' }}
            >
              Done
            </button>
          </div>
        </div>
      )}
      {/* ── CREATE PLAN MODAL ── */}
      {showCreateModal && (
        <CreatePlanModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            showToast('Plan created successfully')
            loadPlans() // auto-refresh table — admin sees new plan immediately
          }}
        />
      )}
    </div>
  )
}

// ─── SHARED STYLES ─────────────────────────────────────────────────────────────

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

const cellStyle = {
  padding: '11px 14px', color: '#334155', verticalAlign: 'middle',
}