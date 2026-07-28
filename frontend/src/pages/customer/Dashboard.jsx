import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { milkService, orderService, paymentService, subscriptionService } from '../../services/api';
import { extractListFromResponse } from '../../lib/apiNormalize';
import { milkEntriesFromResponse } from '../../lib/milkResponse';
import { milkLineRate, milkLineAmount } from '../../lib/milkEntryDisplay';
import { isoMonthPrefix } from '../../lib/dates';
import { amountPending } from '../../lib/paymentUtils';
import { PageLoading, PageError } from '../../components/PageState';
import DataTable from '../../components/DataTable';
import Button from '../../components/Button';
import './CustomerPages.css';
import PageHeader from '../../components/PageHeader';

const customerDashKey = ['customer', 'dashboard'];
const subscriptionQueryKey = ['customer', 'subscription'];

const CustomerDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [quantity, setQuantity] = useState(1);
  const [timeSlot, setTimeSlot] = useState('morning');
  const [frequency, setFrequency] = useState('daily');
  const [editingSub, setEditingSub] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  // Fetch dashboard stats
  const dashboardQuery = useQuery({
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

  // Fetch subscription defaults
  const subscriptionQuery = useQuery({
    queryKey: subscriptionQueryKey,
    queryFn: async () => {
      const response = await subscriptionService.getMy();
      const sub = response.data;
      if (sub) {
        setQuantity(sub.quantity);
        setTimeSlot(sub.timeSlot);
        setFrequency(sub.frequency);
      }
      return sub;
    }
  });

  // Mutation to toggle vacation mode
  const toggleVacationMutation = useMutation({
    mutationFn: (isActive) => subscriptionService.toggleVacation(isActive),
    onSuccess: (data) => {
      queryClient.setQueryData(subscriptionQueryKey, data.data.subscription);
      setStatusMsg({
        type: 'success',
        text: data.data.message
      });
      setTimeout(() => setStatusMsg(null), 4000);
    }
  });

  // Mutation to save subscription changes
  const saveSubMutation = useMutation({
    mutationFn: (payload) => subscriptionService.update(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(subscriptionQueryKey, data.data.subscription);
      setEditingSub(false);
      setStatusMsg({
        type: 'success',
        text: 'Delivery subscription plan updated successfully!'
      });
      setTimeout(() => setStatusMsg(null), 4000);
    }
  });

  const handleToggleVacation = () => {
    const isCurrentlyActive = subscriptionQuery.data?.isActive ?? true;
    toggleVacationMutation.mutate(!isCurrentlyActive);
  };

  const handleSaveSubscription = (e) => {
    e.preventDefault();
    saveSubMutation.mutate({
      quantity,
      timeSlot,
      frequency
    });
  };

  if (dashboardQuery.isPending || subscriptionQuery.isPending) {
    return (
      <div className="customer-loading customer-loading--padded">
        <PageLoading label="Loading your dashboard…" />
      </div>
    );
  }

  if (dashboardQuery.isError) {
    return (
      <div className="customer-loading customer-loading--padded">
        <PageError title="Could not load dashboard" onRetry={() => dashboardQuery.refetch()} />
      </div>
    );
  }

  const { stats, recentMilk } = dashboardQuery.data;
  const isVacationMode = !(subscriptionQuery.data?.isActive ?? true);

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
      style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
    >
      <PageHeader title={`Welcome, ${user?.username || ''}`} subtitle="Your milk and billing snapshot" />

      {/* VACATION MODE & SUBSCRIPTION PLAN CARD */}
      <motion.section variants={itemVariants} className="page-card" style={{ padding: '24px', border: isVacationMode ? '1px solid #fca5a5' : '1px solid rgba(76,175,80,0.15)', background: isVacationMode ? 'rgba(239, 68, 68, 0.02)' : 'rgba(76, 175, 80, 0.01)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: isVacationMode ? '#dc2626' : '#2d5f3f', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{isVacationMode ? '🌴' : '📅'}</span> 
              <span>{isVacationMode ? 'Vacation Mode Active' : 'Daily Delivery Subscription'}</span>
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--ds-text-muted)', lineHeight: '1.5' }}>
              {isVacationMode 
                ? 'Your daily morning/evening milk subscription deliveries are temporarily suspended. We hope you have a great holiday!' 
                : `Active plan: ${subscriptionQuery.data?.quantity || 1}L delivered ${subscriptionQuery.data?.frequency || 'daily'} during ${subscriptionQuery.data?.timeSlot === 'morning' ? 'Morning 🌅' : 'Evening 🌆'} slot.`
              }
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Button
              variant={isVacationMode ? 'primary' : 'secondary'}
              onClick={handleToggleVacation}
              disabled={toggleVacationMutation.isPending}
              style={{ background: isVacationMode ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white', border: 'none' }}
            >
              {isVacationMode ? '☀️ Resume Deliveries' : '🌴 Pause Deliveries (Vacation)'}
            </Button>
            
            {!isVacationMode && (
              <Button
                variant="secondary"
                onClick={() => setEditingSub(!editingSub)}
              >
                {editingSub ? '✕ Close' : '⚙️ Edit Plan'}
              </Button>
            )}
          </div>
        </div>

        {/* Edit Subscription Panel */}
        {editingSub && !isVacationMode && (
          <motion.form 
            onSubmit={handleSaveSubscription}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--ds-border)', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr) auto', gap: '16px', alignItems: 'flex-end' }}
          >
            <div className="form-group-custom">
              <label className="form-label-custom" style={{ fontSize: '0.8rem' }}>Default Quantity (Liters)</label>
              <input 
                type="number" 
                step="0.25" 
                className="form-input-custom"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="0.25" 
                max="50"
                required
              />
            </div>

            <div className="form-group-custom">
              <label className="form-label-custom" style={{ fontSize: '0.8rem' }}>Time Slot</label>
              <select 
                className="form-select-custom"
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
              >
                <option value="morning">Morning (6 AM - 9 AM)</option>
                <option value="evening">Evening (4 PM - 7 PM)</option>
              </select>
            </div>

            <div className="form-group-custom">
              <label className="form-label-custom" style={{ fontSize: '0.8rem' }}>Frequency</label>
              <select 
                className="form-select-custom"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                <option value="daily">Daily drops</option>
                <option value="alternate">Alternate days</option>
                <option value="weekly">Weekly (Sundays only)</option>
              </select>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={saveSubMutation.isPending}
              style={{ height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {saveSubMutation.isPending ? 'Saving...' : 'Save Plan'}
            </Button>
          </motion.form>
        )}

        {statusMsg && (
          <div className={`alert ${statusMsg.type === 'success' ? 'alert-success' : 'alert-error'}`} style={{ marginTop: '16px', marginBottom: 0 }}>
            {statusMsg.text}
          </div>
        )}
      </motion.section>

      {/* Stats Cards Grid */}
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

      {/* Recent Milk History */}
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
            { label: 'Session', key: 'session', render: (value) => value || '—' },
            { label: 'Qty', key: 'quantity', className: 'qty-cell', render: (value) => `${Number(value).toFixed(2)} L` },
            { label: 'Rate/L', className: 'rate-cell', render: (_, row) => `₹${milkLineRate(row).toFixed(2)}` },
            { label: 'Amount', className: 'amount-cell', render: (_, row) => `₹${milkLineAmount(row).toFixed(2)}` },
          ]}
        />
      </motion.div>
    </motion.div>
  );
};

export default CustomerDashboard;