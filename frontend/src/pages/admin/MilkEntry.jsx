import React, { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { milkService, userService } from '../../services/api';
import { extractListFromResponse } from '../../lib/apiNormalize';
import { sortByDateDescending } from '../../lib/dates';
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
    },
  });

  // Handle form submission from modal
  const handleSubmit = (data) => {
    const dateOnly = new Date(data.date);
    dateOnly.setHours(0, 0, 0, 0);

    createMutation.mutate({
      userId: data.userId,
      quantity: data.quantity,
      pricePerLitre: data.pricePerLitre,
      session: data.session,
      date: dateOnly,
      totalPrice: data.total,
    });
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this milk entry? This action cannot be undone.')) return;
    deleteMutation.mutate(id);
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

  // Calculate summary stats
  const summaryStats = listQuery.data ? (() => {
    const { entries } = listQuery.data;
    const totalEntries = entries.length;
    const totalLitres = entries.reduce((sum, e) => sum + (e.quantity || 0), 0);
    const totalAmount = entries.reduce((sum, e) => sum + (e.totalPrice || 0), 0);
    const avgCollection = totalEntries > 0 ? totalLitres / totalEntries : 0;
    return { totalEntries, totalLitres, totalAmount, avgCollection };
  })() : null;

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

  const { entries, users } = listQuery.data;

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
          </div>
        </div>

        <div className="ds-stat-card">
          <div className="stat-accent-line"></div>
          <div className="stat-icon">🥛</div>
          <div className="stat-content">
            <div className="stat-label">Total Litres</div>
            <div className="stat-value">
              {summaryStats?.totalLitres}
              <span className="stat-unit"> L</span>
            </div>
          </div>
        </div>

        <div className="ds-stat-card">
          <div className="stat-accent-line"></div>
          <div className="stat-icon">💰</div>
          <div className="stat-content">
            <div className="stat-label">Total Amount</div>
            <div className="stat-value">
              ₹{summaryStats?.totalAmount}
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
          </div>
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
          entries={entries}
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
    </div>
  );
};

export default MilkEntry;
