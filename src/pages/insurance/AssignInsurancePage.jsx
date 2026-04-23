// AssignInsurancePage.jsx
// ADMIN only: assign an insurance plan to an employee
// POST /finsecure/insurance/plans/assign

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { assignInsurance, getAllEmployees, getAllPlans } from './api'

export default function AssignInsurancePage() {
  const [employees, setEmployees] = useState([])
  const [plans, setPlans] = useState([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [employeeId, setEmployeeId] = useState('')   // the employee's userId
  const [planId, setPlanId] = useState('')           // the insurance plan ID
  const [expiryDate, setExpiryDate] = useState('')   // expiry date for this policy
  const [msg, setMsg] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showOnlyUnassigned, setShowOnlyUnassigned] = useState(true)

  useEffect(() => {
    setLoading(true)
    console.log('Starting to load assign page data...')
    Promise.all([getAllEmployees(), getAllPlans()])
      .then(([employeesData, plansData]) => {
        console.log('Employees data received:', employeesData)
        console.log('Plans data received:', plansData)
        setEmployees(Array.isArray(employeesData) ? employeesData : [])

        const normalizedPlans = Array.isArray(plansData)
          ? plansData
          : Array.isArray(plansData?.plans)
          ? plansData.plans
          : Array.isArray(plansData?.data)
          ? plansData.data
          : []

        if (!Array.isArray(plansData)) {
          console.warn('Normalized plans response to array:', normalizedPlans)
        }

        setPlans(normalizedPlans)
      })
      .catch(e => {
        console.warn('Failed to load assign page data:', e.message)
        console.error('Error details:', e)
        console.error('Error stack:', e.stack)
        setEmployees([])
        setPlans([])
      })
      .finally(() => {
        console.log('Finished loading assign page data')
        setLoading(false)
      })
  }, [])

  async function handleAssign() {
    setMsg(''); setIsError(false)
    try {
      await assignInsurance(Number(employeeId), Number(planId), expiryDate)
      setMsg('Insurance assigned successfully!')
      setEmployeeId(''); setPlanId(''); setExpiryDate('')
      setSelectedEmployeeId('')
    } catch (e) {
      setMsg(e.message)
      setIsError(true)
    }
  }

  function selectEmployee(emp) {
    const id = emp.id
    setEmployeeId(id)
    setSelectedEmployeeId(id)
  }

  function hasInsurance(emp) {
    return Boolean(
      emp.hasInsurance ||
      emp.insurancePlanId ||
      emp.planId ||
      emp.insurancePlanName ||
      emp.insuranceName ||
      emp.insuranceStatus === 'ASSIGNED' ||
      (emp.insurances && emp.insurances.length > 0)
    )
  }

  const visibleEmployees = showOnlyUnassigned
    ? employees.filter(emp => !hasInsurance(emp))
    : employees

  return (
    <div className="space-y-8 p-6">
      <Link
        to="/insurance"
        className="inline-block rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
      >
        Back to Insurance Home
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Assign Insurance</h1>
        <p className="mt-1 text-sm text-slate-600">Assign an insurance plan to an employee.</p>
      </div>

      <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Select Employee</h2>
        <div className="flex flex-wrap items-center gap-3 pb-4">
          <span className="text-sm text-slate-600">Show:</span>
          <button
            type="button"
            onClick={() => setShowOnlyUnassigned(true)}
            className={`rounded border px-3 py-1 text-sm ${showOnlyUnassigned ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}
          >
            Unassigned only
          </button>
          <button
            type="button"
            onClick={() => setShowOnlyUnassigned(false)}
            className={`rounded border px-3 py-1 text-sm ${!showOnlyUnassigned ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}
          >
            All employees
          </button>
        </div>
        {loading ? (
          <p className="text-sm text-slate-500">Loading employees...</p>
        ) : visibleEmployees.length === 0 ? (
          <p className="text-sm text-slate-500">No matching employees found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100">
                  {['Employee ID', 'Name', 'Email', 'Department', 'Insurance Status', 'Assigned Plan', 'Action'].map(h => (
                    <th key={h} className="border border-slate-200 px-3 py-2 text-left font-medium text-slate-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleEmployees.map((emp, i) => {
                  const assigned = hasInsurance(emp)
                  const planName = emp.insurancePlanName || emp.planName || emp.insuranceName || '—'
                  const fullName = (emp.firstName + ' ' + emp.lastName).trim() || emp.username || 'Unknown'
                  return (
                    <tr
                      key={emp.id}
                      className={`${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} ${selectedEmployeeId === emp.id ? 'ring-2 ring-slate-300' : ''}`}
                    >
                      <td className="border border-slate-200 px-3 py-2">{emp.id}</td>
                      <td className="border border-slate-200 px-3 py-2">{fullName}</td>
                      <td className="border border-slate-200 px-3 py-2">{emp.email}</td>
                      <td className="border border-slate-200 px-3 py-2">{emp.department || '—'}</td>
                      <td className="border border-slate-200 px-3 py-2">
                        {assigned ? 'Assigned' : 'No insurance'}
                      </td>
                      <td className="border border-slate-200 px-3 py-2">{assigned ? planName : '—'}</td>
                      <td className="border border-slate-200 px-3 py-2">
                        <button
                          onClick={() => selectEmployee(emp)}
                          disabled={assigned}
                          className={`rounded border px-2 py-1 text-xs ${assigned ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : 'border-slate-300 bg-white text-slate-900 hover:bg-slate-50'}`}
                        >
                          {assigned ? 'Assigned' : 'Assign'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Assign Insurance Plan</h2>
        <div className="space-y-3">

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Employee ID</label>
            {/* This is the employee's userId in the database */}
            <input
              type="number"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              placeholder="Employee's user ID"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Plan ID</label>
            <input
              type="number"
              value={planId}
              onChange={e => setPlanId(e.target.value)}
              placeholder="Enter plan ID"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
            />
            <p className="mt-2 text-sm text-slate-500">Enter the plan ID manually, just like the employee ID.</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Expiry Date</label>
            <input
              type="date"
              value={expiryDate}
              onChange={e => setExpiryDate(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleAssign}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Assign Insurance
          </button>

          {msg && (
            <p className={`text-sm ${isError ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>
          )}
        </div>
      </section>
    </div>
  )
}