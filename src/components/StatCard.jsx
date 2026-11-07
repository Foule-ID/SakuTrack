// Financial summary card. tone: balance | income | expense | warn | neutral
export default function StatCard({ tone = 'neutral', label, value, children }) {
  return (
    <div className={'stat ' + tone}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {children}
    </div>
  );
}
