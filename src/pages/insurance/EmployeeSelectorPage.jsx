// EmployeeSelectorPage.jsx  —  ADMIN + HR
//
// UX FLOW:
//   1. Admin types employee ID → clicks "View" or presses Enter
//   2. Employee profile card appears (name, plan, status, remaining coverage)
//   3. Below the card — 4 tabs: Insurance · Claims · Top-Ups · Summary
//   4. Clicking a tab switches content — no page navigation at all
//
// WHY TABS:
//   Stacking all 4 sections = too much scrolling, overwhelming
//   Tabs = one focused view at a time, counts visible upfront
//   Standard pattern used in every admin dashboard (GitHub, Jira, etc.)
//
// API calls:
//   getEmployeeInsurance(id)  GET /insurance/plans/employee/{id}
//   getEmployeeClaims(id)     GET /insurance/claims/employee/{id}
//   getEmployeeTopUps(id)     GET /insurance/topups/employee/{id}
//   getEmployeeSummary(id)    GET /insurance/summary/employee/{id}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getEmployeeInsurance,
  getEmployeeClaims,
  getEmployeeTopUps,
} from './api'

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatINR(n) {
  if (n == null) return '—'
  return '₹' + Number(n).toLocaleString('en-IN')
}

function formatDate(d) {
  if (!d) return '—'
  return d.toString().split('T')[0]
}

// Universal badge — handles InsuranceStatus + ClaimStatus
function Badge({ value }) {
  if (!value) return <span style={{ color: '#94a3b8' }}>—</span>
  const v = value.toUpperCase()
  const map = {
    ACTIVE:        { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
    EXPIRING_SOON: { bg: '#fef9c3', color: '#854d0e', border: '#fde68a' },
    EXPIRED:       { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' },
    INACTIVE:      { bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
    PENDING:       { bg: '#fef9c3', color: '#854d0e', border: '#fde68a' },
    APPROVED:      { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0' },
    REJECTED:      { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca' },
  }
  const s = map[v] || map.INACTIVE
  return (
    <span style={{
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
      padding: '2px 10px', borderRadius: '999px',
      fontSize: '12px', fontWeight: 600, display: 'inline-block',
    }}>{value}</span>
  )
}

// ─── TAB CONTENT COMPONENTS ───────────────────────────────────────────────────

// Tab 1 — Insurance details shown as key-value grid cards
// WHY grid not table: single record looks better as cards than one table row
function InsuranceTab({ data }) {
  if (!data) return <div style={emptyStyle}>No insurance record found for this employee.</div>
  const fields = [
    ['Plan Name',           data.planName],
    ['Coverage Amount',     formatINR(data.coverageAmount)],
    ['Remaining Coverage',  formatINR(data.remainingCoverage)],
    ['Assigned Date',       formatDate(data.assignedDate)],
    ['Expiry Date',         formatDate(data.expiryDate)],
    ['Status',              <Badge value={data.status} />],
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '12px', padding: '20px' }}>
      {fields.map(([label, value]) => (
        <div key={label} style={{ background: '#f8fafc', borderRadius: '8px',
          padding: '14px 16px', border: '1px solid #f1f5f9' }}>
          <p style={{ margin: 0, fontSize: '11px', fontWeight: 600,
            color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {label}
          </p>
          <div style={{ marginTop: '6px', fontSize: '14px',
            fontWeight: 600, color: '#0f172a' }}>
            {value || '—'}
          </div>
        </div>
      ))}
    </div>
  )
}

// Tab 2 — Claims table with status badge and admin remarks
function ClaimsTab({ data }) {
  if (!data || data.length === 0) return (
    <div style={emptyStyle}>No claims found for this employee.</div>
  )
  return (
    <table style={tableStyle}>
      <thead>
        <tr style={theadRowStyle}>
          {['Claim ID', 'Amount', 'Reason', 'Status', 'Raised On', 'Admin Remarks'].map(h => (
            <th key={h} style={thStyle}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((c, i) => (
          <tr key={c.claimId ?? i} style={{ borderBottom: '1px solid #f1f5f9',
            background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
            <td style={tdStyle}>{c.claimId}</td>
            <td style={{ ...tdStyle, fontWeight: 600 }}>{formatINR(c.claimAmount)}</td>
            <td style={{ ...tdStyle, color: '#64748b' }}>
              <span title={c.reason}>
                {c.reason?.length > 40 ? c.reason.slice(0, 40) + '…' : c.reason}
              </span>
            </td>
            <td style={tdStyle}><Badge value={c.status} /></td>
            <td style={{ ...tdStyle, color: '#64748b' }}>{formatDate(c.raisedAt)}</td>
            <td style={{ ...tdStyle, color: '#64748b', fontStyle: 'italic' }}>
              {c.adminRemarks || '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// Tab 3 — Top-Ups table
function TopUpsTab({ data }) {
  if (!data || data.length === 0) return (
    <div style={emptyStyle}>No top-ups purchased by this employee.</div>
  )
  return (
    <table style={tableStyle}>
      <thead>
        <tr style={theadRowStyle}>
          {['Plan Name', 'Additional Coverage', 'Expiry Date', 'Status'].map(h => (
            <th key={h} style={thStyle}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((t, i) => (
          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9',
            background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
            <td style={{ ...tdStyle, fontWeight: 600, color: '#0f172a' }}>{t.topUpName}</td>
            <td style={{ ...tdStyle, color: '#15803d', fontWeight: 600 }}>
              +{formatINR(t.additionalCoverage)}
            </td>
            <td style={{ ...tdStyle, color: '#64748b' }}>{formatDate(t.expiryDate)}</td>
            <td style={tdStyle}><Badge value={t.status} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function EmployeeSelectorPage() {
  const [empId, setEmpId]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [searched, setSearched] = useState(false)
  const [activeTab, setActiveTab] = useState('insurance')

  const [insurance, setInsurance] = useState(null)
  const [claims, setClaims]       = useState(null)
  const [topUps, setTopUps]       = useState(null)
  

  async function handleSearch() {
    const id = empId.trim()
    if (!id)            return setError('Please enter an employee ID')
    if (isNaN(id))      return setError('Employee ID must be a number')
    if (Number(id) < 1) return setError('Must be a positive number')

    setError(''); setLoading(true); setSearched(false); setActiveTab('insurance')
  

    // All 4 calls fire simultaneously — each has its own .catch
    // so one failure does not prevent the others from showing
    const [ins, cl, tu, sum] = await Promise.all([
      getEmployeeInsurance(id).catch(() => null),
      getEmployeeClaims(id).catch(() => []),
      getEmployeeTopUps(id).catch(() => []),
    ])

    setInsurance(ins)
    setClaims(Array.isArray(cl) ? cl : [])
    setTopUps(Array.isArray(tu) ? tu : [])
    setLoading(false)
    setSearched(true)
  }

  // Tab definitions — counts shown on label so admin sees at a glance
  const tabs = [
    { key: 'insurance', label: 'Insurance',  icon: '🛡️' },
    { key: 'claims',    label: `Claims${claims ? ` (${claims.length})` : ''}`,  icon: '📋' },
    { key: 'topups',    label: `Top-Ups${topUps ? ` (${topUps.length})` : ''}`, icon: '💰' },
  ]

  return (
    <div style={{ padding: '24px', fontFamily: "'DM Sans', sans-serif",
      maxWidth: '1000px', margin: '0 auto' }}>

      <Link to="/insurance" style={{ fontSize: '13px', color: '#475569',
        textDecoration: 'none', display: 'inline-block', marginBottom: '20px' }}>
        ← Back to Insurance Home
      </Link>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>
          View Employee Data
        </h1>
      </div>

      {/* ── SEARCH BAR ── */}
      <div style={{ background: '#fff', borderRadius: '10px',
        border: '1px solid #e2e8f0', padding: '18px 20px', marginBottom: '20px',
        display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>

        <div style={{ flex: 1, minWidth: '180px' }}>
          <label htmlFor="empId" style={{ display: 'block', fontSize: '12px',
            fontWeight: 600, color: '#475569', marginBottom: '5px' }}>
            Employee ID
          </label>
          <input
            id="empId"
            type="number" min="1"
            placeholder="e.g. 3"
            value={empId}
            onChange={e => { setEmpId(e.target.value); setError('') }}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            style={{
              width: '100%', padding: '8px 12px', boxSizing: 'border-box',
              border: `1px solid ${error ? '#fca5a5' : '#cbd5e1'}`,
              borderRadius: '7px', fontSize: '14px', outline: 'none',
            }}
          />
          {error && (
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#b91c1c' }}>{error}</p>
          )}
        </div>

        <button onClick={handleSearch} disabled={loading} style={{
          padding: '9px 20px', borderRadius: '7px', border: 'none',
          background: '#0f172a', color: '#fff', fontWeight: 700,
          fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1,
        }}>
          {loading ? 'Loading…' : '🔍 View'}
        </button>

        {searched && !loading && (
          <button onClick={() => {
            setEmpId(''); setSearched(false)
            setInsurance(null); setClaims(null); setTopUps(null)
          }} style={{
            padding: '9px 14px', borderRadius: '7px',
            border: '1px solid #cbd5e1', background: '#fff',
            color: '#475569', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
          }}>Clear</button>
        )}
      </div>

      {/* ── RESULTS ── */}
      {searched && !loading && (
        <>
          {/* PROFILE CARD — dark header showing key info at a glance
              WHY: Admin needs a quick snapshot before diving into tabs */}
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
            borderRadius: '12px 12px 0 0', padding: '20px 24px',
            display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap',
          }}>
            {/* Avatar circle */}
            <div style={{
              width: '52px', height: '52px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px', fontWeight: 700, color: '#fff', flexShrink: 0,
            }}>
              {empId}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)',
                fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Employee ID {empId}
              </div>
              <div style={{ fontSize: '17px', fontWeight: 700, color: '#fff', marginTop: '2px' }}>
                {insurance?.employeeName ?? 'Employee'}
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                {insurance?.planName ?? 'No active plan'}
              </div>
            </div>

            {/* Quick stats */}
            {[
              { label: 'Remaining',  value: formatINR(insurance?.remainingCoverage) },
              { label: 'Claims',     value: claims?.length ?? 0 },
              { label: 'Top-Ups',   value: topUps?.length ?? 0 },
              { label: 'Status',    value: insurance?.status ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '17px', fontWeight: 700, color: '#fff' }}>{value}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)',
                  fontWeight: 500, marginTop: '2px' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* TAB BAR — sits flush below the profile card */}
          <div style={{ display: 'flex', background: '#fff',
            borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                flex: 1, padding: '13px 8px', border: 'none',
                borderBottom: activeTab === tab.key
                  ? '3px solid #0f172a' : '3px solid transparent',
                background: activeTab === tab.key ? '#f8fafc' : '#fff',
                color: activeTab === tab.key ? '#0f172a' : '#64748b',
                fontWeight: activeTab === tab.key ? 700 : 500,
                fontSize: '13px', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '6px',
              }}>
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* TAB CONTENT — only active tab renders */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0',
            borderTop: 'none', borderRadius: '0 0 10px 10px',
            minHeight: '180px', overflow: 'hidden' }}>
            {activeTab === 'insurance' && <InsuranceTab data={insurance} />}
            {activeTab === 'claims'    && <ClaimsTab    data={claims} />}
            {activeTab === 'topups'    && <TopUpsTab    data={topUps} />}
            {activeTab === 'summary'   && <SummaryTab   data={summary} />}
          </div>
        </>
      )}
    </div>
  )
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const tableStyle    = { width: '100%', borderCollapse: 'collapse', fontSize: '13px' }
const theadRowStyle = { background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }
const thStyle       = { padding: '10px 14px', textAlign: 'left', fontWeight: 600,
  color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }
const tdStyle       = { padding: '11px 14px', color: '#334155', verticalAlign: 'middle' }
const emptyStyle    = { padding: '32px', textAlign: 'center', fontSize: '13px', color: '#94a3b8' }