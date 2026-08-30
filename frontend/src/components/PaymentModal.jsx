import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Modal from './Modal';
import { billTotal, amountPaid, amountPending } from '../lib/paymentUtils';

/**
 * PaymentModal — record a full or partial payment against a bill.
 *
 * Props:
 *  - bill        : the Payment document to receive a payment
 *  - customerName: display name for the bill's customer
 *  - onClose     : close handler
 *  - onConfirm   : (amount) => void  (amount = number to pay)
 *  - isPending   : submitting state
 */
const PaymentModal = ({ bill, customerName, onClose, onConfirm, isPending = false }) => {
  const [mode, setMode] = useState('full'); // 'full' | 'partial'
  const [amount, setAmount] = useState('');
  const [amountError, setAmountError] = useState('');

  const total = billTotal(bill);
  const alreadyPaid = amountPaid(bill);
  const pending = amountPending(bill);

  // Reset when a new bill is opened.
  useEffect(() => {
    setMode('full');
    setAmount('');
    setAmountError('');
  }, [bill?._id]);

  const paidAmount = mode === 'full' ? pending : Number(amount);

  const validateAmount = (value) => {
    const num = Number(value);
    if (!value || Number.isNaN(num)) return 'Enter a valid amount.';
    if (num <= 0) return 'Amount must be greater than ₹0.';
    if (num > pending + 0.001) return `Cannot exceed pending amount ₹${pending.toFixed(2)}.`;
    return null;
  };

  const handleAmountChange = (e) => {
    setAmount(e.target.value);
    setAmountError('');
  };

  const remaining = Math.max(0, pending - (Number.isFinite(paidAmount) ? paidAmount : 0));

  const handleConfirm = () => {
    if (mode === 'full') {
      onConfirm(pending);
      return;
    }
    const err = validateAmount(amount);
    if (err) {
      setAmountError(err);
      return;
    }
    onConfirm(Number(amount));
  };

  const rowStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid var(--ds-border)',
    fontSize: '0.95rem',
    color: 'var(--ds-text)',
  };

  return (
    <Modal
      isOpen={Boolean(bill)}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Record Payment"
      type="success"
      confirmText={isPending ? 'Recording…' : 'Confirm Payment'}
      cancelText="Cancel"
      confirmDisabled={isPending}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Summary */}
        <div style={{ padding: '16px', background: 'var(--ds-surface-muted)', borderRadius: '12px', border: '1px solid var(--ds-border)' }}>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--ds-text)' }}>
            Payment for: {customerName || 'Customer'}
          </p>
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column' }}>
            <div style={rowStyle}><span>Bill Amount</span><strong>₹{total.toFixed(2)}</strong></div>
            <div style={rowStyle}><span>Already Paid</span><strong>₹{alreadyPaid.toFixed(2)}</strong></div>
            <div style={rowStyle}><span>Current Pending</span><strong>₹{pending.toFixed(2)}</strong></div>
          </div>
        </div>

        {/* Payment type */}
        <div>
          <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ds-text-muted)', marginBottom: '8px', display: 'block' }}>
            Payment Type
          </label>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.95rem', color: 'var(--ds-text)' }}>
              <input
                type="radio"
                name="paymode"
                checked={mode === 'full'}
                onChange={() => { setMode('full'); setAmountError(''); }}
              />
              Full Paid (₹{pending.toFixed(2)})
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.95rem', color: 'var(--ds-text)' }}>
              <input
                type="radio"
                name="paymode"
                checked={mode === 'partial'}
                onChange={() => { setMode('partial'); setAmountError(''); }}
              />
              Enter Amount
            </label>
          </div>
        </div>

        {/* Amount input (partial) */}
        {mode === 'partial' && (
          <div>
            <label htmlFor="pay-amount" style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ds-text-muted)', marginBottom: '6px', display: 'block' }}>
              Amount Paid (₹)
            </label>
            <input
              id="pay-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={handleAmountChange}
              placeholder="0.00"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                border: `1.5px solid ${amountError ? '#dc2626' : 'var(--ds-border)'}`,
                background: 'var(--ds-surface-strong)',
                color: 'var(--ds-text)',
                fontSize: '1rem',
                outline: 'none',
                fontFamily: 'Inter, sans-serif',
              }}
            />
            {amountError && (
              <p style={{ color: '#dc2626', fontSize: '0.8rem', margin: '6px 0 0 0' }}>⚠️ {amountError}</p>
            )}
          </div>
        )}

        {/* Live preview */}
        <div style={{ padding: '14px', borderRadius: '12px', border: '1px dashed var(--ds-border-strong)', background: 'var(--ds-surface-strong)' }}>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--ds-text-muted)', marginBottom: '8px' }}>
            After Payment
          </div>
          <div style={rowStyle}>
            <span>Payment Now</span>
            <strong style={{ color: 'var(--ds-primary-strong)' }}>
              ₹{(Number.isFinite(paidAmount) ? paidAmount : 0).toFixed(2)}
            </strong>
          </div>
          <div style={{ ...rowStyle, borderBottom: 'none' }}>
            <span>Remaining Balance</span>
            <strong style={{ color: remaining > 0.001 ? '#b45309' : '#16a34a' }}>
              ₹{remaining.toFixed(2)}
            </strong>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;