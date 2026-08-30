import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Button from '../Button';
import FormInput from '../FormInput';
import {
  CustomerSelect,
  SessionSelect,
  PriceSelect,
  QuantitySelector,
} from './MilkEntryFormFields';
import './MilkEntryForm.css';

const ALLOWED_QUANTITIES = [0.25, 0.5, 0.75, 1, 2, 5];
const ALLOWED_PRICES = [60, 70, 80];

const quantityLabels = {
  0.25: '¼ L',
  0.5: '½ L',
  0.75: '¾ L',
  1: '1 L',
  2: '2 L',
  5: '5 L',
};

export const MilkEntryForm = ({
  formData,
  setFormData,
  handleSubmit,
  onSubmit,
  users = [],
  isSubmitting = false,
  banner = null,
  isModal = false,
}) => {
  const [errors, setErrors] = useState({});

  const submitHandler = onSubmit || handleSubmit;

  const validateField = (name, value) => {
    const val = Number(value);

    switch (name) {
      case 'userId':
        return value ? null : 'Select customer';

      case 'quantity':
        if (!value) return 'Select quantity';
        if (!ALLOWED_QUANTITIES.includes(val)) return 'Invalid quantity';
        return null;

      case 'pricePerLitre':
        if (!value) return 'Select price';
        if (!ALLOWED_PRICES.includes(val)) return 'Invalid price';
        return null;

      case 'date':
        return value ? null : 'Select date';

      case 'session':
        return value ? null : 'Select session';

      default:
        return null;
    }
  };

  const validateForm = () => {
    const newErrors = {};

    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const total =
    Number(formData.quantity || 0) *
    Number(formData.pricePerLitre || 0);

  const submitForm = (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    submitHandler &&
      submitHandler({
        ...formData,
        quantity: Number(formData.quantity),
        pricePerLitre: Number(formData.pricePerLitre),
        totalPrice: total,
      });
  };

  return (
    <motion.div
      className={
        isModal
          ? 'milk-entry-form-modal'
          : 'milk-entry-form-standalone premium-card'
      }
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {!isModal && <h2 className="form-title">Milk Entry</h2>}

      {banner && (
        <div className={`alert ${banner.type}`}>{banner.text}</div>
      )}

      {/* id is used so the footer "Save Milk Entry" button (which sits where the
          Confirm button used to be) can submit this form and keep the exact
          same validation + save behaviour. */}
      <form id="milk-entry-form" onSubmit={submitForm} className="milk-entry-form">
        <CustomerSelect
          value={formData.userId}
          onChange={handleChange}
          users={users}
          error={errors.userId}
        />

        <SessionSelect
          value={formData.session}
          onChange={handleChange}
          error={errors.session}
        />

        <QuantitySelector
          value={formData.quantity}
          onChange={handleChange}
          allowedQuantities={ALLOWED_QUANTITIES}
          labels={quantityLabels}
          error={errors.quantity}
        />

        <PriceSelect
          value={formData.pricePerLitre}
          onChange={handleChange}
          allowedPrices={ALLOWED_PRICES}
          error={errors.pricePerLitre}
        />

        <FormInput
          label="Date"
          type="date"
          value={formData.date}
          onChange={(e) => handleChange('date', e.target.value)}
          error={errors.date}
        />

        <div className="calculation-preview">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 700,
            }}
          >
            <span>Total Amount</span>
            <span>₹{total}</span>
          </div>
        </div>

        {/* In modal usage the single "Save Milk Entry" button is rendered in
            the Modal footer (occupying the position of the removed Confirm
            button). For any non-modal/standalone usage, render it here so the
            form still has a submit button. */}
        {!isModal && (
          <Button
            type="submit"
            variant="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Milk Entry'}
          </Button>
        )}
      </form>
    </motion.div>
  );
};

export default MilkEntryForm;