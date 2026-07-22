import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { userService } from '../../services/api';
import { extractListFromResponse } from '../../lib/apiNormalize';
import CustomerCard from '../../components/CustomerCard';
import Modal from '../../components/Modal';
import { PageError, PageLoading } from '../../components/PageState';
import { useToast } from '../../components/Toast';
import './AdminPages.css';
import PageHeader from '../../components/PageHeader';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setError(null);
      const response = await userService.getAll();
      const users = extractListFromResponse(response);
      setCustomers(users.filter((u) => u.role === 'customer'));
    } catch (err) {
      setError(err.message || 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = (id) => {
    if (!id) return;
    const customer = customers.find((item) => item._id === id);
    if (customer) {
      setCustomerToDelete(customer);
    }
  };

  const confirmDelete = async () => {
    if (!customerToDelete?._id) return;

    setDeletingId(customerToDelete._id);
    try {
      await userService.delete(customerToDelete._id);
      addToast('Customer and all related records deleted successfully.', 'success');
      await fetchCustomers();
    } catch (err) {
      console.error('Error deleting customer:', err);
      addToast(err.message || 'Failed to delete customer', 'error');
    } finally {
      setDeletingId(null);
      setCustomerToDelete(null);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  if (loading) {
    return <PageLoading title="Loading customers" />;
  }

  if (error) {
    return (
      <PageError
        title="Error loading customers"
        message={error}
        onRetry={fetchCustomers}
      />
    );
  }

  return (
    <div className="admin-page">
      <PageHeader title="Customers" subtitle="View and manage registered customers" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="search-bar"
        style={{ marginBottom: '24px' }}
      >
        <input
          type="text"
          className="form-input"
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '350px' }}
        />
        <p style={{ fontSize: '0.85rem', color: '#999', marginTop: '8px' }}>
          Showing {filteredCustomers.length} of {customers.length} customers
        </p>
      </motion.div>

      {filteredCustomers.length > 0 ? (
        <div className="customer-grid">
          {filteredCustomers.map((customer, index) => (
            <motion.div
              key={customer._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <CustomerCard
                customer={customer}
                onDelete={handleDeleteRequest}
                isDeleting={deletingId === customer._id}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p className="empty-text">
            {searchTerm ? '🔍 No customers match your search' : '👥 No customers registered yet'}
          </p>
        </div>
      )}

      <Modal
        isOpen={Boolean(customerToDelete)}
        onClose={() => setCustomerToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Customer?"
        message="This will permanently delete the customer account and all related records."
        confirmText={deletingId ? 'Deleting...' : 'Delete Everything'}
        cancelText="Cancel"
        type="danger"
        confirmDisabled={Boolean(deletingId)}
      >
        <div style={{ display: 'grid', gap: '12px', color: '#374151' }}>
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '12px 14px' }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#991b1b' }}>This will permanently delete:</p>
            <ul style={{ margin: '8px 0 0 18px', padding: 0, lineHeight: 1.6 }}>
              <li>Customer Account</li>
              <li>Milk Entries</li>
              <li>Orders</li>
              <li>Payments</li>
              <li>Notifications</li>
              <li>Bills</li>
            </ul>
          </div>
          <p style={{ margin: 0, color: '#6b7280' }}>This action cannot be undone.</p>
        </div>
      </Modal>
    </div>
  );
};

export default Customers;
