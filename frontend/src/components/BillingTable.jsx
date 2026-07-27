import React from 'react';
import DataTable from './DataTable';
import EntryTypeBadge from './EntryTypeBadge';

const BillingTable = ({ entries = [], totalLitres = 0, totalPrice = 0, month = '' }) => {
  const safeEntries = Array.isArray(entries) ? entries : [];

  if (safeEntries.length === 0) {
    return (
      <div className="empty-state" aria-live="polite">
        <p className="empty-text">No entries for {month}</p>
      </div>
    );
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatQuantity = (qty) => {
    const q = Number(qty || 0);
    return q >= 1 ? `${q}L` : `${q * 1000}ml`;
  };

  const formatPrice = (price) => {
    return `₹${Number(price || 0).toFixed(2)}`;
  };

  const columns = [
    {
      label: 'Date',
      key: 'date',
      className: 'date',
      render: (val) => formatDate(val),
    },
    {
      label: 'Session',
      key: 'session',
      className: 'session',
      style: { textTransform: 'capitalize' },
    },
    {
      label: 'Quantity',
      key: 'quantity',
      className: 'quantity',
      render: (val) => formatQuantity(val),
    },
    {
      label: 'Price',
      key: 'totalPrice',
      className: 'price',
      render: (val) => formatPrice(val),
    },
    {
      label: 'Type',
      key: 'entryType',
      render: (val) => <EntryTypeBadge type={val || 'NORMAL'} />,
    },
  ];

  const footer = (
    <tfoot>
      <tr>
        <td colSpan="2" style={{ fontWeight: 600 }}>Total</td>
        <td style={{ fontWeight: 600 }}>{Number(totalLitres || 0).toFixed(2)}L</td>
        <td style={{ fontWeight: 600, color: '#2d5f3f' }}>
          {formatPrice(totalPrice)}
        </td>
        <td></td>
      </tr>
    </tfoot>
  );

  return (
    <div className="billing-table-container">
      <DataTable
        columns={columns}
        data={safeEntries}
        emptyMessage={`No entries for ${month}`}
        footer={footer}
      />
    </div>
  );
};

export default BillingTable;