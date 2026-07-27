import React, { useState } from 'react';
import DataTable from '../DataTable';
import EntryTypeBadge from '../EntryTypeBadge';

// ✅ Quantity labels
const quantityLabels = {
  0.25: '¼ L',
  0.5: '½ L',
  0.75: '¾ L',
  1: '1 L',
  2: '2 L',
  5: '5 L',
};

export const MilkEntryTable = ({ entries = [], handleDelete }) => {
  const [deletingId, setDeletingId] = useState(null);

  const onDelete = (id) => {
    if (!window.confirm('Delete this entry?')) return;

    setDeletingId(id);
    handleDelete(id);
  };

  const formatQty = (qty) => {
    return quantityLabels[qty] || `${qty} L`;
  };

  const formatCustomer = (userId) => {
    if (!userId) return '—';
    return userId.username || userId.name || '—';
  };

  const columns = [
    {
      label: 'Date',
      key: 'date',
      render: (val) => (val ? new Date(val).toLocaleDateString('en-IN') : '—'),
    },
    {
      label: 'Customer',
      key: 'userId',
      render: (val) => formatCustomer(val),
    },
    {
      label: 'Qty',
      key: 'quantity',
      className: 'qty-cell',
      render: (val) => formatQty(val),
    },
    {
      label: 'Price/L',
      key: 'pricePerLitre',
      className: 'rate-cell',
      render: (val) => (val ? `₹${val}` : '—'),
    },
    {
      label: 'Total',
      key: 'totalPrice',
      className: 'amount-cell',
      render: (val) => `₹${Number(val || 0).toFixed(2)}`,
    },
    {
      label: 'Session',
      key: 'session',
      render: (val) => <span className="session-badge">{val}</span>,
    },
    {
      label: 'Type',
      key: 'entryType',
      render: (val) => <EntryTypeBadge type={val || 'NORMAL'} />,
    },
    {
      label: '',
      key: '_id',
      render: (val) => (
        <button
          type="button"
          onClick={() => onDelete(val)}
          className="btn-delete"
          disabled={deletingId === val}
        >
          {deletingId === val ? '...' : '🗑️'}
        </button>
      ),
    },
  ];

  return (
    <div className="premium-card">
      <div className="table-header">
        <h2 className="table-title">Recent entries</h2>
        <span className="entry-count">{entries.length} total</span>
      </div>

      {entries.length > 0 ? (
        <DataTable
          columns={columns}
          data={entries}
          emptyMessage="No entries yet — add one."
        />
      ) : (
        <div className="empty-state">
          No entries yet — add one.
        </div>
      )}
    </div>
  );
};