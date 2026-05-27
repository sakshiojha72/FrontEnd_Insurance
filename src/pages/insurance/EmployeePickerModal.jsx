// EmployeePickerModal.jsx
// ─────────────────────────────────────────────────────────────────────────────
// A reusable modal that shows a searchable table of all employees.
// Admin clicks a row → the selected employee's ID + name is passed back.
//
// USAGE:
//   import EmployeePickerModal from './EmployeePickerModal'
//
//   <EmployeePickerModal
//     onSelect={(emp) => {
//       setEmployeeId(emp.userId)       // use the ID for API call
//       setEmployeeName(emp.fullName)   // show the name in UI
//     }}
//     onClose={() => setShowPicker(false)}
//   />
//
// PROPS:
//   onSelect(emp)  — called when a row is clicked; emp = { userId, fullName, username }
//   onClose()      — called when modal is dismissed (backdrop click or X button)
//
// API:
//   Calls getAllEmployees() from api.js → GET /employee/employees
//   getAllEmployees() must be imported in THIS file (not in parent)
//   This way parent pages don't have to manage the employee list themselves.

import { useState, useEffect, useMemo } from 'react'
import { getAllEmployees } from './api'

export default function EmployeePickerModal({ onSelect, onClose }) {
  const [employees, setEmployees] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState('')
  const [search,    setSearch]    = useState('')

  // Fetch employee list when modal opens
  useEffect(() => {
    setLoading(true)
    getAllEmployees()
      .then(data => setEmployees(Array.isArray(data) ? data : []))
      .catch(e => setError(e.message || 'Failed to load employees'))
      .finally(() => setLoading(false))
  }, [])

  // Filter by ID, first name, last name, or username — as admin types
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return employees
    return employees.filter(emp => {
      const id   = String(emp.userId ?? emp.id ?? '')
      const name = `${emp.firstName || ''} ${emp.lastName || ''}`.toLowerCase()
      const user = (emp.username || '').toLowerCase()
      return id.includes(q) || name.includes(q) || user.includes(q)
    })
  }, [employees, search])

  // When a row is clicked — normalise the employee object and call parent
  function handleSelect(emp) {
    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.username || 'Unknown'
    onSelect({
      userId:   emp.userId ?? emp.id,
      fullName,
      username: emp.username || '',
    })
    onClose()
  }

  return (
    // ── BACKDROP ──
    // clicking outside the modal box closes it (same UX as CreatePlanModal)
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.50)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2000,   // higher than other modals so it always appears on top
      }}
    >
      {/* ── MODAL BOX ── */}
      <div
        onClick={e => e.stopPropagation()} // prevent backdrop click from firing
        style={{
          background: '#fff', borderRadius: '14px',
          width: '100%', maxWidth: '560px',
          maxHeight: '80vh',             // never taller than 80% of screen
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
      >
        {/* ── HEADER ── */}
        <div style={{
          padding: '18px 22px 14px',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
          display: 'flex', alignItems: 'center', gap: '12px',
          flexShrink: 0,   // header never shrinks even when list is long
        }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Select Employee
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>
              {loading ? 'Loading employees…' : `${filtered.length} of ${employees.length} employees`}
            </p>
          </div>
          {/* X close button */}
          <button
            onClick={onClose}
            style={{
              background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px',
              width: '30px', height: '30px', cursor: 'pointer',
              fontSize: '16px', color: '#64748b', lineHeight: 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </div>

        {/* ── SEARCH INPUT ── */}
        <div style={{ padding: '12px 22px', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
          <input
            autoFocus                          // cursor lands here when modal opens
            type="text"
            placeholder="Search by ID, name, or username…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', boxSizing: 'border-box',
              border: '1px solid #cbd5e1', borderRadius: '7px',
              fontSize: '13px', outline: 'none', color: '#0f172a',
              background: '#fff',
            }}
          />
        </div>

        {/* ── TABLE AREA — scrollable ── */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              Loading employees…
            </div>
          ) : error ? (
            <div style={{
              margin: '16px 22px', padding: '12px 14px', fontSize: '13px',
              background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c',
              borderRadius: '7px',
            }}>{error}</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              No employees match your search.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{
                  background: '#f8fafc', borderBottom: '1px solid #e2e8f0',
                  position: 'sticky', top: 0,   // header stays visible while scrolling
                }}>
                  {['ID', 'Name', 'Username'].map(h => (
                    <th key={h} style={{
                      padding: '9px 14px', textAlign: 'left',
                      fontWeight: 600, color: '#475569',
                      fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, i) => {
                  const id       = emp.userId ?? emp.id
                  const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.username || 'Unknown'
                  return (
                    <tr
                      key={id ?? i}
                      onClick={() => handleSelect(emp)}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        background: i % 2 === 0 ? '#fff' : '#fafafa',
                        cursor: 'pointer',
                        transition: 'background 0.1s',
                      }}
                      // hover highlight — inline because we can't use CSS classes here
                      onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                      onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'}
                    >
                      {/* ID — bold so it's easy to verify */}
                      <td style={{
                        padding: '10px 14px', color: '#0f172a',
                        fontWeight: 700, verticalAlign: 'middle',
                        width: '60px',
                      }}>{id}</td>

                      {/* Full Name */}
                      <td style={{ padding: '10px 14px', color: '#334155', verticalAlign: 'middle' }}>
                        {fullName}
                      </td>

                      {/* Username — secondary info in grey */}
                      <td style={{ padding: '10px 14px', color: '#94a3b8',
                        fontSize: '12px', verticalAlign: 'middle' }}>
                        {emp.username || '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── FOOTER ── */}
        <div style={{
          padding: '12px 22px',
          borderTop: '1px solid #e2e8f0',
          background: '#f8fafc',
          flexShrink: 0,
          fontSize: '12px', color: '#94a3b8', textAlign: 'center',
        }}>
          Click any row to select that employee
        </div>
      </div>
    </div>
  )
}