import React from 'react';
import AppLayout from './AppLayout';

export const CustomerLayout = (props) => <AppLayout role="customer" {...props} />;
export const CustomerLayoutComponent = () => <AppLayout role="customer" />;

export default CustomerLayout;
