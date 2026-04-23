// EmployeeSelectorPage.jsx
// ADMIN+HR: Select an employee ID to view their insurance data
// This page allows admins to enter an employee ID and navigate to their data

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function EmployeeSelectorPage() {
  const navigate = useNavigate()
  const [employeeId, setEmployeeId] = useState('')
  const [error, setError] = useState('')

  function handleViewInsurance() {
    if (!employeeId.trim()) {
      setError('Please enter an employee ID')
      return
    }
    if (isNaN(employeeId)) {
      setError('Employee ID must be a number')
      return
    }
    setError('')
    navigate(`/insurance/employee/${employeeId}/insurance`)
  }

  function handleViewClaims() {
    if (!employeeId.trim()) {
      setError('Please enter an employee ID')
      return
    }
    if (isNaN(employeeId)) {
      setError('Employee ID must be a number')
      return
    }
    setError('')
    navigate(`/insurance/employee/${employeeId}/claims`)
  }

  function handleViewTopUps() {
    if (!employeeId.trim()) {
      setError('Please enter an employee ID')
      return
    }
    if (isNaN(employeeId)) {
      setError('Employee ID must be a number')
      return
    }
    setError('')
    navigate(`/insurance/employee/${employeeId}/topups`)
  }

  function handleViewSummary() {
    if (!employeeId.trim()) {
      setError('Please enter an employee ID')
      return
    }
    if (isNaN(employeeId)) {
      setError('Employee ID must be a number')
      return
    }
    setError('')
    navigate(`/insurance/employee/${employeeId}/summary`)
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
        <h1 className="text-2xl font-semibold text-slate-900">View Employee Data</h1>
        <p className="mt-1 text-sm text-slate-600">Enter an employee ID to view their insurance information.</p>
      </div>

      <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Employee ID</label>
            <input
              type="number"
              value={employeeId}
              onChange={e => setEmployeeId(e.target.value)}
              placeholder="Enter employee ID (e.g., 1, 2, 3)"
              className="w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              min="1"
            />
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <button
              onClick={handleViewInsurance}
              className="rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              👁️ View Insurance
            </button>

            <button
              onClick={handleViewClaims}
              className="rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              📋 View Claims
            </button>

            <button
              onClick={handleViewTopUps}
              className="rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              💰 View Top-Ups
            </button>

            <button
              onClick={handleViewSummary}
              className="rounded-md border border-slate-300 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              📊 View Summary
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}