import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import PageHeader from '../../components/PageHeader';
import { PageError, PageLoading } from '../../components/PageState';
import { deliveryService, userService } from '../../services/api';
import './AdminPages.css';
import '../delivery/DeliveryPages.css';

const accessQueryKey = ['admin', 'delivery-access'];
const permissionModules = [
  { value: 'milk_entry', label: 'Milk Entry' },
  { value: 'customer_management', label: 'Customer Management' },
];

const formatPermissionLabel = (moduleName) => permissionModules.find((module) => module.value === moduleName)?.label || 'Access';

const DeliveryAssignmentCard = ({ deliveryUser, customers, selectedIds, onSelectionChange, onSave, saving }) => {
  const selectAllRef = useRef(null);
  const deliveryManId = String(deliveryUser._id);
  const visibleSelectedIds = customers
    .filter((customer) => selectedIds.includes(String(customer._id)))
    .map((customer) => String(customer._id));
  const allSelected = customers.length > 0 && visibleSelectedIds.length === customers.length;

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = visibleSelectedIds.length > 0 && !allSelected;
    }
  }, [allSelected, visibleSelectedIds.length]);

  const toggleCustomer = (customerId) => {
    const nextIds = selectedIds.includes(customerId)
      ? selectedIds.filter((id) => id !== customerId)
      : [...selectedIds, customerId];
    onSelectionChange(deliveryManId, nextIds);
  };

  const toggleAll = () => {
    const visibleIds = customers.map((customer) => String(customer._id));
    const nextIds = allSelected
      ? selectedIds.filter((id) => !visibleIds.includes(id))
      : [...new Set([...selectedIds, ...visibleIds])];
    onSelectionChange(deliveryManId, nextIds);
  };

  return (
    <section className="delivery-access-card">
      <div className="delivery-access-card-header">
        <div>
          <strong>{deliveryUser.name || deliveryUser.username}</strong>
          <span> · {deliveryUser.phone} · {deliveryUser.isActive ? 'Active' : 'Inactive'}</span>
        </div>
        <Link className="delivery-profile-link" to={`/admin/delivery-access/${deliveryManId}`}>
          View profile
        </Link>
      </div>
      <label className="delivery-assignment-option delivery-select-all">
        <input ref={selectAllRef} type="checkbox" checked={allSelected} onChange={toggleAll} disabled={!customers.length} />
        Select all customers ({customers.length})
      </label>
      <div className="delivery-assignment-grid">
        {customers.map((customer) => {
          const customerId = String(customer._id);
          return (
            <label className="delivery-assignment-option" key={customerId}>
              <input type="checkbox" checked={selectedIds.includes(customerId)} onChange={() => toggleCustomer(customerId)} />
              {customer.name || customer.username}
            </label>
          );
        })}
      </div>
      <button className="delivery-primary-button" type="button" disabled={saving} onClick={() => onSave(deliveryManId, visibleSelectedIds)}>
        Save assignments
      </button>
    </section>
  );
};

export const MilkDeliveryAccessDetail = () => {
  const { deliveryManId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [grantForm, setGrantForm] = useState({ module: 'milk_entry', customerLimit: 25, canWrite: true });

  const detailQuery = useQuery({
    queryKey: ['admin', 'delivery-access', deliveryManId],
    queryFn: async () => (await deliveryService.getDeliveryUser(deliveryManId)).data,
    enabled: Boolean(deliveryManId),
  });

  const grantMutation = useMutation({
    mutationFn: () => deliveryService.grantAccess(deliveryManId, grantForm),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accessQueryKey });
      queryClient.invalidateQueries({ queryKey: ['admin', 'delivery-access', deliveryManId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deliveryService.deleteDeliveryUser(deliveryManId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: accessQueryKey });
      navigate('/admin/delivery-access');
    },
  });

  if (detailQuery.isPending) return <PageLoading title="Loading delivery profile" />;
  if (detailQuery.isError) {
    return <PageError title="Delivery profile unavailable" message={detailQuery.error.message} onRetry={() => detailQuery.refetch()} />;
  }

  const user = detailQuery.data;
  const permissions = Array.isArray(user.permissions) ? user.permissions : [];

  const handleDelete = () => {
    if (window.confirm(`Delete ${user.name || user.username} and remove their access?`)) {
      deleteMutation.mutate();
    }
  };

  return (
    <div className="admin-page delivery-page">
      <PageHeader
        title={user.name || user.username}
        subtitle="Manage delivery permissions and profile access"
        showBack
        onBack={() => navigate('/admin/delivery-access')}
      />

      <section className="delivery-profile-card">
        <div className="delivery-profile-grid">
          <div>
            <span>Name</span>
            <strong>{user.name || user.username}</strong>
          </div>
          <div>
            <span>Phone</span>
            <strong>{user.phone}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{user.isActive ? 'Active' : 'Inactive'}</strong>
          </div>
        </div>
      </section>

      <section className="delivery-admin-card delivery-access-section">
        <h2>Give Access</h2>
        <div className="delivery-grant-form">
          <label>
            <span>Module</span>
            <select
              value={grantForm.module}
              onChange={(event) => setGrantForm((previous) => ({ ...previous, module: event.target.value }))}
            >
              {permissionModules.map((module) => (
                <option key={module.value} value={module.value}>{module.label}</option>
              ))}
            </select>
          </label>

          <label>
            <span>Customer limit</span>
            <input
              type="number"
              min="0"
              value={grantForm.customerLimit}
              onChange={(event) => setGrantForm((previous) => ({ ...previous, customerLimit: Number(event.target.value) || 0 }))}
            />
          </label>

          <label className="delivery-checkbox-row">
            <input
              type="checkbox"
              checked={grantForm.canWrite}
              onChange={(event) => setGrantForm((previous) => ({ ...previous, canWrite: event.target.checked }))}
            />
            Allow writes to this module
          </label>

          <button className="delivery-primary-button" type="button" onClick={() => grantMutation.mutate()} disabled={grantMutation.isPending}>
            {grantMutation.isPending ? 'Granting…' : 'Grant'}
          </button>
        </div>

        {grantMutation.isError && <p className="delivery-form-error" role="alert">{grantMutation.error.message}</p>}
        {grantMutation.isSuccess && <p className="delivery-form-success" role="status">Access granted successfully.</p>}
      </section>

      <section className="delivery-admin-card delivery-access-section">
        <h2>Assigned Modules</h2>
        {permissions.length ? (
          <ul className="delivery-permission-list">
            {permissions.map((permission) => (
              <li key={`${permission.module}-${permission.grantedAt}`}>
                <div>
                  <strong>{permission.label || formatPermissionLabel(permission.module)}</strong>
                  <span>{permission.customerLimit ? `${permission.customerLimit} customers allowed` : 'Unlimited access'}</span>
                </div>
                <span>{permission.canWrite ? 'Write access' : 'Read-only'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="delivery-empty-state">No module grants yet. Select a module and click Grant.</p>
        )}
      </section>

      <div className="delivery-profile-actions">
        <button className="delivery-danger-button" type="button" onClick={handleDelete} disabled={deleteMutation.isPending}>
          {deleteMutation.isPending ? 'Deleting…' : 'Delete Delivery Man'}
        </button>
      </div>
    </div>
  );
};

const MilkDeliveryAccess = () => {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', password: '' });
  const [assignmentDrafts, setAssignmentDrafts] = useState({});

  const usersQuery = useQuery({
    queryKey: accessQueryKey,
    queryFn: async () => (await deliveryService.getDeliveryUsers()).data,
  });
  const customersQuery = useQuery({
    queryKey: ['admin', 'customers'],
    queryFn: async () => (await userService.getAll()).data,
  });

  useEffect(() => {
    if (!usersQuery.data) return;
    setAssignmentDrafts(Object.fromEntries(
      usersQuery.data.map((user) => [String(user._id), user.assignedCustomerIds || []])
    ));
  }, [usersQuery.data]);

  const createUser = useMutation({
    mutationFn: () => deliveryService.createDeliveryUser(form),
    onSuccess: () => {
      setForm({ name: '', phone: '', password: '' });
      setShowCreateForm(false);
      queryClient.invalidateQueries({ queryKey: accessQueryKey });
    },
  });

  const saveAssignments = useMutation({
    mutationFn: ({ deliveryManId, customerIds }) => deliveryService.updateAssignments(deliveryManId, customerIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: accessQueryKey }),
  });

  if (usersQuery.isPending || customersQuery.isPending) return <PageLoading title="Loading delivery access" />;
  if (usersQuery.isError || customersQuery.isError) {
    const error = usersQuery.error || customersQuery.error;
    return <PageError title="Delivery access unavailable" message={error.message} onRetry={() => {
      usersQuery.refetch();
      customersQuery.refetch();
    }} />;
  }

  const customers = customersQuery.data.filter((user) => user.role === 'customer' && user.isActive !== false);

  return (
    <div className="admin-page delivery-page">
      <PageHeader
        title="Delivery Man Management"
        subtitle="Create delivery users, assign customer routes, and grant module-level access"
        actionLabel="Add Delivery Man"
        onAction={() => setShowCreateForm((previous) => !previous)}
      />

      {showCreateForm && (
        <form
          className="delivery-admin-form delivery-panel"
          onSubmit={(event) => {
            event.preventDefault();
            createUser.mutate();
          }}
        >
          <input aria-label="Delivery user's full name" required maxLength={80} placeholder="Full name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          <input aria-label="Delivery user's phone number" required type="tel" placeholder="Phone number" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          <input aria-label="Initial password" required type="password" minLength={8} placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
          <div className="delivery-form-actions">
            <button type="button" className="delivery-secondary-button" onClick={() => setShowCreateForm(false)}>
              Cancel
            </button>
            <button className="delivery-primary-button" type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? 'Submitting…' : 'Submit'}
            </button>
          </div>
          {createUser.isError && <p className="delivery-form-error" role="alert">{createUser.error.message}</p>}
          {createUser.isSuccess && <p className="delivery-form-success" role="status">Delivery account created.</p>}
        </form>
      )}

      <div className="delivery-access-list">
        {usersQuery.data.length ? usersQuery.data.map((deliveryUser) => {
          const deliveryManId = String(deliveryUser._id);
          const selectedIds = assignmentDrafts[deliveryManId] || [];
          const accessBadges = Array.isArray(deliveryUser.permissions) ? deliveryUser.permissions : [];

          return (
            <div key={deliveryManId} className="delivery-access-card">
              <div className="delivery-access-card-header">
                <div className="delivery-access-summary">
                  <strong>{deliveryUser.name || deliveryUser.username}</strong>
                  <span>{deliveryUser.phone}</span>
                </div>
                <div className="delivery-access-actions">
                  <Link className="delivery-profile-link" to={`/admin/delivery-access/${deliveryManId}`}>
                    Open profile
                  </Link>
                </div>
              </div>

              <div className="delivery-access-meta">
                <span>{deliveryUser.isActive ? 'Active' : 'Inactive'}</span>
                {accessBadges.length ? (
                  <div className="delivery-badge-row">
                    {accessBadges.map((permission) => (
                      <span key={`${deliveryManId}-${permission.module}`} className="delivery-badge">
                        {permission.label || formatPermissionLabel(permission.module)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="delivery-muted">No module grants</span>
                )}
              </div>

              <DeliveryAssignmentCard
                deliveryUser={deliveryUser}
                customers={customers}
                selectedIds={selectedIds}
                onSelectionChange={(id, customerIds) => setAssignmentDrafts((previous) => ({ ...previous, [id]: customerIds }))}
                onSave={(id, customerIds) => saveAssignments.mutate({ deliveryManId: id, customerIds })}
                saving={saveAssignments.isPending}
              />
            </div>
          );
        }) : <div className="delivery-empty-state">No delivery men have been created yet.</div>}
      </div>
      {saveAssignments.isError && <p className="delivery-form-error" role="alert">{saveAssignments.error.message}</p>}
      {saveAssignments.isSuccess && <p className="delivery-form-success" role="status">Assignments saved.</p>}
    </div>
  );
};

export default MilkDeliveryAccess;