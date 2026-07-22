import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { buffaloService } from '../../services/api';
import { extractListFromResponse } from '../../lib/apiNormalize';
import { PageLoading, PageError } from '../../components/PageState';
import BuffaloCard from '../../components/BuffaloCard';
import AddBuffaloModal from '../../components/AddBuffaloModal';
import EmptyState from '../../components/EmptyState';
import './AdminPages.css';
import PageHeader from '../../components/PageHeader';

const buffaloKey = ['admin', 'buffalo'];

const BuffaloList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const listQuery = useQuery({
    queryKey: buffaloKey,
    queryFn: async () => {
      const res = await buffaloService.getAll();
      return extractListFromResponse(res);
    },
  });

  if (listQuery.isPending) {
    return (
      <div className="admin-page admin-page--centered">
        <PageLoading label="Loading buffalo herd…" />
      </div>
    );
  }

  if (listQuery.isError) {
    return (
      <div className="admin-page admin-page--centered">
        <PageError title="Could not load buffalo" onRetry={() => listQuery.refetch()} />
      </div>
    );
  }

  const buffalo = listQuery.data;

  const filteredBuffalo = buffalo.filter((b) => {
    const matchesSearch = !searchTerm || 
      (b.name?.toLowerCase() ?? '').includes(searchTerm.toLowerCase()) ||
      (b.tagId && b.tagId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = filterStatus === 'all' || b.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = buffalo.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  const handleAddSuccess = () => {
    setIsModalOpen(false);
    listQuery.refetch();
  };

  return (
    <div className="admin-page">
      <PageHeader title="Buffalo Herd" subtitle="Manage your dairy animals and track their health records" actionLabel=" Add Buffalo" onAction={() => setIsModalOpen(true)} />

      {/* Stats Cards */}
      <motion.div 
        className="stats-grid"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="stat-card">
          <div className="stat-icon bg-emerald-100 dark:bg-emerald-900/50">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <div>
            <p className="stat-label">Total Buffalo</p>
            <p className="stat-value">{buffalo.length}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-emerald-100 dark:bg-emerald-900/50">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <div>
            <p className="stat-label">Active</p>
            <p className="stat-value text-emerald-600 dark:text-emerald-400">
              {statusCounts.active || 0}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-rose-100 dark:bg-rose-900/50">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 8v4l2 2"/>
            </svg>
          </div>
          <div>
            <p className="stat-label">Pregnant</p>
            <p className="stat-value text-rose-600 dark:text-rose-400">
              {statusCounts.pregnant || 0}
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-amber-100 dark:bg-amber-900/50">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div>
            <p className="stat-label">Dry Period</p>
            <p className="stat-value text-amber-600 dark:text-amber-400">
              {statusCounts.dry || 0}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div 
        className="filters-row"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="search-box">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search by name or tag ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select 
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="pregnant">Pregnant</option>
          <option value="dry">Dry</option>
          <option value="sold">Sold</option>
          <option value="deceased">Deceased</option>
        </select>
      </motion.div>

      {/* Buffalo Grid */}
      <motion.section
        className="buffalo-grid"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <AnimatePresence mode="popLayout">
          {filteredBuffalo.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <EmptyState
                icon="🐮"
                title="No buffalo found"
                description={searchTerm || filterStatus !== 'all' 
                  ? "Try adjusting your search or filter"
                  : "Get started by adding your first buffalo"}
                action={searchTerm || filterStatus !== 'all' 
                  ? {
                      label: "Clear Filters",
                      onClick: () => {
                        setSearchTerm('');
                        setFilterStatus('all');
                      }
                    }
                  : {
                      label: "Add Buffalo",
                      onClick: () => setIsModalOpen(true)
                    }
                }
              />
            </motion.div>
          ) : (
            filteredBuffalo.map((b) => (
              <Link key={b._id} to={`/admin/buffalo/${b._id}`}>
                <BuffaloCard buffalo={b} />
              </Link>
            ))
          )}
        </AnimatePresence>
      </motion.section>

      <AddBuffaloModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAddSuccess}
      />
    </div>
  );
};

export default BuffaloList;