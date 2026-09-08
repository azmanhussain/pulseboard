import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './features/auth/LoginPage';
import RegisterPage from './features/auth/RegisterPage';
import ServicesListPage from './features/services/ServicesListPage';
import IncidentsListPage from './features/incidents/IncidentsListPage';
import IncidentDetailPage from './features/incidents/IncidentDetailPage';
import MembersPage from './features/members/MembersPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Protected Dashboard Routes */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/services" replace />} />
          <Route path="/services" element={<ServicesListPage />} />
          <Route path="/incidents" element={<IncidentsListPage />} />
          <Route path="/incidents/:id" element={<IncidentDetailPage />} />
          <Route path="/members" element={<MembersPage />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/services" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
