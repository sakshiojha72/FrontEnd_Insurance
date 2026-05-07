// EmployeeInsurancePage.jsx

import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  getAllEmployees,
  getEmployeeInsurance,
  getEmployeeClaims,
  getEmployeeTopUps,
  renewInsurance,
  assignInsurance,
  getAllPlans,
} from './api'

// ─── ROLE ────────────────────────────────────────────────────────────────────
// Read once at module scope — doesn't change during a session
const USER_ROLE = (localStorage.getItem('jwt_role') || '').toUpperCase()
const IS_ADMIN  = USER_ROLE === 'ADMIN'

// ─── FORMATTERS ──────────────────────────────────────────────────────────────
function fmt(n) {
  // 500000 → "₹5,00,000"   (Indian locale)
  return '₹' + Number(n || 0).toLocaleString('en-IN')
}
function fmtDate(d) {
  // "2025-09-15" → "15 Sep 2025"
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}
// Days until a date (negative = already expired)
function daysUntil(dateStr) {
  if (!dateStr) return null
  const diff = new Date(dateStr) - new Date()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

// ─── INSURANCE STATUS BADGE ───────────────────────────────────────────────────
// Handles string values like "ACTIVE", "EXPIRED", "active" coming from backend
function InsuranceBadge({ status }) {
  const s = (status || '').toUpperCase()
  const map = {
    ACTIVE:   { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0', label: 'Active' },
    EXPIRED:  { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca', label: 'Expired' },
    INACTIVE: { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0', label: 'Inactive' },
  }
  const style = map[s] || map.INACTIVE
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: '999px',
      fontSize: '11px', fontWeight: 700,
      background: style.bg, color: style.color, border: `1px solid ${style.border}`,
    }}>
      {style.label}
    </span>
  )
}

// ─── CLAIM STATUS BADGE ───────────────────────────────────────────────────────
function ClaimBadge({ status }) {
  const s = (status || '').toUpperCase()
  const map = {
    APPROVED: { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
    PENDING:  { bg: '#fef9c3', color: '#854d0e', border: '#fde68a' },
    REJECTED: { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' },
  }
  const style = map[s] || { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' }
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: '999px',
      fontSize: '11px', fontWeight: 700,
      background: style.bg, color: style.color, border: `1px solid ${style.border}`,
    }}>
      {s || 'UNKNOWN'}
    </span>
  )
}

// ─── COVERAGE PROGRESS BAR ───────────────────────────────────────────────────
// Shows visually how much coverage has been consumed via approved claims
// totalCoverage = coverageAmount + topUpCoverage
// remaining     = totalCoverage - approvedClaimsTotal
function CoverageBar({ remaining, total }) {
  const pct = total > 0 ? Math.min(100, Math.max(0, (remaining / total) * 100)) : 0
  const color = pct > 60 ? '#15803d' : pct > 30 ? '#d97706' : '#b91c1c'
  return (
    <div style={{ marginTop: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
        <span>Remaining</span>
        <span style={{ fontWeight: 700, color }}>{Math.round(pct)}%</span>
      </div>
      <div style={{ background: '#e2e8f0', borderRadius: '999px', height: '6px', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', background: color,
          borderRadius: '999px', transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  )
}

// ─── EMPLOYEE CARD ────────────────────────────────────────────────────────────
// One card per employee in the grid
// insuranceStatus is pre-fetched lazily — shows "—" until clicked
function EmployeeCard({ emp, isSelected, onClick, insuranceStatus }) {
  // Initials avatar: "Sakshi Ojha" → "SO"
  const initials = [emp.firstName, emp.lastName]
    .filter(Boolean).map(n => n[0].toUpperCase()).join('')

  // Colour the avatar ring based on insurance status
  const ringColor = {
    ACTIVE:  '#22c55e',
    EXPIRED: '#ef4444',
    NONE:    '#94a3b8',
  }[insuranceStatus || 'NONE']

  return (
    <div
      onClick={onClick}
      style={{
        background: isSelected ? '#f0f9ff' : '#fff',
        border: `2px solid ${isSelected ? '#0ea5e9' : '#e2e8f0'}`,
        borderRadius: '12px',
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxShadow: isSelected
          ? '0 0 0 3px rgba(14,165,233,0.15), 0 4px 12px rgba(0,0,0,0.08)'
          : '0 1px 3px rgba(0,0,0,0.05)',
        position: 'relative',
        // subtle lift on hover handled via onMouseEnter/Leave below
      }}
      onMouseEnter={e => {
        if (!isSelected) e.currentTarget.style.borderColor = '#94a3b8'
      }}
      onMouseLeave={e => {
        if (!isSelected) e.currentTarget.style.borderColor = '#e2e8f0'
      }}
    >
      {/* Selection indicator dot */}
      {isSelected && (
        <div style={{
          position: 'absolute', top: '10px', right: '10px',
          width: '8px', height: '8px', borderRadius: '50%', background: '#0ea5e9',
        }} />
      )}

      {/* Avatar + Name row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '50%',
          background: '#0f172a', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '13px', fontWeight: 700, flexShrink: 0,
          outline: `2px solid ${ringColor}`, outlineOffset: '2px',
        }}>
          {initials || '?'}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontWeight: 700, fontSize: '13px', color: '#0f172a',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {emp.firstName} {emp.lastName}
          </div>
          <div style={{
            fontSize: '11px', color: '#64748b',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {emp.email}
          </div>
        </div>
      </div>

      {/* Footer row: ID + insurance badge */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
          ID #{emp.userId ?? emp.id}
        </span>
        {insuranceStatus
          ? <InsuranceBadge status={insuranceStatus === 'NONE' ? 'INACTIVE' : insuranceStatus} />
          : <span style={{ fontSize: '11px', color: '#cbd5e1' }}>Click to load</span>
        }
      </div>
    </div>
  )
}

// ─── RENEW FORM (inline in detail panel, ADMIN only) ─────────────────────────
function RenewForm({ insurance, onRenewed }) {
  const [date, setDate]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // Min date = tomorrow
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minStr = minDate.toISOString().split('T')[0]

  async function submit() {
    if (!date) return setError('Pick a new expiry date')
    setLoading(true); setError('')
    try {
      await renewInsurance(insurance.employeeInsuranceId ?? insurance.id, date)
      onRenewed()
    } catch (e) {
      setError(e.message || 'Renewal failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      background: '#fef9c3', border: '1px solid #fde68a',
      borderRadius: '8px', padding: '14px 16px', marginTop: '12px',
    }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#854d0e', marginBottom: '10px' }}>
        ⚠️ Insurance Expired — Renew Now
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label style={lbl}>New Expiry Date</label>
          <input type="date" min={minStr} value={date}
            onChange={e => setDate(e.target.value)}
            style={{ ...inp, width: '160px', margin: 0 }} />
        </div>
        <button onClick={submit} disabled={loading}
          style={{ ...btnPrimary, background: '#854d0e', borderColor: '#854d0e' }}>
          {loading ? 'Renewing…' : 'Renew'}
        </button>
      </div>
      {error && <div style={{ fontSize: '12px', color: '#b91c1c', marginTop: '8px' }}>{error}</div>}
    </div>
  )
}

// ─── ASSIGN FORM (inline in detail panel, ADMIN only) ────────────────────────
// Shown when employee has NO insurance yet
function AssignForm({ employeeId, plans, onAssigned }) {
  const [planId, setPlanId]   = useState('')
  const [date, setDate]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minStr = minDate.toISOString().split('T')[0]

  async function submit() {
    if (!planId) return setError('Select a plan')
    if (!date)   return setError('Pick an expiry date')
    setLoading(true); setError('')
    try {
      await assignInsurance(Number(employeeId), Number(planId), date)
      onAssigned()
    } catch (e) {
      setError(e.message || 'Assignment failed')
    } finally {
      setLoading(false)
    }
  }

  // Only show active plans in dropdown — inactive plans should not be assignable
  const activePlans = (plans || []).filter(p => p.isActive)

  return (
    <div style={{
      background: '#f0f9ff', border: '1px solid #bae6fd',
      borderRadius: '8px', padding: '14px 16px', marginTop: '12px',
    }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1', marginBottom: '10px' }}>
        📋 No Insurance — Assign a Plan
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <label style={lbl}>Insurance Plan</label>
          <select value={planId} onChange={e => setPlanId(e.target.value)}
            style={{ ...inp, width: '200px', margin: 0 }}>
            <option value="">— Select plan —</option>
            {activePlans.map(p => (
              <option key={p.id ?? p.planId} value={p.id ?? p.planId}>
                {p.planName} · {fmt(p.coverageAmount)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={lbl}>Expiry Date</label>
          <input type="date" min={minStr} value={date}
            onChange={e => setDate(e.target.value)}
            style={{ ...inp, width: '160px', margin: 0 }} />
        </div>
        <button onClick={submit} disabled={loading} style={btnPrimary}>
          {loading ? 'Assigning…' : 'Assign Plan'}
        </button>
      </div>
      {error && <div style={{ fontSize: '12px', color: '#b91c1c', marginTop: '8px' }}>{error}</div>}
    </div>
  )
}

// ─── DETAIL PANEL ─────────────────────────────────────────────────────────────
// Right-side panel that shows full insurance + claims + top-ups for one employee
function DetailPanel({ emp, onClose, onActionDone }) {
  const [insurance, setInsurance] = useState(null)
  const [claims,    setClaims]    = useState([])
  const [topups,    setTopUps]    = useState([])
  const [plans,     setPlans]     = useState([])   // for the assign dropdown
  const [loading,   setLoading]   = useState(true)
  const [toast,     setToast]     = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Fetch all data for this employee in parallel
  const load = useCallback(() => {
    if (!emp) return
    const id = emp.userId ?? emp.id
    setLoading(true)

    // Fire 3 calls simultaneously for speed
    Promise.allSettled([
      getEmployeeInsurance(id),
      getEmployeeClaims(id),
      getEmployeeTopUps(id),
      IS_ADMIN ? getAllPlans() : Promise.resolve([]),
    ]).then(([ins, cls, tps, pls]) => {
      setInsurance(ins.status === 'fulfilled' ? ins.value : null)
      setClaims(   cls.status === 'fulfilled' ? (cls.value || []) : [])
      setTopUps(   tps.status === 'fulfilled' ? (tps.value || []) : [])
      setPlans(    pls.status === 'fulfilled' ? (pls.value || []) : [])
      setLoading(false)
    })
  }, [emp])

  useEffect(() => { load() }, [load])

  if (!emp) return null

  const empId     = emp.userId ?? emp.id
  const fullName  = `${emp.firstName || ''} ${emp.lastName || ''}`.trim()
  const initials  = [emp.firstName, emp.lastName].filter(Boolean).map(n => n[0]).join('').toUpperCase()

  // Calculate total coverage (base + topups) for the progress bar
  const baseAmount  = insurance?.coverageAmount || insurance?.baseAmount || 0
  const topUpTotal  = topups.filter(t => (t.status || '').toUpperCase() === 'ACTIVE')
                            .reduce((s, t) => s + (t.additionalCoverage || 0), 0)
  const totalCoverage  = baseAmount + topUpTotal
  const remaining      = insurance?.remainingCoverage ?? insurance?.remaining ?? baseAmount

  // Counts for the mini-summary row above claims table
  const approvedCount = claims.filter(c => c.status?.toUpperCase() === 'APPROVED').length
  const pendingCount  = claims.filter(c => c.status?.toUpperCase() === 'PENDING').length
  const rejectedCount = claims.filter(c => c.status?.toUpperCase() === 'REJECTED').length

  // Days until expiry — for urgency indicator
  const expiryDays = daysUntil(insurance?.expiryDate)

  return (
    <div style={{
      width: '440px',
      flexShrink: 0,
      background: '#fff',
      borderLeft: '1px solid #e2e8f0',
      height: '100%',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* ── PANEL HEADER ── */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #e2e8f0',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        {/* Avatar */}
        <div style={{
          width: '42px', height: '42px', borderRadius: '50%',
          background: '#0f172a', color: '#fff', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 700,
        }}>{initials || '?'}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a' }}>{fullName}</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>{emp.email} · ID #{empId}</div>
        </div>

        {/* Close button */}
        <button onClick={onClose} style={{
          background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px',
          padding: '4px 8px', cursor: 'pointer', fontSize: '16px', color: '#64748b',
          lineHeight: 1,
        }}>×</button>
      </div>

      {/* ── TOAST ── */}
      {toast && (
        <div style={{
          position: 'sticky', top: '72px', zIndex: 20,
          margin: '10px 20px 0',
          background: toast.type === 'success' ? '#dcfce7' : '#fee2e2',
          color:      toast.type === 'success' ? '#15803d' : '#b91c1c',
          border: `1px solid ${toast.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          borderRadius: '6px', padding: '8px 12px', fontSize: '12px', fontWeight: 600,
        }}>{toast.msg}</div>
      )}

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#94a3b8', fontSize: '14px' }}>
          Loading employee data…
        </div>
      ) : (
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── SECTION 1: INSURANCE SUMMARY CARD ── */}
          <section>
            <SectionTitle icon="🛡️" title="Insurance" />

            {insurance ? (
              <div style={{
                border: '1px solid #e2e8f0', borderRadius: '10px',
                overflow: 'hidden',
              }}>
                {/* Expiry urgency banner */}
                {expiryDays !== null && expiryDays <= 30 && expiryDays > 0 && (
                  <div style={{
                    background: expiryDays <= 7 ? '#fef2f2' : '#fef9c3',
                    borderBottom: `1px solid ${expiryDays <= 7 ? '#fecaca' : '#fde68a'}`,
                    padding: '8px 14px', fontSize: '12px', fontWeight: 600,
                    color: expiryDays <= 7 ? '#b91c1c' : '#854d0e',
                  }}>
                    {expiryDays <= 7 ? '🚨' : '⚠️'} Expires in {expiryDays} day{expiryDays !== 1 ? 's' : ''}!
                  </div>
                )}

                {/* Main stats grid */}
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <Stat label="Plan Name"        value={insurance.planName || '—'} bold />
                    <Stat label="Status"
                      value={<InsuranceBadge status={insurance.status} />} />
                    <Stat label="Base Coverage"    value={fmt(insurance.coverageAmount)} />
                    <Stat label="Top-Up Coverage"  value={fmt(topUpTotal)} />
                    <Stat label="Assigned Date"    value={fmtDate(insurance.assignedDate)} />
                    <Stat label="Expiry Date"      value={fmtDate(insurance.expiryDate)} />
                    <Stat label="Assigned By"      value={insurance.assignedBy || '—'} />
                    <Stat label="Remaining"
                      value={<span style={{ color: '#15803d', fontWeight: 700 }}>{fmt(remaining)}</span>} />
                  </div>

                  {/* Coverage consumption bar */}
                  <div style={{ marginTop: '14px', padding: '10px 12px',
                    background: '#f8fafc', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                      fontSize: '11px', color: '#64748b', marginBottom: '2px' }}>
                      <span>Total coverage: {fmt(totalCoverage)}</span>
                      <span>Used: {fmt(totalCoverage - remaining)}</span>
                    </div>
                    <CoverageBar remaining={remaining} total={totalCoverage} />
                  </div>
                </div>

                {/* ADMIN-only: Renew if expired */}
                {IS_ADMIN && insurance.status?.toUpperCase() === 'EXPIRED' && (
                  <div style={{ padding: '0 16px 14px' }}>
                    <RenewForm
                      insurance={insurance}
                      onRenewed={() => {
                        showToast('Insurance renewed successfully')
                        load()
                        onActionDone()
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              // Employee has no insurance at all
              <div style={{
                background: '#f8fafc', border: '1px dashed #cbd5e1',
                borderRadius: '10px', padding: '20px',
                textAlign: 'center', color: '#94a3b8', fontSize: '13px',
              }}>
                No insurance assigned yet.
                {IS_ADMIN && (
                  <AssignForm
                    employeeId={empId}
                    plans={plans}
                    onAssigned={() => {
                      showToast('Insurance assigned successfully')
                      load()
                      onActionDone()
                    }}
                  />
                )}
              </div>
            )}
          </section>

          {/* ── SECTION 2: CLAIMS ── */}
          <section>
            <SectionTitle icon="📄" title="Claims" />

            {/* Mini summary pills */}
            {claims.length > 0 && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                <CountPill label="Approved" count={approvedCount} color="#15803d" bg="#dcfce7" />
                <CountPill label="Pending"  count={pendingCount}  color="#854d0e" bg="#fef9c3" />
                <CountPill label="Rejected" count={rejectedCount} color="#b91c1c" bg="#fee2e2" />
              </div>
            )}

            {claims.length === 0 ? (
              <EmptyState text="No claims found" />
            ) : (
              <div style={{
                border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      {['Amount', 'Reason', 'Status', 'Date'].map(h => (
                        <th key={h} style={{
                          padding: '8px 10px', textAlign: 'left',
                          fontWeight: 600, color: '#475569', fontSize: '11px',
                          textTransform: 'uppercase', letterSpacing: '0.04em',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {claims.map((c, i) => (
                      <tr key={i} style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: i % 2 === 0 ? '#fff' : '#fafafa',
                      }}>
                        <td style={td}>{fmt(c.claimAmount)}</td>
                        <td style={{ ...td, color: '#64748b', maxWidth: '120px',
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={c.reason}>
                          {c.reason}
                        </td>
                        <td style={td}><ClaimBadge status={c.status} /></td>
                        <td style={{ ...td, color: '#94a3b8' }}>
                          {fmtDate(c.raisedAt?.split('T')[0] || c.raisedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ── SECTION 3: TOP-UPS ── */}
          <section>
            <SectionTitle icon="⬆️" title="Top-Ups" />

            {topups.length === 0 ? (
              <EmptyState text="No top-ups purchased" />
            ) : (
              <div style={{
                border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden',
              }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      {['Plan', 'Coverage', 'Status', 'Expiry'].map(h => (
                        <th key={h} style={{
                          padding: '8px 10px', textAlign: 'left',
                          fontWeight: 600, color: '#475569', fontSize: '11px',
                          textTransform: 'uppercase', letterSpacing: '0.04em',
                        }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {topups.map((t, i) => (
                      <tr key={i} style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: i % 2 === 0 ? '#fff' : '#fafafa',
                      }}>
                        <td style={{ ...td, fontWeight: 600, color: '#0f172a' }}>{t.topUpName}</td>
                        <td style={td}>{fmt(t.additionalCoverage)}</td>
                        <td style={td}>
                          <InsuranceBadge status={t.status} />
                        </td>
                        <td style={{ ...td, color: '#94a3b8' }}>{fmtDate(t.expiryDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

        </div>
      )}
    </div>
  )
}

// ─── SMALL REUSABLE BITS ──────────────────────────────────────────────────────

// Section title with icon inside the detail panel
function SectionTitle({ icon, title }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
      <span style={{ fontSize: '14px' }}>{icon}</span>
      <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a',
        textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
    </div>
  )
}

// A single key-value pair inside the insurance grid
function Stat({ label, value, bold }) {
  return (
    <div>
      <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8',
        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontSize: '13px', fontWeight: bold ? 700 : 500, color: '#0f172a' }}>
        {value}
      </div>
    </div>
  )
}

// Small count pill: "Approved 2"
function CountPill({ label, count, color, bg }) {
  if (count === 0) return null
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '4px',
      background: bg, borderRadius: '999px', padding: '2px 8px',
      fontSize: '11px', fontWeight: 700, color,
    }}>
      {label} <span style={{
        background: color, color: '#fff', borderRadius: '50%',
        width: '16px', height: '16px', display: 'flex',
        alignItems: 'center', justifyContent: 'center', fontSize: '10px',
      }}>{count}</span>
    </div>
  )
}

// Empty state for tables
function EmptyState({ text }) {
  return (
    <div style={{
      background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '8px',
      padding: '16px', textAlign: 'center', fontSize: '12px', color: '#94a3b8',
    }}>{text}</div>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function EmployeeInsurancePage() {
  const [employees,  setEmployees]  = useState([])
  const [loading,    setLoading]    = useState(true)
  const [error,      setError]      = useState('')

  // Lazily cached insurance status per employee — fetched when card is clicked
  // { [empId]: 'ACTIVE' | 'EXPIRED' | 'NONE' }
  const [insStatus, setInsStatus]   = useState({})

  // Which employee's detail panel is open
  const [selectedEmp, setSelectedEmp] = useState(null)

  // Grid-level filters
  const [search,       setSearch]      = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL'|'ACTIVE'|'EXPIRED'|'NONE'

  // Toast at page level (for actions done inside the panel)
  const [toast, setToast] = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Load all employees once on mount
  useEffect(() => {
    setLoading(true)
    getAllEmployees()
      .then(data => setEmployees(data || []))
      .catch(e => setError(e.message || 'Failed to load employees'))
      .finally(() => setLoading(false))
  }, [])

  // When a card is clicked:
  //  1. Set it as selected (opens panel)
  //  2. Fetch its insurance status if we haven't already (for the avatar ring colour)
  function handleCardClick(emp) {
    const id = emp.userId ?? emp.id

    // If same card clicked again — toggle panel closed
    if (selectedEmp && (selectedEmp.userId ?? selectedEmp.id) === id) {
      setSelectedEmp(null)
      return
    }

    setSelectedEmp(emp)

    // Only fetch status if we don't have it yet
    if (insStatus[id] !== undefined) return

    getEmployeeInsurance(id)
      .then(ins => {
        setInsStatus(prev => ({
          ...prev,
          [id]: ins ? (ins.status || 'ACTIVE').toUpperCase() : 'NONE',
        }))
      })
      .catch(() => {
        setInsStatus(prev => ({ ...prev, [id]: 'NONE' }))
      })
  }

  // After an action (renew / assign) — refresh the status badge on the card
  function handleActionDone() {
    if (!selectedEmp) return
    const id = selectedEmp.userId ?? selectedEmp.id
    // Clear cached status so it re-fetches
    setInsStatus(prev => { const n = { ...prev }; delete n[id]; return n })
    // Re-fetch it
    getEmployeeInsurance(id)
      .then(ins => setInsStatus(prev => ({
        ...prev,
        [id]: ins ? (ins.status || 'ACTIVE').toUpperCase() : 'NONE',
      })))
      .catch(() => setInsStatus(prev => ({ ...prev, [id]: 'NONE' })))

    showToast('Action completed. Data refreshed.')
  }

  // Apply search + status filter to the grid
  const filtered = employees.filter(emp => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      (emp.firstName || '').toLowerCase().includes(q) ||
      (emp.lastName  || '').toLowerCase().includes(q) ||
      (emp.email     || '').toLowerCase().includes(q) ||
      String(emp.userId ?? emp.id).includes(q)

    const id = emp.userId ?? emp.id
    const status = insStatus[id] || 'UNKNOWN'
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE'  && status === 'ACTIVE') ||
      (statusFilter === 'EXPIRED' && status === 'EXPIRED') ||
      (statusFilter === 'NONE'    && (status === 'NONE' || status === 'UNKNOWN'))

    return matchSearch && matchStatus
  })

  // Count badges for filter buttons
  const countActive  = employees.filter(e => insStatus[e.userId ?? e.id] === 'ACTIVE').length
  const countExpired = employees.filter(e => insStatus[e.userId ?? e.id] === 'EXPIRED').length
  const countNone    = employees.filter(e =>
    insStatus[e.userId ?? e.id] === 'NONE' || !insStatus[e.userId ?? e.id]).length

  return (
    <div style={{
      fontFamily: "'DM Sans', sans-serif",
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: '#f8fafc',
    }}>

      {/* ── PAGE-LEVEL TOAST ── */}
      {toast && (
        <div style={{
          position: 'fixed', top: '16px', right: '16px', zIndex: 9999,
          background: toast.type === 'success' ? '#15803d' : '#b91c1c',
          color: '#fff', borderRadius: '8px', padding: '10px 18px',
          fontSize: '13px', fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>{toast.msg}</div>
      )}

      {/* ── TOP BAR ── */}
      <div style={{
        padding: '16px 24px',
        background: '#fff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
        flexShrink: 0,
      }}>
        <Link to="/insurance" style={{
          padding: '7px 12px', border: '1px solid #cbd5e1', borderRadius: '6px',
          fontSize: '13px', fontWeight: 500, color: '#475569', textDecoration: 'none',
          background: '#fff', whiteSpace: 'nowrap',
        }}>
          ← Back to Insurance
        </Link>

        <div style={{ flex: 1, minWidth: '160px' }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
            Employee Insurance
          </h1>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>
            {employees.length} employees · click a card to view details
          </p>
        </div>

        {/* Search input */}
        <input
          placeholder="Search by name, email or ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            padding: '8px 14px', border: '1px solid #cbd5e1', borderRadius: '8px',
            fontSize: '13px', outline: 'none', minWidth: '220px', color: '#0f172a',
            background: '#fff',
          }}
        />

        {/* Status filter buttons */}
        <div style={{ display: 'flex', gap: '5px' }}>
          {[
            { key: 'ALL',     label: `All (${employees.length})` },
            { key: 'ACTIVE',  label: `Active (${countActive})` },
            { key: 'EXPIRED', label: `Expired (${countExpired})` },
            { key: 'NONE',    label: `No Plan (${countNone})` },
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setStatusFilter(key)} style={{
              padding: '6px 11px', borderRadius: '6px', fontSize: '12px',
              fontWeight: 600, cursor: 'pointer', border: '1px solid',
              background: statusFilter === key ? '#0f172a' : '#fff',
              color: statusFilter === key ? '#fff' : '#475569',
              borderColor: statusFilter === key ? '#0f172a' : '#cbd5e1',
              whiteSpace: 'nowrap',
            }}>{label}</button>
          ))}
        </div>
      </div>

      {/* ── MAIN BODY: grid + panel side-by-side ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* LEFT: scrollable card grid */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>

          {error && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
              borderRadius: '8px', padding: '12px 16px', fontSize: '13px', marginBottom: '16px',
            }}>{error}</div>
          )}

          {loading ? (
            // Skeleton loader — 8 placeholder cards while data loads
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '14px',
            }}>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  height: '96px', background: '#e2e8f0', borderRadius: '12px',
                  animation: 'pulse 1.5s ease-in-out infinite',
                  opacity: 1 - i * 0.08,
                }} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{
              textAlign: 'center', color: '#94a3b8', fontSize: '14px',
              marginTop: '60px',
            }}>
              No employees match your search.
            </div>
          ) : (
            <div style={{
              display: 'grid',
              // When panel is open, grid shrinks → fewer columns → cards stay readable
              gridTemplateColumns: selectedEmp
                ? 'repeat(auto-fill, minmax(180px, 1fr))'
                : 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '14px',
              transition: 'grid-template-columns 0.2s ease',
            }}>
              {filtered.map(emp => {
                const id = emp.userId ?? emp.id
                return (
                  <EmployeeCard
                    key={id}
                    emp={emp}
                    isSelected={selectedEmp && (selectedEmp.userId ?? selectedEmp.id) === id}
                    onClick={() => handleCardClick(emp)}
                    insuranceStatus={insStatus[id]}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* RIGHT: detail panel — only visible when a card is selected */}
        {selectedEmp && (
          <DetailPanel
            emp={selectedEmp}
            onClose={() => setSelectedEmp(null)}
            onActionDone={handleActionDone}
          />
        )}
      </div>

      {/* Skeleton pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.9; }
        }
      `}</style>
    </div>
  )
}

// ─── SHARED MICRO-STYLES ──────────────────────────────────────────────────────
// These are only used inside the detail panel's forms
const lbl = {
  display: 'block', fontSize: '11px', fontWeight: 600,
  color: '#475569', marginBottom: '3px', marginTop: '8px',
}
const inp = {
  display: 'block', width: '100%', padding: '7px 10px',
  border: '1px solid #cbd5e1', borderRadius: '6px',
  fontSize: '13px', outline: 'none', color: '#0f172a',
  background: '#fff', boxSizing: 'border-box',
}
const btnPrimary = {
  padding: '8px 14px', borderRadius: '6px', border: 'none',
  background: '#0f172a', color: '#fff', fontWeight: 600,
  fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap',
}
const td = {
  padding: '8px 10px', color: '#334155', verticalAlign: 'middle',
}