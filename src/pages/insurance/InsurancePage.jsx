// InsurancePage.jsx
// Hub page — role-based navigation cards
// Role is read from localStorage 'jwt_role' (saved at login)
//
// WHAT CHANGED:
//   REMOVED the entire "Admin Operations" section
//   WHY: Create Plan, Assign Insurance, Create Top-Up, Delete Plan, Delete Top-Up
//        are now all inline actions on their respective pages:
//          → Create Plan + Assign + Deactivate Plan = InsurancePlansPage
//          → Create Top-Up + Deactivate Top-Up      = AllTopUpsPage
//        Having cards that navigate to deleted pages causes a crash.
//
// ADMIN/HR sees: All Plans · All Top-Ups · All Claims · Reports · View Employee Data
// EMPLOYEE sees: My Summary · My Claims · My Top-Ups

import { Link, Navigate } from 'react-router-dom'

export default function InsurancePage() {
  const userRole = (localStorage.getItem('jwt_role') || '').toUpperCase()
  const jwtToken = localStorage.getItem('jwt_token') || ''

  // Not logged in → send to login page
  if (!jwtToken) return <Navigate to="/login" replace />

  const isAdmin    = userRole === 'ADMIN'
  const isHR       = userRole === 'HR'
  const isEmployee = userRole === 'EMPLOYEE'

  return (
    <div className="space-y-8 p-6">

      {/* ── EMPLOYEE VIEW ─────────────────────────────────────────────────────
          Only shown when logged in as EMPLOYEE
          Links go to employee-specific pages (my- prefix) */}
      {isEmployee && (
        <div className="rounded-md border border-slate-300 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">My Insurance</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link to="/insurance/my-claims"
              className="rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100">
              📝 My Claims
            </Link>
            <Link to="/insurance/my-topups"
              className="rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100">
              💰 My Top-Ups
            </Link>
          </div>
        </div>
      )}

      {/* ── ADMIN + HR VIEW ───────────────────────────────────────────────────
          All Plans → InsurancePlansPage  (create + assign + deactivate all inline)
          All Top-Ups → AllTopUpsPage     (create + deactivate all inline)
          All Claims → AllClaims          (approve + reject inline, employee filter inline)
          Reports → ReportsPage
          View Employee Data → EmployeeSelectorPage */}
      {(isAdmin || isHR) && (
        <div className="rounded-md border border-slate-300 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Insurance Management</h2>
          <p className="mb-4 text-xs text-slate-500">
            {isAdmin
              ? 'You can create, assign, and deactivate plans directly from each page.'
              : 'HR view — read-only access to all insurance data.'}
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link to="/insurance/plans"
              className="rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100">
              📋 All Plans
              {isAdmin && <span className="block text-xs text-slate-500 mt-1">Create · Assign · Deactivate</span>}
            </Link>
            <Link to="/insurance/all-topups"
              className="rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100">
              💰 All Top-Ups
              {isAdmin && <span className="block text-xs text-slate-500 mt-1">Create · Deactivate</span>}
            </Link>
            <Link to="/insurance/all-claims"
              className="rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100">
              📝 All Claims
              {isAdmin && <span className="block text-xs text-slate-500 mt-1">Approve · Reject</span>}
            </Link>
            <Link to="/insurance/reports"
              className="rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100">
              📊 Reports
              {isAdmin && <span className="block text-xs text-slate-500 mt-1">Various Reports</span>}
            </Link>
            <Link to="/insurance/employee-selector"
              className="rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100">
              👁️ View Employee Data
              {isAdmin && <span className="block text-xs text-slate-500 mt-1">Employee Insurance · Employee Claims ·  EmployeeTop-Ups</span>}
            </Link>
          </div>
        </div>
      )}

      {/* Fallback if role is missing */}
      {!userRole && (
        <p className="text-sm text-slate-500">
          Please <Link to="/login" className="underline">log in</Link> to access the Insurance module.
        </p>
      )}
    </div>
  )
}