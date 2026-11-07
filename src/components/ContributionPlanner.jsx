import { money } from '../lib/format';
const fmtDate = (d) => d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
const days = (n) => `${n} day${n === 1 ? '' : 's'}`;
const PILL = { achieved: ['ok', 'Goal achieved'], active: ['ok', 'In progress'], today: ['warn', 'Due today'], overdue: ['over', 'Overdue'], 'no-deadline': ['neutral', 'No deadline'], 'invalid-target': ['over', 'Invalid target'] };

export default function ContributionPlanner({ goal, plan, onEdit }) {
  const { status: s, remaining, daysLeft, deadline } = plan; const c = goal.currency;
  const [tone, label] = PILL[s];
  const edit = (text) => <button type="button" className="ghost" onClick={() => onEdit(goal)}>{text}</button>;
  const tiles = [['Per day', plan.daily], ['Per week', plan.weekly], ['Per month', plan.monthly]];
  return (
    <details className="planner" open>
      <summary><span>Contribution Planner</span><span className={'pill ' + tone}>{label}</span></summary>
      <div className="planner-body">
        {s === 'achieved' && <p className="planner-msg">You have reached this savings goal. Nothing more needs to be saved.</p>}
        {s === 'active' && <p className="planner-msg"><b>Your savings goal is progressing!</b> To reach your target before {fmtDate(deadline)}, you should save approximately:</p>}
        {s === 'today' && <p className="planner-msg">The deadline is <b>today</b>. You still need {money(remaining, c)}, so the target has to be completed today.</p>}
        {s === 'overdue' && <p className="planner-msg">This goal passed its deadline ({fmtDate(deadline)}) {days(plan.overdueDays)} ago and {money(remaining, c)} is still needed. Set a new deadline to get a contribution plan.</p>}
        {s === 'no-deadline' && <p className="planner-msg">Set a valid deadline to see how much to save each day, week or month.</p>}
        {s === 'invalid-target' && <p className="planner-msg">Set a target amount above zero to calculate progress and contributions.</p>}

        {s !== 'invalid-target' && (
          <dl className="planner-facts">
            <div><dt>Remaining</dt><dd>{money(remaining, c)}</dd></div>
            <div><dt>Days left</dt><dd>{daysLeft === null ? '—' : daysLeft < 0 ? `Overdue by ${days(plan.overdueDays)}` : daysLeft === 0 ? 'Due today' : days(daysLeft)}</dd></div>
            <div><dt>Deadline</dt><dd>{deadline ? fmtDate(deadline) : 'Not set'}</dd></div>
          </dl>
        )}
        {(s === 'active' || s === 'achieved') && (
          <>
            <div className="planner-tiles">{tiles.map(([t, v]) => <div key={t} className={'planner-tile' + (s === 'achieved' ? ' zero' : '')}><span>{t}</span><b>{money(v, c)}</b></div>)}</div>
            {s === 'active' && <p className="planner-note">Choose one schedule. These are alternatives, not amounts to pay together.</p>}
          </>
        )}
        {(s === 'overdue' || s === 'no-deadline' || s === 'invalid-target') && edit(s === 'invalid-target' ? 'Edit target' : 'Set deadline')}
      </div>
    </details>
  );
}
