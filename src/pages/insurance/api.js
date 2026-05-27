const BASE = '/finsecure'

// ─── AUTH HEADERS ─────────────────────────────────────────────────────────────
// Reads JWT token from localStorage and returns ONLY the headers object.
// Every protected endpoint passes this as { headers: authHeaders() }
// Public endpoints (login/signup) do NOT use this.
function authHeaders() {
  const token = localStorage.getItem("jwt_token") // must match key used in login
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }), // only added if token exists
  }
}

// ─── GENERIC FETCH WRAPPER ────────────────────────────────────────────────────
// Sends the request, checks for errors, returns parsed JSON (or null for plain text).
// Throws a readable error message if the response is not OK.
async function call(url, options = {}) {
  const res = await fetch(url, options)
  const contentType = res.headers.get('content-type') || ''

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || res.statusText)
  }

  // Some endpoints return plain text (not JSON) — return null for those
  if (!contentType.includes('application/json')) {
    return null
  }

  return res.json()
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
// POST /finsecure/public/login  →  { token, username, isValid }
// No authHeaders() here — login is a public endpoint
export function login(username, password) {
  return call(`${BASE}/public/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
}

// ─── INSURANCE PLANS ─────────────────────────────────────────────────────────

// GET  /finsecure/insurance/plans  →  list of all plans  (ADMIN / HR)
export function getAllPlans() {
  return call(`${BASE}/insurance/plans`, { headers: authHeaders() })
}

// POST /finsecure/insurance/plans  →  create a new plan  (ADMIN)
export function createPlan(plan) {
  return call(`${BASE}/insurance/plans`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(plan),
  })
}

// DELETE /finsecure/insurance/plans/{id}  →  deactivate a plan  (ADMIN)
// FIX: backend now returns DeactivatePlanResponseDTO (JSON), not plain text
// so we use the normal call() which parses JSON correctly
export function deletePlan(planId) {
  return call(`${BASE}/insurance/plans/${planId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}

// PUT /finsecure/insurance/plans/{id}/set-default  →  mark plan as fallback default  (ADMIN)
// Backend clears old default automatically before setting the new one
// Only one plan can be default at a time
export function setDefaultPlan(planId) {
  return call(`${BASE}/insurance/plans/${planId}/set-default`, {
    method: 'PUT',
    headers: authHeaders(),
  })
}

// POST /finsecure/insurance/plans/assign  →  assign plan to employee  (ADMIN)
export function assignInsurance(employeeId, planId, expiryDate) {
  return call(`${BASE}/insurance/plans/assign`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ employeeId, planId, expiryDate }),
  })
}

// GET /finsecure/insurance/plans/employee/{id}  →  any employee's insurance  (ADMIN / HR)
export function getEmployeeInsurance(employeeId) {
  return call(`${BASE}/insurance/plans/employee/${employeeId}`, { headers: authHeaders() })
}

// PUT /finsecure/insurance/plans/renew/{id}  →  renew expired insurance  (ADMIN)
export function renewInsurance(insuranceId, newExpiryDate) {
  return call(`${BASE}/insurance/plans/renew/${insuranceId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ expiryDate: newExpiryDate }),
  })
}

// GET /finsecure/employee/employees  →  all employees  (ADMIN / HR)
export function getAllEmployees() {
  return call(`${BASE}/employee/employees`, { headers: authHeaders() })
}

// ─── MY INSURANCE (EMPLOYEE) ─────────────────────────────────────────────────

// GET /finsecure/insurance/plans/my  →  logged-in employee's own insurance record
export function getMyInsurance() {
  return call(`${BASE}/insurance/plans/my`, { headers: authHeaders() })
}

// ─── CLAIMS ──────────────────────────────────────────────────────────────────

// POST /finsecure/insurance/claims  →  raise a claim  (EMPLOYEE)
export function raiseClaim(employeeInsuranceId, claimAmount, reason) {
  return call(`${BASE}/insurance/claims`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ employeeInsuranceId, claimAmount, reason }),
  })
}

// GET /finsecure/insurance/claims/my  →  employee's own claims  (EMPLOYEE)
export function getMyClaims() {
  return call(`${BASE}/insurance/claims/my`, { headers: authHeaders() })
}

// GET /finsecure/insurance/claims?status=X  →  all claims with optional filter  (ADMIN / HR)
export function getAllClaims(status, page = 0, size = 10) {
  const params = new URLSearchParams()
  if (status) params.append('status', status)
  params.append('page', page)
  params.append('size', size)
  return call(`${BASE}/insurance/claims?${params}`, { headers: authHeaders() })
}

// GET /finsecure/insurance/claims/employee/{id}  →  specific employee's claims  (ADMIN / HR)
export function getEmployeeClaims(employeeId) {
  return call(`${BASE}/insurance/claims/employee/${employeeId}`, { headers: authHeaders() })
}

// PUT /finsecure/insurance/claims/status  →  approve or reject a claim  (ADMIN)
export function updateClaimStatus(claimId, status, adminRemarks) {
  return call(`${BASE}/insurance/claims/status`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({ claimId, status, adminRemarks }),
  })
}

// ─── TOP-UPS ─────────────────────────────────────────────────────────────────

// POST /finsecure/insurance/topups/plans  →  create a top-up plan  (ADMIN)
export function createTopUpPlan(name, description, cost, coverageAmount) {
  return call(`${BASE}/insurance/topups/plans`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      topUpName: name,
      description: description,
      price: cost,
      additionalCoverage: coverageAmount,
    }),
  })
}

// GET /finsecure/insurance/topups/plans  →  all top-up plans  (ADMIN / HR / EMPLOYEE)
export function getAllTopUpPlans() {
  return call(`${BASE}/insurance/topups/plans`, { headers: authHeaders() })
}

// DELETE /finsecure/insurance/topups/plans/{id}  →  deactivate top-up plan  (ADMIN)
// NOTE: TopUp delete returns plain text — using res.text() to avoid JSON parse crash
export async function deleteTopUpPlan(planId) {
  const res = await fetch(`${BASE}/insurance/topups/plans/${planId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || 'Failed to delete top-up plan')
  }
  return null
}

// POST /finsecure/insurance/topups/buy  →  employee buys a top-up  (EMPLOYEE)
export function buyTopUp(topUpPlanId, expiryDate) {
  return call(`${BASE}/insurance/topups/buy`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ topUpPlanId, expiryDate }),
  })
}

// GET /finsecure/insurance/topups/my  →  employee's own top-ups  (EMPLOYEE)
export function getMyTopUps() {
  return call(`${BASE}/insurance/topups/my`, { headers: authHeaders() })
}

// GET /finsecure/insurance/topups/employee/{id}  →  any employee's top-ups  (ADMIN / HR)
export function getEmployeeTopUps(employeeId) {
  return call(`${BASE}/insurance/topups/employee/${employeeId}`, { headers: authHeaders() })
}

// ─── REPORTS ─────────────────────────────────────────────────────────────────

// GET /finsecure/insurance/reports/with-topup?page=0&size=10
export function getEmployeesWithTopUp(page = 0, size = 10) {
  const params = new URLSearchParams()
  params.append('page', page)
  params.append('size', size)
  return call(`${BASE}/insurance/reports/with-topup?${params}`, { headers: authHeaders() })
}

// GET /finsecure/insurance/reports/no-topup
export function getEmployeesWithoutTopUp() {
  return call(`${BASE}/insurance/reports/no-topup`, { headers: authHeaders() })
}

// GET /finsecure/insurance/reports/assigned-between?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
export function getAssignedBetweenDates(startDate, endDate) {
  const params = new URLSearchParams()
  params.append('startDate', startDate)
  params.append('endDate', endDate)
  return call(`${BASE}/insurance/reports/assigned-between?${params}`, { headers: authHeaders() })
}

// GET /finsecure/insurance/reports/current-financial-year
export function getCurrentFinancialYearReport() {
  return call(`${BASE}/insurance/reports/current-financial-year`, { headers: authHeaders() })
}

// GET /finsecure/insurance/reports/pending-claims?page=0&size=10
export function getPendingClaimsReport(page = 0, size = 10) {
  const params = new URLSearchParams()
  params.append('page', page)
  params.append('size', size)
  return call(`${BASE}/insurance/reports/pending-claims?${params}`, { headers: authHeaders() })
}

// GET /finsecure/insurance/reports/expiring-soon?days=30
export function getExpiringSoonReport(days = 30) {
  const params = new URLSearchParams()
  params.append('days', days)
  return call(`${BASE}/insurance/reports/expiring-soon?${params}`, { headers: authHeaders() })
}

// ─── SUMMARY ─────────────────────────────────────────────────────────────────

// GET /finsecure/insurance/summary/my  →  employee's own full summary  (EMPLOYEE)
export function getMySummary() {
  return call(`${BASE}/insurance/summary/my`, { headers: authHeaders() })
}

// GET /finsecure/insurance/summary/{id}  →  any employee's summary  (ADMIN / HR)
export function getEmployeeSummary(employeeId) {
  return call(`${BASE}/insurance/summary/${employeeId}`, { headers: authHeaders() })
}