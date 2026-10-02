import React, { useEffect, useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { PageLoading, PageError } from '../../components/PageState';
import { workerService } from '../../services/api';

const WorkerProfile = () => {
  const [worker, setWorker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const response = await workerService.getMyProfile();
        setWorker(response.data?.worker || null);
      } catch (err) {
        setError(err.message || 'Unable to load profile');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) return <PageLoading title="Loading profile" />;
  if (error) return <PageError title="Profile unavailable" message={error} onRetry={() => window.location.reload()} />;

  return (
    <div className="admin-page">
      <PageHeader title="Profile" subtitle="Worker account details" />
      <div className="premium-card" style={{ padding: '24px', maxWidth: '680px' }}>
        <div style={{ display: 'grid', gap: '12px' }}>
          <div><strong>Name:</strong> {worker?.name || '—'}</div>
          <div><strong>Phone:</strong> {worker?.phone || '—'}</div>
          <div><strong>Role:</strong> {worker?.role || 'worker'}</div>
          <div><strong>Work type:</strong> {worker?.workType || 'Buffalo Keeper'}</div>
        </div>
      </div>
    </div>
  );
};

export default WorkerProfile;
