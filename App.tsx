
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { storageService } from './services/storageService';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { InventoryProvider } from './contexts/InventoryContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProductList from './pages/ProductList';
import StockMovement from './pages/StockMovement';
import Reports from './pages/Reports';
import KanbanBoard from './pages/KanbanBoard';
import Attendance from './pages/Attendance';
import CustomerList from './pages/CustomerList';
import Settings from './pages/Settings';
import CustomerContact from './pages/CustomerContact';
import AttendanceReport from './pages/AttendanceReport';
import Devices from './pages/Devices';
import { UserRole, PERMISSIONS } from './types';

const ProtectedRoute = ({ children }: { children?: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const PermissionRoute = ({ permission, children }: { permission: string, children: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === UserRole.ADMIN) return <>{children}</>; // Admin access all

  if (user.role === UserRole.USER && user.permissions?.includes(permission)) {
    return <>{children}</>;
  }

  return <Navigate to="/app/dashboard" replace />;
};

const AdminRoute = ({ children }: { children?: React.ReactNode }) => {
  const { user } = useAuth();
  if (!user || user.role !== UserRole.ADMIN) return <Navigate to="/app/dashboard" replace />;
  return <>{children}</>;
};

const AppHomeRedirect = () => {
  const { user } = useAuth();
  if (user?.role === UserRole.CUSTOMER) {
    return <Navigate to="/app/contact" replace />;
  }
  return <Navigate to="/app/dashboard" replace />;
};

const App = () => {
  useEffect(() => {
    storageService.init();
  }, []);

  return (
    <HashRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <InventoryProvider>
              <Routes>
                {/* Public Route */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />

                {/* Protected App Routes */}
                <Route path="/app" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route path="dashboard" element={<PermissionRoute permission={PERMISSIONS.DASHBOARD}><Dashboard /></PermissionRoute>} />
                  <Route path="kanban" element={<PermissionRoute permission={PERMISSIONS.KANBAN}><KanbanBoard /></PermissionRoute>} />
                  <Route path="attendance" element={<PermissionRoute permission={PERMISSIONS.ATTENDANCE}><Attendance /></PermissionRoute>} />
                  <Route path="attendance-report" element={<PermissionRoute permission={PERMISSIONS.REPORTS}><AttendanceReport /></PermissionRoute>} />
                  <Route path="products" element={<PermissionRoute permission={PERMISSIONS.PRODUCTS}><ProductList /></PermissionRoute>} />
                  <Route path="customers" element={<PermissionRoute permission={PERMISSIONS.CUSTOMERS}><CustomerList /></PermissionRoute>} />
                  <Route path="stock-movement" element={<PermissionRoute permission={PERMISSIONS.STOCK}><StockMovement /></PermissionRoute>} />
                  <Route path="reports" element={<PermissionRoute permission={PERMISSIONS.REPORTS}><Reports /></PermissionRoute>} />
                  <Route path="contact" element={<CustomerContact />} />
                  <Route path="devices" element={<PermissionRoute permission={PERMISSIONS.DEVICES}><Devices /></PermissionRoute>} />

                  {/* Admin Only Route */}
                  <Route path="settings" element={
                    <AdminRoute>
                      <Settings />
                    </AdminRoute>
                  } />

                  {/* Default redirect dynamically based on role */}
                  <Route index element={<AppHomeRedirect />} />
                </Route>

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </InventoryProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </HashRouter>
  );
};

export default App;
