import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { milkService } from '../../services/api';
import { milkEntriesFromResponse, filterMilkEntriesByPreset } from '../../lib/milkResponse';
import { milkLineRate, milkLineAmount } from '../../lib/milkEntryDisplay';
import { PageLoading, PageError } from '../../components/PageState';
import DataTable from '../../components/DataTable';
import './CustomerPages.css';
import PageHeader from '../../components/PageHeader';

const customerMilkKey = ['customer', 'milk'];
const NO_MILK = [];

const MilkView = () => {
  const [filter, setFilter] = useState('all');

  const query = useQuery({
    queryKey: customerMilkKey,
    queryFn: async () => milkEntriesFromResponse(await milkService.getMyMilk()),
  });

  const { filteredEntries, volumeL, amountInr } = useMemo(() => {
    const milkEntries = query.data == null ? NO_MILK : query.data;
    const filtered = filterMilkEntriesByPreset(milkEntries, filter);
    const vol = filtered.reduce((sum, m) => sum + (Number(m.quantity) || 0), 0);
    const amt = filtered.reduce((sum, m) => sum + milkLineAmount(m), 0);
    return { filteredEntries: filtered, volumeL: vol, amountInr: amt };
  }, [query.data, filter]);

  if (query.isPending) {
    return (
      <div className="customer-loading customer-loading--padded">
        <PageLoading label="Loading milk records…" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="customer-loading customer-loading--padded">
        <PageError title="Could not load records" onRetry={() => query.refetch()} />
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.06 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div className="customer-page" variants={containerVariants} initial="hidden" animate="visible">
      <PageHeader title="My milk records" subtitle="Filter by period and review quantities" />

      <motion.div className="filter-bar" variants={itemVariants}>
        {['all', 'today', 'week', 'month'].map((key) => (
          <button
            key={key}
            type="button"
            className={`filter-btn ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {key === 'all' ? 'All' : key === 'today' ? 'Today' : key === 'week' ? '7 days' : 'Month'}
          </button>
        ))}
      </motion.div>

      <motion.div className="stats-grid" variants={containerVariants}>
        <motion.div variants={itemVariants} className="ds-stat-card">
          <div className="stat-icon">🥛</div>
          <div className="stat-content">
            <p className="stat-label">Volume (filtered)</p>
            <h2 className="stat-value">{volumeL.toFixed(2)} L</h2>
          </div>
        </motion.div>
        <motion.div variants={itemVariants} className="ds-stat-card">
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <p className="stat-label">At recorded rate</p>
            <h2 className="stat-value">₹{amountInr.toFixed(0)}</h2>
          </div>
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants} className="page-card">
        <div className="card-header">
          <h3 className="card-title">Entries</h3>
          <span className="card-meta-muted">{filteredEntries.length} rows</span>
        </div>
        <DataTable
          data={filteredEntries}
          emptyMessage="No entries for this filter."
          animate={false}
          columns={[
            {
              label: 'Date',
              key: 'date',
              render: (value) => (value ? new Date(value).toLocaleDateString('en-IN') : '—'),
            },
            { label: 'Session', key: 'session', render: (value) => value ?? '—' },
            { label: 'Qty', key: 'quantity', render: (value) => `${Number(value).toFixed(2)} L` },
            { label: 'Rate', className: 'rate-cell', render: (_, row) => `₹${milkLineRate(row).toFixed(2)}` },
            { label: 'Amount', className: 'amount-cell', render: (_, row) => `₹${milkLineAmount(row).toFixed(2)}` },
          ]}
        />
      </motion.div>
    </motion.div>
  );
};

export default MilkView;
