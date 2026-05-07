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

import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  getAllEmployees,
  getEmployeeInsurance,
  getEmployeeClaims,
  getEmployeeTopUps,
  getEmployeeSummary,
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

function SummaryTab({ employee, summary, insurance, claims, topUps }) {
  if (!employee) return <div style={emptyStyle}>Select an employee to view the summary.</div>

  const claimList = Array.isArray(claims) ? claims : []
  const pendingCount = summary?.pendingClaims ?? claimList.filter(c => c.status === 'PENDING').length
  const approvedCount = summary?.approvedClaims ?? claimList.filter(c => c.status === 'APPROVED').length
  const rejectedCount = summary?.rejectedClaims ?? claimList.filter(c => c.status === 'REJECTED').length
  const totalClaims = summary?.totalClaims ?? claimList.length
  const topUpCount = Array.isArray(topUps) ? topUps.length : 0
  const coverageRate = summary?.coverageRate ?? (
    insurance?.coverageAmount && insurance?.remainingCoverage != null
      ? Math.max(0, Math.round((insurance.remainingCoverage / insurance.coverageAmount) * 100))
      : 0
  )
  const employeeName = `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.username || 'Unknown'

  const fields = [
    ['Employee', employeeName],
    ['Employee ID', employee.userId ?? employee.id],
    ['Email', summary?.email || employee.email || '—'],
    ['Role', employee.role || '—'],
    ['Plan', insurance?.planName || '—'],
    ['Policy Status', <Badge value={insurance?.status || '—'} />],
    ['Remaining Coverage', formatINR(insurance?.remainingCoverage)],
    ['Coverage Amount', formatINR(insurance?.coverageAmount || insurance?.baseAmount)],
    ['Coverage Rate', `${coverageRate}%`],
    ['Assigned Date', formatDate(insurance?.assignedDate)],
    ['Expiry Date', formatDate(insurance?.expiryDate)],
    ['Claims Submitted', totalClaims],
    ['Pending Claims', pendingCount],
    ['Approved Claims', approvedCount],
    ['Rejected Claims', rejectedCount],
    ['Top-Ups', topUpCount],
  ]

  return (
    <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px' }}>
      {fields.map(([label, value]) => (
        <div key={label} style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', border: '1px solid #e2e8f0' }}>
          <p style={{ margin: 0, fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            {label}
          </p>
          <div style={{ marginTop: '8px', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
            {value || '—'}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function EmployeeSelectorPage() {
  const [empId, setEmpId]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [searched, setSearched] = useState(false)
  const [activeTab, setActiveTab] = useState('insurance')

  const [employees, setEmployees] = useState([])
  const [employeesLoading, setEmployeesLoading] = useState(true)
  const [employeesError, setEmployeesError] = useState('')
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [summary, setSummary] = useState(null)
  const [insurance, setInsurance] = useState(null)
  const [claims, setClaims]       = useState([])
  const [topUps, setTopUps]       = useState([])
  

  useEffect(() => {
    let mounted = true

    async function loadEmployees() {
      setEmployeesLoading(true)
      setEmployeesError('')

      try {
        const data = await getAllEmployees()
        if (!mounted) return
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.content)
            ? data.content
            : []
        setEmployees(list)
      } catch (error) {
        if (!mounted) return
        setEmployeesError(error.message || 'Failed to load employees')
      } finally {
        if (mounted) setEmployeesLoading(false)
      }
    }

    loadEmployees()
    return () => { mounted = false }
  }, [])

  async function loadEmployeeData(id) {
    setError('')
    setLoading(true)
    setActiveTab('insurance')

    const lookupId = id?.toString().trim()
    if (!lookupId) {
      setError('Please enter an employee ID')
      setLoading(false)
      return
    }

    const selected = employees.find(emp =>
      `${emp.userId ?? emp.id}` === lookupId ||
      `${emp.userId ?? emp.id}` === Number(lookupId).toString()
    ) || null

    setSelectedEmployee(selected)

    const [summaryData, ins, cl, tu] = await Promise.all([
      getEmployeeSummary(lookupId).catch(() => null),
      getEmployeeInsurance(lookupId).catch(() => null),
      getEmployeeClaims(lookupId).catch(() => []),
      getEmployeeTopUps(lookupId).catch(() => []),
    ])

    setSummary(summaryData)
    setInsurance(ins)
    setClaims(Array.isArray(cl) ? cl : [])
    setTopUps(Array.isArray(tu) ? tu : [])
    setLoading(false)
    setSearched(true)
  }

  async function handleSearch() {
    const query = empId.trim()
    if (!query) {
      setError('Please enter an employee ID or select a row')
      return
    }

    const numericId = Number(query)
    if (!Number.isNaN(numericId) && numericId > 0) {
      return await loadEmployeeData(query)
    }

    const matches = filteredEmployees
    if (matches.length === 1) {
      return await loadEmployeeData(`${matches[0].userId ?? matches[0].id}`)
    }

    if (matches.length > 1) {
      setError('Multiple employees match this search. Click a row to select one.')
      return
    }

    setError('No employee matches this search.')
  }

  const tabs = [
    { key: 'summary',   label: 'Summary', icon: '📊' },
    { key: 'insurance', label: 'Insurance', icon: '🛡️' },
    { key: 'claims',    label: `Claims (${claims?.length ?? 0})`, icon: '📋' },
    { key: 'topups',    label: `Top-Ups (${topUps?.length ?? 0})`, icon: '💰' },
  ]

  const filteredEmployees = useMemo(() => {
    const query = empId.trim().toLowerCase()
    if (!query) return employees
    return employees.filter(emp => {
      const id = `${emp.userId ?? emp.id}`.toLowerCase()
      const name = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase()
      const username = `${emp.username || ''}`.toLowerCase()
      return id.includes(query) || name.includes(query) || username.includes(query)
    })
  }, [employees, empId])

  return (
    <div style={{ padding: '24px', fontFamily: "'DM Sans', sans-serif", maxWidth: '1200px', margin: '0 auto' }}>

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
            Search employees
          </label>
          <input
            id="empId"
            type="text"
            placeholder="Search by ID, name, or username"
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
            setEmpId('')
            setSearched(false)
            setSelectedEmployee(null)
            setSummary(null)
            setInsurance(null)
            setClaims([])
            setTopUps([])
            setError('')
          }} style={{
            padding: '9px 14px', borderRadius: '7px',
            border: '1px solid #cbd5e1', background: '#fff',
            color: '#475569', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
          }}>Clear</button>
        )}
      </div>

      {/* ── RESULTS ── */}
      <div style={{ display: 'grid', gap: '22px', gridTemplateColumns: 'minmax(300px, 1fr) minmax(620px, 1.7fr)' }}>

          {/* EMPLOYEE DIRECTORY */}
          <aside style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '18px', minHeight: '480px' }}>
            <div style={{ marginBottom: '18px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Employee Directory
              </h2>
              <p style={{ margin: '10px 0 0', color: '#64748b', fontSize: '14px' }}>
                Click an employee to load their insurance, claims and top-up summary.
              </p>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Filter by ID, name, username"
                value={empId}
                onChange={e => { setEmpId(e.target.value); setError('') }}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px',
                  border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}
              />
            </div>

            <div style={{ maxHeight: '460px', overflowY: 'auto' }}>
              {employeesLoading ? (
                <div style={emptyStyle}>Loading employees...</div>
              ) : employeesError ? (
                <div style={emptyStyle}>{employeesError}</div>
              ) : filteredEmployees.length === 0 ? (
                <div style={emptyStyle}>No employees found.</div>
              ) : (
                <table style={{ ...tableStyle, width: '100%' }}>
                  <thead>
                    <tr style={theadRowStyle}>
                      {['ID', 'Name', 'Username'].map(h => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((emp, index) => {
                      const idValue = emp.userId ?? emp.id
                      const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.username || 'Unknown'
                      const selected = selectedEmployee && `${selectedEmployee.userId ?? selectedEmployee.id}` === `${idValue}`
                      return (
                        <tr key={idValue || index}
                          onClick={() => loadEmployeeData(`${idValue}`)}
                          style={{
                            cursor: 'pointer',
                            background: selected ? '#f8fafc' : index % 2 === 0 ? '#fff' : '#fafafa',
                            borderBottom: '1px solid #e2e8f0'
                          }}>
                          <td style={tdStyle}>{idValue}</td>
                          <td style={tdStyle}>{fullName}</td>
                          <td style={tdStyle}>{emp.username || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </aside>

          {/* DETAIL PANEL */}
          <main>
            {selectedEmployee ? (
              <>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', padding: '22px', background: '#f8fafc' }}>
                    <div style={{ width: '58px', height: '58px', borderRadius: '50%', background: '#0f172a', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 700, fontSize: '18px' }}>
                      {`${selectedEmployee.firstName?.[0] ?? ''}${selectedEmployee.lastName?.[0] ?? ''}`.toUpperCase() || 'E'}
                    </div>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Employee Profile</div>
                      <div style={{ marginTop: '6px', fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
                        {`${selectedEmployee.firstName || ''} ${selectedEmployee.lastName || ''}`.trim() || selectedEmployee.username || 'Employee'}
                      </div>
                      <div style={{ marginTop: '4px', color: '#475569', fontSize: '13px' }}>
                        {selectedEmployee.email || 'No email available'}
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px', minWidth: '220px' }}>
                      {[
                        { label: 'Claims', value: claims.length },
                        { label: 'Top-Ups', value: topUps.length },
                        { label: 'Status', value: insurance?.status || 'No plan' },
                        { label: 'Plan', value: insurance?.planName || '—' },
                      ].map(card => (
                        <div key={card.label} style={{ background: '#fff', borderRadius: '12px', padding: '14px', border: '1px solid #e2e8f0' }}>
                          <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{card.label}</div>
                          <div style={{ marginTop: '8px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{card.value || '—'}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', background: '#fff', borderBottom: '1px solid #e2e8f0' }}>
                    {tabs.map(tab => (
                      <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                        flex: 1, minWidth: '130px', padding: '14px', border: 'none',
                        borderBottom: activeTab === tab.key ? '3px solid #0f172a' : '3px solid transparent',
                        background: activeTab === tab.key ? '#f8fafc' : '#fff',
                        color: activeTab === tab.key ? '#0f172a' : '#64748b',
                        fontWeight: activeTab === tab.key ? 700 : 600,
                        fontSize: '13px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                      }}>
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>
                  <div style={{ minHeight: '230px' }}>
                    {activeTab === 'insurance' && <InsuranceTab data={insurance} />}
                    {activeTab === 'claims' && <ClaimsTab data={claims} />}
                    {activeTab === 'topups' && <TopUpsTab data={topUps} />}
                    {activeTab === 'summary' && <SummaryTab employee={selectedEmployee} summary={summary} insurance={insurance} claims={claims} topUps={topUps} />}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ padding: '28px', borderRadius: '16px', background: '#fff', border: '1px solid #e2e8f0', color: '#475569' }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>Select an employee</h2>
                <p style={{ marginTop: '10px', fontSize: '14px' }}>
                  Click any employee in the directory on the left to view their detailed insurance dashboard.
                </p>
              </div>
            )}
          </main>
        </div>
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