import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
// import CustomerDashboard from './pages/customer/CustomerDashboard';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useIsFetching } from '@tanstack/react-query';
import { useAuth } from './context/AuthContext';
import { subscribeApiLoading, getApiPendingCount } from './services/api';
import TopProgressBar from './components/TopProgressBar';
import LandingPage from './pages/auth/LandingPage';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminLayout from './components/AdminLayout';
import CustomerLayout from './components/CustomerLayout';
import AdminDashboard from './pages/admin/Dashboard';
import MilkEntry from './pages/admin/MilkEntry';
import AdminOrders from './pages/admin/Orders';
import AdminPayments from './pages/admin/Payments';
import Customers from './pages/admin/Customers';
import CustomerDetails from './pages/admin/CustomerDetails';
import Expenses from './pages/admin/Expenses';
import BuffaloList from './pages/admin/BuffaloList';
import AddBuffalo from './pages/admin/Buffalo';
import BuffaloDetails from './pages/admin/BuffaloDetails';
import CustomerDashboard from './pages/customer/Dashboard';
import MilkView from './pages/customer/MilkView';
import CustomerOrders from './pages/customer/Orders';
import CustomerPayments from './pages/customer/Payments';
import ChartPage from './pages/customer/Chart';
import PremiumLoading from './components/PremiumLoading';

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  if (!user) return <Navigate to="/login" />;
  
  if (allowedRole && user.role !== allowedRole) {
    return user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/customer" />;
  }
  
  return children;
};

const App = () => {
  const { loading: authLoading } = useAuth();
  const location = useLocation();
  const isFetching = useIsFetching();
  const apiPending = useSyncExternalStore(subscribeApiLoading, getApiPendingCount);

  // Brief pulse on navigation so even static (cached) routes show a transition.
  const [routePulse, setRoutePulse] = useState(false);
  const isFirstRender = useRef(true);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setRoutePulse(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setRoutePulse(false), 600);
    return () => clearTimeout(timerRef.current);
  }, [location.pathname]);

  // Persistent loader: active while navigating or any async data is in flight.
  const topLoaderActive =
    routePulse || isFetching > 0 || apiPending > 0;

  return (
    <>
      <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/admin" element={
        <ProtectedRoute allowedRole="admin">
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="milk" element={<MilkEntry />} />
        <Route path="buffalo">
          <Route index element={<BuffaloList />} />
          <Route path="add" element={<AddBuffalo />} />
          <Route path=":id" element={<BuffaloDetails />} />
        </Route>
        <Route path="orders" element={<AdminOrders />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="customers" element={<Customers />} />
        <Route path="customers/:id" element={<CustomerDetails />} />
        <Route path="expenses" element={<Expenses />} />
      </Route>
      
      <Route path="/customer" element={
        <ProtectedRoute allowedRole="customer">
          <CustomerLayout />
        </ProtectedRoute>
      }>
        {/* <Route index element={<CustomerDashboard />} /> */}
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
        <Route path="milk" element={<MilkView />} />
        <Route path="orders" element={<CustomerOrders />} />
        <Route path="payments" element={<CustomerPayments />} />
        <Route path="chart" element={<ChartPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      {authLoading && <PremiumLoading />}
      <TopProgressBar active={topLoaderActive} />
    </>
  );
};

export default App;