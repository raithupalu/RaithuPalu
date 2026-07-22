import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { orderService } from '../../services/api';
import { extractListFromResponse } from '../../lib/apiNormalize';
import DataTable from '../../components/DataTable';
import './CustomerPages.css';
import PageHeader from '../../components/PageHeader';

const PRICE_PER_LITRE = 80; // ₹/L — keep in sync with backend DEFAULT_PRICE_PER_LITRE
const QUANTITY_PRESETS = [0.5, 1, 2, 5, 10, 20];

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ quantity: 1, time: 'morning' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await orderService.getUserOrders();
      const orders = extractListFromResponse(response);
      setOrders([...orders].reverse());
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const qty = Number(formData.quantity);
    const newErrors = {};
    if (!qty || qty <= 0) newErrors.quantity = 'Please select a quantity';
    else if (qty < 0.5 || qty > 100) newErrors.quantity = 'Quantity must be between 0.5 and 100 liters';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        const qty = Number(formData.quantity);
        const total = qty * PRICE_PER_LITRE;
        await orderService.create({
          quantity: qty,
          time: formData.time,
          description: `Delivery: ${formData.time === 'morning' ? 'Morning' : 'Evening'} - ${qty}L - ₹${total.toFixed(2)}`
        });
        setFormData({ quantity: 1, time: 'morning' });
        setShowForm(false);
        setErrors({});
        fetchOrders();
      } catch (error) {
        setErrors({ submit: error.message || 'Failed to create order' });
      }
    }
  };

  if (loading) {
    return (
      <div className="customer-loading">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
          <div className="spinner" />
        </motion.div>
      </div>
    );
  }

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const acceptedCount = orders.filter(o => o.status === 'confirmed' || o.status === 'accepted').length;
  const rejectedCount = orders.filter(o => o.status === 'cancelled' || o.status === 'rejected').length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <motion.div 
      className="customer-page"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <PageHeader title="Order Management 📦" subtitle="Track and manage your delivery orders" />

      <motion.div className="stats-grid" variants={containerVariants} initial="hidden" animate="visible">
        <motion.div variants={itemVariants} className="ds-stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <p className="stat-label">Pending</p>
            <h2 className="stat-value">{pendingCount}</h2>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="ds-stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <p className="stat-label">Accepted</p>
            <h2 className="stat-value">{acceptedCount}</h2>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="ds-stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <p className="stat-label">Rejected</p>
            <h2 className="stat-value">{rejectedCount}</h2>
          </div>
        </motion.div>
      </motion.div>

      <motion.div variants={itemVariants} className="page-card">
        <div className="card-header">
          <h3 className="card-title">
            {showForm ? 'New Order' : 'Create Order'}
          </h3>
          <button 
            onClick={() => setShowForm(!showForm)}
            className={`action-button ${showForm ? 'secondary-button' : ''}`}
          >
            {showForm ? '✕ Cancel' : '+ New Order'}
          </button>
        </div>

        {showForm && (
          <motion.form 
            onSubmit={handleSubmit} 
            className="order-form"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="form-group-custom">
              <label className="form-label-custom">Quantity (Liters)</label>
              <div className="quantity-selector">
                {QUANTITY_PRESETS.map((q) => (
                  <button
                    type="button"
                    key={q}
                    className={`quantity-btn ${formData.quantity === q ? 'quantity-btn--selected' : ''}`}
                    onClick={() => {
                      setFormData({ ...formData, quantity: q });
                      if (errors.quantity) setErrors({ ...errors, quantity: '' });
                    }}
                    aria-pressed={formData.quantity === q}
                  >
                    {q} L
                  </button>
                ))}
              </div>
              {errors.quantity && <p style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: 6 }}>⚠️ {errors.quantity}</p>}
            </div>

            <div className="order-total-preview">
              <span className="order-total-label">Total ({PRICE_PER_LITRE}/L)</span>
              <span className="order-total-amount">
                ₹{(Number(formData.quantity) * PRICE_PER_LITRE).toFixed(2)}
              </span>
            </div>

            <div className="form-group-custom">
              <label className="form-label-custom">Delivery Time</label>
              <select
                className="form-select-custom"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              >
                <option value="morning">Morning (6 AM - 9 AM)</option>
                <option value="evening">Evening (4 PM - 7 PM)</option>
              </select>
            </div>

            <motion.button 
              type="submit"
              className="submit-button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Place Order
            </motion.button>
          </motion.form>
        )}

        {errors.submit && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: '#fee',
              border: '1px solid #fcc',
              color: '#c33',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '0.9rem'
            }}
          >
            ⚠️ {errors.submit}
          </motion.div>
        )}
      </motion.div>

      <motion.div variants={itemVariants} className="page-card">
        <div className="card-header">
          <h3 className="card-title">Order History</h3>
          <span style={{ color: '#999', fontSize: '0.9rem' }}>Total: {orders.length} orders</span>
        </div>

        <DataTable
          data={orders}
          emptyMessage="📭 No orders yet"
          animate={false}
          columns={[
            { label: 'Order ID', key: 'orderId', className: 'date-cell', render: (_, row) => row._id?.slice(-8) || '-' },
            { label: 'Quantity', key: 'quantity', className: 'qty-cell', render: (_, row) => `${Number(row.quantity).toFixed(2)} L` },
            { label: 'Amount', className: 'amount-cell', render: (_, row) => `₹${((Number(row.quantity) || 0) * PRICE_PER_LITRE).toFixed(2)}` },
            { label: 'Time', key: 'time', render: (_, row) => (row.time === 'morning' ? '🌅 Morning' : '🌆 Evening') },
            {
              label: 'Status',
              render: (_, row) => (
                <span className={`status-badge status-${row.status}`}>
                  {row.status}
                </span>
              ),
            },
            { label: 'Date', key: 'createdAt', className: 'date-cell', render: (_, row) => new Date(row.createdAt).toLocaleDateString() },
          ]}
        />
      </motion.div>
    </motion.div>
  );
};

export default CustomerOrders;
