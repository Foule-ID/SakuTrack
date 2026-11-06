export default function EmptyState({ art, title, text, compact }) {
  return (
    <div className={'empty' + (compact ? ' compact' : '')}>
      <img src={art} alt="" />
      <strong>{title}</strong>
      <p className="muted small">{text}</p>
    </div>
  );
}
