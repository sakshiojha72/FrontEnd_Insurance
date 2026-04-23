// InsurancePage.jsx
// The hub page — shows role-based section cards with links to sub-pages
// Matches FinancePage.jsx style exactly (same Tailwind classes, same card pattern)
// Role is read from localStorage (set during login)

import { Link, Navigate } from 'react-router-dom'

export default function InsurancePage() {
  // Read role from localStorage — set during login (see LoginPage.jsx)
  // Possible values: ADMIN, EMPLOYEE, HR, FINANCE
  const userRole = (localStorage.getItem('jwt_role') || '').toUpperCase()
  const jwtToken = localStorage.getItem('jwt_token') || ''

  // If not logged in, redirect to login
  if (!jwtToken) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="space-y-8 p-6">

      {/* ── My Insurance section - ONLY for EMPLOYEE users ────────────────────── */}
      {userRole.toUpperCase() === 'EMPLOYEE' && (
        <div className="rounded-md border border-slate-300 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            My Insurance
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/insurance/my-summary"
              className="rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              📊 My Summary
            </Link>

            <Link
              to="/insurance/my-claims"
              className="rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              📝 My Claims
            </Link>

            <Link
              to="/insurance/my-topups"
              className="rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              💰 My Top-Ups
            </Link>
          </div>
        </div>
      )}

      {/* ── Admin/HR Management section ──────────────────────────── */}
      {(userRole.toUpperCase() === 'ADMIN' || userRole.toUpperCase() === 'HR') && (
        <div className="rounded-md border border-slate-300 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Insurance Management
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/insurance/plans"
              className="rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              📋 All Plans
            </Link>

            <Link
              to="/insurance/all-topups"
              className="rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              💰 All Top-Ups
            </Link>

            <Link
              to="/insurance/all-claims"
              className="rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              📝 All Claims
            </Link>

            <Link
              to="/insurance/reports"
              className="rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              📊 Reports
            </Link>

            {/* Employee management - ADMIN+HR */}
            <Link
              to="/insurance/employee-selector"
              className="rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              👁️ View Employee Data
            </Link>
          </div>
        </div>
      )}

      {/* ── Admin Operations section ──────────────────────────── */}
      {userRole.toUpperCase() === 'ADMIN' && (
        <div className="rounded-md border border-slate-300 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Admin Operations
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/insurance/create-plan"
              className="rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              ➕ Create Plan
            </Link>

            <Link
              to="/insurance/assign"
              className="rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              👤 Assign Insurance
            </Link>

            <Link
              to="/insurance/create-topup"
              className="rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              💰 Create Top-Up
            </Link>



            <Link
              to="/insurance/delete-plan"
              className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-900 hover:bg-red-100"
            >
              🗑️ Delete Plan
            </Link>

            <Link
              to="/insurance/delete-topup"
              className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-900 hover:bg-red-100"
            >
              🚫 Delete Top-Up
            </Link>
          </div>
        </div>
      )}

      {/* Show message if no role is detected (not logged in) */}
      {!userRole && (
        <p className="text-sm text-slate-500">
          Please <Link to="/login" className="underline">log in</Link> to access the Insurance module.
        </p>
      )}

    </div>
  )
}