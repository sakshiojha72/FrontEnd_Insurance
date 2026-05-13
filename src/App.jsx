import { Link, Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'

import AssetsPage from './pages/assets/AssetsPage'
import BankManagementPage from './pages/finance/BankManagementPage'
import CardManagementPage from './pages/finance/CardManagementPage'
import FinancePage from './pages/finance/FinancePage'
import HrPage from './pages/hr/HrPage'
import InsurancePage from './pages/insurance/InsurancePage'
import MyClaimsPage from './pages/insurance/MyClaimsPage'
import MyTopUpsPage from './pages/insurance/MyTopUpsPage'
import InsurancePlansPage from './pages/insurance/InsurancePlansPage'
import AllClaimsPage from './pages/insurance/AllClaims'
import RenewInsurancePage from './pages/insurance/RenewInsurancePage'
import ReportsPage from './pages/insurance/ReportsPage'
import EmployeeInsurancePage from './pages/insurance/EmployeeInsurancePage'
import EmployeeSummaryPage from './pages/insurance/EmployeeSummaryPage'
import RequestInsurancePage from './pages/insurance/RequestInsurancePage'
import AllTopUpsPage from './pages/insurance/AllTopUpsPage'
import EmployeeSelectorPage from './pages/insurance/EmployeeSelectorPage'
import InvestmentManagementPage from './pages/finance/InvestmentManagementPage'
import LoginPage from './pages/login/LoginPage'
import ProfilePage from './pages/profile/ProfilePage'
import FinanceReportsPage from './pages/finance/ReportsPage'
import SalaryProcessingPage from './pages/finance/SalaryProcessingPage'
import TimesheetPage from './pages/timesheet/TimesheetPage'
import TrainingPage from './pages/training/TrainingPage'

function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem('jwt_token'))

  useEffect(() => {
    // Check token on mount and whenever route changes
    const token = localStorage.getItem('jwt_token')
    setIsLoggedIn(!!token)
  }, [location.pathname])

  useEffect(() => {
    // Also listen for storage changes from other tabs
    const handleStorageChange = () => {
      const token = localStorage.getItem('jwt_token')
      setIsLoggedIn(!!token)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('jwt_token')
    localStorage.removeItem('jwt_role')
    setIsLoggedIn(false)
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <nav className="flex flex-1 flex-wrap gap-2">
            <Link to="/hr" className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              HR
            </Link>
            <Link to="/finance" className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              FINANCE
            </Link>
            <Link to="/training" className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              TRAINING
            </Link>
            <Link to="/timesheet" className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              TIMESHEET
            </Link>
            <Link to="/assets" className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              ASSETS
            </Link>
            <Link to="/insurance" className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              INSURANCE
            </Link>
            <Link to="/profile" className="rounded border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              PROFILE
            </Link>
          </nav>

          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="rounded border border-red-600 bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors"
            >
              Log Out
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
            >
              Login
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={isLoggedIn ? <Navigate to="/insurance" replace /> : <Navigate to="/login" replace />} />
          <Route path="/hr" element={isLoggedIn ? <HrPage /> : <Navigate to="/login" replace />} />
          <Route path="/finance" element={isLoggedIn ? <FinancePage /> : <Navigate to="/login" replace />} />
          <Route path="/finance/bank-management" element={isLoggedIn ? <BankManagementPage /> : <Navigate to="/login" replace />} />
          <Route path="/finance/investment-management" element={isLoggedIn ? <InvestmentManagementPage /> : <Navigate to="/login" replace />} />
          <Route path="/finance/card-management" element={isLoggedIn ? <CardManagementPage /> : <Navigate to="/login" replace />} />
          <Route path="/finance/salary-processing" element={isLoggedIn ? <SalaryProcessingPage /> : <Navigate to="/login" replace />} />
          <Route path="/finance/reports" element={isLoggedIn ? <FinanceReportsPage /> : <Navigate to="/login" replace />} />
          <Route path="/training" element={isLoggedIn ? <TrainingPage /> : <Navigate to="/login" replace />} />
          <Route path="/timesheet" element={isLoggedIn ? <TimesheetPage /> : <Navigate to="/login" replace />} />
          <Route path="/assets" element={isLoggedIn ? <AssetsPage /> : <Navigate to="/login" replace />} />
          <Route path="/insurance" element={isLoggedIn ? <InsurancePage /> : <Navigate to="/login" replace />} />
          <Route path="/insurance/my-claims" element={isLoggedIn ? <MyClaimsPage /> : <Navigate to="/login" replace />} />
          <Route path="/insurance/my-topups" element={isLoggedIn ? <MyTopUpsPage /> : <Navigate to="/login" replace />} />
          <Route path="/insurance/plans" element={isLoggedIn ? <InsurancePlansPage /> : <Navigate to="/login" replace />} />
          <Route path="/insurance/all-claims" element={isLoggedIn ? <AllClaimsPage /> : <Navigate to="/login" replace />} />
          <Route path="/insurance/renew" element={isLoggedIn ? <RenewInsurancePage /> : <Navigate to="/login" replace />} />
          <Route path="/insurance/reports" element={isLoggedIn ? <ReportsPage /> : <Navigate to="/login" replace />} />
          <Route path="/insurance/employee" element={isLoggedIn ? <EmployeeInsurancePage /> : <Navigate to="/login" replace />} />          <Route path="/insurance/employee/:employeeId/summary" element={isLoggedIn ? <EmployeeSummaryPage /> : <Navigate to="/login" replace />} />
          <Route path="/insurance/all-topups" element={isLoggedIn ? <AllTopUpsPage /> : <Navigate to="/login" replace />} />
          <Route path="/insurance/employee-selector" element={isLoggedIn ? <EmployeeSelectorPage /> : <Navigate to="/login" replace />} />
          <Route path="/profile" element={isLoggedIn ? <ProfilePage /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default App