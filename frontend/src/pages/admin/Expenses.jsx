import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { expenseService } from '../../services/api';
import { extractListFromResponse } from '../../lib/apiNormalize';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import DataTable from '../../components/DataTable';
import './AdminPages.css';

const Expenses = () => {
  const navigate = useNavigate();
  const expensesRef = useRef(null);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ description: '', amount: '', category: 'feed' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const categories = [
    { id: 'feed', label: 'Feed', icon: '🌾', color: '#8b7355' },
    { id: 'veterinary', label: 'Veterinary', icon: '🏥', color: '#e74c3c' },
    { id: 'equipment', label: 'Equipment', icon: '🔧', color: '#3498db' },
    { id: 'labor', label: 'Labor', icon: '👷', color: '#f39c12' },
    { id: 'other', label: 'Other', icon: '📦', color: '#95a5a6' }
  ];

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await expenseService.getAll();
      const list = extractListFromResponse(response);
      setExpenses([...list].reverse());
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await expenseService.create({
        ...formData,
        amount: parseFloat(formData.amount),
        date: new Date().toISOString()
      });
      setSuccess('✓ Expense added successfully!');
      setFormData({ description: '', amount: '', category: 'feed' });
      fetchExpenses();
      setTimeout(() => setSuccess(''), 3000);

      // Focus back on description field
      const descInput = expensesRef.current?.querySelector('input[id="description"]');
      descInput?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add expense');
    }
  };

  const handleAddClick = () => {
    expensesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const descInput = expensesRef.current?.querySelector('input, select');
    descInput?.focus();
  };

  const handleDelete = async (id) => {
    if (!id) {
      console.error('Invalid expense ID');
      return;
    }
    if (window.confirm('Delete this expense?')) {
      try {
        await expenseService.delete(id);
        setExpenses(prev => prev.filter(e => e._id !== id));
      } catch (error) {
        console.error('Error deleting expense:', error);
      }
    }
  };

  const getTotalExpenses = () => expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const getCategoryTotal = (cat) => expenses.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  if (loading) {
    return (
      <div className="admin-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <PageHeader
        title="Expense Management"
        subtitle="Track and manage business expenses"
        actionLabel="Add Expense"
        onAction={handleAddClick}
        breadcrumbs={
          <span>
            <span style={{ cursor: 'pointer' }} onClick={() => navigate('/admin')}>Dashboard</span>
            <span style={{ margin: '0 8px' }}>/</span>
            <span>Expenses</span>
          </span>
        }
      />

      {/* Category Stats Grid */}
      <motion.div
        className="stats-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ marginBottom: '32px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
      >
        {/* Total Expenses Card */}
        <motion.div variants={itemVariants} className="ds-stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <p className="stat-label">Total Expenses</p>
            <h2 className="stat-value" style={{ color: '#ef4444' }}>₹{getTotalExpenses().toFixed(0)}</h2>
          </div>
          <div className="stat-accent-line" />
        </motion.div>

        {/* Category Stats */}
        {categories.map((cat, i) => (
          <motion.div 
            key={cat.id}
            variants={itemVariants}
            className="ds-stat-card"
          >
            <div className="stat-icon">{cat.icon}</div>
            <div className="stat-content">
              <p className="stat-label">{cat.label}</p>
              <h2 className="stat-value">₹{getCategoryTotal(cat.id).toFixed(0)}</h2>
            </div>
            <div className="stat-accent-line" />
          </motion.div>
        ))}
      </motion.div>

      {/* Form and History */}
      <div className="admin-layout-two-col">
        {/* Add Expense Form */}
        <motion.div
          ref={expensesRef}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="premium-card form-section"
        >
          <h2 className="section-title">Add Expense</h2>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit} className="premium-form">
            <div className="form-input-custom">
              <label htmlFor="category" className="form-label">Category</label>
              <select 
                id="category"
                className="form-select-custom"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                ))}
              </select>
            </div>

            <div className="form-input-custom">
              <label htmlFor="description" className="form-label">Description</label>
              <input
                id="description"
                type="text"
                className="form-input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="E.g., Buffalo feed supply"
                required
              />
            </div>

            <div className="form-input-custom">
              <label htmlFor="amount" className="form-label">Amount (₹)</label>
              <input
                id="amount"
                type="number"
                step="0.01"
                className="form-input"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
              />
            </div>

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            style={{ width: '100%' }}
          >
              + Add Expense
            </Button>
          </form>
        </motion.div>

        {/* Expense History */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="premium-card"
        >
          <div className="table-header">
            <h2 className="table-title">Expense History</h2>
            <span className="entry-count">{expenses.length} expenses</span>
          </div>

          <DataTable
            data={expenses.slice(0, 20)}
            emptyMessage="📭 No expenses recorded"
            animate={false}
            columns={[
              {
                label: 'Date',
                key: 'date',
                className: 'date',
                render: (value) => (value ? new Date(value).toLocaleDateString('en-IN') : 'N/A'),
              },
              {
                label: 'Category',
                render: (_, row) => (
                  <span className="category-badge">
                    {categories.find((c) => c.id === row.category)?.icon} {row.category}
                  </span>
                ),
              },
              { label: 'Description', key: 'description', className: 'description' },
              {
                label: 'Amount',
                key: 'amount',
                className: 'amount',
                render: (value) => (
                  <span style={{ color: '#ef4444', fontWeight: 700 }}>
                    ₹{(Number(value) || 0).toFixed(2)}
                  </span>
                ),
              },
              {
                label: 'Action',
                render: (_, row) => (
                  <motion.button
                    onClick={() => handleDelete(row._id)}
                    className="btn-delete"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    🗑️
                  </motion.button>
                ),
              },
            ]}
          />
        </motion.div>
      </div>
    </div>
  );
};

export default Expenses;