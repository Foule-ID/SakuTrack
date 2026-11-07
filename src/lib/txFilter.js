// Transaction type filter shared by views that need it. Same four options as the Transactions page dropdown.
export const TYPE_FILTERS = [['all', 'All'], ['income', 'Income'], ['expense', 'Expenses'], ['exchange', 'Exchange']];
export const matchType = (t, filter) => filter === 'all' || t.type === filter;
