import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentService, userService, pdfService } from '../../services/api';
import { extractListFromResponse } from '../../lib/apiNormalize';
import {
  billTotal,
  amountPaid,
  amountPending,
  isFullyPaid,
  paymentStatus,
  previousBalance,
} from '../../lib/paymentUtils';
import { PageLoading, PageError } from '../../components/PageState';
import Modal from '../../components/Modal';
import Button from '../../components/Button';
import DataTable from '../../components/DataTable';
import { useToast } from '../../components/Toast';
import { SearchableCustomerSelect } from '../../components/admin/MilkEntryFormFields';
import PaymentModal from '../../components/PaymentModal';
import './AdminPages.css';
import PageHeader from '../../components/PageHeader';

const paymentsKey = ['admin', 'payments'];

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const AdminPayments = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [userId, setUserId] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [forceRegenerate, setForceRegenerate] = useState(false);
  const [formError, setFormError] = useState('');
  const [validationTouched, setValidationTouched] = useState({
    userId: false,
    month: false,
    year: false,
  });
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [paymentBill, setPaymentBill] = useState(null); // bill currently receiving a payment

  // Generate years: current year - 1, current year, current year + 1, current year + 2
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  // Set default to previous month on initial load
  useEffect(() => {
    const now = new Date();
    let prevMonth = now.getMonth() - 1;
    let prevYear = now.getFullYear();
    if (prevMonth < 0) {
      prevMonth = 11;
      prevYear = now.getFullYear() - 1;
    }
    setMonth(months[prevMonth]);
    setYear(String(prevYear));
  }, []);

  const paymentsQuery = useQuery({
    queryKey: paymentsKey,
    queryFn: async () => {
      const [paymentsRes, usersRes] = await Promise.all([
        paymentService.getAll(),
        userService.getAll(),
      ]);
      return {
        payments: extractListFromResponse(paymentsRes),
        users: extractListFromResponse(usersRes).filter((u) => u.role === 'customer'),
      };
    },
  });

  // Record a full or partial payment. Sends the amount to pay; the backend
  // validates against the current pending amount and appends to payment history.
  const recordPaymentMutation = useMutation({
    mutationFn: ({ id, amount }) => paymentService.update(id, { paid: amount }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: paymentsKey });
      setPaymentBill(null);
      const fullyPaid = amountPending(res.data?.payment) <= 0.001;
      addToast(
        fullyPaid ? 'Bill fully paid.' : 'Payment recorded.',
        'success'
      );
    },
    onError: (err) => {
      addToast(err?.message || 'Failed to record payment', 'error');
    },
  });

  const deletePaymentMutation = useMutation({
    mutationFn: (id) => paymentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentsKey });
      addToast('Payment record deleted successfully.', 'success');
      setPaymentToDelete(null);
    },
    onError: (err) => {
      addToast(err?.message || 'Failed to delete payment', 'error');
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const createBillMutation = useMutation({
    mutationFn: (body) => paymentService.createBill(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentsKey });
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] });
      setFormError('');
      setForceRegenerate(false);
      addToast('Bill generated successfully.', 'success');
    },
    onError: (err) => {
      const message = err?.response?.data?.message || 'Could not generate bill';
      addToast(message, 'error');
      if (err?.response?.status === 409) {
        setFormError(message);
      } else {
        setFormError(message);
      }
    },
  });

  const validationErrors = {
    userId: !userId ? 'Please select a customer.' : '',
    month: !month ? 'Please select a month.' : '',
    year: !year ? 'Please select a year.' : '',
  };

  const isBillingFormValid = Boolean(userId && month && year);

  const handleCreate = useCallback(
    (e) => {
      e.preventDefault();
      setFormError('');
      setValidationTouched({ userId: true, month: true, year: true });

      if (!isBillingFormValid) {
        setFormError('Please select a customer, month, and year.');
        return;
      }

      createBillMutation.mutate({
        userId,
        month: `${month} ${year}`,
        force: forceRegenerate,
      });
    },
    [month, year, userId, forceRegenerate, createBillMutation, isBillingFormValid]
  );

  const handleDeletePayment = useCallback(async () => {
    if (!paymentToDelete?._id) return;

    setDeletingId(paymentToDelete._id);
    try {
      await deletePaymentMutation.mutateAsync(paymentToDelete._id);
    } catch {
      // handled by mutation error toast
    }
  }, [deletePaymentMutation, paymentToDelete]);

  if (paymentsQuery.isPending) {
    return (
      <div className="admin-page admin-page--centered">
        <PageLoading label="Loading payments…" />
      </div>
    );
  }

  if (paymentsQuery.isError) {
    return (
      <div className="admin-page admin-page--centered">
        <PageError
          title="Could not load payments"
          message={paymentsQuery.error?.message}
          onRetry={() => paymentsQuery.refetch()}
        />
      </div>
    );
  }

  const { payments, users } = paymentsQuery.data;
  const sorted = [...payments].reverse();

  const totalCollected = sorted.reduce((sum, p) => sum + amountPaid(p), 0);
  const totalOutstanding = sorted.reduce((sum, p) => sum + amountPending(p), 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="admin-page">
      <PageHeader title="Payments & billing" subtitle="Generate monthly bills from milk records, then record collections" />
      
      <motion.div
        className="stats-grid"
        style={{ marginBottom: 'var(--spacing-xl, 32px)', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="ds-stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <p className="stat-label">Total collected</p>
            <h2 className="stat-value" style={{ color: '#16a34a' }}>
              ₹{Math.round(totalCollected).toLocaleString('en-IN')}
            </h2>
          </div>
          <div className="stat-accent-line" />
        </motion.div>
        <motion.div variants={itemVariants} className="ds-stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <p className="stat-label">Outstanding</p>
            <h2 className="stat-value" style={{ color: '#ca8a04' }}>
              ₹{Math.round(totalOutstanding).toLocaleString('en-IN')}
            </h2>
          </div>
          <div className="stat-accent-line" />
        </motion.div>
        <motion.div variants={itemVariants} className="ds-stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <p className="stat-label">Bills</p>
            <h2 className="stat-value">{sorted.length}</h2>
          </div>
          <div className="stat-accent-line" />
        </motion.div>
      </motion.div>

      <motion.div
        className="premium-card"
        style={{ marginBottom: 'var(--spacing-xl, 32px)' }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="payments-bill-header">
          <h2 className="section-title">Generate bill</h2>
          <p className="payments-bill-subtitle">Bills use recorded milk for the selected period.</p>
        </div>

        <form onSubmit={handleCreate} className="payments-billing-form">
          <div className="payments-form-field payments-form-field--full">
            <SearchableCustomerSelect
              value={userId}
              onChange={(id) => {
                setUserId(id);
                setValidationTouched((prev) => ({ ...prev, userId: true }));
              }}
              users={users}
              error={
                validationTouched.userId && validationErrors.userId
                  ? validationErrors.userId
                  : null
              }
              label="Customer"
              placeholder="Select customer…"
            />
          </div>

          <div className="payments-form-row">
            <div className="payments-form-field">
              <label htmlFor="month" className="form-label">Month</label>
              <select
                id="month"
                className="form-select-custom"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                onBlur={() => setValidationTouched((prev) => ({ ...prev, month: true }))}
                aria-invalid={Boolean(validationTouched.month && validationErrors.month)}
                required
              >
                <option value="">Select month…</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              {validationTouched.month && validationErrors.month && (
                <span className="field-error-text">{validationErrors.month}</span>
              )}
            </div>

            <div className="payments-form-field">
              <label htmlFor="year" className="form-label">Year</label>
              <select
                id="year"
                className="form-select-custom"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                onBlur={() => setValidationTouched((prev) => ({ ...prev, year: true }))}
                aria-invalid={Boolean(validationTouched.year && validationErrors.year)}
                required
              >
                <option value="">Select year…</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              {validationTouched.year && validationErrors.year && (
                <span className="field-error-text">{validationErrors.year}</span>
              )}
            </div>
          </div>

          <div className="payments-checkbox-row">
            <input
              id="forceRegenerate"
              type="checkbox"
              checked={forceRegenerate}
              onChange={(e) => setForceRegenerate(e.target.checked)}
            />
            <label htmlFor="forceRegenerate" className="payments-checkbox-label">
              Force regenerate existing bill
            </label>
          </div>

            <div className="payments-form-actions">
              <span className="payments-helper-text">Generate a monthly bill from the selected customer and milk records.</span>
              <Button
                type="submit"
                variant="primary"
                disabled={!isBillingFormValid || createBillMutation.isPending}
              >
                {createBillMutation.isPending ? 'Generating…' : 'Generate Bill'}
              </Button>
            </div>
        </form>

        {formError && (
          <div style={{ marginTop: '12px' }}>
            <p className="alert alert-error" role="alert" style={{ marginBottom: forceRegenerate ? '8px' : '0' }}>
              {formError}
            </p>
              {createBillMutation.isError && createBillMutation.error?.status === 409 && !forceRegenerate && (
                <Button
                  type="button"
                  variant="primary"
                  style={{ width: '100%', padding: '10px 16px', fontSize: '0.9rem' }}
                  onClick={() => setForceRegenerate(true)}
                >
                  ✓ Regenerate Bill (override)
                </Button>
              )}
          </div>
        )}
      </motion.div>

      <motion.div className="premium-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="table-header">
          <h2 className="table-title">All bills</h2>
          <span className="entry-count">{sorted.length} records</span>
        </div>

          <DataTable
            columns={[
              { label: 'Customer', render: (_, row) => row.userId?.username || '—' },
              { label: 'Period', render: (_, row) => row.month || '—' },
              { label: 'Litres', render: (_, row) => Number(row.totalLitres || 0).toFixed(2) },
              { label: 'Bill', render: (_, row) => `₹${billTotal(row).toFixed(2)}` },
              { label: 'Prev Bal', render: (_, row) => `₹${previousBalance(row).toFixed(2)}` },
              { label: 'Paid', render: (_, row) => `₹${amountPaid(row).toFixed(2)}` },
              { label: 'Pending', render: (_, row) => `₹${amountPending(row).toFixed(2)}` },
              { label: 'Status', render: (_, row) => {
                const st = paymentStatus(row);
                const labelMap = { paid: 'Paid', partial: 'Partially Paid', pending: 'Pending' };
                return (
                  <span className={`status-badge status-${st === 'partial' ? 'partially' : st}`}>
                    {labelMap[st] || 'Pending'}
                  </span>
                );
              }},
              {
                label: 'Actions',
                render: (_, row) => (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <motion.button
                      type="button"
                      className="btn-action"
                      onClick={async () => {
                        try {
                          await pdfService.downloadInvoice(row._id);
                          addToast('Invoice downloaded successfully.', 'success');
                        } catch (err) {
                          console.error('Invoice download failed', err);
                          addToast(err?.message || 'Failed to download invoice', 'error');
                        }
                      }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      title="Download Invoice"
                    >
                      PDF
                    </motion.button>
                    {!isFullyPaid(row) ? (
                      <motion.button
                        type="button"
                        className="btn-action btn-accept"
                        onClick={() => setPaymentBill(row)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        title="Record a full or partial payment"
                      >
                        {amountPending(row) > 0 && amountPaid(row) > 0 ? 'Payment' : 'Receive Payment'}
                      </motion.button>
                    ) : (
                      <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.875rem' }}>Settled</span>
                    )}
                    <motion.button
                      type="button"
                      className="btn-action btn-reject"
                      disabled={deletePaymentMutation.isPending && deletingId === row._id}
                      onClick={() => setPaymentToDelete(row)}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {deletingId === row._id ? 'Deleting…' : 'Delete'}
                    </motion.button>
                  </div>
                ),
              },
            ]}
            data={sorted}
            emptyMessage="No bills yet — generate one above."
          />
      </motion.div>

      <PaymentModal
        bill={paymentBill}
        customerName={paymentBill?.userId?.username}
        onClose={() => setPaymentBill(null)}
        onConfirm={(amount) =>
          recordPaymentMutation.mutate({ id: paymentBill._id, amount })
        }
        isPending={recordPaymentMutation.isPending}
      />

      <Modal
        isOpen={Boolean(paymentToDelete)}
        onClose={() => setPaymentToDelete(null)}
        onConfirm={handleDeletePayment}
        title="Delete payment record?"
        message="This will remove the selected payment bill record. This action cannot be undone."
        confirmText={deletingId ? 'Deleting...' : 'Delete Record'}
        cancelText="Cancel"
        type="danger"
        confirmDisabled={Boolean(deletingId)}
      />
    </div>
  );
};

export default AdminPayments;