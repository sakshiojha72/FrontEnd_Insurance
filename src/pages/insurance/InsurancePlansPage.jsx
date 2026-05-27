// InsurancePlansPage.jsx  — ADMIN/HR
// CHANGE FROM ORIGINAL:
//   AssignPanel no longer has a raw "Employee ID" number input.
//   Instead: a "Pick Employee" button opens EmployeePickerModal.
//   Admin clicks a row in the modal → name + ID fill in automatically.
//   This way admin never has to remember or type an employee ID.

import { useEffect, useState, useCallback } from 'react'
import { getAllPlans, createPlan, deletePlan, assignInsurance, setDefaultPlan } from './api'
import { Link } from 'react-router-dom'
import EmployeePickerModal from './EmployeePickerModal'   // ← NEW IMPORT

// ─── tiny helper: format rupee amounts nicely ─────────────────────────────────
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

// ─── CREATE PLAN MODAL ────────────────────────────────────────────────────────
function CreatePlanModal({ onClose, onCreated }) {
  const [planName, setPlanName] = useState('')
  const [coverage, setCoverage] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!planName.trim()) return setError('Plan name is required')
    if (!coverage || Number(coverage) <= 0) return setError('Coverage must be greater than 0')

    setLoading(true); setError('')
    try {
      await createPlan({
        planName: planName.trim(),
        coverageAmount: Number(coverage),
        description: description.trim(),
      })
      onCreated()
      onClose()
    } catch (e) {
      setError(e.message || 'Failed to create plan')
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
        width: '100%', maxWidth: '440px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        <h2 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
          Create Insurance Plan
        </h2>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
            borderRadius: '6px', padding: '10px 14px', fontSize: '13px', marginBottom: '16px',
          }}>{error}</div>
        )}

        <label style={labelStyle}>Plan Name *</label>
        <input style={inputStyle} placeholder="e.g. Basic Health Plan"
          value={planName} onChange={e => setPlanName(e.target.value)} />

        <label style={labelStyle}>Coverage Amount (₹) *</label>
        <input style={inputStyle} type="number" placeholder="e.g. 500000"
          value={coverage} onChange={e => setCoverage(e.target.value)} />

        <label style={labelStyle}>Description (optional)</label>
        <input style={inputStyle} placeholder="Brief description of the plan"
          value={description} onChange={e => setDescription(e.target.value)} />

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
// CHANGED: No more raw Employee ID number input.
//   Now has a "Pick Employee" button that opens EmployeePickerModal.
//   selectedEmployee state holds { userId, fullName } after picker selection.
//   This completely eliminates the need for admin to know/type employee IDs.
function AssignPanel({ plan, onClose, onAssigned }) {
  // NEW: instead of a plain employeeId string, we store the whole picked employee object
  const [selectedEmployee, setSelectedEmployee] = useState(null)  // { userId, fullName }
  const [showPicker, setShowPicker]             = useState(false)  // controls modal visibility
  const [expiryDate, setExpiryDate]             = useState('')
  const [loading, setLoading]                   = useState(false)
  const [error, setError]                       = useState('')

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  async function handleAssign() {
    // Validate: employee must be picked (not typed manually)
    if (!selectedEmployee)
      return setError('Please select an employee using the picker')
    if (!expiryDate)
      return setError('Please select an expiry date')

    setLoading(true); setError('')
    try {
      await assignInsurance(
        Number(selectedEmployee.userId),   // the numeric ID from the picked employee
        plan.planId ?? plan.id,
        expiryDate
      )
      onAssigned()
      onClose()
    } catch (e) {
      setError(e.message || 'Assignment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <tr>
        <td colSpan={6} style={{ padding: 0 }}>
          <div style={{
            padding: '14px 20px', background: '#f0f9ff',
            borderTop: '2px solid #0ea5e9', borderBottom: '1px solid #bae6fd',
          }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0369a1', marginBottom: '12px' }}>
              📋 Assigning: <span style={{ color: '#0f172a' }}>{plan.planName}</span>
              <span style={{ marginLeft: '10px', fontSize: '12px', color: '#64748b', fontWeight: 400 }}>
                Plan ID: {plan.planId ?? plan.id} · Coverage: {formatINR(plan.coverageAmount)}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>

              {/* ── EMPLOYEE PICKER (replaces the old number input) ── */}
              <div>
                <label style={{ ...labelStyle, marginTop: 0 }}>Employee *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Show the selected employee's name + ID, or a placeholder */}
                  <div style={{
                    padding: '7px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
                    fontSize: '13px', color: selectedEmployee ? '#0f172a' : '#94a3b8',
                    background: '#fff', minWidth: '200px',
                    // green border when selected so admin can see it's filled
                    borderColor: selectedEmployee ? '#86efac' : '#cbd5e1',
                  }}>
                    {selectedEmployee
                      ? `${selectedEmployee.fullName} (ID: ${selectedEmployee.userId})`
                      : 'No employee selected'}
                  </div>

                  {/* The button that opens the modal */}
                  <button
                    onClick={() => setShowPicker(true)}
                    style={{
                      padding: '7px 12px', borderRadius: '6px', fontSize: '12px',
                      fontWeight: 600, cursor: 'pointer',
                      border: '1px solid #0ea5e9',
                      background: '#f0f9ff', color: '#0369a1',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    🔍 Pick Employee
                  </button>

                  {/* Allow admin to clear the selection */}
                  {selectedEmployee && (
                    <button
                      onClick={() => setSelectedEmployee(null)}
                      style={{
                        background: 'none', border: 'none',
                        color: '#94a3b8', cursor: 'pointer',
                        fontSize: '18px', lineHeight: 1, padding: '2px',
                      }}
                      title="Clear selection"
                    >×</button>
                  )}
                </div>
              </div>

              {/* Expiry date — unchanged from original */}
              <div>
                <label style={{ ...labelStyle, marginTop: 0 }}>Expiry Date *</label>
                <input type="date" min={minDateStr} value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  style={{ ...inputStyle, width: '160px', margin: 0 }} />
              </div>

              <button onClick={handleAssign} disabled={loading}
                style={{ ...primaryBtn, background: '#0369a1' }}>
                {loading ? 'Assigning…' : 'Confirm Assign'}
              </button>
              <button onClick={onClose} style={secondaryBtn}>Cancel</button>
            </div>

            {error && (
              <div style={{
                marginTop: '10px', fontSize: '13px', color: '#b91c1c',
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '6px', padding: '8px 12px', display: 'inline-block',
              }}>{error}</div>
            )}
          </div>
        </td>
      </tr>

      {/* ── EMPLOYEE PICKER MODAL — renders outside the table ── */}
      {/* WHY: modals inside <tr><td> cause layout bugs in some browsers */}
      {showPicker && (
        <EmployeePickerModal
          onSelect={emp => setSelectedEmployee(emp)}   // emp = { userId, fullName, username }
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function InsurancePlansPage() {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [assigningPlanId, setAssigningPlanId] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [toast, setToast] = useState(null)
  const [deactivateResult, setDeactivateResult] = useState(null)

  const loadPlans = useCallback(() => {
    setLoading(true); setError('')
    getAllPlans()
      .then(data => setPlans(data || []))
      .catch(e => setError(e.message || 'Failed to load plans'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadPlans() }, [loadPlans])

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleDeactivate(plan) {
    const planId = plan.id ?? plan.planId
    if (!window.confirm(
      `Deactivate "${plan.planName}"?\n\nAffected employees will be auto-moved to the default plan.`
    )) return

    try {
      const result = await deletePlan(planId)
      setPlans(prev => prev.map(p =>
        (p.id ?? p.planId) === planId ? { ...p, isActive: false } : p
      ))
      setDeactivateResult(result)
    } catch (e) {
      showToast(e.message || 'Failed to deactivate plan', 'error')
    }
  }

  async function handleSetDefault(plan) {
    const planId = plan.id ?? plan.planId
    if (!window.confirm(
      `Set "${plan.planName}" as the default plan?\n\nThe current default will be cleared.`
    )) return

    try {
      await setDefaultPlan(planId)
      setPlans(prev => prev.map(p =>
        (p.id ?? p.planId) === planId
          ? { ...p, isDefault: true }
          : { ...p, isDefault: false }
      ))
      showToast(`"${plan.planName}" is now the default plan`)
    } catch (e) {
      showToast(e.message || 'Failed to set default plan', 'error')
    }
  }

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

      <Link to="/insurance" style={{
        display: 'inline-block', marginBottom: '18px', padding: '8px 12px',
        border: '1px solid #cbd5e1', borderRadius: '8px', background: '#fff',
        color: '#0f172a', textDecoration: 'none', fontSize: '13px', fontWeight: 600,
      }}>
        ← Back to Insurance
      </Link>

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

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>
            Insurance Plans
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            {activeCount} active · {inactiveCount} inactive · {plans.length} total
          </p>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          style={{ ...primaryBtn, fontSize: '14px', padding: '10px 18px' }}>
          + Create Plan
        </button>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type="text" placeholder="Search by plan name…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 14px',
            fontSize: '13px', outline: 'none', minWidth: '220px', color: '#0f172a',
          }} />
        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'ACTIVE', 'INACTIVE'].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)} style={{
              padding: '7px 14px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
              cursor: 'pointer', border: '1px solid',
              background: statusFilter === f ? '#0f172a' : '#fff',
              color: statusFilter === f ? '#fff' : '#475569',
              borderColor: statusFilter === f ? '#0f172a' : '#cbd5e1',
            }}>
              {f === 'ALL' ? `All (${plans.length})` : f === 'ACTIVE' ? `Active (${activeCount})` : `Inactive (${inactiveCount})`}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
          borderRadius: '8px', padding: '12px 16px', fontSize: '13px', marginBottom: '16px',
        }}>{error}</div>
      )}

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
                    <tr key={planId} style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: isAssigning ? '#f0f9ff' : (i % 2 === 0 ? '#fff' : '#fafafa'),
                    }}>
                      <td style={cellStyle}>{planId}</td>
                      <td style={{ ...cellStyle, fontWeight: 600, color: '#0f172a' }}>{plan.planName}</td>
                      <td style={cellStyle}>{formatINR(plan.coverageAmount)}</td>
                      <td style={{ ...cellStyle, color: '#64748b' }}>{plan.description || '—'}</td>
                      <td style={cellStyle}><StatusBadge isActive={plan.isActive} /></td>

                      <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          {plan.isActive && (
                            <button
                              onClick={() => setAssigningPlanId(isAssigning ? null : planId)}
                              style={{
                                padding: '5px 10px', borderRadius: '5px', fontSize: '12px',
                                fontWeight: 600, cursor: 'pointer', border: '1px solid #0ea5e9',
                                background: isAssigning ? '#0ea5e9' : '#f0f9ff',
                                color: isAssigning ? '#fff' : '#0369a1',
                              }}>
                              {isAssigning ? 'Cancel' : 'Assign'}
                            </button>
                          )}

                          {plan.isActive && !plan.isDefault && (
                            <button onClick={() => handleDeactivate(plan)} style={{
                              padding: '5px 10px', borderRadius: '5px', fontSize: '12px',
                              fontWeight: 600, cursor: 'pointer',
                              border: '1px solid #fca5a5', background: '#fef2f2', color: '#b91c1c',
                            }}>
                              Deactivate
                            </button>
                          )}

                          {plan.isActive && !plan.isDefault && (
                            <button onClick={() => handleSetDefault(plan)} style={{
                              padding: '5px 10px', borderRadius: '5px', fontSize: '12px',
                              fontWeight: 600, cursor: 'pointer',
                              border: '1px solid #a3e635', background: '#f7fee7', color: '#3f6212',
                            }}>
                              Set Default
                            </button>
                          )}

                          {plan.isDefault && (
                            <span style={{
                              padding: '5px 10px', borderRadius: '5px', fontSize: '12px',
                              fontWeight: 700, border: '1px solid #a3e635',
                              background: '#f7fee7', color: '#3f6212',
                            }}>
                              ★ Default
                            </span>
                          )}

                          {!plan.isActive && (
                            <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                              No actions
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* ASSIGN PANEL — now uses EmployeePickerModal internally */}
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

      {/* DEACTIVATION RESULT MODAL — unchanged */}
      {deactivateResult && (
        <div onClick={() => setDeactivateResult(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: '12px', padding: '28px 32px',
            width: '100%', maxWidth: '460px', boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <h2 style={{ margin: '0 0 6px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              Plan Deactivated ✓
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748b' }}>
              {deactivateResult.message}
            </p>
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
            <button onClick={() => setDeactivateResult(null)}
              style={{ ...primaryBtn, width: '100%', padding: '10px' }}>
              Done
            </button>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreatePlanModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            showToast('Plan created successfully')
            loadPlans()
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