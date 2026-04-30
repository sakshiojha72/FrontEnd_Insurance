import React from 'react';
import { Link } from 'react-router-dom';

function FinancePage() {
  // Pretend this comes from login
  const userRole = 'FINANCE';

  return (
    <div className="space-y-8 p-6">

      <Link
        to="/"
        className="inline-block rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
      >
        ← Back
      </Link>

      {/* General Operations */}
      <div className="rounded-md border border-slate-300 bg-white p-5">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">
          General Operations
        </h2>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/finance/bank-management"
            className="rounded-md border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            Bank Management
          </Link>
          <Link
            to="/finance/investment-management"
            className="rounded-md border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            Investment Management
          </Link>
          <Link
            to="/finance/card-management"
            className="rounded-md border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
          >
            Card Management
          </Link>
        </div>
      </div>

      {/* Finance Operations (only for FINANCE role) */}
      {userRole === 'FINANCE' && (
        <div className="rounded-md border border-slate-300 bg-white p-5">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            Finance Operations
          </h2>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/finance/salary-processing"
              className="rounded-md border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              Salary Processing
            </Link>
            <Link
              to="/finance/reports"
              className="rounded-md border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
            >
              Reports
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default FinancePage;