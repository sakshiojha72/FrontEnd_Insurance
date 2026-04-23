// CreatePlanPage.jsx
// ADMIN only: create a new insurance plan
// POST /finsecure/insurance/plans

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createPlan } from './api'

export default function CreatePlanPage() {
  const [planName, setPlanName] = useState('')
  const [coverage, setCoverage] = useState('')
  const [description, setDescription] = useState('')
  const [msg, setMsg] = useState('')
  const [isError, setIsError] = useState(false)

  async function handleCreate() {
    setMsg(''); setIsError(false)
    try {
      await createPlan(planName, Number(coverage), description)
      setMsg('Plan created successfully!')
      setPlanName(''); setCoverage(''); setDescription('')
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
        <h1 className="text-2xl font-semibold text-slate-900">Create Insurance Plan</h1>
        <p className="mt-1 text-sm text-slate-600">Add a new insurance plan for employees.</p>
      </div>

      <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
        <div className="space-y-3">

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Plan Name</label>
            <input
              type="text"
              value={planName}
              onChange={e => setPlanName(e.target.value)}
              placeholder="e.g. Basic Health Plan"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Coverage Amount (₹)</label>
            <input
              type="number"
              value={coverage}
              onChange={e => setCoverage(e.target.value)}
              placeholder="e.g. 500000"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description (optional)</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Brief description of the plan"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleCreate}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Create Plan
          </button>

          {msg && (
            <p className={`text-sm ${isError ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>
          )}
        </div>
      </section>
    </div>
  )
}