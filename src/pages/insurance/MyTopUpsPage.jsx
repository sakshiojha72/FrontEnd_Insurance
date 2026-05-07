// MyTopUpsPage.jsx  —  EMPLOYEE only
//
// WHAT CHANGED vs old version:
//   OLD: Employee reads plan ID from table → scrolls to form → manually types it → picks date → buys
//   NEW: Each active plan row has a "Buy" button
//        Clicking it opens an expiry date picker inline below that row
//        Plan ID is pre-filled automatically — employee never types it
//
// API calls:
//   getAllTopUpPlans()   GET  /insurance/topups/plans    → available plans to browse
//   buyTopUp(id, date)  POST /insurance/topups/buy       → purchase
//   getMyTopUps()       GET  /insurance/topups/my        → my purchased top-ups

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllTopUpPlans, buyTopUp, getMyTopUps, getMyInsurance } from './api'

function formatINR(n) {
  return '₹' + Number(n).toLocaleString('en-IN')
}

function StatusBadge({ status }) {
  const isActive = status === 'ACTIVE' || status === 'Active'
  return (
    <span style={{
      background: isActive ? '#dcfce7' : '#fee2e2',
      color: isActive ? '#15803d' : '#b91c1c',
      border: `1px solid ${isActive ? '#bbf7d0' : '#fecaca'}`,
      padding: '2px 10px', borderRadius: '999px',
      fontSize: '12px', fontWeight: 600, display: 'inline-block',
    }}>{status}</span>
  )
}

export default function MyTopUpsPage() {
  const [plans, setPlans]       = useState([])   // available top-up plans
  const [myTopUps, setMyTopUps] = useState([])   // my purchased top-ups
  const [loading, setLoading]   = useState(true)
  const [myPlan, setMyPlan]     = useState(null)   // my insurance plan (for coverage info in the UI)

  // Which plan row has the buy panel open (by planId), null = none
  const [buyingPlanId, setBuyingPlanId] = useState(null)
  const [expiry, setExpiry]             = useState('')
  const [buying, setBuying]             = useState(false)

  const [toast, setToast] = useState(null)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  function loadMyTopUps() {
    getMyTopUps().then(d => setMyTopUps(d || [])).catch(() => setMyTopUps([]))
  }

  useEffect(() => {
    Promise.all([
      getAllTopUpPlans(),
      getMyTopUps(),
      getMyInsurance().catch(() => null),
    ])
      .then(([p, t, plan]) => {
        setPlans(p || [])
        setMyTopUps(t || [])
        setMyPlan(plan || null)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // tomorrow as minimum expiry date — matches backend @Future validation
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  async function handleBuy(plan) {
    if (!expiry) return showToast('Please select an expiry date', 'error')
    setBuying(true)
    try {
      const planId = plan.topUpPlanId ?? plan.id
      await buyTopUp(planId, expiry)
      showToast(`"${plan.topUpName}" purchased successfully!`)
      setBuyingPlanId(null); setExpiry('')
      loadMyTopUps() // refresh my top-ups list
    } catch (e) {
      showToast(e.message || 'Purchase failed', 'error')
    } finally {
      setBuying(false)
    }
  }

  // Only show active plans for buying — inactive plans are unavailable
  const activePlans = plans.filter(p => p.isActive)

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
          Top-Up Plans
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
          Boost your coverage by purchasing a top-up. Click "Buy" on any plan below.
        </p>
      </div>

      {/* ── INSURANCE PLAN STATUS BANNER ────────────────────────────────────
          Shows only when myPlan is loaded and has a noteworthy status.
          Three cases:
            EXPIRING_SOON / <=30 days left → yellow warning — reassures employee
                                             they CAN still buy (this was the bug)
            EXPIRED / CANCELLED / past date → red — tells them to contact HR
            ACTIVE with plenty of time left → nothing shown, stays clean        */}
      {!loading && myPlan && (() => {
        const status = (myPlan.insuranceStatus || '').toUpperCase()
        const today  = new Date(); today.setHours(0,0,0,0)
        const expDt  = myPlan.expiryDate ? new Date(myPlan.expiryDate) : null
        const days   = expDt ? Math.ceil((expDt - today) / 86400000) : null
        const isExpired = status === 'EXPIRED' || status === 'CANCELLED' || (days !== null && days < 0)
        const isExpiringSoon = !isExpired && (status === 'EXPIRING_SOON' || (days !== null && days <= 30))

        if (isExpired) return (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px',
            padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#b91c1c',
          }}>
            {/* Hard block — employee cannot buy a top-up without a valid plan */}
            <strong>⛔ Your insurance plan has expired.</strong>
            {' '}You cannot purchase top-ups. Please contact HR to renew your coverage.
          </div>
        )

        if (isExpiringSoon) return (
          <div style={{
            background: '#fefce8', border: '1px solid #fde68a', borderRadius: '8px',
            padding: '12px 16px', marginBottom: '20px', fontSize: '13px', color: '#854d0e',
          }}>
            {/*
              THIS IS THE KEY FIX FOR THE BUG:
              Before this banner existed, an employee with EXPIRING_SOON status
              would click "Buy", get a cryptic backend error ("No active insurance
              plan"), and not understand why.

              Now they see upfront:
                • Their plan IS still valid (not expired yet)
                • They CAN buy a top-up right now
                • They should contact HR to also renew the base plan
            */}
            <strong>⚠ Your insurance plan is expiring soon</strong>
            {days !== null && ` — ${days} day${days !== 1 ? 's' : ''} remaining`}
            {myPlan.expiryDate && ` (expires ${myPlan.expiryDate})`}.
            {' '}You can still purchase top-ups — your plan is still valid.
            Contact HR to renew your base coverage.
          </div>
        )

        return null  // ACTIVE with plenty of time — no banner needed
      })()}

      {/* ── AVAILABLE PLANS TABLE ─────────────────────────────────────────────

      {/* ── AVAILABLE PLANS TABLE ─────────────────────────────────────────────
          WHY Buy button per row: employee sees the plan details and buys in one place.
          No need to scroll to a separate form and re-type the plan ID. */}
      <div style={{ background: '#fff', borderRadius: '10px',
        border: '1px solid #e2e8f0', overflow: 'hidden', marginBottom: '28px' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
            Available Plans
          </h2>
        </div>

        {loading ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Loading…</div>
        ) : activePlans.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
            No top-up plans are currently available.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Plan Name', 'Extra Coverage', 'Price', 'Description', 'Action'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600,
                    color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activePlans.map((plan, i) => {
                const planId   = plan.topUpPlanId ?? plan.id
                const isOpen   = buyingPlanId === planId

                return (
                  <>
                    <tr key={planId} style={{ borderBottom: '1px solid #f1f5f9',
                      background: isOpen ? '#f0f9ff' : (i % 2 === 0 ? '#fff' : '#fafafa') }}>
                      <td style={{ ...cell, fontWeight: 600, color: '#0f172a' }}>{plan.topUpName}</td>
                      <td style={{ ...cell, color: '#15803d', fontWeight: 600 }}>
                        +{formatINR(plan.additionalCoverage)}
                      </td>
                      <td style={cell}>{formatINR(plan.price)}</td>
                      <td style={{ ...cell, color: '#64748b' }}>{plan.description || '—'}</td>
                      <td style={cell}>
                        {/* Buy button — opens expiry picker inline below this row */}
                        <button
                          onClick={() => {
                            setBuyingPlanId(isOpen ? null : planId)
                            setExpiry('')
                          }}
                          style={{
                            padding: '5px 12px', borderRadius: '5px', fontSize: '12px',
                            fontWeight: 600, cursor: 'pointer',
                            border: isOpen ? 'none' : '1px solid #bbf7d0',
                            background: isOpen ? '#e2e8f0' : '#dcfce7',
                            color: isOpen ? '#475569' : '#15803d',
                          }}
                        >
                          {isOpen ? 'Cancel' : 'Buy'}
                        </button>
                      </td>
                    </tr>

                    {/* ── BUY PANEL — expiry date picker, opens below the row ── */}
                    {isOpen && (
                      <tr key={`buy-${planId}`}>
                        <td colSpan={5} style={{ padding: 0 }}>
                          <div style={{
                            padding: '14px 20px', background: '#f0fdf4',
                            borderTop: '2px solid #86efac',
                            borderBottom: '1px solid #bbf7d0',
                          }}>
                            <div style={{ fontSize: '13px', fontWeight: 700,
                              color: '#15803d', marginBottom: '10px' }}>
                              Buying: {plan.topUpName} — {formatINR(plan.price)}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px' }}>
                              <div>
                                <label style={{ display: 'block', fontSize: '12px',
                                  fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                                  Expiry Date *
                                </label>
                                {/* min = tomorrow — matches backend @Future constraint */}
                                <input type="date" min={minDateStr} value={expiry}
                                  onChange={e => setExpiry(e.target.value)}
                                  style={{ padding: '7px 10px', border: '1px solid #86efac',
                                    borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
                              </div>
                              <button onClick={() => handleBuy(plan)} disabled={buying}
                                style={{ padding: '8px 16px', borderRadius: '6px',
                                  border: 'none', background: '#15803d', color: '#fff',
                                  fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
                                {buying ? 'Purchasing…' : 'Confirm Purchase'}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── MY PURCHASED TOP-UPS TABLE ── */}
      <div style={{ background: '#fff', borderRadius: '10px',
        border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
            My Purchased Top-Ups
          </h2>
        </div>

        {myTopUps.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
            You haven't purchased any top-ups yet.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                {['Plan Name', 'Extra Coverage', 'Expiry Date', 'Status'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600,
                    color: '#475569', fontSize: '12px', textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myTopUps.map((t, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9',
                  background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ ...cell, fontWeight: 600, color: '#0f172a' }}>{t.topUpName}</td>
                  <td style={{ ...cell, color: '#15803d', fontWeight: 600 }}>
                    +{formatINR(t.additionalCoverage)}
                  </td>
                  <td style={{ ...cell, color: '#64748b' }}>{t.expiryDate}</td>
                  <td style={cell}><StatusBadge status={t.status} /></td>
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
const cell = { padding: '11px 14px', color: '#334155', verticalAlign: 'middle' }