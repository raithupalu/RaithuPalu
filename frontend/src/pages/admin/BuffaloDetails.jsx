import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { buffaloService } from '../../services/api';
import { formatDate } from '../../lib/utils';
import FormInput from '../../components/FormInput';
import Button from '../../components/Button';
import ChildCard from '../../components/ChildCard';
import ExpenseTable from '../../components/ExpenseTable';
import { PageLoading, PageError } from '../../components/PageState';
import './AdminPages.css';
import PageHeader from '../../components/PageHeader';

const BuffaloDetails = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  // Buffalo data
  const buffaloQuery = useQuery({
    queryKey: ['buffalo', id],
    queryFn: async () => {
      const res = await buffaloService.getById(id);
      return res.data;
    },
  });
  // Milks
  const milksQuery = useQuery({
    queryKey: ['buffalo', id, 'milks'],
    queryFn: async () => {
      const res = await buffaloService.getMilks(id);
      return res.data;
    },
    enabled: !!id,
  });

  // Children
  const childrenQuery = useQuery({
    queryKey: ['buffalo', id, 'children'],
    queryFn: async () => {
      const res = await buffaloService.getChildren(id);
      return res.data;
    },
    enabled: !!id,
  });

  // Expenses
  const expensesQuery = useQuery({
    queryKey: ['buffalo', id, 'expenses'],
    queryFn: async () => {
      const res = await buffaloService.getExpenses(id);
      return res.data;
    },
    enabled: !!id,
  });

  // Deworming
  const dewormingQuery = useQuery({
    queryKey: ['buffalo', id, 'deworming'],
    queryFn: async () => {
      const res = await buffaloService.getDeworming(id);
      return res.data;
    },
    enabled: !!id,
  });

  // Mating
  const matingQuery = useQuery({
    queryKey: ['buffalo', id, 'mating'],
    queryFn: async () => {
      const res = await buffaloService.getMatings(id);
      return res.data;
    },
    enabled: !!id,
  });

  // Mutations
  const milkMutation = useMutation({
    mutationFn: (data) => buffaloService.addMilk(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buffalo', id, 'milks'] });
      setNewMilk({ quantity: '', date: '' });
    },
  });

  const childMutation = useMutation({
    mutationFn: (data) => buffaloService.addChild(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buffalo', id, 'children'] });
      setNewChild({ gender: 'female', birthDate: '' });
    },
  });

  const expenseMutation = useMutation({
    mutationFn: (data) => buffaloService.addExpense(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buffalo', id, 'expenses'] });
      setNewExpense({ type: 'feed', amount: '', date: '', description: '' });
    },
  });

  const dewormingMutation = useMutation({
    mutationFn: (data) => buffaloService.addDeworming(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buffalo', id, 'deworming'] });
      setNewDeworming({ date: '', notes: '' });
    },
  });

  const matingMutation = useMutation({
    mutationFn: (data) => buffaloService.addMating(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buffalo', id, 'mating'] });
      setNewMating({ matingDate: '', expectedDelivery: '', notes: '' });
    },
  });

  // Form states
  const [newMilk, setNewMilk] = useState({ quantity: '', date: '' });
  const [newChild, setNewChild] = useState({ gender: 'female', birthDate: '' });
  const [newExpense, setNewExpense] = useState({ type: 'feed', amount: '', date: '', description: '' });
  const [newDeworming, setNewDeworming] = useState({ date: '', notes: '' });
  const [newMating, setNewMating] = useState({ matingDate: '', expectedDelivery: '', notes: '' });
  const [errors, setErrors] = useState({});

  if (buffaloQuery.isPending) {
    return (
      <div className="admin-page admin-page--centered">
        <PageLoading label="Loading buffalo details…" />
      </div>
    );
  }

  if (buffaloQuery.isError) {
    return (
      <div className="admin-page admin-page--centered">
        <PageError title="Could not load buffalo" onRetry={() => buffaloQuery.refetch()} />
      </div>
    );
  }

  const buffalo = buffaloQuery.data;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'milk', label: 'Milk Records' },
    { id: 'children', label: 'Children' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'health', label: 'Health' },
  ];

  const handleAddMilk = (e) => {
    e.preventDefault();
    const errors = {};
    if (!newMilk.quantity) errors.quantity = 'Quantity is required';
    if (!newMilk.date) errors.date = 'Date is required';

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    milkMutation.mutate({
      buffaloId: id,
      quantity: Number(newMilk.quantity),
      date: new Date(newMilk.date),
    });
  };

  const handleAddChild = (e) => {
    e.preventDefault();
    const errors = {};
    if (!newChild.birthDate) errors.birthDate = 'Birth date is required';

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    childMutation.mutate({
      buffaloId: id,
      gender: newChild.gender,
      birthDate: new Date(newChild.birthDate),
    });
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    const errors = {};
    if (!newExpense.amount) errors.amount = 'Amount is required';

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    expenseMutation.mutate({
      buffaloId: id,
      type: newExpense.type,
      amount: Number(newExpense.amount),
      date: newExpense.date ? new Date(newExpense.date) : new Date(),
      description: newExpense.description,
    });
  };

  const handleAddDeworming = (e) => {
    e.preventDefault();
    const errors = {};
    if (!newDeworming.date) errors.date = 'Date is required';

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    dewormingMutation.mutate({
      buffaloId: id,
      date: new Date(newDeworming.date),
      notes: newDeworming.notes,
    });
  };

  const handleAddMating = (e) => {
    e.preventDefault();
    const errors = {};
    if (!newMating.matingDate) errors.matingDate = 'Mating date is required';
    if (!newMating.expectedDelivery) errors.expectedDelivery = 'Expected delivery is required';

    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    matingMutation.mutate({
      buffaloId: id,
      matingDate: new Date(newMating.matingDate),
      expectedDelivery: new Date(newMating.expectedDelivery),
      notes: newMating.notes,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-100 text-emerald-700';
      case 'pregnant': return 'bg-rose-100 text-rose-700';
      case 'dry': return 'bg-amber-100 text-amber-700';
      case 'sold': return 'bg-slate-100 text-slate-600';
      case 'deceased': return 'bg-slate-100 text-slate-500';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="admin-page">
      {/* Header */}
      <PageHeader
        title={buffalo.name}
        subtitle={
          <>
            {buffalo.tagId ? `Tag: ${buffalo.tagId} | ` : ''}
            {buffalo.breed} | {buffalo.age != null ? `${buffalo.age} years` : 'Unknown age'}
          </>
        }
        action={<Button variant="secondary" as={Link} to="/admin/buffalo">← Back to Herd</Button>}
      />

      {/* Tabs */}
      <motion.div 
        className="tabs-container"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="buffalo-details-grid">
              <motion.div 
                className="premium-card"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h3 className="section-title">Basic Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Name</label>
                    <p className="font-semibold text-slate-800 dark:text-white">{buffalo.name}</p>
                  </div>
                  <div className="info-item">
                    <label>Tag ID</label>
                    <p className="text-slate-600 dark:text-slate-300">{buffalo.tagId || '—'}</p>
                  </div>
                  <div className="info-item">
                    <label>Breed</label>
                    <p className="text-slate-600 dark:text-slate-300">{buffalo.breed || '—'}</p>
                  </div>
                  <div className="info-item">
                    <label>Age</label>
                    <p className="text-slate-600 dark:text-slate-300">
                      {buffalo.age != null ? `${buffalo.age} years` : '—'}
                    </p>
                  </div>
                  <div className="info-item">
                    <label>Status</label>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(buffalo.status)}`}>
                      {buffalo.status ? buffalo.status.charAt(0).toUpperCase() + buffalo.status.slice(1) : '—'}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Milk Capacity</label>
                    <p className="text-emerald-600 dark:text-emerald-400 font-medium">
                      {buffalo.milkCapacity != null ? `${buffalo.milkCapacity} L/day` : '—'}
                    </p>
                  </div>
                  <div className="info-item">
                    <label>Purchase Date</label>
                    <p className="text-slate-600 dark:text-slate-300">
                      {buffalo.purchaseDate ? formatDate(buffalo.purchaseDate) : '—'}
                    </p>
                  </div>
                  {buffalo.notes && (
                    <div className="info-item col-span-2">
                      <label>Notes</label>
                      <p className="text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg">
                        {buffalo.notes}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Quick Stats */}
              <motion.div 
                className="premium-card"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <h3 className="section-title">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="stat-row">
                    <span className="text-slate-600 dark:text-slate-400">Milk Records</span>
                    <span className="font-semibold text-slate-800 dark:text-white">
                      {milksQuery.data?.length || 0}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="text-slate-600 dark:text-slate-400">Children</span>
                    <span className="font-semibold text-slate-800 dark:text-white">
                      {childrenQuery.data?.length || 0}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="text-slate-600 dark:text-slate-400">Total Expenses</span>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">
                      ₹{expensesQuery.data?.total?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="text-slate-600 dark:text-slate-400">Deworming Records</span>
                    <span className="font-semibold text-slate-800 dark:text-white">
                      {dewormingQuery.data?.length || 0}
                    </span>
                  </div>
                  <div className="stat-row">
                    <span className="text-slate-600 dark:text-slate-400">Mating Records</span>
                    <span className="font-semibold text-slate-800 dark:text-white">
                      {matingQuery.data?.length || 0}
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Milk Tab */}
          {activeTab === 'milk' && (
            <motion.div 
              className="premium-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h3 className="section-title">Add Milk Entry</h3>
              <form onSubmit={handleAddMilk} className="premium-form grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput
                  label="Quantity (L)"
                  type="number"
                  min="0"
                  step="0.1"
                  value={newMilk.quantity}
                  onChange={(e) => setNewMilk({ ...newMilk, quantity: e.target.value })}
                  error={errors.quantity}
                  required
                />
                <FormInput
                  label="Date"
                  type="date"
                  value={newMilk.date}
                  onChange={(e) => setNewMilk({ ...newMilk, date: e.target.value })}
                  error={errors.date}
                  required
                />
                <div className="md:col-span-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={milkMutation.isPending}
                    style={{ width: '100%' }}
                  >
                    {milkMutation.isPending ? 'Adding…' : 'Add Milk Entry'}
                  </Button>
                </div>
              </form>

              <div className="mt-8">
                <h3 className="section-title">Milk History</h3>
                {milksQuery.isLoading ? (
                  <p className="text-slate-500 dark:text-slate-400 text-center py-8">Loading…</p>
                ) : milksQuery.data?.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400 text-center py-8">No milk entries yet</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-800 dark:text-white">Date</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-800 dark:text-white">Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {milksQuery.data?.map((milk) => (
                          <tr key={milk._id} className="border-b border-slate-100 dark:border-slate-700/50">
                            <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                              {formatDate(milk.date)}
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                              {milk.quantity} L
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}
            </motion.div>

          {/* Children Tab */}
          {activeTab === 'children' && (
            <motion.div 
              className="premium-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h3 className="section-title">Add New Child</h3>
              <form onSubmit={handleAddChild} className="premium-form grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-input-custom">
                  <label className="form-label">Gender</label>
                  <select
                    value={newChild.gender}
                    onChange={(e) => setNewChild({ ...newChild, gender: e.target.value })}
                    className="form-input"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <FormInput
                  label="Birth Date"
                  type="date"
                  value={newChild.birthDate}
                  onChange={(e) => setNewChild({ ...newChild, birthDate: e.target.value })}
                  error={errors.birthDate}
                  required
                />
                <div className="md:col-span-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={childMutation.isPending}
                    style={{ width: '100%' }}
                  >
                    {childMutation.isPending ? 'Adding…' : 'Add Child'}
                  </Button>
                </div>
              </form>

              <div className="mt-8">
                <h3 className="section-title mb-4">Children List</h3>
                {childrenQuery.isLoading ? (
                  <p className="text-slate-500 dark:text-slate-400 text-center py-8">Loading…</p>
                ) : childrenQuery.data?.length === 0 ? (
                  <p className="text-slate-500 dark:text-slate-400 text-center py-8">No children yet</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {childrenQuery.data?.map((child) => (
                      <ChildCard
                        key={child._id}
                        child={child}
                        onViewDetails={(child) => {
                          // Navigate to child detail view or show modal
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <motion.div 
              className="premium-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h3 className="section-title">Add Expense</h3>
              <form onSubmit={handleAddExpense} className="premium-form grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-input-custom">
                  <label className="form-label">Type</label>
                  <select
                    value={newExpense.type}
                    onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value })}
                    className="form-input"
                  >
                    <option value="feed">Feed</option>
                    <option value="medical">Medical</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <FormInput
                  label="Amount (₹)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={newExpense.amount}
                  onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                  error={errors.amount}
                  required
                />
                <FormInput
                  label="Date (optional)"
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                />
                <div className="md:col-span-2">
                  <FormInput
                    label="Description"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>
                <div className="md:col-span-2">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={expenseMutation.isPending}
                    style={{ width: '100%' }}
                  >
                    {expenseMutation.isPending ? 'Adding…' : 'Add Expense'}
                  </Button>
                </div>
              </form>

              <div className="mt-8">
                <h3 className="section-title">Expense History</h3>
                {expensesQuery.isLoading ? (
                  <p className="text-slate-500 dark:text-slate-400 text-center py-8">Loading…</p>
                ) : (
                  <ExpenseTable expenses={expensesQuery.data?.expenses || []} />
                )}
              </div>
            </motion.div>
          )}

          {/* Health Tab */}
          {activeTab === 'health' && (
            <div className="space-y-6">
              {/* Deworming */}
              <motion.div 
                className="premium-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h3 className="section-title">Deworming Records</h3>
                <form onSubmit={handleAddDeworming} className="premium-form grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Date"
                    type="date"
                    value={newDeworming.date}
                    onChange={(e) => setNewDeworming({ ...newDeworming, date: e.target.value })}
                    error={errors.date}
                    required
                  />
                  <FormInput
                    label="Notes"
                    value={newDeworming.notes}
                    onChange={(e) => setNewDeworming({ ...newDeworming, notes: e.target.value })}
                    placeholder="Optional notes"
                  />
                  <div className="md:col-span-2">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={dewormingMutation.isPending}
                      style={{ width: '100%' }}
                    >
                      {dewormingMutation.isPending ? 'Adding…' : 'Add Deworming Record'}
                    </Button>
                  </div>
                </form>

                <div className="mt-6">
                  {dewormingQuery.isLoading ? (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-4">Loading…</p>
                  ) : dewormingQuery.data?.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-4">No deworming records</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-800 dark:text-white">Date</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-800 dark:text-white">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dewormingQuery.data?.map((record) => (
                            <tr key={record._id} className="border-b border-slate-100 dark:border-slate-700/50">
                              <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                                {formatDate(record.date)}
                              </td>
                              <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                                {record.notes || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Mating */}
              <motion.div 
                className="premium-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <h3 className="section-title">Mating Records</h3>
                <form onSubmit={handleAddMating} className="premium-form grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormInput
                    label="Mating Date"
                    type="date"
                    value={newMating.matingDate}
                    onChange={(e) => setNewMating({ ...newMating, matingDate: e.target.value })}
                    error={errors.matingDate}
                    required
                  />
                  <FormInput
                    label="Expected Delivery"
                    type="date"
                    value={newMating.expectedDelivery}
                    onChange={(e) => setNewMating({ ...newMating, expectedDelivery: e.target.value })}
                    error={errors.expectedDelivery}
                    required
                  />
                  <div className="md:col-span-2">
                    <FormInput
                      label="Notes"
                      value={newMating.notes}
                      onChange={(e) => setNewMating({ ...newMating, notes: e.target.value })}
                      placeholder="Optional notes"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={matingMutation.isPending}
                      style={{ width: '100%' }}
                    >
                      {matingMutation.isPending ? 'Adding…' : 'Add Mating Record'}
                    </Button>
                  </div>
                </form>

                <div className="mt-6">
                  {matingQuery.isLoading ? (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-4">Loading…</p>
                  ) : matingQuery.data?.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-center py-4">No mating records</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-800 dark:text-white">Mating Date</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-800 dark:text-white">Expected Delivery</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-800 dark:text-white">Status</th>
                            <th className="text-left py-3 px-4 text-sm font-semibold text-slate-800 dark:text-white">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {matingQuery.data?.map((record) => (
                            <tr key={record._id} className="border-b border-slate-100 dark:border-slate-700/50">
                              <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                                {formatDate(record.matingDate)}
                              </td>
                              <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                                {formatDate(record.expectedDelivery)}
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  record.status === 'delivered' 
                                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                                }`}>
                                  {record.status === 'delivered' ? 'Delivered' : 'Pending'}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-sm text-slate-600 dark:text-slate-300">
                                {record.notes || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
        
          )}
        </AnimatePresence>
    </div>
  );
};

export default BuffaloDetails;