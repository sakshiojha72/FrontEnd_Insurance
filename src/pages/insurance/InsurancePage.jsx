// InsurancePage.jsx
// Enhanced hub page with modern UI/UX design
// Features role-based navigation with improved visual design
// Uses Tailwind CSS for responsive, professional styling
// Includes smooth transitions and better accessibility

import { Link, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  getAllPlans,
  getAllClaims,
  getAllEmployees,
  getEmployeesWithTopUp,
  getEmployeesWithoutTopUp,
  getPendingClaimsReport
} from './api'

export default function InsurancePage() {
  const userRole = (localStorage.getItem('jwt_role') || '').toUpperCase()
  const jwtToken = localStorage.getItem('jwt_token') || ''

  const isAdmin    = userRole === 'ADMIN'
  const isHR       = userRole === 'HR'
  const isEmployee = userRole === 'EMPLOYEE'

  // Statistics state
  const [stats, setStats] = useState({
    activePlans: 0,
    pendingClaims: 0,
    coverageRate: 0,
    totalEmployees: 0,
    totalClaims: 0,
    approvedClaims: 0,
    activeInsuranceEmployees: 0,
    totalEmployeesFromBackend: false
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState('')

  function normalizeCount(response) {
    if (!response) return 0
    if (Array.isArray(response)) return response.length
    if (response.content && Array.isArray(response.content)) return response.content.length
    if (response.data && Array.isArray(response.data)) return response.data.length
    if (response.claims && Array.isArray(response.claims)) return response.claims.length
    if (Array.isArray(response.employees)) return response.employees.length
    if (typeof response.totalElements === 'number') return response.totalElements
    if (typeof response.totalCount === 'number') return response.totalCount
    return 0
  }

  // Fetch dashboard statistics from available backend reports
  useEffect(() => {
    if (!isAdmin && !isHR) return // Only fetch for admin/HR

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatsLoading(true); setStatsError('')

    Promise.all([
      getAllPlans().catch(() => null),
      getPendingClaimsReport(0, 1000).catch(() => null),
      getAllClaims('APPROVED', 0, 1000).catch(() => null),
      getAllClaims(undefined, 0, 1000).catch(() => null),
      getAllEmployees().catch(() => null),
      getEmployeesWithTopUp().catch(() => null),
      getEmployeesWithoutTopUp().catch(() => null)
    ])
      .then(([
        plans,
        pendingClaimsResponse,
        approvedClaimsResponse,
        allClaimsResponse,
        employeesResponse,
        withTopUpResponse,
        withoutTopUpResponse
      ]) => {
        const activePlansCount = normalizeCount(plans)
        const pendingClaimsCount = normalizeCount(pendingClaimsResponse)
        const approvedClaimsCount = normalizeCount(approvedClaimsResponse)
        const totalClaimsCount = normalizeCount(allClaimsResponse)
        const totalEmployeesCount = normalizeCount(employeesResponse)
        const withTopUpCount = normalizeCount(withTopUpResponse)
        const withoutTopUpCount = normalizeCount(withoutTopUpResponse)
        const activeInsuranceCount = withTopUpCount + withoutTopUpCount

        const coverageRate = activeInsuranceCount > 0
          ? Math.min(100, Math.round((withTopUpCount / activeInsuranceCount) * 100))
          : 0

        setStats({
          activePlans: activePlansCount,
          pendingClaims: pendingClaimsCount,
          coverageRate,
          totalEmployees: totalEmployeesCount || activeInsuranceCount,
          totalClaims: totalClaimsCount,
          approvedClaims: approvedClaimsCount,
          activeInsuranceEmployees: activeInsuranceCount,
          totalEmployeesFromBackend: totalEmployeesCount > 0
        })
      })
      .catch(error => {
        console.error('Failed to load dashboard stats:', error)
        setStatsError('Failed to load statistics')
        setStats({
          activePlans: 0,
          pendingClaims: 0,
          coverageRate: 0,
          totalEmployees: 0,
          totalClaims: 0,
          approvedClaims: 0
        })
      })
      .finally(() => setStatsLoading(false))
  }, [isAdmin, isHR])

  // Not logged in → send to login page
  if (!jwtToken) return <Navigate to="/login" replace />

  // Enhanced card data with better styling and descriptions
const employeeCards = [
    {
      title: 'My Insurance',
      description: 'View your current plan, coverage amount and expiry date',
      icon: '🛡️',
      path: '/insurance/my-insurance',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
      iconColor: 'text-purple-600'
    },
    {
      title: 'My Summary',
      description: 'See remaining coverage, claims used and top-up details',
      icon: '📊',
      path: '/insurance/my-summary',
      color: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200',
      iconColor: 'text-indigo-600'
    },
    {
      title: 'My Claims',
      description: 'View and manage your insurance claims',
      icon: '📝',
      path: '/insurance/my-claims',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
      iconColor: 'text-blue-600'
    },
    {
      title: 'My Top-Ups',
      description: 'Manage your insurance top-up payments',
      icon: '💰',
      path: '/insurance/my-topups',
      color: 'bg-green-50 hover:bg-green-100 border-green-200',
      iconColor: 'text-green-600'
    },
    {
      title: 'My Insurance History',
      description: 'View all past plan assignments including deactivated plans',
      icon: '🕐',
      path: '/insurance/my-history',
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
      iconColor: 'text-orange-600'
    }
  ]

  const adminHRCards = [
    {
      title: 'All Plans',
      description: 'Manage insurance plans and coverage',
      icon: '📋',
      path: '/insurance/plans',
      color: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
      iconColor: 'text-purple-600',
      actions: isAdmin ? 'Create · Assign · Deactivate' : null
    },
    {
      title: 'All Top-Ups',
      description: 'Oversee employee top-up payments',
      icon: '💰',
      path: '/insurance/all-topups',
      color: 'bg-green-50 hover:bg-green-100 border-green-200',
      iconColor: 'text-green-600',
      actions: isAdmin ? 'Create · Deactivate' : null
    },
    {
      title: 'All Claims',
      description: 'Review and process insurance claims',
      icon: '📝',
      path: '/insurance/all-claims',
      color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
      iconColor: 'text-blue-600',
      actions: isAdmin ? 'Approve · Reject' : null
    },
    {
      title: 'Reports',
      description: 'Generate insurance analytics and reports',
      icon: '📊',
      path: '/insurance/reports',
      color: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200',
      iconColor: 'text-indigo-600',
      actions: isAdmin ? 'Various Reports' : null
    },
    {
      title: 'Employee Data',
      description: 'View comprehensive employee insurance details',
      icon: '👁️',
      path: '/insurance/employee-selector',
      color: 'bg-orange-50 hover:bg-orange-100 border-orange-200',
      iconColor: 'text-orange-600',
      actions: isAdmin ? 'Insurance · Claims · Top-Ups' : null
    }
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🛡️</span>
          <h1 className="text-2xl font-bold text-slate-900">Insurance Management</h1>
        </div>
        <p className="text-slate-600">
          Welcome to the insurance module. Manage your coverage, claims, and policies efficiently.
        </p>
      </div>

      {/* ── EMPLOYEE VIEW ───────────────────────────────────────────────────── */}
      {isEmployee && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">👤</span>
            <h2 className="text-xl font-semibold text-slate-900">My Insurance Dashboard</h2>
          </div>
          <p className="text-slate-600 mb-6">
            Access your personal insurance information and manage your claims and payments.
          </p>
          <div className="grid gap-6 md:grid-cols-2">
            {employeeCards.map((card, index) => (
              <Link
                key={index}
                to={card.path}
                className={`group block rounded-lg border-2 p-6 transition-all duration-200 ${card.color} hover:shadow-md hover:-translate-y-1`}
              >
                <div className="flex items-start gap-4">
                  <div className={`text-3xl ${card.iconColor}`}>{card.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-slate-800">
                      {card.title}
                    </h3>
                    <p className="text-sm text-slate-600 mb-3">{card.description}</p>
                    <div className="flex items-center text-sm font-medium text-slate-700">
                      <span>Access Now</span>
                      <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── ADMIN + HR VIEW ─────────────────────────────────────────────────── */}
      {(isAdmin || isHR) && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">⚙️</span>
            <h2 className="text-xl font-semibold text-slate-900">Insurance Administration</h2>
          </div>
          <div className="mb-6">
            <p className="text-slate-600 mb-2">
              {isAdmin
                ? 'Manage all aspects of employee insurance including plans, claims, and reporting.'
                : 'Access comprehensive insurance data and employee information.'}
            </p>
            {isAdmin && (
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                <span className="text-xs">💡</span>
                <span>Full administrative access available</span>
              </div>
            )}
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {adminHRCards.map((card, index) => (
              <Link
                key={index}
                to={card.path}
                className={`group block rounded-lg border-2 p-6 transition-all duration-200 ${card.color} hover:shadow-md hover:-translate-y-1`}
              >
                <div className="flex items-start gap-4">
                  <div className={`text-3xl ${card.iconColor}`}>{card.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-slate-800">
                      {card.title}
                    </h3>
                    <p className="text-sm text-slate-600 mb-3">{card.description}</p>
                    {card.actions && (
                      <div className="text-xs text-slate-500 mb-3 font-medium">
                        {card.actions}
                      </div>
                    )}
                    <div className="flex items-center text-sm font-medium text-slate-700">
                      <span>Manage</span>
                      <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats for Admin/HR */}
      {(isAdmin || isHR) && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📋</span>
              <div>
                <p className="text-sm font-medium text-slate-600">Active Plans</p>
                <p className="text-2xl font-bold text-slate-900">
                  {statsLoading ? '...' : stats.activePlans}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500">Currently active insurance plans</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">⏳</span>
              <div>
                <p className="text-sm font-medium text-slate-600">Pending Claims</p>
                <p className="text-2xl font-bold text-slate-900">
                  {statsLoading ? '...' : stats.pendingClaims}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500">Claims awaiting review</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-sm font-medium text-slate-600">Coverage Rate</p>
                <p className="text-2xl font-bold text-slate-900">
                  {statsLoading ? '...' : `${stats.coverageRate}%`}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500">Employees with active coverage</p>
          </div>
        </div>
      )}

      {/* Additional Stats for Admin */}
      {isAdmin && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">👥</span>
              <div>
                <p className="text-sm font-medium text-slate-600">
                  {statsLoading
                    ? 'Total Employees'
                    : stats.totalEmployeesFromBackend
                      ? 'Total Employees'
                      : 'Active Insurance Employees'}
                </p>
                <p className="text-2xl font-bold text-slate-900">
                  {statsLoading ? '...' : stats.totalEmployees}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              {statsLoading
                ? 'Registered employees'
                : stats.totalEmployeesFromBackend
                  ? 'Registered employees'
                  : 'Employees currently insured'}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">📊</span>
              <div>
                <p className="text-sm font-medium text-slate-600">Total Claims</p>
                <p className="text-2xl font-bold text-slate-900">
                  {statsLoading ? '...' : stats.totalClaims}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500">All-time claims submitted</p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">🎯</span>
              <div>
                <p className="text-sm font-medium text-slate-600">Approval Rate</p>
                <p className="text-2xl font-bold text-slate-900">
                  {statsLoading ? '...' : stats.totalClaims > 0
                    ? `${Math.round((stats.approvedClaims / stats.totalClaims) * 100)}%`
                    : '0%'}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500">Claims approved vs total</p>
          </div>
        </div>
      )}

      {/* Error message for stats */}
      {statsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <span className="text-red-600">⚠️</span>
            <p className="text-sm text-red-700">{statsError}</p>
          </div>
        </div>
      )}

      {/* Fallback if role is missing */}
      {!userRole && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">Access Required</h3>
              <p className="text-yellow-700 mt-1">
                Please <Link to="/login" className="underline font-medium hover:text-yellow-900">log in</Link> to access the Insurance module.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}