import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { milkService } from '../../services/api';
import { milkEntriesFromResponse } from '../../lib/milkResponse';
import { milkLineRate, milkLineAmount } from '../../lib/milkEntryDisplay';
import { isoDayPrefix, isoMonthPrefix } from '../../lib/dates';
import { PageLoading, PageError } from '../../components/PageState';
import './CustomerPages.css';
import PageHeader from '../../components/PageHeader';

const customerChartKey = ['customer', 'milk-chart'];

const ChartPage = () => {
  const query = useQuery({
    queryKey: customerChartKey,
    queryFn: async () => milkEntriesFromResponse(await milkService.getMyMilk()),
  });

  const { last7Days, last6Months, maxQty, totals } = useMemo(() => {
    const milkData = query.data ?? [];
    const days = [];
    for (let i = 6; i >= 0; i -= 1) {
      const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = milkData.filter((m) => isoDayPrefix(m.date) === dateStr);
      const quantity = dayData.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);
      days.push({
        date: dateStr,
        label: date.toLocaleDateString('en-IN', { weekday: 'short' }),
        quantity,
      });
    }

    const months = [];
    for (let i = 5; i >= 0; i -= 1) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().slice(0, 7);
      const monthData = milkData.filter((m) => isoMonthPrefix(m.date) === monthStr);
      const quantity = monthData.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);
      const amount = monthData.reduce((sum, m) => sum + milkLineAmount(m), 0);
      months.push({
        month: monthStr,
        label: date.toLocaleDateString('en-IN', { month: 'short' }),
        quantity,
        amount,
      });
    }

    const maxQ = Math.max(...days.map((d) => d.quantity), 1);
    const totalQty = milkData.reduce((s, m) => s + (Number(m.quantity) || 0), 0);
    const totalEarnings = milkData.reduce((s, m) => s + milkLineAmount(m), 0);
    const avgRate =
      milkData.length > 0
        ? milkData.reduce((s, m) => s + milkLineRate(m), 0) / milkData.length
        : 0;

    return {
      last7Days: days,
      last6Months: months,
      maxQty: maxQ,
      totals: { totalQty, totalEarnings, avgRate, count: milkData.length },
    };
  }, [query.data]);

  if (query.isPending) {
    return (
      <div className="customer-page customer-loading--padded">
        <PageLoading label="Loading analytics…" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="customer-page customer-loading--padded">
        <PageError title="Could not load chart data" onRetry={() => query.refetch()} />
      </div>
    );
  }

  return (
    <div className="customer-page fade-in">
      <PageHeader title="Analytics" subtitle="Milk volume trends from your records" />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="ds-glass chart-card"
      >
        <h3 className="chart-card__title">Last 7 days (L)</h3>
        <div className="chart-bars">
          {last7Days.map((day, i) => (
            <div key={day.date} className="chart-bar-col">
              <motion.div
                className="chart-bar-fill"
                initial={{ height: 0 }}
                animate={{ height: `${(day.quantity / maxQty) * 150}px` }}
                transition={{ delay: i * 0.06, duration: 0.45 }}
              />
              <span className="chart-bar-label">{day.label}</span>
              <span className="chart-bar-value">{day.quantity.toFixed(1)} L</span>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="ds-glass chart-card"
      >
        <h3 className="chart-card__title">Last 6 months</h3>
        <div className="chart-month-grid">
          {last6Months.map((month, i) => (
            <motion.div
              key={month.month}
              className="chart-month-cell"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.05 }}
            >
              <div className="chart-month-label">{month.label}</div>
              <div className="chart-month-qty">{month.quantity.toFixed(0)} L</div>
              <div className="chart-month-amt">₹{month.amount.toFixed(0)}</div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="ds-glass chart-card"
      >
        <h3 className="chart-card__title">Summary</h3>
        <div className="chart-summary-grid">
          <div className="chart-summary-tile">
            <div className="chart-summary-label">Entries</div>
            <div className="chart-summary-value">{totals.count}</div>
          </div>
          <div className="chart-summary-tile">
            <div className="chart-summary-label">Total volume</div>
            <div className="chart-summary-value">{totals.totalQty.toFixed(1)} L</div>
          </div>
          <div className="chart-summary-tile">
            <div className="chart-summary-label">At recorded rate</div>
            <div className="chart-summary-value">₹{totals.totalEarnings.toFixed(0)}</div>
          </div>
          <div className="chart-summary-tile">
            <div className="chart-summary-label">Avg rate</div>
            <div className="chart-summary-value">₹{totals.avgRate.toFixed(2)}</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ChartPage;
