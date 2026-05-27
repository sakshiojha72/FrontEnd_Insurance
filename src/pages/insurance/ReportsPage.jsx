// ReportsPage.jsx
// CHANGES FROM ORIGINAL:
//   1. Date filters ("assigned-between") and days input ("expiring-soon") moved OUT
//      of the left sidebar and into a top filter bar that appears above the table.
//   2. The sidebar now ONLY has the report type selector buttons (clean, no extra inputs).
//   3. Filter bar is horizontal, sits between the header and the table — easy to see.
//   4. UX: admin picks a report → sees the filter inputs immediately at top → generates.
//   5. No logic changes — all API calls and download logic are identical to original.

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

const BASE_URL = 'http://localhost:8085'

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function formatINR(amount) {
  if (amount == null) return '—'
  return '₹' + Number(amount).toLocaleString('en-IN')
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

function StatusBadge({ status }) {
  const colours = {
    ACTIVE:   ['#dcfce7', '#15803d', '#bbf7d0'],
    APPROVED: ['#dcfce7', '#15803d', '#bbf7d0'],
    PENDING:  ['#fef9c3', '#a16207', '#fde68a'],
    EXPIRED:  ['#fee2e2', '#b91c1c', '#fecaca'],
    REJECTED: ['#fee2e2', '#b91c1c', '#fecaca'],
    INACTIVE: ['#f1f5f9', '#64748b', '#cbd5e1'],
    EXPIRING_SOON: ['#fff7ed', '#c2410c', '#fed7aa'],
  }
  const [bg, color, border] = colours[status] ?? ['#f1f5f9', '#64748b', '#cbd5e1']
  return (
    <span style={{
      display: 'inline-block', padding: '2px 10px', borderRadius: '999px',
      fontSize: '12px', fontWeight: 600, background: bg, color,
      border: `1px solid ${border}`,
    }}>
      {status ?? '—'}
    </span>
  )
}

// ─── REPORT DEFINITIONS ────────────────────────────────────────────────────────
const REPORTS = [
  { id: 'with-topup',       name: 'With Top-up',            icon: '📋', description: 'Active insurance + active top-up' },
  { id: 'no-topup',         name: 'No Top-up',              icon: '📄', description: 'Active insurance, NO top-up' },
  { id: 'assigned-between', name: 'Assigned Between Dates', icon: '📅', description: 'Filter by assignment date range' },
  { id: 'financial-year',   name: 'Current Financial Year', icon: '🏦', description: 'April – March, current year' },
  { id: 'pending-claims',   name: 'Pending Claims',         icon: '⏳', description: 'Claims awaiting admin approval' },
  { id: 'expiring-soon',    name: 'Expiring Soon',          icon: '⚠️', description: 'Policies expiring within N days' },
]

// ─── EXCEL DOWNLOAD ───────────────────────────────────────────────────────────
async function downloadExcel(url, filename) {
  const token = localStorage.getItem('jwt_token')
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) { alert('Download failed: ' + res.status); return }
    const blob = await res.blob()
    const excelBlob = new Blob([blob], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    })
    const blobUrl = URL.createObjectURL(excelBlob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  } catch (e) {
    alert('Download error: ' + e.message)
  }
}

// ─── TABLE COMPONENT ──────────────────────────────────────────────────────────
function Table({ headers, rows }) {
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
      <thead>
        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
          {headers.map(h => (
            <th key={h} style={{
              padding: '11px 14px', textAlign: 'left', fontWeight: 600,
              color: '#475569', fontSize: '12px', textTransform: 'uppercase',
              letterSpacing: '0.04em', whiteSpace: 'nowrap',
            }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((cells, i) => (
          <tr key={i} style={{ borderBottom: '1px solid #f1f5f9',
            background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
            {cells.map((cell, j) => (
              <td key={j} style={cellStyle}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState('with-topup')
  const [reportData,   setReportData]   = useState([])
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState('')
  const [toast,        setToast]        = useState(null)

  // Filter inputs — shown in top filter bar, not sidebar
  const [startDate, setStartDate] = useState('')
  const [endDate,   setEndDate]   = useState('')
  const [days,      setDays]      = useState(30)

  function showToast(msg, type = 'success') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const loadReport = useCallback(async (reportType) => {
    setLoading(true); setError(''); setReportData([])
    try {
      let data
      switch (reportType) {
        case 'with-topup':       data = await getEmployeesWithTopUp();                  break
        case 'no-topup':         data = await getEmployeesWithoutTopUp();               break
        case 'assigned-between':
          if (!startDate || !endDate) {
            setError('Please select both Start Date and End Date, then click Generate.')
            setLoading(false); return
          }
          data = await getAssignedBetweenDates(startDate, endDate);                     break
        case 'financial-year':   data = await getCurrentFinancialYearReport();          break
        case 'pending-claims':   data = await getPendingClaimsReport();                 break
        case 'expiring-soon':    data = await getExpiringSoonReport(days);              break
        default:                 data = []
      }
      setReportData(data || [])
    } catch (e) {
      setError(e.message || `Failed to load: ${reportType}`)
    } finally {
      setLoading(false)
    }
  }, [startDate, endDate, days])

  // Auto-load report when tab changes — except assigned-between which needs dates first
  useEffect(() => {
    if (activeReport === 'assigned-between') { setReportData([]); setError(''); return }
    loadReport(activeReport)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReport])

  const currentReport = REPORTS.find(r => r.id === activeReport)

  function getDownloadUrl() {
    switch (activeReport) {
      case 'with-topup':       return `${BASE_URL}/finsecure/insurance/reports/with-topup/download`
      case 'no-topup':         return `${BASE_URL}/finsecure/insurance/reports/no-topup/download`
      case 'assigned-between': return `${BASE_URL}/finsecure/insurance/reports/assigned-between/download?startDate=${startDate}&endDate=${endDate}`
      case 'financial-year':   return `${BASE_URL}/finsecure/insurance/reports/current-financial-year/download`
      case 'pending-claims':   return `${BASE_URL}/finsecure/insurance/reports/pending-claims/download`
      case 'expiring-soon':    return `${BASE_URL}/finsecure/insurance/reports/expiring-soon/download?days=${days}`
      default:                 return ''
    }
  }

  function canDownload() {
    if (activeReport === 'assigned-between') return !!(startDate && endDate)
    return true
  }

  // ─── needs top filter bar? ──
  // Only "assigned-between" and "expiring-soon" need extra filter inputs.
  // For those two, we show a filter bar between the header and the table.
  const needsFilterBar = activeReport === 'assigned-between' || activeReport === 'expiring-soon'

  function renderTable() {
    if (loading) return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
        Loading report…
      </div>
    )
    if (error) return (
      <div style={{
        background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
        borderRadius: '8px', padding: '12px 16px', fontSize: '13px',
        margin: '16px',
      }}>{error}</div>
    )
    if (reportData.length === 0) return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
        {activeReport === 'assigned-between'
          ? '← Select a date range in the filter bar above and click "Generate Report".'
          : 'No records found.'}
      </div>
    )

    switch (activeReport) {
      case 'with-topup':
      case 'no-topup':
      case 'assigned-between':
      case 'financial-year':
        return (
          <Table
            headers={['Emp ID', 'Name', 'Plan', 'Coverage', 'Status', 'Assigned', 'Expiry']}
            rows={reportData.map(item => [
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.employeeId}</span>,
              item.employeeName, item.planName, formatINR(item.coverageAmount),
              <StatusBadge status={item.status?.toString()} />,
              formatDate(item.assignedDate), formatDate(item.expiryDate),
            ])}
          />
        )
      case 'pending-claims':
        return (
          <Table
            headers={['Claim ID', 'Employee', 'Plan', 'Claim Amount', 'Reason', 'Status', 'Raised On']}
            rows={reportData.map(item => [
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.claimId}</span>,
              <span>{item.employeeName}<span style={{ color: '#94a3b8', fontSize: '11px', marginLeft: '4px' }}>#{item.employeeId}</span></span>,
              item.planName, formatINR(item.claimAmount),
              <span title={item.reason}>{item.reason?.length > 30 ? item.reason.substring(0, 30) + '…' : (item.reason || '—')}</span>,
              <StatusBadge status={item.status?.toString()} />,
              formatDate(item.raisedAt),
            ])}
          />
        )
      case 'expiring-soon':
        return (
          <Table
            headers={['Emp ID', 'Name', 'Plan', 'Coverage', 'Status', 'Expiry Date']}
            rows={reportData.map(item => [
              <span style={{ fontWeight: 600, color: '#0f172a' }}>{item.employeeId}</span>,
              item.employeeName, item.planName, formatINR(item.coverageAmount),
              <StatusBadge status={item.status?.toString()} />,
              <span style={{ color: '#c2410c', fontWeight: 600 }}>{formatDate(item.expiryDate)}</span>,
            ])}
          />
        )
      default:
        return null
    }
  }

  return (
    <div style={{ padding: '24px', fontFamily: "'DM Sans', sans-serif", maxWidth: '1200px', margin: '0 auto' }}>

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
        }}>{toast.msg}</div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#0f172a' }}>
          Insurance Reports
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
          Business reports for Admin &amp; HR
        </p>
      </div>

      {/* ── LAYOUT: sidebar left + content right ── */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* ── SIDEBAR — report type selector ONLY (no filter inputs here) ── */}
        {/* WHY moved filters out: admin had to scroll down past the sidebar to find date inputs.
            Now sidebar is clean — just click a report type and filters appear above the table. */}
        <div style={{
          width: '220px', flexShrink: 0,
          background: '#fff', border: '1px solid #e2e8f0',
          borderRadius: '10px', overflow: 'hidden',
          position: 'sticky', top: '20px',   // stays visible while scrolling
        }}>
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc',
          }}>
            <span style={{
              fontSize: '11px', fontWeight: 700, color: '#475569',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>Report Type</span>
          </div>
          <div style={{ padding: '8px' }}>
            {REPORTS.map(report => {
              const isActive = activeReport === report.id
              return (
                <button
                  key={report.id}
                  onClick={() => {
                    setActiveReport(report.id)
                    setError('')
                  }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '10px 12px', marginBottom: '4px',
                    borderRadius: '7px',
                    border: isActive ? '1px solid #0f172a' : '1px solid transparent',
                    background: isActive ? '#0f172a' : 'transparent',
                    color: isActive ? '#fff' : '#334155',
                    cursor: 'pointer', transition: 'background 0.15s',
                  }}
                >
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>
                    {report.icon} {report.name}
                  </div>
                  <div style={{ fontSize: '11px', marginTop: '2px', opacity: 0.7, lineHeight: '1.4' }}>
                    {report.description}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>

          {/* ── FILTER BAR — appears ABOVE the table for reports that need inputs ──
              MOVED HERE FROM SIDEBAR. Now clearly visible, horizontal, easy to use.
              Only shown for "assigned-between" and "expiring-soon".
              For all other reports no filter bar appears at all. */}
          {needsFilterBar && (
            <div style={{
              background: activeReport === 'assigned-between' ? '#f0f9ff' : '#fff7ed',
              border: `1px solid ${activeReport === 'assigned-between' ? '#bae6fd' : '#fed7aa'}`,
              borderRadius: '10px',
              padding: '16px 20px',
            }}>
              {/* Filter bar header */}
              <div style={{
                fontSize: '12px', fontWeight: 700, marginBottom: '14px',
                color: activeReport === 'assigned-between' ? '#0369a1' : '#c2410c',
              }}>
                {activeReport === 'assigned-between' ? '📅 Filter by Date Range' : '⚠️ Expiry Window'}
              </div>

              {/* Inputs + button in a horizontal row */}
              <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>

                {activeReport === 'assigned-between' && (
                  <>
                    {/* Start Date */}
                    <div>
                      <label style={labelStyle}>Start Date *</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        style={{ ...inputStyle, width: '170px' }}
                      />
                    </div>

                    {/* End Date */}
                    <div>
                      <label style={labelStyle}>End Date *</label>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate || undefined}  // end can't be before start
                        onChange={e => setEndDate(e.target.value)}
                        style={{ ...inputStyle, width: '170px' }}
                      />
                    </div>

                    {/* Generate button */}
                    <button
                      onClick={() => loadReport('assigned-between')}
                      disabled={!startDate || !endDate}
                      style={{
                        ...primaryBtn,
                        background: '#0369a1',
                        opacity: !startDate || !endDate ? 0.5 : 1,
                        cursor: !startDate || !endDate ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Generate Report
                    </button>

                    {/* Helper text if dates missing */}
                    {(!startDate || !endDate) && (
                      <span style={{ fontSize: '12px', color: '#64748b', alignSelf: 'center' }}>
                        Select both dates to generate
                      </span>
                    )}
                  </>
                )}

                {activeReport === 'expiring-soon' && (
                  <>
                    {/* Days input */}
                    <div>
                      <label style={labelStyle}>Expiring within (days)</label>
                      <input
                        type="number"
                        value={days}
                        min="1" max="365"
                        onChange={e => setDays(Number(e.target.value))}
                        style={{ ...inputStyle, width: '120px' }}
                      />
                    </div>

                    {/* Apply button */}
                    <button
                      onClick={() => loadReport('expiring-soon')}
                      style={{ ...primaryBtn, background: '#c2410c' }}
                    >
                      Update Report
                    </button>

                    <span style={{ fontSize: '12px', color: '#64748b', alignSelf: 'center' }}>
                      Currently showing policies expiring within <strong>{days}</strong> day{days !== 1 ? 's' : ''}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── TABLE CARD ── */}
          <div style={{
            background: '#fff', borderRadius: '10px',
            border: '1px solid #e2e8f0', overflow: 'hidden',
          }}>
            {/* Panel header */}
            <div style={{
              padding: '14px 20px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              flexWrap: 'wrap', gap: '8px',
            }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  {currentReport?.icon} {currentReport?.name}
                </h2>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
                  {currentReport?.description}
                </p>
              </div>

              {/* Record count + download button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {!loading && reportData.length > 0 && (
                  <span style={{
                    background: '#0f172a', color: '#fff', borderRadius: '999px',
                    padding: '3px 12px', fontSize: '12px', fontWeight: 600,
                  }}>
                    {reportData.length} record{reportData.length !== 1 ? 's' : ''}
                  </span>
                )}

                <button
                  onClick={() => downloadExcel(getDownloadUrl(), `${activeReport}_report.xlsx`)}
                  disabled={!canDownload()}
                  title={
                    activeReport === 'assigned-between' && !canDownload()
                      ? 'Select dates first'
                      : 'Download as Excel'
                  }
                  style={{
                    padding: '7px 14px', borderRadius: '6px', border: 'none',
                    background: canDownload() ? '#16a34a' : '#94a3b8',
                    color: '#fff', fontWeight: 600, fontSize: '12px',
                    cursor: canDownload() ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', gap: '5px',
                  }}
                >
                  ⬇ Download Excel
                </button>
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              {renderTable()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
const labelStyle = {
  display: 'block', fontSize: '12px', fontWeight: 600,
  color: '#475569', marginBottom: '4px', marginTop: 0,
}
const inputStyle = {
  display: 'block', padding: '8px 12px',
  border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '13px',
  outline: 'none', color: '#0f172a', background: '#fff', boxSizing: 'border-box',
}
const primaryBtn = {
  padding: '9px 18px', borderRadius: '6px', border: 'none',
  background: '#0f172a', color: '#fff', fontWeight: 600,
  fontSize: '13px', cursor: 'pointer',
}
const cellStyle = {
  padding: '11px 14px', color: '#334155', verticalAlign: 'middle',
}