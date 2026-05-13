import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../insurance/api'

export default function LoginPage() {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Check if already logged in and redirect
  useEffect(() => {
    if (localStorage.getItem('jwt_token')) {
      navigate('/insurance', { replace: true })
    }
  }, [navigate])

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Call backend login endpoint — expects response: { token: "eyJhbGc..." }
      const data = await login(username, password)

      if (!data || !data.token) {
        throw new Error('Invalid response from server: missing token')
      }

      // Extract JWT payload (middle part between dots)
      const payload = JSON.parse(atob(data.token.split('.')[1]))

      // Normalize role from JWT payload in case backend uses role array or ROLE_ prefix
      const rawRole = payload.role || payload.roles?.[0] || payload.authorities?.[0] || data.role || data.roles?.[0] || ''
      let normalizedRole = String(rawRole || '')
        .toUpperCase()
        .replace(/^ROLE_/, '')
        .replace(/[^A-Z_]/g, '')

      const subject = String(payload.sub || data.username || username || '').toUpperCase()
      if (!normalizedRole) {
        if (/ADMIN|ADMINISTRATOR|ADM/.test(subject)) normalizedRole = 'ADMIN'
        else if (/HR|HUMANRESOURCE|HUMAN_RESOURCE/.test(subject)) normalizedRole = 'HR'
        else if (/EMP|USER|STAFF|WORKER/.test(subject)) normalizedRole = 'EMPLOYEE'
      }

      const roleToStore = normalizedRole || 'EMPLOYEE'

      // Store authentication data in localStorage
      localStorage.setItem('jwt_token', data.token)
      localStorage.setItem('jwt_role', roleToStore)
      localStorage.setItem('username', subject || username)

      // Redirect to insurance page after successful login
      navigate('/insurance', { replace: true })
    } catch (e) {
      console.error('Login error:', e)
      setError(e.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-2xl font-semibold text-slate-900">LOGIN</h1>
      <form onSubmit={handleLogin} className="mt-6 space-y-4">
        <label className="block space-y-2 text-sm font-medium text-slate-700">
          <span>Username</span>
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="w-full rounded border border-slate-300 px-3 py-2 outline-none"
            required
            disabled={loading}
          />
        </label>
        <label className="block space-y-2 text-sm font-medium text-slate-700">
          <span>Password</span>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full rounded border border-slate-300 px-3 py-2 outline-none"
            required
            disabled={loading}
          />
        </label>
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </section>
  )
}
