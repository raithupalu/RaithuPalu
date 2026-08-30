import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FormInput from '../FormInput';

// ─────────────────────────────────────────────
// CustomerSelect — custom SEARCHABLE dropdown.
//
// Deliberately NOT a native <select>. A native select uses browser type-ahead
// (typing "p" jumps straight to the first name starting with "p"), which is
// not the desired behaviour. Here the user types into a dedicated search input
// that only FILTERS results; nothing is auto-selected. The user must click a
// filtered result to select it.
//
// Two independent states:
//   - `value` (controlled from parent formData.userId)  → the SELECTED customer.
//   - `search` (local)                                  → the text being typed.
// Typing updates `search` only. Clicking a result updates `value`.
// ─────────────────────────────────────────────
export const CustomerSelect = ({ value, onChange, users = [], error }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedUser = users.find((u) => u._id === value);

  const customerLabel = (u) => u.username || u.name || '';

  // Case-insensitive, matches ANYWHERE inside the name.
  const filtered = users.filter((u) =>
    customerLabel(u)
      .toLowerCase()
      .includes(search.toLowerCase().trim())
  );

  // Close when clicking outside the widget.
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Autofocus the search input each time the dropdown opens.
  useEffect(() => {
    if (open && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [open]);

  const handleSelect = (id) => {
    onChange('userId', id); // set the selected customer
    setOpen(false);         // close the dropdown
    setSearch('');          // reset search for next open
  };

  return (
    <div className="form-input-wrapper customer-select-wrapper" ref={containerRef}>
      <label className="form-input-label">Customer</label>

      {/* Trigger / selected value display */}
      <button
        type="button"
        className={`customer-select-trigger ${selectedUser ? '' : 'customer-select-placeholder'}`}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="customer-select-trigger-text">
          {selectedUser ? customerLabel(selectedUser) : 'Select Customer'}
        </span>
        <span className="customer-select-caret">▼</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="customer-select-dropdown"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            role="listbox"
          >
            {/* Dedicated search input. Typing here ONLY filters — never selects. */}
            <div className="customer-select-search">
              <span className="customer-select-search-icon">🔍</span>
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                placeholder="Search customer..."
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="customer-select-list">
              {filtered.length === 0 ? (
                <div className="customer-select-empty">No customers found</div>
              ) : (
                filtered.map((u) => {
                  const isSelected = u._id === value;
                  return (
                    <button
                      key={u._id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className={`customer-select-option ${isSelected ? 'customer-select-option--selected' : ''}`}
                      onClick={() => handleSelect(u._id)}
                    >
                      {customerLabel(u)}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="form-input-error" role="alert">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
};

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