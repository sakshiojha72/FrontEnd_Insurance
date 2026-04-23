// DeleteTopUpPage.jsx
// ADMIN only: deactivate a top-up plan
// DELETE /finsecure/insurance/topups/plans/{id}

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { deleteTopUpPlan, getAllTopUpPlans } from './api'

export default function DeleteTopUpPage() {
  const [topUpPlans, setTopUpPlans] = useState([])
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [msg, setMsg] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(true)

  // Load top-up plans on component mount
  useEffect(() => {
    getAllTopUpPlans()
      .then(data => {
        setTopUpPlans(data)
        setLoading(false)
      })
      .catch(e => {
        console.warn('Failed to load top-up plans:', e.message)
        setTopUpPlans([])
        setLoading(false)
      })
  }, [])


  async function handleDelete(e) {
  e.preventDefault()

  if (!selectedPlanId) {
    setMsg('Please select a top-up plan to delete')
    setIsError(true)
    return
  }

  setMsg('')
  setIsError(false)

  try {
    await deleteTopUpPlan(selectedPlanId)
    setMsg('Top-up plan deleted successfully!')

    setTopUpPlans(prev =>
      prev.filter(
        plan =>
          String(plan.topUpPlanId ?? plan.id) !== String(selectedPlanId)
      )
    )

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
        <h1 className="text-2xl font-semibold text-slate-900">Delete Top-Up Plan</h1>
        <p className="mt-1 text-sm text-slate-600">Deactivate a top-up plan (ADMIN only)</p>
      </div>

      <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
        <div className="space-y-4">

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Select Top-Up Plan to Delete</label>
            {loading ? (
              <p className="text-sm text-slate-500">Loading top-up plans...</p>
            ) : topUpPlans.length === 0 ? (
              <p className="text-sm text-slate-500">No top-up plans available</p>
            ) : (
            <select
              value={selectedPlanId}
              onChange={e => setSelectedPlanId(e.target.value)}
              className="w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
            >
              <option value="">Choose a top-up plan...</option>  {/* ADD THIS LINE */}
              {topUpPlans.map(plan => (
                <option key={plan.topUpPlanId ?? plan.id} value={plan.topUpPlanId ?? plan.id}>
                  {(plan.topUpName ?? plan.name)} - ₹{plan.price?.toLocaleString()} (₹{plan.additionalCoverage?.toLocaleString()} coverage)
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
            type="button"
            onClick={handleDelete}
            disabled={!selectedPlanId || loading}
            className="w-full rounded border border-red-600 bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-red-400 hover:bg-red-700"
          >
            Delete Top-Up Plan
          </button>

          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3">
            <p className="text-xs text-yellow-800">
              <strong>Warning:</strong> This will deactivate the top-up plan. Existing purchases will remain active.
            </p>
          </div>

        </div>
      </section>
    </div>
  )
}