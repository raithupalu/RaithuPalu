import React from 'react';
import FormInput from '../FormInput';

export const CustomerSelect = ({ value, onChange, users = [], error }) => (
  <FormInput
    label="Customer"
    type="select"
    placeholder="Select Customer"
    value={value}
    onChange={(e) => onChange('userId', e.target.value)}
    options={users.map((u) => ({ value: u._id, label: u.username }))}
    error={error}
  />
);

export const SessionSelect = ({ value, onChange, error }) => (
  <FormInput
    label="Session"
    type="select"
    placeholder="Session"
    value={value}
    onChange={(e) => onChange('session', e.target.value)}
    options={[
      { value: 'morning', label: 'Morning' },
      { value: 'evening', label: 'Evening' },
    ]}
    error={error}
  />
);

export const PriceSelect = ({ value, onChange, allowedPrices = [], error }) => (
  <FormInput
    label="Price"
    type="select"
    placeholder="Select Price"
    value={value}
    onChange={(e) => onChange('pricePerLitre', Number(e.target.value))}
    options={allowedPrices.map((p) => ({ value: p, label: `₹${p}` }))}
    error={error}
  />
);

export const QuantitySelector = ({ value, onChange, allowedQuantities = [], labels = {}, error }) => (
  <div className="form-input-wrapper">
    <label className="form-input-label">Quantity</label>
    <div className="quantity-selector">
      {allowedQuantities.map((qty) => (
        <button
          key={qty}
          type="button"
          className={
            value === qty
              ? 'quantity-btn quantity-btn--selected'
              : 'quantity-btn'
          }
          onClick={() => onChange('quantity', qty)}
        >
          {labels[qty] || `${qty} L`}
        </button>
      ))}
    </div>
    {error && <div className="form-input-error" role="alert">⚠️ {error}</div>}
  </div>
);
