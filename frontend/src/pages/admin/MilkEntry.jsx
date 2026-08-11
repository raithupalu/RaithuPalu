import React, { useState, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { milkService, userService } from '../../services/api';
import { extractListFromResponse } from '../../lib/apiNormalize';
import { sortByDateDescending, formatBusinessDate } from '../../lib/dates';
import { PageError } from '../../components/PageState';
import { DashboardSkeleton } from '../../components/Skeleton';
import { adminDashboardQueryKey } from '../../hooks/useAdminDashboard';
import Modal from '../../components/Modal';
import { MilkEntryForm } from '../../components/admin/MilkEntryForm';
import { MilkEntryTable } from '../../components/admin/MilkEntryTable';
import './AdminPages.css';
import PageHeader from '../../components/PageHeader';

const milkAdminKey = ['admin', 'milk-entries'];

const MilkEntry = () => {
  const queryClient = useQueryClient();

  const [showModal, setShowModal] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'normal' | 'order'
  const [sortOrder, setSortOrder] = useState('none'); // 'none' | 'normal' | 'order'

  // Delete modal states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState(null);

  // Form state for modal
  const [formData, setFormData] = useState({
    userId: '',
    quantity: null,
    pricePerLitre: 80,
    session: 'morning',
    date: new Date().toISOString().split('T')[0],
  });

  const [submitStatus, setSubmitStatus] = useState(null);

  // Clear status after delay
  const clearStatus = useCallback(() => {
    setTimeout(() => setSubmitStatus(null), 4000);
  }, []);

  const listQuery = useQuery({
    queryKey: milkAdminKey,
    queryFn: async () => {
      const [entriesRes, usersRes] = await Promise.all([
        milkService.getAll({ limit: 500 }),
        userService.getAll(),
      ]);

      const entries = sortByDateDescending(extractListFromResponse(entriesRes), 'date');

      const users = extractListFromResponse(usersRes).filter((u) => u.role === 'customer');

      return { entries, users };
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload) => milkService.create(payload),
    onSuccess: () => {
      setSubmitStatus({
        type: 'success',
        message: 'Milk entry recorded successfully!',
      });

      setFormData({
        userId: '',
        quantity: null,
        pricePerLitre: 80,
        session: 'morning',
        date: new Date().toISOString().split('T')[0],
      });

      setShowModal(false);
      createMutation.reset();
      queryClient.invalidateQueries({ queryKey: milkAdminKey });
      queryClient.invalidateQueries({ queryKey: adminDashboardQueryKey() });
      clearStatus();
    },
    onError: (err) => {
      setSubmitStatus({ 
        type: 'error', 
        message: err?.response?.data?.message || 'Failed to save entry' 
      });
      clearStatus();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => milkService.delete(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(milkAdminKey, (old) => {
        if (!old) return old;
        return {
          ...old,
          entries: old.entries.filter((e) => e._id !== id),
        };
      });
      queryClient.invalidateQueries({ queryKey: adminDashboardQueryKey() });
    },
  });

  // Handle form submission from modal
  const handleSubmit = (data) => {
    // Send the raw input date string directly to avoid timezone conversions!
    createMutation.mutate({
      userId: data.userId,
      quantity: data.quantity,
      pricePerLitre: data.pricePerLitre,
      session: data.session,
      date: data.date, 
      totalPrice: data.total,
      entryType: "NORMAL", 
    });
  };

  const handleDelete = (entry) => {
    setEntryToDelete(entry);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (!entryToDelete) return;
    deleteMutation.mutate(entryToDelete._id, {
      onSuccess: () => {
        setDeleteModalOpen(false);
        setEntryToDelete(null);
      }
    });
  };

  // Modal handlers
  const openModal = () => {
    setShowModal(true);
    setSubmitStatus(null);
    createMutation.reset();
  };

  const closeModal = () => {
    setShowModal(false);
    setSubmitStatus(null);
  };

  // Filter and sort entries dynamically
  const processedEntries = useMemo(() => {
    if (!listQuery.data?.entries) return [];
    let result = [...listQuery.data.entries];
    
    // 1. Filter by type
    if (typeFilter === 'normal') {
      result = result.filter(e => !e.entryType || e.entryType.toUpperCase() === 'NORMAL');
    } else if (typeFilter === 'order') {
      result = result.filter(e => e.entryType && e.entryType.toUpperCase() === 'ORDER');
    }
    
    // 2. Sort by type
    if (sortOrder === 'normal') {
      result.sort((a, b) => {
        const typeA = (a.entryType || 'NORMAL').toUpperCase();
        const typeB = (b.entryType || 'NORMAL').toUpperCase();
        if (typeA === 'NORMAL' && typeB === 'ORDER') return -1;
        if (typeA === 'ORDER' && typeB === 'NORMAL') return 1;
        return 0;
      });
    } else if (sortOrder === 'order') {
      result.sort((a, b) => {
        const typeA = (a.entryType || 'NORMAL').toUpperCase();
        const typeB = (b.entryType || 'NORMAL').toUpperCase();
        if (typeA === 'ORDER' && typeB === 'NORMAL') return -1;
        if (typeA === 'NORMAL' && typeB === 'ORDER') return 1;
        return 0;
      });
    }
    
    return result;
  }, [listQuery.data, typeFilter, sortOrder]);

  // Calculate summary stats including custom sub-types requested
  const summaryStats = useMemo(() => {
    if (!listQuery.data?.entries) return null;
    const { entries } = listQuery.data;
    const totalEntries = entries.length;
    const totalLitres = entries.reduce((sum, e) => sum + (e.quantity || 0), 0);
    const totalAmount = entries.reduce((sum, e) => sum + (e.totalPrice || 0), 0);
    const avgCollection = totalEntries > 0 ? totalLitres / totalEntries : 0;

    // Ordered vs Normal counts
    const normalEntriesCount = entries.filter(e => !e.entryType || e.entryType.toUpperCase() === 'NORMAL').length;
    const orderedEntriesCount = entries.filter(e => e.entryType && e.entryType.toUpperCase() === 'ORDER').length;

    // Ordered vs Normal volumes
    const totalNormalMilk = entries.filter(e => !e.entryType || e.entryType.toUpperCase() === 'NORMAL').reduce((sum, e) => sum + (e.quantity || 0), 0);
    const totalOrderedMilk = entries.filter(e => e.entryType && e.entryType.toUpperCase() === 'ORDER').reduce((sum, e) => sum + (e.quantity || 0), 0);

    return {
      totalEntries,
      totalLitres,
      totalAmount,
      avgCollection,
      normalEntries: normalEntriesCount,
      orderedEntries: orderedEntriesCount,
      totalNormalMilk,
      totalOrderedMilk
    };
  }, [listQuery.data]);

  if (listQuery.isPending) return <DashboardSkeleton />;

  if (listQuery.isError) {
    return (
      <PageError
        title="Error loading data"
        message={listQuery.error?.message}
        onRetry={() => listQuery.refetch()}
      />
    );
  }

  const { users } = listQuery.data;

  return (
    <div className="admin-page">
      <PageHeader title="Milk Entry" subtitle="Manage daily milk collection" actionLabel=" Add Milk Entry" onAction={openModal} />

      {/* Dashboard Stats */}
      <div className="stats-grid stats-grid--dashboard">
        <div className="ds-stat-card">
          <div className="stat-accent-line"></div>
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-label">Total Entries</div>
            <div className="stat-value">
              {summaryStats?.totalEntries}
              <span className="stat-unit"> records</span>
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '8px', color: 'var(--ds-text-muted)' }}>
              Normal: <strong>{summaryStats?.normalEntries}</strong> | Ordered: <strong>{summaryStats?.orderedEntries}</strong>
            </div>
          </div>
        </div>

        <div className="ds-stat-card">
          <div className="stat-accent-line"></div>
          <div className="stat-icon">🥛</div>
          <div className="stat-content">
            <div className="stat-label">Total Litres</div>
            <div className="stat-value">
              {summaryStats?.totalLitres.toFixed(1)}
              <span className="stat-unit"> L</span>
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '8px', color: 'var(--ds-text-muted)' }}>
              Normal: <strong>{summaryStats?.totalNormalMilk.toFixed(1)}L</strong> | Ordered: <strong>{summaryStats?.totalOrderedMilk.toFixed(1)}L</strong>
            </div>
          </div>
        </div>

        <div className="ds-stat-card">
          <div className="stat-accent-line"></div>
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">Total Amount</div>
            <div className="stat-value">
              ₹{summaryStats?.totalAmount.toFixed(2)}
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '8px', color: 'var(--ds-text-muted)' }}>
              Calculations unchanged
            </div>
          </div>
        </div>

        <div className="ds-stat-card">
          <div className="stat-accent-line"></div>
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <div className="stat-label">Avg per Entry</div>
            <div className="stat-value">
              {summaryStats?.avgCollection.toFixed(1)}
              <span className="stat-unit"> L</span>
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '8px', color: 'var(--ds-text-muted)' }}>
              Dairy herd production summary
            </div>
          </div>
        </div>
      </div>

      {/* Filter and sorting row */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', alignItems: 'center', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Type Filter:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="filter-select"
            style={{ padding: '8px 12px', fontSize: '0.85rem', minWidth: '120px' }}
          >
            <option value="all">All</option>
            <option value="normal">Normal Only</option>
            <option value="order">Ordered Only</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Sort:</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="filter-select"
            style={{ padding: '8px 12px', fontSize: '0.85rem', minWidth: '140px' }}
          >
            <option value="none">Default (Date)</option>
            <option value="normal">Normal First</option>
            <option value="order">Ordered First</option>
          </select>
        </div>
      </div>

      {/* Recent Entries Table */}
      <div className="page-card">
        <div className="card-header">
          <h2 className="card-title">Recent Entries</h2>
          <Link to="/admin/milk-history" className="card-link">
            View All →
          </Link>
        </div>
        <MilkEntryTable
          entries={processedEntries}
          handleDelete={handleDelete}
          isDeleting={deleteMutation.isPending}
        />
      </div>

      {/* Add Entry Modal */}
      <AnimatePresence>
        {showModal && (
          <Modal
            isOpen={showModal}
            onClose={closeModal}
            title="Add Milk Entry"
            size="lg"
          >
            <MilkEntryForm
              formData={formData}
              setFormData={setFormData}
              onSubmit={handleSubmit}
              users={users}
              isSubmitting={createMutation.isPending}
              banner={submitStatus}
              isModal={true}
            />
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Details Modal */}
      <AnimatePresence>
        {deleteModalOpen && entryToDelete && (
          <Modal
            isOpen={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setEntryToDelete(null);
            }}
            onConfirm={confirmDelete}
            title="Delete Milk Entry"
            type="danger"
            confirmText={deleteMutation.isPending ? "Deleting..." : "Delete Record"}
            cancelText="Cancel"
            confirmDisabled={deleteMutation.isPending}
          >
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--ds-text-muted)', lineHeight: '1.5' }}>
                Are you sure you want to permanently remove this milk record? This action cannot be undone and will update your dynamic totals instantly.
              </p>
              
              <div style={{ padding: '16px', background: 'var(--ds-surface-muted)', borderRadius: '12px', border: '1px solid var(--ds-border)', display: 'grid', gridTemplateColumns: '1fr', gap: '8px', fontSize: '0.9rem', color: 'var(--ds-text)' }}>
                <div>👤 <strong>Customer:</strong> {entryToDelete.userId?.username || entryToDelete.userId?.name || '—'}</div>
                <div>📅 <strong>Date:</strong> {formatBusinessDate(entryToDelete.date)}</div>
                <div>🌅 <strong>Session:</strong> <span style={{ textTransform: 'capitalize' }}>{entryToDelete.session}</span></div>
                <div>🥛 <strong>Quantity:</strong> {entryToDelete.quantity} L</div>
                <div>💰 <strong>Amount:</strong> ₹{Number(entryToDelete.totalPrice || 0).toFixed(2)}</div>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MilkEntry;