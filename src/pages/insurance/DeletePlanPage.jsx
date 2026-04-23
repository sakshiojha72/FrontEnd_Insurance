// DeletePlanPage.jsx
// ADMIN only: soft delete an insurance plan
// DELETE /finsecure/insurance/plans/{planId}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { deletePlan, getAllPlans } from './api'

export default function DeletePlanPage() {
  const [plans, setPlans] = useState([])
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [msg, setMsg] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load plans on component mount
  useEffect(() => {
    getAllPlans()
      .then(data => {
        setPlans(data)
        setLoading(false)
      })
      .catch(e => {
        console.warn('Failed to load plans:', e.message)
        setPlans([])
        setLoading(false)
      })
  }, [])

  async function handleDelete() {
    if (!selectedPlanId) {
      setMsg('Please select a plan to delete')
      setIsError(true)
      return
    }

    setMsg('')
    setIsError(false)

    try {
      await deletePlan(selectedPlanId)
      setMsg('Plan deleted successfully!')

      // Refresh the plans list
      const updatedPlans = await getAllPlans()
      setPlans(updatedPlans)
      setSelectedPlanId('')
    } catch (e) {
      setMsg(e.message)
      setIsError(true)
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
        <h1 className="text-2xl font-semibold text-slate-900">Delete Insurance Plan</h1>
        <p className="mt-1 text-sm text-slate-600">Soft delete an insurance plan (ADMIN only)</p>
      </div>

      <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
        <div className="space-y-4">

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Select Plan to Delete</label>
            {loading ? (
              <p className="text-sm text-slate-500">Loading plans...</p>
            ) : plans.length === 0 ? (
              <p className="text-sm text-slate-500">No plans available</p>
            ) : (
              <select
                value={selectedPlanId}
                onChange={e => setSelectedPlanId(e.target.value)}
                className="w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              >
                <option value="">Choose a plan...</option>
                {plans.map(plan => (
                  <option key={plan.planId ?? plan.id} value={plan.planId ?? plan.id}>
                    {plan.planName ?? plan.name} - ₹{plan.coverageAmount?.toLocaleString()} ({plan.isActive ? 'Active' : 'Inactive'})
                  </option>
                ))}
              </select>
            )}
          </div>

          {msg && (
            <div className={`rounded-md border px-3 py-2 text-sm ${
              isError
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-green-200 bg-green-50 text-green-700'
            }`}>
              {msg}
            </div>
          )}

          <button
            onClick={handleDelete}
            disabled={!selectedPlanId || loading}
            className="w-full rounded border border-red-600 bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-red-400 hover:bg-red-700"
          >
            Delete Plan
          </button>

          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
            <p className="text-xs text-yellow-800">
              <strong>Warning:</strong> This will soft delete the plan. It will be marked as inactive but not permanently removed.
            </p>
          </div>

        </div>
      </section>
    </div>
  )
}