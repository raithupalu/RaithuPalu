import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { buffaloService } from '../../services/api';
import { PageLoading } from '../../components/PageState';
import Button from '../../components/Button';
import FormInput from '../../components/FormInput';
import './AdminPages.css';
import PageHeader from '../../components/PageHeader';

const AddBuffalo = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    name: '',
    tagId: '',
    breed: '',
    age: '',
    status: 'active',
    purchaseDate: '',
    notes: '',
    milkCapacity: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: (data) => buffaloService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'buffalo'] });
      navigate('/admin/buffalo');
    },
    onError: (err) => {
      setError(err?.response?.data?.message || 'Could not save buffalo');
      setSubmitting(false);
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    if (!form.name.trim()) {
      setError('Name is required');
      setSubmitting(false);
      return;
    }

    const data = {
      name: form.name.trim(),
      tagId: form.tagId.trim(),
      breed: form.breed.trim(),
      age: form.age === '' ? undefined : Number(form.age),
      status: form.status,
      purchaseDate: form.purchaseDate ? new Date(form.purchaseDate) : undefined,
      notes: form.notes.trim(),
      milkCapacity: form.milkCapacity === '' ? undefined : Number(form.milkCapacity),
    };

    createMutation.mutate(data);
  };

  if (submitting && createMutation.isPending) {
    return (
      <div className="admin-page admin-page--centered">
        <PageLoading label="Adding buffalo…" />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <PageHeader title="Add New Buffalo" subtitle="Register a new animal in your herd" action={<Button variant="secondary" as={Link} to="/admin/buffalo">← Back to Herd</Button>} />

      <motion.div
        className="admin-layout-two-col"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <motion.section
          className="premium-card form-section"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h2 className="section-title">Buffalo Information</h2>
          {error && (
            <div className="alert alert-error">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="premium-form">
            <FormInput
              label="Name *"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter buffalo name"
              required
            />
            <FormInput
              label="Tag ID"
              name="tagId"
              value={form.tagId}
              onChange={handleChange}
              placeholder="Optional tag identifier"
            />
            <FormInput
              label="Breed"
              name="breed"
              value={form.breed}
              onChange={handleChange}
              placeholder="e.g., Murrah, Jafarabadi"
            />
            <FormInput
              label="Age (years)"
              name="age"
              type="number"
              min="0"
              step="0.5"
              value={form.age}
              onChange={handleChange}
              placeholder="Age in years"
            />
            <div className="form-input-custom">
              <label className="form-label" htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                className="form-input"
                value={form.status}
                onChange={handleChange}
              >
                <option value="active">Active</option>
                <option value="pregnant">Pregnant</option>
                <option value="dry">Dry Period</option>
                <option value="sold">Sold</option>
                <option value="deceased">Deceased</option>
              </select>
            </div>
            <FormInput
              label="Purchase Date"
              name="purchaseDate"
              type="date"
              value={form.purchaseDate}
              onChange={handleChange}
            />
            <div className="form-input-custom">
              <label className="form-label" htmlFor="notes">Notes</label>
              <textarea
                id="notes"
                name="notes"
                className="form-input"
                value={form.notes}
                onChange={handleChange}
                placeholder="Additional notes..."
                rows="3"
              />
            </div>
            <FormInput
              label="Milk Capacity (L/day)"
              name="milkCapacity"
              type="number"
              min="0"
              step="0.1"
              value={form.milkCapacity}
              onChange={handleChange}
              placeholder="Daily milk production"
            />

            <div className="form-actions">
              <Button
                type="submit"
                variant="primary"
                disabled={createMutation.isPending}
                style={{ alignSelf: 'flex-end' }}
              >
                {createMutation.isPending ? 'Adding…' : 'Add Buffalo'}
              </Button>
              <Button variant="secondary" as={Link} to="/admin/buffalo">
                Cancel
              </Button>
            </div>
          </form>
        </motion.section>

        <motion.aside
          className="premium-card"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="section-title">Quick Info</h3>
          <div className="info-list">
            <p>Fill in the basic details to register a new buffalo in your herd.</p>
            <ul>
              <li>Name is required</li>
              <li>Tag ID helps with identification</li>
              <li>Track milk capacity for production planning</li>
              <li>Status helps monitor animal health</li>
            </ul>
          </div>
        </motion.aside>
      </motion.div>
    </div>
  );
};

export default AddBuffalo;
