import { money, getLocale } from '../lib/format';
import { useTranslation } from '../hooks/useTranslation';
const PILL = { achieved: 'ok', active: 'ok', today: 'warn', overdue: 'over', 'no-deadline': 'neutral', 'invalid-target': 'over' };
const PILL_KEY = { achieved: 'achieved', active: 'active', today: 'today', overdue: 'overdue', 'no-deadline': 'noDeadline', 'invalid-target': 'invalid' };
const fmtDate = (d) => d.toLocaleDateString(getLocale(), { year: 'numeric', month: 'long', day: 'numeric' }); // d is a local-midnight Date

export default function ContributionPlanner({ goal, plan, onEdit }) {
  const { t } = useTranslation();
  const { status: s, remaining, daysLeft, deadline } = plan; const c = goal.currency;
  const days = (n) => t('plan.days', { count: n });
  const edit = (text) => <button type="button" className="ghost" onClick={() => onEdit(goal)}>{text}</button>;
  const tiles = [['plan.perDay', plan.daily], ['plan.perWeek', plan.weekly], ['plan.perMonth', plan.monthly]];
  return (
    <details className="planner" open>
      <summary><span>{t('plan.title')}</span><span className={'pill ' + PILL[s]}>{t('plan.' + PILL_KEY[s])}</span></summary>
      <div className="planner-body">
        {s === 'achieved' && <p className="planner-msg">{t('plan.msgAchieved')}</p>}
        {s === 'active' && <p className="planner-msg"><b>{t('plan.msgActiveA')}</b>{t('plan.msgActiveB', { date: fmtDate(deadline) })}</p>}
        {s === 'today' && <p className="planner-msg">{t('plan.msgTodayA')}<b>{t('plan.todayWord')}</b>{t('plan.msgTodayB', { amount: money(remaining, c) })}</p>}
        {s === 'overdue' && <p className="planner-msg">{t('plan.msgOverdue', { date: fmtDate(deadline), days: days(plan.overdueDays), amount: money(remaining, c) })}</p>}
        {s === 'no-deadline' && <p className="planner-msg">{t('plan.msgNoDeadline')}</p>}
        {s === 'invalid-target' && <p className="planner-msg">{t('plan.msgInvalid')}</p>}

        {s !== 'invalid-target' && (
          <dl className="planner-facts">
            <div><dt>{t('plan.remaining')}</dt><dd>{money(remaining, c)}</dd></div>
            <div><dt>{t('plan.daysLeft')}</dt><dd>{daysLeft === null ? '—' : daysLeft < 0 ? t('plan.overdueBy', { days: days(plan.overdueDays) }) : daysLeft === 0 ? t('plan.today') : days(daysLeft)}</dd></div>
            <div><dt>{t('plan.deadline')}</dt><dd>{deadline ? fmtDate(deadline) : t('plan.notSet')}</dd></div>
          </dl>
        )}
        {(s === 'active' || s === 'achieved') && (
          <>
            <div className="planner-tiles">{tiles.map(([k, v]) => <div key={k} className={'planner-tile' + (s === 'achieved' ? ' zero' : '')}><span>{t(k)}</span><b>{money(v, c)}</b></div>)}</div>
            {s === 'active' && <p className="planner-note">{t('plan.note')}</p>}
          </>
        )}
        {(s === 'overdue' || s === 'no-deadline' || s === 'invalid-target') && edit(s === 'invalid-target' ? t('plan.editTarget') : t('plan.setDeadline'))}
      </div>
    </details>
  );
}
