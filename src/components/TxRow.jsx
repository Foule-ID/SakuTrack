import { money, fmtDate } from '../lib/format';
import { useTranslation } from '../hooks/useTranslation';
import { categoryIcon } from '../assets';
export default function TxRow({ t, onEdit, onDelete }) {
  const { t: tr, cat, acct } = useTranslation();
  const x = t.type === 'exchange';
  const amt = x ? `${money(t.amount, t.currency)} → ${money(t.to_amount, t.to_currency)}` : (t.type === 'income' ? '+' : '−') + money(t.amount, t.currency);
  return (
    <li className="row">
      <img className="cat-icon" src={categoryIcon(t.category)} alt="" />
      <div className="grow">
        <strong>{t.title}</strong>
        <div className="muted small">{cat(t.category)}, {acct(t.account)} · {fmtDate(t.date)} {(t.time || '').slice(0, 5)}</div>
        {t.notes && <div className="muted small">{t.notes}</div>}
      </div>
      <div className={'amt ' + (x ? '' : t.type)}>{amt}</div>
      {onEdit && <div className="acts"><button className="ghost" onClick={() => onEdit(t)}>{tr('common.edit')}</button><button className="ghost danger" onClick={() => onDelete(t)}>{tr('common.delete')}</button></div>}
    </li>
  );
}
