import React from 'react';
import AppLayout from './AppLayout';

// Single, canonical dashboard layout. These wrappers keep the existing
// export names (used by the router) while delegating to <AppLayout />.
export const AdminLayout = (props) => <AppLayout role="admin" {...props} />;
export const CustomerLayout = (props) => <AppLayout role="customer" {...props} />;
export const AdminLayoutComponent = () => <AppLayout role="admin" />;
export const CustomerLayoutComponent = () => <AppLayout role="customer" />;

export default AdminLayout;
