import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import { PageError, PageLoading } from '../../components/PageState';
import { deliveryService } from '../../services/api';
import './DeliveryPages.css';

const formatDate = (value) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};

const formatDateInput = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getEntryCustomer = (entry) => {
  if (entry.userId && typeof entry.userId === 'object') {
    return entry.userId.name || entry.userId.username || entry.userId.phone || 'Customer';
  }
  return 'Customer';
};

const DeliveryCustomers = () => {
  const customersQuery = useQuery({
    queryKey: ['delivery', 'customers'],
    queryFn: async () => (await deliveryService.getAssignedCustomers()).data,
  });

  if (customersQuery.isPending) return <PageLoading title="Loading assigned customers" />;
  if (customersQuery.isError) {
    return <PageError title="Customers unavailable" message={customersQuery.error.message} onRetry={customersQuery.refetch} />;
  }

  return (
    <div className="admin-page delivery-page">
      <PageHeader title="Assigned Customers" subtitle="Customer profiles and delivery records for your route" />
      {customersQuery.data.length ? (
        <div className="delivery-customer-list">
          {customersQuery.data.map((customer) => (
            <Link className="delivery-customer-row" to={`/delivery/customers/${customer._id}`} key={customer._id}>
              <span className="delivery-customer-avatar" aria-hidden="true">
                {(customer.name || customer.username || 'C').slice(0, 1).toUpperCase()}
              </span>
              <span className="delivery-customer-details">
                <strong>{customer.name || customer.username}</strong>
                <span>{customer.phone || 'No phone number'}</span>
              </span>
              <span className="delivery-customer-open" aria-hidden="true">›</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className="delivery-empty-state">No customers have been assigned to your route yet.</div>
      )}
    </div>
  );
};

const DeliveryCustomerDetails = () => {
  const { customerId } = useParams();
  const queryClient = useQueryClient();
  const [historyPage, setHistoryPage] = useState(1);
  const [entry, setEntry] = useState({
    quantity: '1',
    pricePerLitre: '80',
    session: 'morning',
    date: formatDateInput(),
    notes: '',
  });
  const customerQuery = useQuery({
    queryKey: ['delivery', 'customer', customerId],
    queryFn: async () => (await deliveryService.getAssignedCustomer(customerId)).data,
  });
  const historyQuery = useQuery({
    queryKey: ['delivery', 'customer-milk', customerId, historyPage],
    queryFn: async () => (await deliveryService.getMilkHistory(customerId, { page: historyPage, limit: 20 })).data,
  });
  const createEntry = useMutation({
    mutationFn: () => deliveryService.createMilkEntry({
      userId: customerId,
      ...entry,
      quantity: Number(entry.quantity),
      pricePerLitre: Number(entry.pricePerLitre),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery', 'customer-milk', customerId] });
      queryClient.invalidateQueries({ queryKey: ['delivery', 'milk-history'] });
      setEntry((previous) => ({ ...previous, notes: '' }));
    },
  });

  if (customerQuery.isPending || historyQuery.isPending) return <PageLoading title="Loading customer" />;
  if (customerQuery.isError || historyQuery.isError) {
    const error = customerQuery.error || historyQuery.error;
    return <PageError title="Customer unavailable" message={error.message} onRetry={() => {
      customerQuery.refetch();
      historyQuery.refetch();
    }} />;
  }

  const customer = customerQuery.data;
  const history = historyQuery.data.entries || [];
  const historyPagination = historyQuery.data.pagination;

  return (
    <div className="admin-page delivery-page">
      <Link className="delivery-back-link" to="/delivery">‹ Assigned customers</Link>
      <PageHeader title={customer.name || customer.username} subtitle="Customer profile, milk history, and new delivery entry" />

      <section className="delivery-profile" aria-label="Customer profile">
        <div><span>Name</span><strong>{customer.name || customer.username}</strong></div>
        <div><span>Phone</span><strong>{customer.phone || '—'}</strong></div>
        <div><span>Email</span><strong>{customer.email || '—'}</strong></div>
      </section>

      <section className="delivery-section">
        <h2>Record milk delivery</h2>
        <form className="delivery-entry-form" onSubmit={(event) => {
          event.preventDefault();
          createEntry.mutate();
        }}>
          <label>
            Quantity
            <select value={entry.quantity} onChange={(event) => setEntry({ ...entry, quantity: event.target.value })}>
              {[0.25, 0.5, 0.75, 1, 2, 5].map((quantity) => <option value={quantity} key={quantity}>{quantity} L</option>)}
            </select>
          </label>
          <label>
            Price per litre
            <select value={entry.pricePerLitre} onChange={(event) => setEntry({ ...entry, pricePerLitre: event.target.value })}>
              {[60, 70, 80].map((price) => <option value={price} key={price}>₹{price}</option>)}
            </select>
          </label>
          <label>
            Session
            <select value={entry.session} onChange={(event) => setEntry({ ...entry, session: event.target.value })}>
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
            </select>
          </label>
          <label>
            Date
            <input type="date" value={entry.date} onChange={(event) => setEntry({ ...entry, date: event.target.value })} required />
          </label>
          <label className="delivery-notes-field">
            Notes
            <input value={entry.notes} maxLength={500} onChange={(event) => setEntry({ ...entry, notes: event.target.value })} placeholder="Optional" />
          </label>
          <button className="delivery-primary-button" type="submit" disabled={createEntry.isPending}>
            {createEntry.isPending ? 'Saving…' : 'Save delivery'}
          </button>
          {createEntry.isError && <p className="delivery-form-error" role="alert">{createEntry.error.message}</p>}
          {createEntry.isSuccess && <p className="delivery-form-success" role="status">Delivery saved.</p>}
        </form>
      </section>

      <section className="delivery-section">
        <h2>Milk entry history</h2>
        <div className="delivery-history-list">
          {history.length ? history.map((record) => (
            <article className="delivery-history-row" key={record._id}>
              <div><strong>{formatDate(record.date)}</strong><span>{record.session}</span></div>
              <div><strong>{record.quantity} L</strong><span>₹{record.totalPrice}</span></div>
            </article>
          )) : <div className="delivery-empty-state">No milk entries found for this customer.</div>}
        </div>
        {historyPagination?.pages > 1 && (
          <div className="delivery-pagination">
            <button type="button" onClick={() => setHistoryPage((page) => Math.max(1, page - 1))} disabled={historyPage === 1}>Previous</button>
            <span>Page {historyPagination.page} of {historyPagination.pages}</span>
            <button type="button" onClick={() => setHistoryPage((page) => Math.min(historyPagination.pages, page + 1))} disabled={historyPage >= historyPagination.pages}>Next</button>
          </div>
        )}
      </section>
    </div>
  );
};

const DeliveryMilkHistory = () => {
  const [historyPage, setHistoryPage] = useState(1);
  const historyQuery = useQuery({
    queryKey: ['delivery', 'milk-history', historyPage],
    queryFn: async () => (await deliveryService.getAllMilkHistory({ page: historyPage, limit: 50 })).data,
  });

  if (historyQuery.isPending) return <PageLoading title="Loading milk history" />;
  if (historyQuery.isError) {
    return <PageError title="Milk history unavailable" message={historyQuery.error.message} onRetry={historyQuery.refetch} />;
  }

  return (
    <div className="admin-page delivery-page">
      <PageHeader title="Milk Entry History" subtitle="Recent records for your assigned customers" />
      <div className="delivery-history-list">
        {historyQuery.data.entries?.length ? historyQuery.data.entries.map((entry) => (
          <Link className="delivery-history-row delivery-history-link" to={`/delivery/customers/${entry.userId?._id}`} key={entry._id}>
            <div><strong>{getEntryCustomer(entry)}</strong><span>{formatDate(entry.date)} · {entry.session}</span></div>
            <div><strong>{entry.quantity} L</strong><span>₹{entry.totalPrice}</span></div>
          </Link>
        )) : <div className="delivery-empty-state">No milk entries found.</div>}
      </div>
      {historyQuery.data.pagination?.pages > 1 && (
        <div className="delivery-pagination">
          <button type="button" onClick={() => setHistoryPage((page) => Math.max(1, page - 1))} disabled={historyPage === 1}>Previous</button>
          <span>Page {historyQuery.data.pagination.page} of {historyQuery.data.pagination.pages}</span>
          <button type="button" onClick={() => setHistoryPage((page) => Math.min(historyQuery.data.pagination.pages, page + 1))} disabled={historyPage >= historyQuery.data.pagination.pages}>Next</button>
        </div>
      )}
    </div>
  );
};

export { DeliveryCustomers, DeliveryCustomerDetails, DeliveryMilkHistory };