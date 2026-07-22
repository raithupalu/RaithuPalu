import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { milkService } from '../../services/api';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import DataTable from '../../components/DataTable';
import '../../pages/admin/AdminPages.css';

const CustomerDashboard = () => {
  const [month, setMonth] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM
  );

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['customer-milk', month],
    queryFn: () =>
      milkService.getByUserAndMonth(user._id, month),
  });

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading data</div>;

  const entries = data?.data?.entries || [];
  const totals = data?.data?.totals || {};

  return (
    <div className="admin-page">
      <PageHeader
        title="My Milk Dashboard"
        subtitle="Monthly summary & billing"
      />

      {/* MONTH SELECT */}
      <div style={{ marginBottom: 20 }}>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        />
      </div>

      {/* STATS */}
      <div className="stats-grid">
        <div className="ds-stat-card">
          <div className="stat-label">Total Milk</div>
          <div className="stat-value">
            {totals.totalLitres || 0} L
          </div>
        </div>

        <div className="ds-stat-card">
          <div className="stat-label">Total Amount</div>
          <div className="stat-value">
            ₹{totals.totalPrice || 0}
          </div>
        </div>
      </div>

      {/* DOWNLOAD PDF */}
      <Button
        variant="primary"
        onClick={() =>
          window.open(`/api/pdf/my-report?month=${month}`, '_blank')
        }
      >
        Download Report
      </Button>

      {/* TABLE */}
      <div className="page-card" style={{ marginTop: 20 }}>
        <h3>Daily Entries</h3>

        {entries.length === 0 ? (
          <div>No entries found</div>
        ) : (
          <DataTable
            columns={[
              { label: 'Date', render: (val, row) => new Date(row.date).toLocaleDateString() },
              { label: 'Qty', render: (val, row) => `${row.quantity} L` },
              { label: 'Price', render: (val, row) => `₹${row.pricePerLitre}` },
              { label: 'Total', render: (val, row) => `₹${row.totalPrice}` },
              { label: 'Session', key: 'session' },
            ]}
            data={entries}
          />
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;