import { money, weekday } from '../lib/format';
export default function TxRow({ t, onEdit, onDelete }) {
  const x = t.type === 'exchange';
  const amt = x ? `${money(t.amount, t.currency)} → ${money(t.to_amount, t.to_currency)}` : (t.type === 'income' ? '+' : '−') + money(t.amount, t.currency);
  return (
    <li className="row">
      <div className="grow">
        <strong>{t.title}</strong>
        <div className="muted small">{t.category}, {t.account} · {weekday(t.date)}, {t.date} {(t.time || '').slice(0, 5)}</div>
        {t.notes && <div className="muted small">{t.notes}</div>}
      </div>
      <div className={'amt ' + (x ? '' : t.type)}>{amt}</div>
      {onEdit && <div className="acts"><button className="ghost" onClick={() => onEdit(t)}>Edit</button><button className="ghost danger" onClick={() => onDelete(t)}>Delete</button></div>}
    </li>
  );
}
