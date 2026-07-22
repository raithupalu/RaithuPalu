import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { milkService, userService } from '../../services/api';
import BillingTable from '../../components/BillingTable';
import Button from '../../components/Button';
import { generateInvoicePDF } from '../../lib/pdfGenerator';
import { PageError, PageLoading } from '../../components/PageState';
import './AdminPages.css';
import PageHeader from '../../components/PageHeader';
import { getMonthOptions } from '../../lib/getMonthOptions';

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const customerQuery = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      const response = await userService.getById(id);
      return response.data;
    },
    enabled: !!id,
  });

  // Only offer months from the member's joining month onward.
  const monthOptions = useMemo(
    () => getMonthOptions({ joinDate: customerQuery.data?.createdAt }),
    [customerQuery.data?.createdAt]
  );

  const milkQuery = useQuery({
    queryKey: ['milk', id, selectedMonth],
    queryFn: async () => {
      const response = await milkService.getByUserAndMonth(id, selectedMonth);
      return response.data;
    },
    enabled: !!id && !!selectedMonth,
  });

  // Observability: log received billing data for debugging month filtering
  React.useEffect(() => {
    if (milkQuery.data) {
      console.debug('Billing data received for', selectedMonth, milkQuery.data);
    }
  }, [milkQuery.data, selectedMonth]);

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };

  const handleDownloadInvoice = () => {
    if (!milkQuery.data || !customerQuery.data) return;
    console.debug('Download invoice - selectedMonth:', selectedMonth);
    console.debug('Download invoice - entries:', milkQuery.data?.entries?.length);
    const { entries, totals, customer } = milkQuery.data;
    generateInvoicePDF(
      customer?.username || 'Customer',
      selectedMonth,
      entries,
      totals
    );
  };

  const handleGoBack = () => {
    navigate('/admin/customers');
  };

  if (customerQuery.isPending) {
    return <PageLoading title="Loading customer" />;
  }

  if (customerQuery.isError) {
    return (
      <PageError
        title="Error loading customer"
        message={customerQuery.error.message}
        onRetry={() => customerQuery.refetch()}
      />
    );
  }

  const customer = customerQuery.data;

  return (
    <div className="admin-page">
      <motion.button
        onClick={handleGoBack}
        className="btn-back"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontSize: '1rem',
          color: '#666',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        ← Back to Customers
      </motion.button>

      <PageHeader title={customer.username} subtitle="Customer Details & Billing" />

      <motion.div
        className="premium-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        style={{ marginBottom: '24px' }}
      >
        <div className="customer-info-grid">
          <div className="info-item">
            <span className="info-label">Email</span>
            <span className="info-value">{customer.email || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Phone</span>
            <span className="info-value">{customer.phone || 'N/A'}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Joined</span>
            <span className="info-value">
              {customer.createdAt 
                ? new Date(customer.createdAt).toLocaleDateString('en-IN')
                : 'N/A'}
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="month-selector"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
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
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
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
    </div>
  );
};

export default CustomerDetails;
