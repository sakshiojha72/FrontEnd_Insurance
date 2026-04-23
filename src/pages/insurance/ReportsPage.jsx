// ReportsPage.jsx
// ADMIN+HR: view various insurance reports
// Multiple GET endpoints for different reports

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getEmployeesWithTopUp,
  getEmployeesWithoutTopUp,
  getAssignedBetweenDates,
  getCurrentFinancialYearReport,
  getPendingClaimsReport,
  getExpiringSoonReport
} from './api'

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState('with-topup')
  const [reportData, setReportData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Date range filters
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [days, setDays] = useState(30)

  const reports = [
    { id: 'with-topup', name: 'Employees with Top-up', description: 'Employees who have active insurance AND top-up coverage' },
    { id: 'no-topup', name: 'Employees without Top-up', description: 'Employees with insurance but NO top-up coverage' },
    { id: 'assigned-between', name: 'Assigned Between Dates', description: 'Insurance assignments within a date range' },
    { id: 'financial-year', name: 'Current Financial Year', description: 'All assignments in current Indian FY (April-March)' },
    { id: 'pending-claims', name: 'Pending Claims', description: 'All claims that are still pending approval' },
    { id: 'expiring-soon', name: 'Expiring Soon', description: 'Insurance policies expiring within specified days' }
  ]

  useEffect(() => {
    loadReport(activeReport)
  }, [activeReport])

  async function loadReport(reportType) {
    setLoading(true)
    setError('')
    try {
      let data
      switch (reportType) {
        case 'with-topup':
          data = await getEmployeesWithTopUp()
          break
        case 'no-topup':
          data = await getEmployeesWithoutTopUp()
          break
        case 'assigned-between':
          if (!startDate || !endDate) {
            setReportData([])
            setLoading(false)
            return
          }
          data = await getAssignedBetweenDates(startDate, endDate)
          break
        case 'financial-year':
          data = await getCurrentFinancialYearReport()
          break
        case 'pending-claims':
          data = await getPendingClaimsReport()
          break
        case 'expiring-soon':
          data = await getExpiringSoonReport(days)
          break
        default:
          data = []
      }
      setReportData(data)
    } catch (e) {
      console.warn(`Failed to load ${reportType} report:`, e.message)
      setReportData([])
    } finally {
      setLoading(false)
    }
  }

  function renderReportTable() {
    if (loading) return <p className="text-sm text-slate-500">Loading report...</p>
    if (reportData.length === 0) return <p className="text-sm text-slate-500">No data found for this report.</p>

    switch (activeReport) {
      case 'with-topup':
        return (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-2 text-left font-medium text-slate-700">Employee ID</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Name</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Plan</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Top-up</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Total Coverage</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item, index) => (
                <tr key={index} className="border-b border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-900">{item.employeeId}</td>
                  <td className="px-4 py-2 text-slate-700">{item.employeeName}</td>
                  <td className="px-4 py-2 text-slate-700">{item.planName}</td>
                  <td className="px-4 py-2 text-slate-700">{item.topUpName}</td>
                  <td className="px-4 py-2 text-slate-700">₹{item.totalCoverage?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )

      case 'no-topup':
        return (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-2 text-left font-medium text-slate-700">Employee ID</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Name</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Plan</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Coverage Amount</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item, index) => (
                <tr key={index} className="border-b border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-900">{item.employeeId}</td>
                  <td className="px-4 py-2 text-slate-700">{item.employeeName}</td>
                  <td className="px-4 py-2 text-slate-700">{item.planName}</td>
                  <td className="px-4 py-2 text-slate-700">₹{item.coverageAmount?.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )

      case 'pending-claims':
        return (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-2 text-left font-medium text-slate-700">Claim ID</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Employee</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Amount</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Reason</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Raised Date</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item, index) => (
                <tr key={index} className="border-b border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-900">{item.claimId}</td>
                  <td className="px-4 py-2 text-slate-700">{item.employeeName} ({item.employeeId})</td>
                  <td className="px-4 py-2 text-slate-700">₹{item.claimAmount?.toLocaleString()}</td>
                  <td className="px-4 py-2 text-slate-700">{item.reason}</td>
                  <td className="px-4 py-2 text-slate-700">{item.raisedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )

      case 'expiring-soon':
        return (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-4 py-2 text-left font-medium text-slate-700">Employee ID</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Name</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Plan</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Expiry Date</th>
                <th className="px-4 py-2 text-left font-medium text-slate-700">Days Until Expiry</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((item, index) => (
                <tr key={index} className="border-b border-slate-100">
                  <td className="px-4 py-2 font-medium text-slate-900">{item.employeeId}</td>
                  <td className="px-4 py-2 text-slate-700">{item.employeeName}</td>
                  <td className="px-4 py-2 text-slate-700">{item.planName}</td>
                  <td className="px-4 py-2 text-slate-700">{item.expiryDate}</td>
                  <td className="px-4 py-2">
                    <span className={`font-medium ${
                      item.daysUntilExpiry <= 7 ? 'text-red-600' :
                      item.daysUntilExpiry <= 14 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {item.daysUntilExpiry} days
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )

      default:
        return <p className="text-sm text-slate-500">Select a report to view data.</p>
    }
  }

  return (
    <div className="space-y-8 p-6">
      <Link
        to="/insurance"
        className="inline-block rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
      >
        Back to Insurance Home
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Insurance Reports</h1>
        <p className="mt-1 text-sm text-slate-600">View various insurance-related reports and analytics.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Report Selection */}
        <section className="lg:col-span-1">
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Available Reports</h3>
          <div className="space-y-2">
            {reports.map((report) => (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id)}
                className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                  activeReport === report.id
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="font-medium">{report.name}</div>
                <div className="text-xs opacity-75">{report.description}</div>
              </button>
            ))}
          </div>

          {/* Filters for specific reports */}
          {activeReport === 'assigned-between' && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                />
              </div>
              <button
                onClick={() => loadReport('assigned-between')}
                disabled={!startDate || !endDate}
                className="w-full rounded border border-slate-900 bg-slate-900 px-2 py-1 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                Generate Report
              </button>
            </div>
          )}

          {activeReport === 'expiring-soon' && (
            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Days</label>
                <input
                  type="number"
                  value={days}
                  onChange={e => setDays(Number(e.target.value))}
                  min="1"
                  max="365"
                  className="w-full rounded border border-slate-300 px-2 py-1 text-xs"
                />
              </div>
              <button
                onClick={() => loadReport('expiring-soon')}
                className="w-full rounded border border-slate-900 bg-slate-900 px-2 py-1 text-xs font-medium text-white"
              >
                Update Report
              </button>
            </div>
          )}
        </section>

        {/* Report Data */}
        <section className="lg:col-span-3">
          <div className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              {reports.find(r => r.id === activeReport)?.name}
            </h3>
            {error && (
              <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="overflow-x-auto">
              {renderReportTable()}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}