import { useQuery } from '@tanstack/react-query';
import { milkService, orderService, paymentService, userService, expenseService } from '../services/api';
import { extractListFromResponse } from '../lib/apiNormalize';
import { isoDayPrefix } from '../lib/dates';
import { amountPaid } from '../lib/paymentUtils';

const DASHBOARD_QUERY_KEY = ['admin', 'dashboard'];
const DEFAULT_MILK_LIMIT = 2000;

async function fetchAdminDashboard() {
  const [usersRes, milkRes, ordersRes, paymentsRes, expensesRes] = await Promise.all([
    userService.getAll(),
    milkService.getAll({ limit: DEFAULT_MILK_LIMIT }),
    orderService.getAll(),
    paymentService.getAll(),
    expenseService.getAll(),
  ]);

  const users = extractListFromResponse(usersRes);
  const milk = extractListFromResponse(milkRes);
  const orders = extractListFromResponse(ordersRes);
  const payments = extractListFromResponse(paymentsRes);
  const expenses = extractListFromResponse(expensesRes);

  const today = new Date().toISOString().split('T')[0];
  const todayMilk = milk.reduce((sum, m) => {
    const day = isoDayPrefix(m.date);
    return day === today ? sum + (Number(m.quantity) || 0) : sum;
  }, 0);

  const currentMonthPrefix = new Date().toISOString().slice(0, 7);
  const monthlyRevenue = payments.reduce((sum, p) => {
    if (!p.createdAt) return sum;
    const created = new Date(p.createdAt).toISOString();
    return created.startsWith(currentMonthPrefix) ? sum + amountPaid(p) : sum;
  }, 0);

  const pendingOrders = orders.filter((o) => o.status === 'pending').length;
  const totalExpenses = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  return {
    stats: {
      totalCustomers: users.filter((u) => u.role === 'customer').length,
      todayMilk: todayMilk.toFixed(1),
      monthlyRevenue: monthlyRevenue.toFixed(2),
      pendingOrders,
      totalExpenses: totalExpenses.toFixed(2),
    },
    recentOrders: orders.slice(0, 8),
    // Expose raw data arrays to power client-side AI forecasting and statistical models
    rawData: {
      users,
      milk,
      orders,
      payments,
      expenses
    }
  };
}

export function useAdminDashboard() {
  return useQuery({
    queryKey: DASHBOARD_QUERY_KEY,
    queryFn: fetchAdminDashboard,
  });
}

export function adminDashboardQueryKey() {
  return DASHBOARD_QUERY_KEY;
}