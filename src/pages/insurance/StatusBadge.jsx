// reusable component that shows status of insurance 


export default function StatusBadge({ status, daysUntilExpiry }) {

  let classes = ''
  let label = ''

  if (status === 'ACTIVE') {
    classes = 'bg-green-100 text-green-800 border border-green-300'
    label = 'Active'

  } else if (status === 'EXPIRING_SOON') {
    classes = 'bg-yellow-100 text-yellow-800 border border-yellow-400'
    // Show how many days are left  
    label = daysUntilExpiry != null
      ? `Expiring in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`
      : 'Expiring Soon'

  } else if (status === 'EXPIRED') {
    classes = 'bg-red-100 text-red-800 border border-red-300'
    label = 'Expired'

  } else {
    // if status is null or something unexpected
    classes = 'bg-gray-100 text-gray-600 border border-gray-300'
    label = status || 'Unknown'
  }

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${classes}`}>
      {label}
    </span>
  )
}