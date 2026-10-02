import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import { PageLoading, PageError } from '../../components/PageState';
import Modal from '../../components/Modal';
import { useToast } from '../../components/Toast';
import { workerService } from '../../services/api';

const defaultForm = {
  name: '',
  workType: 'Buffalo Keeper',
  phone: '',
  password: '',
};

const Workers = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [deletingWorkerId, setDeletingWorkerId] = useState(null);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadWorkers = async () => {
    try {
      setError('');
      const response = await workerService.getAll();
      setWorkers(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError(err.message || 'Unable to load workers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkers();
  }, []);

  const validateForm = () => {
    const digits = String(form.phone || '').replace(/\D/g, '');

    if (!form.name.trim()) return 'Name is required.';
    if (!['Milk Labour', 'Buffalo Keeper'].includes(form.workType)) return 'Please select a valid work type.';
    if (!digits || digits.length < 10) return 'Please enter a valid phone number.';
    if (!form.password || form.password.length < 8) return 'Password must be at least 8 characters long.';
    if (!/[A-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      return 'Password must contain at least one uppercase letter and one number.';
    }
    return '';
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setFormError('');
      await workerService.create({
        name: form.name.trim(),
        workType: form.workType,
        phone: form.phone.trim(),
        password: form.password,
      });
      addToast('Worker created successfully', 'success');
      setForm(defaultForm);
      setIsModalOpen(false);
      await loadWorkers();
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Unable to create worker';
      setFormError(message);
      addToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWorker = async () => {
    if (!selectedWorker) return;

    try {
      setDeletingWorkerId(selectedWorker._id);
      await workerService.delete(selectedWorker._id);
      addToast('Worker and all related records deleted successfully.', 'success');
      setWorkers((prev) => prev.filter((worker) => worker._id !== selectedWorker._id));
      setIsDeleteModalOpen(false);
      setSelectedWorker(null);
    } catch (err) {
      const message = err?.response?.data?.message || err?.message || 'Unable to delete worker';
      addToast(message, 'error');
    } finally {
      setDeletingWorkerId(null);
    }
  };

  if (loading) return <PageLoading title="Loading workers" />;
  if (error) return <PageError title="Workers unavailable" message={error} onRetry={loadWorkers} />;

  return (
    <div className="admin-page">
      <PageHeader title="Workers" subtitle="Manage buffalo keepers and labour staff" />

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          style={{
            padding: '12px 20px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #4caf50, #2d5f3f)',
            color: '#fff',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          + Add Worker
        </button>
      </div>

      <div className="premium-card" style={{ padding: '24px' }}>
        {workers.length === 0 ? (
          <p>No workers found.</p>
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {workers.map((worker) => (
              <div
                key={worker._id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  background: '#fff',
                  padding: '16px',
                }}
              >
                <button
                  type="button"
                  onClick={() => navigate(`/admin/workers/${worker._id}`)}
                  style={{
                    flex: 1,
                    textAlign: 'left',
                    border: 'none',
                    background: 'transparent',
                    padding: 0,
                    cursor: 'pointer',
                    color: '#111827',
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{worker.name || worker.username}</div>
                  <div style={{ color: '#6b7280', marginTop: '4px' }}>{worker.phone} • {worker.workType || 'Unknown'}</div>
                </button>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedWorker(worker);
                    setIsDeleteModalOpen(true);
                  }}
                  style={{
                    border: '1px solid #fecaca',
                    background: '#fff1f2',
                    color: '#b91c1c',
                    borderRadius: '10px',
                    padding: '10px 14px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {deletingWorkerId === worker._id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedWorker(null);
        }}
        onConfirm={handleDeleteWorker}
        confirmText={deletingWorkerId ? 'Deleting...' : 'Delete Permanently'}
        cancelText="Cancel"
        title="Delete Worker"
        type="danger"
        confirmDisabled={Boolean(deletingWorkerId)}
      >
        <div style={{ display: 'grid', gap: '12px' }}>
          <p style={{ margin: 0, color: '#374151', lineHeight: 1.6 }}>
            Are you sure you want to permanently delete <strong>{selectedWorker?.name || selectedWorker?.username || 'this worker'}</strong>?
          </p>
          <p style={{ margin: 0, color: '#7f1d1d', fontWeight: 600 }}>
            This action removes the worker account, all attendance records, and stored task photos.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setForm(defaultForm);
          setFormError('');
        }}
        onConfirm={handleSubmit}
        confirmText={submitting ? 'Saving...' : 'Submit'}
        cancelText="Cancel"
        title="Add Worker"
        type="info"
        confirmDisabled={submitting}
      >
        <div style={{ display: 'grid', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #d1d5db' }}
              placeholder="Worker Name"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Work Type</label>
            <select
              value={form.workType}
              onChange={(e) => setForm({ ...form, workType: e.target.value })}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #d1d5db' }}
            >
              <option value="Buffalo Keeper">Buffalo Keeper</option>
              <option value="Milk Labour">Milk Labour</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #d1d5db' }}
              placeholder="10-digit phone number"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #d1d5db' }}
              placeholder="Enter password"
            />
          </div>

          {formError && (
            <div style={{ background: '#fef2f2', color: '#991b1b', borderRadius: '10px', padding: '10px 12px', border: '1px solid #fecaca' }}>
              {formError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Workers;
