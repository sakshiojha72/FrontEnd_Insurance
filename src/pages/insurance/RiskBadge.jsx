// RiskBadge.jsx
// Displays a color-coded pill based on the claim's riskLevel field.
// Usage: <RiskBadge level={claim.riskLevel} />

const RISK_CONFIG = {
  HIGH:   { label: "HIGH RISK",   bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500"    },
  MEDIUM: { label: "MEDIUM RISK", bg: "bg-yellow-100", text: "text-yellow-700", dot: "bg-yellow-500" },
  LOW:    { label: "LOW RISK",    bg: "bg-green-100",  text: "text-green-700",  dot: "bg-green-500"  },
};

export default function RiskBadge({ level }) {
  if (!level) return <span className="text-gray-400 text-xs">N/A</span>;

  const config = RISK_CONFIG[level] ?? RISK_CONFIG["MEDIUM"];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}