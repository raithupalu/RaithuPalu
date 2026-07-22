import React from 'react';
import { motion } from 'framer-motion';
import { useAdminDashboard } from '../../hooks/useAdminDashboard';
import { PageError } from '../../components/PageState';
import { DashboardSkeleton } from '../../components/Skeleton';
import DataTable from '../../components/DataTable';
import './AdminPages.css';
import PageHeader from '../../components/PageHeader';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

const AdminDashboard = () => {
  const { data, isPending, isError, error, refetch } = useAdminDashboard();

  if (isPending) {
    return <DashboardSkeleton />;
  }

  if (isError) {
    return (
      <div className="admin-page admin-page--centered">
        <PageError
          title="Dashboard unavailable"
          message={error?.message || 'Check your connection and try again.'}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const { stats, recentOrders } = data;

  return (
    <div className="admin-page">
      <PageHeader title="Dashboard" subtitle="Operations overview — data refreshes when you revisit this page" />

      <motion.section
        className="stats-grid stats-grid--dashboard"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        aria-label="Key metrics"
      >
        <motion.div variants={itemVariants} className="ds-stat-card">
          <div className="stat-icon" aria-hidden>👥</div>
          <div className="stat-content">
            <p className="stat-label">Customers</p>
            <h2 className="stat-value">{stats.totalCustomers}</h2>
          </div>
          <div className="stat-accent-line" />
        </motion.div>

        <motion.div variants={itemVariants} className="ds-stat-card">
          <div className="stat-icon" aria-hidden>🥛</div>
          <div className="stat-content">
            <p className="stat-label">Today&apos;s milk</p>
            <h2 className="stat-value">{stats.todayMilk} L</h2>
          </div>
          <div className="stat-accent-line" />
        </motion.div>

        <motion.div variants={itemVariants} className="ds-stat-card">
          <div className="stat-icon" aria-hidden>💰</div>
          <div className="stat-content">
            <p className="stat-label">Collected this month</p>
            <h2 className="stat-value">₹{Number(stats.monthlyRevenue).toLocaleString('en-IN')}</h2>
          </div>
          <div className="stat-accent-line" />
        </motion.div>

        <motion.div variants={itemVariants} className="ds-stat-card">
          <div className="stat-icon" aria-hidden>📦</div>
          <div className="stat-content">
            <p className="stat-label">Pending orders</p>
            <h2 className="stat-value">{stats.pendingOrders}</h2>
          </div>
          <div className="stat-accent-line" />
        </motion.div>

        <motion.div variants={itemVariants} className="ds-stat-card">
          <div className="stat-icon" aria-hidden>📋</div>
          <div className="stat-content">
            <p className="stat-label">Total expenses</p>
            <h2 className="stat-value">₹{Number(stats.totalExpenses).toLocaleString('en-IN')}</h2>
          </div>
          <div className="stat-accent-line" />
        </motion.div>
      </motion.section>

      <motion.section
        className="premium-card dashboard-orders-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.45 }}
        aria-labelledby="recent-orders-heading"
      >
        <div className="table-header">
          <h2 id="recent-orders-heading" className="table-title">
            Recent orders
          </h2>
        </div>

        <DataTable
          data={recentOrders}
          emptyMessage="No orders yet"
          animate={false}
          columns={[
            { label: 'ID', key: 'orderId', className: 'order-id', render: (_, row) => row._id?.slice(-8) || '—' },
            { label: 'Customer', key: 'customer', className: 'customer-name', render: (_, row) => row.userId?.username || '—' },
            { label: 'Qty', key: 'quantity', className: 'amount', render: (_, row) => row.quantity ?? '—' },
            {
              label: 'Status',
              render: (_, row) => (
                <span className={`status-badge status-${row.status || 'pending'}`}>
                  {row.status || 'pending'}
                </span>
              ),
            },
            { label: 'Date', key: 'createdAt', className: 'date', render: (_, row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN') : '—') },
          ]}
        />
      </motion.section>
    </div>
  );
};

export default AdminDashboard;
