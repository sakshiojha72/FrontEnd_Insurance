import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    role: '',
  })

  useEffect(() => {
    const token = localStorage.getItem('jwt_token')
    const role = localStorage.getItem('jwt_role')
    if (!token) {
      navigate('/login')
      return
    }
    // Extract username from JWT if available
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      setProfile({
        username: payload.sub || 'User',
        email: payload.email || 'Not available',
        role: role || 'EMPLOYEE',
      })
    } catch (e) {
      console.warn('Failed to decode token')
    }
  }, [])

  return (
    <div className="space-y-8 p-6">
      <Link
        to="/"
        className="inline-block rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
      >
        ← Back
      </Link>

      <div>
        <h1 className="text-2xl font-semibold text-slate-900">My Profile</h1>
        <p className="mt-1 text-sm text-slate-600">View and manage your account details</p>
      </div>

      <section className="rounded-lg border border-slate-300 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Profile Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-slate-700">Username</label>
            <p className="mt-2 text-lg font-semibold text-slate-900">{profile.username}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Email</label>
            <p className="mt-2 text-lg font-semibold text-slate-900">{profile.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-700">Role</label>
            <p className="mt-2 text-lg font-semibold text-slate-900">{profile.role}</p>
          </div>
        </div>
      </section>
    </div>
  )
}
