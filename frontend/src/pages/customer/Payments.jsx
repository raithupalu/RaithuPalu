import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { milkService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import BillingTable from '../../components/BillingTable';
import Button from '../../components/Button';
import { generateInvoicePDF } from '../../lib/pdfGenerator';
import { getMonthOptions, monthKey } from '../../lib/getMonthOptions';
import { PageError, PageLoading } from '../../components/PageState';
import './CustomerPages.css';
import PageHeader from '../../components/PageHeader';

const CustomerPayments = () => {
  const { user } = useAuth();
  const [selectedMonth, setSelectedMonth] = useState(() => monthKey(new Date()));

  // Only show months from the member's joining month onward.
  const monthOptions = useMemo(
    () => getMonthOptions({ joinDate: user?.createdAt }),
    [user?.createdAt]
  );

  const milkQuery = useQuery({
    queryKey: ['customer-milk', selectedMonth],
    queryFn: async () => {
      const response = await milkService.getByUserAndMonth(user._id, selectedMonth);
      return response.data;
    },
    enabled: !!user?._id && !!selectedMonth,
  });

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  const handleDownloadInvoice = () => {
    if (!milkQuery.data || !user) return;
    
    const { entries, totals } = milkQuery.data;
    generateInvoicePDF(
      user.username || 'Customer',
      selectedMonth,
      entries,
      totals
    );
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.06 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      className="customer-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <PageHeader title="Billing" subtitle="View your milk delivery history and download invoices" />

      <motion.div
        className="month-selector"
        variants={itemVariants}
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label htmlFor="month-select" style={{ fontWeight: 500, color: '#555' }}>
            Select Month:
          </label>
          <select
            id="month-select"
            value={selectedMonth}
            onChange={handleMonthChange}
            className="form-select-custom"
            style={{ minWidth: '180px' }}
          >
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <Button
          variant="primary"
          onClick={handleDownloadInvoice}
          disabled={milkQuery.isLoading || milkQuery.data?.entries?.length === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          📥 Download Invoice
        </Button>
      </motion.div>

      {milkQuery.isLoading ? (
        <PageLoading title="Loading billing data" />
      ) : milkQuery.isError ? (
        <PageError
          title="Error loading billing data"
          message={milkQuery.error.message}
          onRetry={() => milkQuery.refetch()}
        />
      ) : (
        <motion.div variants={itemVariants}>
          {milkQuery.data?.totals && (
            <div className="billing-summary" style={{ 
              display: 'flex', 
              gap: '24px', 
              marginBottom: '24px',
              flexWrap: 'wrap'
            }}>
              <div className="summary-card">
                <span className="summary-label">Total Litres</span>
                <span className="summary-value">{milkQuery.data.totals.totalLitres.toFixed(2)}L</span>
              </div>
              <div className="summary-card">
                <span className="summary-label">Total Amount</span>
                <span className="summary-value" style={{ color: '#2d5f3f' }}>
                  ₹{milkQuery.data.totals.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <BillingTable
            entries={milkQuery.data?.entries || []}
            totalLitres={milkQuery.data?.totals?.totalLitres || 0}
            totalPrice={milkQuery.data?.totals?.totalPrice || 0}
            month={monthOptions.find(o => o.value === selectedMonth)?.label || selectedMonth}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default CustomerPayments;