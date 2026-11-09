// Transaction type filter shared by views that need it. Same four options as the Transactions page dropdown.
// Each entry is [filter value, translation key for its label].
export const TYPE_FILTERS = [['all', 'type.all'], ['income', 'type.income'], ['expense', 'type.expenses'], ['exchange', 'type.exchange']];
export const matchType = (t, filter) => filter === 'all' || t.type === filter;
