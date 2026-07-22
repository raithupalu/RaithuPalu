import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { buffaloService } from '../services/api';
import Button from './Button';
import './AddBuffaloModal.css';

const AddBuffaloModal = ({ isOpen, onClose, onSuccess }) => {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: '',
    age: '',
    breed: '',
    purchaseDate: '',
    milkCapacity: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const createMutation = useMutation({
    mutationFn: (data) => buffaloService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'buffalo'] });
      setForm({ name: '', age: '', breed: '', purchaseDate: '', milkCapacity: '' });
      setErrors({});
      setSubmitting(false);
      if (onSuccess) onSuccess();
      onClose();
    },
    onError: (err) => {
      setErrors({ submit: err?.response?.data?.message || 'Could not save buffalo' });
      setSubmitting(false);
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.age) newErrors.age = 'Age is required';
    else if (isNaN(form.age) || Number(form.age) < 0) newErrors.age = 'Valid age is required';
    if (!form.breed.trim()) newErrors.breed = 'Breed is required';
    if (!form.purchaseDate) newErrors.purchaseDate = 'Brought date is required';
    if (!form.milkCapacity) newErrors.milkCapacity = 'Milk capacity is required';
    else if (isNaN(form.milkCapacity) || Number(form.milkCapacity) < 0) newErrors.milkCapacity = 'Valid capacity is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    setErrors({});

    const [year, month, day] = form.purchaseDate.split('-').map(Number);
    const purchaseDate = new Date(year, month - 1, day);

    const data = {
      name: form.name.trim(),
      age: Number(form.age),
      breed: form.breed.trim(),
      purchaseDate: purchaseDate,
      milkCapacity: Number(form.milkCapacity),
      status: 'active',
      notes: ''
    };

    createMutation.mutate(data);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="modal-overlay"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="modal-content"
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          <div className="modal-header">
            <h2>Add New Buffalo</h2>
            <button className="modal-close" onClick={onClose} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label>Name / Tag ID *</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter name or tag ID"
                className={errors.name ? 'error' : ''}
              />
              {errors.name && <span className="error-msg">{errors.name}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Age (yrs) *</label>
                <input
                  type="number"
                  name="age"
                  min="0"
                  step="0.5"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="Age in years"
                  className={errors.age ? 'error' : ''}
                />
                {errors.age && <span className="error-msg">{errors.age}</span>}
              </div>

              <div className="form-group">
                <label>Breed *</label>
                <input
                  type="text"
                  name="breed"
                  value={form.breed}
                  onChange={handleChange}
                  placeholder="e.g., Murrah"
                  className={errors.breed ? 'error' : ''}
                />
                {errors.breed && <span className="error-msg">{errors.breed}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Brought Date *</label>
                <input
                  type="date"
                  name="purchaseDate"
                  value={form.purchaseDate}
                  onChange={handleChange}
                  className={errors.purchaseDate ? 'error' : ''}
                />
                {errors.purchaseDate && <span className="error-msg">{errors.purchaseDate}</span>}
              </div>

              <div className="form-group">
                <label>Milk Capacity (L/day) *</label>
                <input
                  type="number"
                  name="milkCapacity"
                  min="0"
                  step="0.1"
                  value={form.milkCapacity}
                  onChange={handleChange}
                  placeholder="Daily production"
                  className={errors.milkCapacity ? 'error' : ''}
                />
                {errors.milkCapacity && <span className="error-msg">{errors.milkCapacity}</span>}
              </div>
            </div>

            {errors.submit && (
              <div className="form-error">{errors.submit}</div>
            )}

            <div className="modal-actions" style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <Button variant="secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting || createMutation.isPending}>
                {submitting || createMutation.isPending ? 'Adding...' : 'Add Buffalo'}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddBuffaloModal;