// MyTopUpsPage.jsx
// Employee can: view available top-up plans, buy one, and view their purchased top-ups
// GET  /finsecure/insurance/topups/plans  (all available plans)
// POST /finsecure/insurance/topups/buy    (buy a top-up)
// GET  /finsecure/insurance/topups/my     (my purchased top-ups)

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAllTopUpPlans, buyTopUp, getMyTopUps } from './api'

export default function MyTopUpsPage() {
  const [topUpPlans, setTopUpPlans] = useState([])  // available plans from backend
  const [myTopUps, setMyTopUps] = useState([])       // my purchased top-ups

  // Form fields
  const [planId, setPlanId] = useState('')
  const [expiry, setExpiry] = useState('')

  // UI feedback
  const [msg, setMsg] = useState('')
  const [isError, setIsError] = useState(false)

  // Load data on page mount
  useEffect(() => {
    getAllTopUpPlans().then(setTopUpPlans).catch(e => {
      console.warn('Failed to load top-up plans:', e.message)
      setTopUpPlans([])
    })
    getMyTopUps().then(setMyTopUps).catch(e => {
      console.warn('Failed to load my top-ups:', e.message)
      setMyTopUps([])
    })
  }, [])

  async function handleBuy() {
    setMsg(''); setIsError(false)
    try {
      await buyTopUp(Number(planId), expiry)
      setMsg('Top-up purchased successfully!')
      setPlanId(''); setExpiry('')
      // Refresh my top-ups list
      getMyTopUps().then(setMyTopUps).catch(() => {})
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
        <h1 className="text-2xl font-semibold text-slate-900">Top-Up Plans</h1>
        <p className="mt-1 text-sm text-slate-600">Enhance your coverage by purchasing a top-up plan.</p>
      </div>

      {/* ── Available Top-Up Plans Table ─────────────────────────────────── */}
      <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Available Top-Up Plans</h2>
        {topUpPlans.length === 0 ? (
          <p className="text-sm text-slate-500">No top-up plans available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100">
                  {['Plan ID', 'Name', 'Extra Coverage', 'Price'].map(h => (
                    <th key={h} className="border border-slate-200 px-3 py-2 text-left font-medium text-slate-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topUpPlans.map((p, i) => (
                  <tr key={p.topUpPlanId ?? p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    {/* Use topUpPlanId — that's the field name from your backend */}
                    <td className="border border-slate-200 px-3 py-2">{p.topUpPlanId ?? p.id}</td>
                    <td className="border border-slate-200 px-3 py-2">{p.topUpName}</td>
                    <td className="border border-slate-200 px-3 py-2">₹{p.additionalCoverage}</td>
                    <td className="border border-slate-200 px-3 py-2">₹{p.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── Buy a Top-Up Form ─────────────────────────────────────────────── */}
      <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Buy a Top-Up</h2>
        <div className="space-y-3">

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Top-Up Plan ID
            </label>
            <input
              type="number"
              value={planId}
              onChange={e => setPlanId(e.target.value)}
              placeholder="Enter plan ID from the table above"
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Expiry Date
            </label>
            <input
              type="date"
              value={expiry}
              onChange={e => setExpiry(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none"
            />
          </div>

          <button
            type="button"
            onClick={handleBuy}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Buy Top-Up
          </button>

          {msg && (
            <p className={`text-sm ${isError ? 'text-red-600' : 'text-green-600'}`}>{msg}</p>
          )}
        </div>
      </section>

      {/* ── My Purchased Top-Ups ─────────────────────────────────────────── */}
      <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">My Top-Ups</h2>
        {myTopUps.length === 0 ? (
          <p className="text-sm text-slate-500">You have not purchased any top-ups yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100">
                  {['Name', 'Extra Coverage', 'Expiry', 'Status'].map(h => (
                    <th key={h} className="border border-slate-200 px-3 py-2 text-left font-medium text-slate-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {myTopUps.map((t, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border border-slate-200 px-3 py-2">{t.topUpName}</td>
                    <td className="border border-slate-200 px-3 py-2">₹{t.additionalCoverage}</td>
                    <td className="border border-slate-200 px-3 py-2">{t.expiryDate}</td>
                    <td className="border border-slate-200 px-3 py-2">{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}