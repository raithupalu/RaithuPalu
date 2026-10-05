import React, { useState, useEffect, useRef, useSyncExternalStore, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useIsFetching } from '@tanstack/react-query';
import { useAuth } from './context/AuthContext';
import { subscribeApiLoading, getApiPendingCount } from './services/api';
import TopProgressBar from './components/TopProgressBar';
import PremiumLoading from './components/PremiumLoading';
import GlobalTranslator from './components/GlobalTranslator';

// ─────────────────────────────────────────────
// LAZY-LOADED COMPONENTS (Code-Splitting for Minimal Initial Bundle Size)
// ─────────────────────────────────────────────
const LandingPage = React.lazy(() => import('./pages/auth/LandingPage'));
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const AdminLayout = React.lazy(() => import('./components/AdminLayout'));
const CustomerLayout = React.lazy(() => import('./components/CustomerLayout'));
const WorkerLayout = React.lazy(() => import('./components/WorkerLayout'));
const DeliveryLayout = React.lazy(() => import('./components/DeliveryLayout'));
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const Workers = React.lazy(() => import('./pages/admin/Workers'));
const WorkerDetails = React.lazy(() => import('./pages/admin/WorkerDetails'));
const WorkerAttendanceDetails = React.lazy(() => import('./pages/admin/WorkerAttendanceDetails'));
const MilkEntry = React.lazy(() => import('./pages/admin/MilkEntry'));
const AdminOrders = React.lazy(() => import('./pages/admin/Orders'));
const AdminPayments = React.lazy(() => import('./pages/admin/Payments'));
const Customers = React.lazy(() => import('./pages/admin/Customers'));
const CustomerDetails = React.lazy(() => import('./pages/admin/CustomerDetails'));
const Expenses = React.lazy(() => import('./pages/admin/Expenses'));
const BuffaloList = React.lazy(() => import('./pages/admin/BuffaloList'));
const AddBuffalo = React.lazy(() => import('./pages/admin/Buffalo'));
const BuffaloDetails = React.lazy(() => import('./pages/admin/BuffaloDetails'));
const Broadcast = React.lazy(() => import('./pages/admin/Broadcast'));
const WorkerDashboard = React.lazy(() => import('./pages/worker/Dashboard'));
const WorkerTasks = React.lazy(() => import('./pages/worker/Tasks'));
const WorkerProfile = React.lazy(() => import('./pages/worker/Profile'));
const CustomerDashboard = React.lazy(() => import('./pages/customer/Dashboard'));
const MilkView = React.lazy(() => import('./pages/customer/MilkView'));
const CustomerOrders = React.lazy(() => import('./pages/customer/Orders'));
const CustomerPayments = React.lazy(() => import('./pages/customer/Payments'));
const ChartPage = React.lazy(() => import('./pages/customer/Chart'));
const ProfilePage = React.lazy(() => import('./pages/customer/Profile'));
const DeliveryCustomers = React.lazy(() => import('./pages/delivery/DeliveryPages').then((module) => ({ default: module.DeliveryCustomers })));
const DeliveryCustomerDetails = React.lazy(() => import('./pages/delivery/DeliveryPages').then((module) => ({ default: module.DeliveryCustomerDetails })));
const DeliveryMilkHistory = React.lazy(() => import('./pages/delivery/DeliveryPages').then((module) => ({ default: module.DeliveryMilkHistory })));
const MilkDeliveryAccess = React.lazy(() => import('./pages/admin/MilkDeliveryAccess'));
const MilkDeliveryAccessDetail = React.lazy(() => import('./pages/admin/MilkDeliveryAccess').then((module) => ({ default: module.MilkDeliveryAccessDetail })));

const ProtectedRoute = ({ children, allowedRole }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) return null;
  
  if (!user) {
    const loginPath = location.pathname.startsWith('/delivery') ? '/milk-delivery/login' : '/login';
    return <Navigate to={loginPath} replace />;
  }
  
  if (allowedRole && user.role !== allowedRole) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'milk_delivery_man') return <Navigate to="/delivery" replace />;
    if (user.role === 'worker') return <Navigate to="/worker" replace />;
    return <Navigate to="/customer/dashboard" replace />;
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
      <GlobalTranslator />
      <Suspense fallback={<PremiumLoading />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/milk-delivery/login" element={<Navigate to="/login" replace />} />
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
            <Route path="workers" element={<Workers />} />
            <Route path="workers/:id" element={<WorkerDetails />} />
            <Route path="workers/:workerId/attendance/:date" element={<WorkerAttendanceDetails />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="broadcast" element={<Broadcast />} />
            <Route path="delivery-access" element={<MilkDeliveryAccess />} />
            <Route path="delivery-access/:deliveryManId" element={<MilkDeliveryAccessDetail />} />
          </Route>

          <Route path="/delivery" element={
            <ProtectedRoute allowedRole="milk_delivery_man">
              <DeliveryLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DeliveryCustomers />} />
            <Route path="customers/:customerId" element={<DeliveryCustomerDetails />} />
            <Route path="milk" element={<DeliveryMilkHistory />} />
          </Route>

          <Route path="/worker" element={
            <ProtectedRoute allowedRole="worker">
              <WorkerLayout />
            </ProtectedRoute>
          }>
            <Route index element={<WorkerDashboard />} />
            <Route path="tasks" element={<WorkerTasks />} />
            <Route path="profile" element={<WorkerProfile />} />
          </Route>
          
          <Route path="/customer" element={
            <ProtectedRoute allowedRole="customer">
              <CustomerLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/customer/dashboard" replace />} />
            <Route path="dashboard" element={<CustomerDashboard />} />
            <Route path="milk" element={<MilkView />} />
            <Route path="orders" element={<CustomerOrders />} />
            <Route path="payments" element={<CustomerPayments />} />
            <Route path="chart" element={<ChartPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      {authLoading && <PremiumLoading />}
      <TopProgressBar active={topLoaderActive} />
    </>
  );
};

export default App;