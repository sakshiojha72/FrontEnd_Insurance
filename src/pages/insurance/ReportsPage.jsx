// ReportsPage.jsx
// ─────────────────────────────────────────────────────────────────────────────
// WHO CAN SEE THIS PAGE: ADMIN and HR only (enforced on the backend via
//   @PreAuthorize("hasAuthority('ADMIN') or hasAuthority('HR')"))
//   The frontend just renders the page; the JWT sent by api.js does the auth.
//
// WHAT IT DOES: Shows 6 different insurance business reports in a
//   sidebar + main-panel layout, styled exactly like InsurancePlansPage.
//
// HOW IT WORKS:
//   1. Left sidebar lists all available report types as clickable buttons
//   2. Clicking a button loads that report from the backend
//   3. Main panel shows the data table for the selected report
//   4. Some reports need extra input (date range / days) — those filters
//      appear just below the sidebar buttons when that report is active
//
// API ENDPOINTS (all in /finsecure/insurance/reports/...):
//   GET /with-topup              → employees with active insurance AND top-up
//   GET /no-topup                → employees with insurance but NO top-up
//   GET /assigned-between        → insurances assigned in a date range
//   GET /current-financial-year  → current Indian FY (April–March)
//   GET /pending-claims          → claims in PENDING status
//   GET /expiring-soon           → insurances expiring within N days
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  getEmployeesWithTopUp,
  getEmployeesWithoutTopUp,
  getAssignedBetweenDates,
  getCurrentFinancialYearReport,
  getPendingClaimsReport,
  getExpiringSoonReport,
} from './api'

// ─── HELPER: format rupee amounts in Indian number format ──────────────────
// e.g. 500000 → "₹5,00,000"
function formatINR(amount) {
  if (amount == null) return '—'
  return '₹' + Number(amount).toLocaleString('en-IN')
}

// ─── HELPER: format date strings nicely ───────────────────────────────────
// Accepts "2024-06-15" or any ISO string and returns "15 Jun 2024"
function formatDate(dateStr) {
  if (!dateStr) return '—'
  // toLocaleDateString works on both "2024-06-15" and full ISO strings
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ─── STATUS BADGE ──────────────────────────────────────────────────────────
// Shows a coloured pill for insurance/claim status
// status can be: "ACTIVE", "EXPIRED", "INACTIVE", "PENDING", "APPROVED", "REJECTED"
function StatusBadge({ status }) {
  // map each status to a colour pair [background, text-colour, border]
  const colours = {
    ACTIVE:   ['#dcfce7', '#15803d', '#bbf7d0'],
    APPROVED: ['#dcfce7', '#15803d', '#bbf7d0'],
    PENDING:  ['#fef9c3', '#a16207', '#fde68a'],
    EXPIRED:  ['#fee2e2', '#b91c1c', '#fecaca'],
    REJECTED: ['#fee2e2', '#b91c1c', '#fecaca'],
    INACTIVE: ['#f1f5f9', '#64748b', '#cbd5e1'],
  }
  const [bg, color, border] = colours[status] ?? ['#f1f5f9', '#64748b', '#cbd5e1']

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 600,
        background: bg,
        color,
        border: `1px solid ${border}`,
      }}
    >
      {status ?? '—'}
    </span>
  )
}

// ─── REPORT DEFINITIONS ────────────────────────────────────────────────────
// Single source of truth for sidebar labels and descriptions.
// 'id' must match the switch-case keys used inside loadReport() and renderTable().
const REPORTS = [
  {
    id: 'with-topup',
    name: 'With Top-up',
    icon: '📋',
    description: 'Employees who have active insurance AND at least one active top-up',
  },
  {
    id: 'no-topup',
    name: 'No Top-up',
    icon: '📄',
    description: 'Employees with active insurance but NO top-up coverage purchased',
  },
  {
    id: 'assigned-between',
    name: 'Assigned Between Dates',
    icon: '📅',
    description: 'Insurance assignments within a custom start–end date range',
  },
  {
    id: 'financial-year',
    name: 'Current Financial Year',
    icon: '🏦',
    description: 'All assignments in the current Indian financial year (April–March)',
  },
  {
    id: 'pending-claims',
    name: 'Pending Claims',
    icon: '⏳',
    description: 'All insurance claims currently waiting for admin approval',
  },
  {
    id: 'expiring-soon',
    name: 'Expiring Soon',
    icon: '⚠️',
    description: 'Insurance policies expiring within a specified number of days',
  },
]

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────
export default function ReportsPage() {
  // which report is selected in the sidebar
  const [activeReport, setActiveReport] = useState('with-topup')

  // data returned by the API for the current report
  const [reportData, setReportData] = useState([])

  // loading / error state
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  // toast notification (same pattern as InsurancePlansPage)
  const [toast, setToast] = useState(null) // { msg, type: 'success'|'error' }

  // ── Filter state: only used by specific reports ──
  // "assigned-between" report needs a start and end date
  const [startDate, setStartDate] = useState('')
  const [endDate,   setEndDate]   = useState('')

  // "expiring-soon" report needs a number of days ahead to look
  const [days, setDays] = useState(30)

  // ── Show toast for 3 seconds then clear ──
  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  // ── loadReport: fetches data from backend for the given reportType ──
  // Wrapped in useCallback so we can also call it manually from filter buttons.
  // Dependencies: startDate, endDate, days — so the function re-creates itself
  // when those filter values change (but does NOT auto-fire the API call).
  const loadReport = useCallback(
    async (reportType) => {
      setLoading(true)
      setError('')
      setReportData([])

      try {
        let data

        switch (reportType) {
          // ── Report 1: employees with BOTH insurance and top-up ──
          case 'with-topup':
            data = await getEmployeesWithTopUp()
            break

          // ── Report 2: employees with insurance but NO top-up ──
          case 'no-topup':
            data = await getEmployeesWithoutTopUp()
            break

          // ── Report 3a: insurances assigned in a date range ──
          // Guard: if either date is missing, bail early (don't hit backend)
          case 'assigned-between':
            if (!startDate || !endDate) {
              setError('Please select both a start date and an end date, then click Generate Report.')
              setLoading(false)
              return
            }
            data = await getAssignedBetweenDates(startDate, endDate)
            break

          // ── Report 3b: current Indian financial year ──
          case 'financial-year':
            data = await getCurrentFinancialYearReport()
            break

          // ── Report 4: pending claims ──
          case 'pending-claims':
            data = await getPendingClaimsReport()
            break

          // ── Report 5: expiring soon ──
          case 'expiring-soon':
            data = await getExpiringSoonReport(days)
            break

          default:
            data = []
        }

        setReportData(data || [])
      } catch (e) {
        // Show the backend error message if available, else a generic fallback
        setError(e.message || `Failed to load report: ${reportType}`)
      } finally {
        setLoading(false)
      }
    },
    [startDate, endDate, days] // filter deps — loadReport stays stable otherwise
  )

  // ── Auto-load whenever the active report changes ──
  // But NOT for 'assigned-between' (needs user to click Generate Report first)
  useEffect(() => {
    if (activeReport === 'assigned-between') {
      // Clear stale data and wait for the user to set dates and click the button
      setReportData([])
      setError('')
      return
    }
    loadReport(activeReport)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReport])
  // Note: we intentionally exclude loadReport from deps here so switching
  // reports doesn't cause double-fetches when days/dates haven't changed.

  // ── current report metadata (for the panel title) ──
  const currentReport = REPORTS.find((r) => r.id === activeReport)

  // ─────────────────────────────────────────────────────────────────────────
  // TABLE RENDERERS — one per report type
  // Each report returns different fields so we render a custom table per type.
  // ─────────────────────────────────────────────────────────────────────────

  // Shared table wrapper with header+body helpers
  function Table({ headers, rows }) {
    return (
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
            {headers.map((h) => (
              <th
                key={h}
                style={{
                  padding: '11px 14px',
                  textAlign: 'left',
                  fontWeight: 600,
                  color: '#475569',
                  fontSize: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, i) => (
            <tr
              key={i}
              style={{
                borderBottom: '1px solid #f1f5f9',
                background: i % 2 === 0 ? '#fff' : '#fafafa',
              }}
            >
              {cells.map((cell, j) => (
                <td key={j} style={cellStyle}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  function renderTable() {
    // ── Loading state ──
    if (loading) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
          Loading report…
        </div>
      )
    }

    // ── Error state ──
    if (error) {
      return (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '13px',
          }}
        >
          {error}
        </div>
      )
    }

    // ── Empty / waiting state ──
    if (reportData.length === 0) {
      const msg =
        activeReport === 'assigned-between'
          ? 'Select a date range above and click "Generate Report" to load data.'
          : 'No records found for this report.'
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
          {msg}
        </div>
      )
    }

    // ── Data tables — one per report type ──
    switch (activeReport) {

      // REPORT 1 — with-topup
      // Backend: EmployeeInsuranceResponseDTO
      // Fields shown: employeeId, employeeName, planName, coverageAmount, status, assignedDate, expiryDate
      case 'with-topup':
        return (
          <Table
            headers={['Emp ID', 'Name', 'Plan', 'Coverage', 'Status', 'Assigned', 'Expiry']}
            rows={reportData.map((item) => [
              // employeeId — the AppUser PK
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.employeeId}</span>,
              item.employeeName,
              item.planName,
              formatINR(item.coverageAmount),
              <StatusBadge status={item.status?.toString()} />,
              formatDate(item.assignedDate),
              formatDate(item.expiryDate),
            ])}
          />
        )

      // REPORT 2 — no-topup
      // Same EmployeeInsuranceResponseDTO; no top-up columns needed
      case 'no-topup':
        return (
          <Table
            headers={['Emp ID', 'Name', 'Plan', 'Coverage', 'Status', 'Assigned', 'Expiry']}
            rows={reportData.map((item) => [
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.employeeId}</span>,
              item.employeeName,
              item.planName,
              formatINR(item.coverageAmount),
              <StatusBadge status={item.status?.toString()} />,
              formatDate(item.assignedDate),
              formatDate(item.expiryDate),
            ])}
          />
        )

      // REPORT 3a & 3b — assigned-between / financial-year
      // Both return List<EmployeeInsuranceResponseDTO>
      case 'assigned-between':
      case 'financial-year':
        return (
          <Table
            headers={['Emp ID', 'Name', 'Plan', 'Coverage', 'Status', 'Assigned', 'Expiry']}
            rows={reportData.map((item) => [
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.employeeId}</span>,
              item.employeeName,
              item.planName,
              formatINR(item.coverageAmount),
              <StatusBadge status={item.status?.toString()} />,
              formatDate(item.assignedDate),
              formatDate(item.expiryDate),
            ])}
          />
        )

      // REPORT 4 — pending-claims
      // Backend: ClaimResponseDTO
      // Fields: claimId, employeeId, employeeName, planName, claimAmount, reason, status, raisedAt
      case 'pending-claims':
        return (
          <Table
            headers={['Claim ID', 'Employee', 'Plan', 'Claim Amount', 'Reason', 'Status', 'Raised On']}
            rows={reportData.map((item) => [
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.claimId}</span>,
              // combine name + id so admin can identify the employee at a glance
              <span>
                {item.employeeName}
                <span style={{ color: '#94a3b8', fontSize: '11px', marginLeft: '4px' }}>
                  #{item.employeeId}
                </span>
              </span>,
              item.planName,
              formatINR(item.claimAmount),
              // reason can be long — truncate with title for hover
              <span title={item.reason}>
                {item.reason && item.reason.length > 30
                  ? item.reason.substring(0, 30) + '…'
                  : (item.reason || '—')}
              </span>,
              <StatusBadge status={item.status?.toString()} />,
              formatDate(item.raisedAt),
            ])}
          />
        )

      // REPORT 5 — expiring-soon
      // Backend: EmployeeInsuranceResponseDTO
      case 'expiring-soon':
        return (
          <Table
            headers={['Emp ID', 'Name', 'Plan', 'Coverage', 'Status', 'Expiry Date']}
            rows={reportData.map((item) => [
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.employeeId}</span>,
              item.employeeName,
              item.planName,
              formatINR(item.coverageAmount),
              <StatusBadge status={item.status?.toString()} />,
              // highlight the expiry date in orange so it stands out
              <span style={{ color: '#c2410c', fontWeight: 600 }}>
                {formatDate(item.expiryDate)}
              </span>,
            ])}
          />
        )

      default:
        return (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
            Select a report from the left panel.
          </div>
        )
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        padding: '24px',
        fontFamily: "'DM Sans', sans-serif",
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      {/* ── BACK LINK ── */}
      <Link
        to="/insurance"
        style={{
          display: 'inline-block',
          marginBottom: '18px',
          padding: '8px 12px',
          border: '1px solid #cbd5e1',
          borderRadius: '8px',
          background: '#fff',
          color: '#0f172a',
          textDecoration: 'none',
          fontSize: '13px',
          fontWeight: 600,
        }}
      >
        ← Back to Insurance
      </Link>

      {/* ── TOAST NOTIFICATION ── */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            background: toast.type === 'success' ? '#15803d' : '#b91c1c',
            color: '#fff',
            borderRadius: '8px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* ── PAGE HEADER ── */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>
          Insurance Reports
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
          Business reports for Admin &amp; HR — select a report from the left panel
        </p>
      </div>

      {/* ── MAIN LAYOUT: sidebar + panel ── */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* ════════════════════════════════════════════════════════════
            LEFT SIDEBAR — report selector + optional filter controls
        ════════════════════════════════════════════════════════════ */}
        <div
          style={{
            width: '240px',
            flexShrink: 0,
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            overflow: 'hidden',
          }}
        >
          {/* Sidebar header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #e2e8f0',
              background: '#f8fafc',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Available Reports
            </span>
          </div>

          {/* Report buttons */}
          <div style={{ padding: '8px' }}>
            {REPORTS.map((report) => {
              const isActive = activeReport === report.id
              return (
                <button
                  key={report.id}
                  onClick={() => setActiveReport(report.id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 12px',
                    marginBottom: '4px',
                    borderRadius: '7px',
                    border: isActive ? '1px solid #0f172a' : '1px solid transparent',
                    background: isActive ? '#0f172a' : 'transparent',
                    color: isActive ? '#fff' : '#334155',
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  // Hover handled via CSS class in real app; inline styles can't do :hover.
                  // The active state still makes the selection visually clear.
                >
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>
                    {report.icon} {report.name}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      marginTop: '2px',
                      opacity: 0.7,
                      lineHeight: '1.4',
                    }}
                  >
                    {report.description}
                  </div>
                </button>
              )
            })}
          </div>

          {/* ── FILTER CONTROLS — shown only for reports that need extra input ── */}

          {/* Filter for "assigned-between": two date pickers + Generate button */}
          {activeReport === 'assigned-between' && (
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid #e2e8f0',
                background: '#f0f9ff',
              }}
            >
              <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#0369a1' }}>
                📅 Date Range Filter
              </p>

              {/* Start date */}
              <label style={labelStyle}>Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ ...inputStyle, fontSize: '12px', padding: '6px 10px' }}
              />

              {/* End date */}
              <label style={labelStyle}>End Date *</label>
              <input
                type="date"
                value={endDate}
                // end date must be on or after start date
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ ...inputStyle, fontSize: '12px', padding: '6px 10px' }}
              />

              {/* Generate button — manually triggers the API call */}
              <button
                onClick={() => loadReport('assigned-between')}
                disabled={!startDate || !endDate}
                style={{
                  ...primaryBtn,
                  marginTop: '10px',
                  width: '100%',
                  fontSize: '12px',
                  padding: '7px',
                  opacity: !startDate || !endDate ? 0.5 : 1,
                  cursor: !startDate || !endDate ? 'not-allowed' : 'pointer',
                }}
              >
                Generate Report
              </button>
            </div>
          )}

          {/* Filter for "expiring-soon": number of days input + Update button */}
          {activeReport === 'expiring-soon' && (
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid #e2e8f0',
                background: '#fff7ed',
              }}
            >
              <p style={{ margin: '0 0 8px', fontSize: '11px', fontWeight: 700, color: '#c2410c' }}>
                ⚠️ Expiry Window
              </p>

              {/* Days ahead */}
              <label style={labelStyle}>Days Ahead</label>
              <input
                type="number"
                value={days}
                min="1"
                max="365"
                onChange={(e) => setDays(Number(e.target.value))}
                style={{ ...inputStyle, fontSize: '12px', padding: '6px 10px' }}
              />
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                Policies expiring within {days} day{days !== 1 ? 's' : ''} from today
              </p>

              {/* Update button — re-fires the API with the new days value */}
              <button
                onClick={() => loadReport('expiring-soon')}
                style={{
                  ...primaryBtn,
                  marginTop: '10px',
                  width: '100%',
                  fontSize: '12px',
                  padding: '7px',
                  background: '#c2410c',
                }}
              >
                Update Report
              </button>
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════
            RIGHT PANEL — report title, record count, and data table
        ════════════════════════════════════════════════════════════ */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              background: '#fff',
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              overflow: 'hidden',
            }}
          >
            {/* Panel header — shows report name + record count */}
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid #e2e8f0',
                background: '#f8fafc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  {currentReport?.icon} {currentReport?.name}
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                  {currentReport?.description}
                </p>
              </div>

              {/* Record count badge — only shown when data is loaded */}
              {!loading && reportData.length > 0 && (
                <span
                  style={{
                    background: '#0f172a',
                    color: '#fff',
                    borderRadius: '999px',
                    padding: '3px 12px',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {reportData.length} record{reportData.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Table area — scrollable horizontally on small screens */}
            <div style={{ overflowX: 'auto' }}>
              {renderTable()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SHARED STYLES (mirrors InsurancePlansPage exactly) ───────────────────

const labelStyle = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#475569',
  marginBottom: '4px',
  marginTop: '10px',
}

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #cbd5e1',
  borderRadius: '6px',
  fontSize: '13px',
  outline: 'none',
  color: '#0f172a',
  background: '#fff',
  boxSizing: 'border-box',
}

const primaryBtn = {
  padding: '8px 14px',
  borderRadius: '6px',
  border: 'none',
  background: '#0f172a',
  color: '#fff',
  fontWeight: 600,
  fontSize: '13px',
  cursor: 'pointer',
}

const cellStyle = {
  padding: '11px 14px',
  color: '#334155',
  verticalAlign: 'middle',
}