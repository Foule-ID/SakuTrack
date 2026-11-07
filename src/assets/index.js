// Central registry for image assets. Pages import from here, never from file paths.
import iconDark from './brand/logo-icon-dark.png';
import wordmark from './brand/logo-wordmark-dark.png';

import navDashboard from './icons/navigation/nav-dashboard.png';
import navTransactions from './icons/navigation/nav-transactions.png';
import navStatistics from './icons/navigation/nav-statistics.png';
import navBudget from './icons/navigation/nav-budget-planner.png';
import navSavings from './icons/navigation/nav-savings-goals.png';
import navSettings from './icons/navigation/nav-settings.png';
import navCalendar from './icons/navigation/nav-calendar.png';
import navCalendarOn from './icons/navigation/nav-calendar-active.png';
import calendarArt from './icons/features/feature-transaction-calendar.png';
import navDashboardOn from './icons/navigation/nav-dashboard-active.png';
import navTransactionsOn from './icons/navigation/nav-transactions-active.png';
import navStatisticsOn from './icons/navigation/nav-statistics-active.png';
import navBudgetOn from './icons/navigation/nav-budget-planner-active.png';
import navSavingsOn from './icons/navigation/nav-savings-goals-active.png';
import navSettingsOn from './icons/navigation/nav-settings-active.png';

import catFood from './icons/categories/category-food.png';
import catTransport from './icons/categories/category-transport.png';
import catShopping from './icons/categories/category-shopping.png';
import catEntertainment from './icons/categories/category-entertainment.png';
import catEducation from './icons/categories/category-education.png';
import catHealth from './icons/categories/category-health.png';
import catBills from './icons/categories/category-bills.png';
import catGift from './icons/categories/category-gift.png';
import catOther from './icons/categories/category-other.png';

import stOk from './icons/status/status-on-track.png';
import stWarn from './icons/status/status-near-limit.png';
import stOver from './icons/status/status-over-budget.png';

import pageDashboard from './illustrations/pages/page-dashboard.png';
import pageStatistics from './illustrations/pages/page-statistics.png';
import pageBudget from './illustrations/pages/page-budget-planner.png';
import pageSavings from './illustrations/pages/page-savings-goals.png';
import emptyTx from './illustrations/empty-states/empty-no-transactions.png';
import emptyBudgets from './illustrations/empty-states/empty-no-budgets.png';
import emptyGoals from './illustrations/empty-states/empty-no-goals.png';
import heroManage from './illustrations/hero/hero-manage-finances.png';
import heroBudget from './illustrations/hero/hero-set-budget.png';
import heroGoal from './illustrations/hero/hero-reach-savings-goal.png';
import authArt from './illustrations/auth/auth-secure-login.png';
import sprig from './backgrounds/decor-leaf-sprig.png';

export const BRAND = { icon: iconDark, wordmark };
export const NAV_ICONS = {
  '/': [navDashboard, navDashboardOn], '/transactions': [navTransactions, navTransactionsOn], '/statistics': [navStatistics, navStatisticsOn], '/calendar': [navCalendar, navCalendarOn],
  '/budgets': [navBudget, navBudgetOn], '/savings': [navSavings, navSavingsOn], '/settings': [navSettings, navSettingsOn],
};
const CATEGORY_ICONS = { Food: catFood, Transportation: catTransport, Shopping: catShopping, Entertainment: catEntertainment, Education: catEducation, Health: catHealth, Bills: catBills, Gift: catGift, Other: catOther };
export const categoryIcon = (c) => CATEGORY_ICONS[c] || catOther; // Salary, Allowance, Freelance and Exchange have no matching icon, so they use the neutral one
export const STATUS_ICONS = { ok: stOk, warn: stWarn, over: stOver };
export const PAGE_ART = { dashboard: pageDashboard, statistics: pageStatistics, budgets: pageBudget, savings: pageSavings };
export const EMPTY_ART = { transactions: emptyTx, budgets: emptyBudgets, goals: emptyGoals };
export const HERO_ART = { manage: heroManage, budget: heroBudget, goal: heroGoal };
export const AUTH_ART = authArt;
export const CALENDAR_ART = calendarArt;
export const DECOR = { sprig };
