import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { orderService, userService } from '../../services/api';
import { extractListFromResponse } from '../../lib/apiNormalize';
import './AdminPages.css';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ userId: '', quantity: '', time: 'morning' });
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    pending: 0,
    confirmed: 0,
    cancelled: 0
  });

  // Modal deletion states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, usersRes] = await Promise.all([
        orderService.getAll(),
        userService.getAll()
      ]);

      const ordersData = extractListFromResponse(ordersRes);
      const usersData = extractListFromResponse(usersRes);

      setOrders([...ordersData].reverse());
      setUsers(usersData.filter((u) => u.role === 'customer'));

      setStats({
        pending: ordersData.filter((o) => o.status === 'pending').length,
        confirmed: ordersData.filter((o) => o.status === 'confirmed').length,
        cancelled: ordersData.filter((o) => o.status === 'cancelled').length,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    if (!id) {
      console.error('Invalid order ID');
      return;
    }
    try {
      const response = await orderService.updateStatus(id, status);
      if (response.data?.order) {
        setOrders(prev => prev.map(o => o._id === id ? response.data.order : o));
      } else {
        fetchData();
      }
    } catch (error) {
      console.error('Error updating order:', error);
    }
  };

  const handleDeleteClick = (id) => {
    if (!id) {
      console.error('Invalid order ID');
      return;
    }
    setOrderToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!orderToDelete) return;
    try {
      setDeletingId(orderToDelete);
      await orderService.delete(orderToDelete);
      setOrders(prev => prev.filter(o => o._id !== orderToDelete));
      
      // Update stats dynamically on successful deletion
      const deletedOrder = orders.find(o => o._id === orderToDelete);
      if (deletedOrder) {
        const status = deletedOrder.status || 'pending';
        setStats(prev => ({
          ...prev,
          [status]: Math.max(0, prev[status] - 1)
        }));
      }
      
      setDeleteModalOpen(false);
      setOrderToDelete(null);
    } catch (error) {
      console.error('Error deleting order:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await orderService.create({
        userId: formData.userId,
        quantity: parseFloat(formData.quantity),
        time: formData.time
      });
      setFormData({ userId: '', quantity: '', time: 'morning' });
      fetchData();
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
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
      <PageHeader title="Order Management" subtitle="Manage and track customer orders" />

      {/* Stats Cards */}
      <motion.div 
        className="stats-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        style={{ marginBottom: '32px' }}
      >
        <motion.div variants={itemVariants} className="ds-stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <p className="stat-label">Pending Orders</p>
            <h2 className="stat-value">{stats.pending}</h2>
          </div>
          <div className="stat-accent-line" />
        </motion.div>

        <motion.div variants={itemVariants} className="ds-stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <p className="stat-label">Confirmed</p>
            <h2 className="stat-value">{stats.confirmed}</h2>
          </div>
          <div className="stat-accent-line" />
        </motion.div>

        <motion.div variants={itemVariants} className="ds-stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <p className="stat-label">Cancelled</p>
            <h2 className="stat-value">{stats.cancelled}</h2>
          </div>
          <div className="stat-accent-line" />
        </motion.div>
      </motion.div>

      {/* Create Order Form */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="premium-card"
        style={{ marginBottom: '32px' }}
      >
        <h2 className="section-title">Create New Order</h2>
        
        <form onSubmit={handleCreate} className="premium-form-grid">
          <div className="form-input-custom">
            <label htmlFor="userId" className="form-label">Customer</label>
            <select 
              id="userId"
              className="form-select-custom"
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              required
            >
              <option value="">Select a customer...</option>
              {users.map(user => (
                <option key={user._id} value={user._id}>{user.username}</option>
              ))}
            </select>
          </div>

          <div className="form-input-custom">
            <label htmlFor="quantity" className="form-label">Quantity (L)</label>
            <input
              id="quantity"
              type="number"
              step="0.01"
              className="form-input"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="form-input-custom">
            <label htmlFor="time" className="form-label">Time Slot</label>
            <select 
              id="time"
              className="form-select-custom"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              required
            >
              <option value="morning">🌅 Morning</option>
              <option value="evening">🌆 Evening</option>
            </select>
          </div>

          <Button
            type="submit"
            variant="primary"
            style={{ alignSelf: 'flex-end' }}
          >
            + Create Order
          </Button>
        </form>
      </motion.div>

      {/* Orders Table */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="premium-card"
      >
        <div className="table-header">
          <h2 className="table-title">All Orders</h2>
          <span className="entry-count">{orders.length} orders</span>
        </div>

        <DataTable
          data={orders}
          emptyMessage="📭 No orders found"
          animate={false}
          columns={[
            { label: 'Order ID', key: 'orderId', className: 'order-id', render: (_, row) => row._id?.slice(-8) || 'N/A' },
            { label: 'Customer', key: 'customer', className: 'customer-name', render: (_, row) => row.userId?.username || 'N/A' },
            { label: 'Quantity', key: 'quantity', className: 'quantity', render: (_, row) => `${row.quantity || 0}L` },
            {
              label: 'Time Slot',
              key: 'time',
              className: 'session',
              render: (_, row) => (
                <span className="session-badge">
                  {row.time === 'morning' ? '🌅 Morning' : '🌆 Evening'}
                </span>
              ),
            },
            {
              label: 'Status',
              render: (_, row) => (
                <span className={`status-badge status-${row.status || 'pending'}`}>
                  {row.status || 'pending'}
                </span>
              ),
            },
            { label: 'Date', key: 'createdAt', className: 'date', render: (_, row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString('en-IN') : 'N/A') },
            {
              label: 'Actions',
              render: (_, row) => (
                <div className="action-buttons">
                  {row.status === 'pending' && (
                    <>
                      <motion.button
                        onClick={() => handleStatusUpdate(row._id, 'confirmed')}
                        className="btn-action btn-accept"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Accept order"
                      >
                        ✓
                      </motion.button>
                      <motion.button
                        onClick={() => handleStatusUpdate(row._id, 'cancelled')}
                        className="btn-action btn-reject"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="Reject order"
                      >
                        ✕
                      </motion.button>
                    </>
                  )}
                  <motion.button
                    onClick={() => handleDeleteClick(row._id)}
                    className="btn-delete"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Delete order"
                  >
                    🗑️
                  </motion.button>
                </div>
              ),
            },
          ]}
        />
      </motion.div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setOrderToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Order"
        message="Are you sure you want to delete this order? This action cannot be undone and will also automatically delete the corresponding milk delivery record in the customer's delivery history."
        confirmText={deletingId ? "Deleting..." : "Delete Order"}
        cancelText="Cancel"
        type="danger"
        confirmDisabled={Boolean(deletingId)}
      />
    </div>
  );
};

export default AdminOrders;