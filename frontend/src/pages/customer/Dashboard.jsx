import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { milkService, orderService, paymentService } from '../../services/api';
import { extractListFromResponse } from '../../lib/apiNormalize';
import { milkEntriesFromResponse } from '../../lib/milkResponse';
import { milkLineRate, milkLineAmount } from '../../lib/milkEntryDisplay';
import { isoMonthPrefix } from '../../lib/dates';
import { amountPending } from '../../lib/paymentUtils';
import { PageLoading, PageError } from '../../components/PageState';
import DataTable from '../../components/DataTable';
import './CustomerPages.css';
import PageHeader from '../../components/PageHeader';

const customerDashKey = ['customer', 'dashboard'];

const CustomerDashboard = () => {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: customerDashKey,
    queryFn: async () => {
      const [milkRes, ordersRes, paymentsRes] = await Promise.all([
        milkService.getMyMilk(),
        orderService.getUserOrders(),
        paymentService.getUserPayments(),
      ]);

      const milk = milkEntriesFromResponse(milkRes);
      const orders = extractListFromResponse(ordersRes);
      const payments = extractListFromResponse(paymentsRes);

      const totalMilk = milk.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);
      const totalEarnings = milk.reduce((sum, m) => sum + milkLineAmount(m), 0);

      const monthPrefix = new Date().toISOString().slice(0, 7);
      const thisMonth = milk
        .filter((m) => isoMonthPrefix(m.date) === monthPrefix)
        .reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);

      const pendingPayments = payments.reduce((sum, p) => sum + amountPending(p), 0);
      const activeOrders = orders.filter(
        (o) => o.status === 'pending' || o.status === 'confirmed'
      ).length;

      const recentMilk = milk.slice(0, 5);

      return {
        stats: { totalMilk, thisMonth, pendingPayments, activeOrders, totalEarnings },
        recentMilk,
      };
    },
  });

  if (query.isPending) {
    return (
      <div className="customer-loading customer-loading--padded">
        <PageLoading label="Loading your dashboard…" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="customer-loading customer-loading--padded">
        <PageError title="Could not load dashboard" onRetry={() => query.refetch()} />
      </div>
    );
  }

  const { stats, recentMilk } = query.data;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
  };

  return (
    <motion.div
      className="customer-dashboard"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <PageHeader title={`Welcome, ${user?.username || ''}`} subtitle="Your milk and billing snapshot" />

      <motion.div className="stats-grid" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="ds-stat-card">
          <div className="stat-icon">🥛</div>
          <div className="stat-content">
            <p className="stat-label">Total supplied</p>
            <h2 className="stat-value">
              {stats.totalMilk.toFixed(1)}
              <span className="stat-unit">L</span>
            </h2>
          </div>
          <div className="stat-accent-line" />
        </motion.div>

        <motion.div variants={itemVariants} className="ds-stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <p className="stat-label">This month</p>
            <h2 className="stat-value">
              {stats.thisMonth.toFixed(1)}
              <span className="stat-unit">L</span>
            </h2>
          </div>
          <div className="stat-accent-line" />
        </motion.div>

        <motion.div variants={itemVariants} className="ds-stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <p className="stat-label">At recorded rates</p>
            <h2 className="stat-value">₹{stats.totalEarnings.toFixed(0)}</h2>
          </div>
          <div className="stat-accent-line" />
        </motion.div>

        <motion.div variants={itemVariants} className="ds-stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <p className="stat-label">Outstanding bills</p>
            <h2 className="stat-value">₹{stats.pendingPayments.toFixed(0)}</h2>
          </div>
          <div className="stat-accent-line" />
        </motion.div>

        <motion.div variants={itemVariants} className="ds-stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <p className="stat-label">Open orders</p>
            <h2 className="stat-value">{stats.activeOrders}</h2>
          </div>
          <div className="stat-accent-line" />
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants} className="recent-milk-card">
        <div className="card-header">
          <h3 className="card-title">Recent milk</h3>
          <Link to="/customer/milk" className="card-link">
            View all →
          </Link>
        </div>

        <DataTable
          data={recentMilk}
          emptyMessage="No milk entries yet."
          animate={false}
          columns={[
            {
              label: 'Date',
              key: 'date',
              className: 'date-cell',
              render: (value) => (value ? new Date(value).toLocaleDateString('en-IN') : '—'),
            },
            { label: 'Qty', key: 'quantity', className: 'qty-cell', render: (value) => `${Number(value).toFixed(2)} L` },
            { label: 'Session', key: 'session', render: (value) => value || '—' },
            { label: 'Rate/L', className: 'rate-cell', render: (_, row) => `₹${milkLineRate(row).toFixed(2)}` },
            { label: 'Amount', className: 'amount-cell', render: (_, row) => `₹${milkLineAmount(row).toFixed(2)}` },
          ]}
        />
      </motion.div>
    </motion.div>
  );
};

export default CustomerDashboard;
