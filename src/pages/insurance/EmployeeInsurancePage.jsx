// EmployeeInsurancePage.jsx
// ADMIN+HR: view any employee's insurance details
// GET /finsecure/insurance/plans/employee/{id}

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getEmployeeInsurance } from './api'
import StatusBadge from './StatusBadge' 
export default function EmployeeInsurancePage() {
  const { employeeId } = useParams()
  const [insurance, setInsurance] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (employeeId) {
      getEmployeeInsurance(employeeId)
        .then(data => {
          setInsurance(data)
          setLoading(false)
        })
        .catch(e => {
          console.warn('Failed to load employee insurance:', e.message)
          setInsurance(null)
          setError('Failed to load employee insurance')
          setLoading(false)
        })
    }
  }, [employeeId])

  return (
    <div className="space-y-8 p-6">
      <Link
        to="/insurance"
        className="inline-block rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
      >
        Back to Insurance Home
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Employee Insurance Details</h1>
        <p className="mt-1 text-sm text-slate-600">Insurance details for Employee ID: {employeeId}</p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {loading ? (
        <p className="text-sm text-slate-500">Loading insurance details...</p>
      ) : insurance ? (
        <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Employee ID</label>
              <p className="text-lg font-semibold text-slate-900">{insurance.employeeId}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Plan Name</label>
              <p className="text-lg font-semibold text-slate-900">{insurance.planName}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Coverage Amount</label>
              <p className="text-lg font-semibold text-slate-900">₹{insurance.coverageAmount?.toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Status</label>
              <StatusBadge status={insurance.status} daysUntilExpiry={insurance.daysUntilExpiry} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Assigned Date</label>
              <p className="text-lg font-semibold text-slate-900">{insurance.assignedDate}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Expiry Date</label>
              <p className="text-lg font-semibold text-slate-900">{insurance.expiryDate}</p>
            </div>
          </div>
        </section>
      ) : (
        <p className="text-sm text-slate-500">No insurance found for this employee.</p>
      )}
    </div>
  )
}