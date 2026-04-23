// CreateTopUpPlanPage.jsx
// ADMIN only: create a new top-up plan
// POST /finsecure/insurance/topups/plans

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { createTopUpPlan } from './api'

export default function CreateTopUpPlanPage() {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [cost, setCost] = useState('')
  const [coverageAmount, setCoverageAmount] = useState('')
  const [msg, setMsg] = useState('')
  const [isError, setIsError] = useState(false)

  async function handleCreate() {
    setMsg(''); setIsError(false)
    try {
      await createTopUpPlan(name, description, Number(cost), Number(coverageAmount))
      setMsg('Top-up plan created successfully!')
      setName(''); setDescription(''); setCost(''); setCoverageAmount('')
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
        <h1 className="text-2xl font-semibold text-slate-900">Create Top-Up Plan</h1>
        <p className="mt-1 text-sm text-slate-600">Add a new top-up coverage plan for employees.</p>
      </div>

      <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
        <div className="space-y-4">

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Plan Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Extra ₹50k Coverage"
              className="w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe the top-up coverage benefits"
              rows={3}
              className="w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Cost (₹)</label>
              <input
                type="number"
                value={cost}
                onChange={e => setCost(e.target.value)}
                placeholder="e.g., 2000"
                className="w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Coverage Amount (₹)</label>
              <input
                type="number"
                value={coverageAmount}
                onChange={e => setCoverageAmount(e.target.value)}
                placeholder="e.g., 50000"
                className="w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-slate-500"
                required
              />
            </div>
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
            onClick={handleCreate}
            disabled={!name || !description || !cost || !coverageAmount}
            className="w-full rounded border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            Create Top-Up Plan
          </button>

        </div>
      </section>
    </div>
  )
}