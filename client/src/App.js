import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import RequireAuth from './auth/RequireAuth';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import ComplaintsPage from './pages/complaints/ComplaintsPage';
import PageLayout from './components/PageLayout';
import WorkerServicesPage from "./pages/workerServices/WorkerServicesPage";
import MaintenancePage from "./pages/maintenance/MaintenancePage";
import ReceiptPage from "./pages/payments/ReceiptPage";
import GateManagementPage from "./pages/gate/GateManagementPage";
import MyParcelsPage from "./pages/gate/MyParcelsPage";
import MarketplacePage from "./pages/marketplace/MarketplacePage";
import MarketplaceReceiptPage from "./pages/marketplace/MarketplaceReceiptPage";
import Signup from "./pages/auth/Signup";
import MarketplaceSellersAdminPage from "./pages/marketplace/MarketplaceSellersAdminPage";
import MyEvents from "./pages/events/MyEvents";
import FacilityDetails from "./pages/facilities/FacilityDetails";
import AdminFacilities from "./pages/admin/AdminFacilities";
import NoticesPage from "./pages/notices/NoticesPage";
import EventsPage from "./pages/events/EventsPage";
import FacilitiesPage from "./pages/facilities/FacilitiesPage";
import FacilityBookingsPage from "./pages/facilities/FacilityBookingsPage";
import AdminRefunds from "./pages/admin/AdminRefunds"; // Import the new Refund page

import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Protected Dashboard Routes - All wrapped in PageLayout */}
          <Route path="/dashboard" element={<RequireAuth><PageLayout><Dashboard /></PageLayout></RequireAuth>} />
          <Route path="/complaints" element={<RequireAuth><PageLayout><ComplaintsPage /></PageLayout></RequireAuth>} />
          <Route path="/worker-services" element={<RequireAuth><PageLayout><WorkerServicesPage /></PageLayout></RequireAuth>} />
          <Route path="/notices" element={<RequireAuth><PageLayout><NoticesPage /></PageLayout></RequireAuth>} />
          <Route path="/events" element={<RequireAuth><PageLayout><EventsPage /></PageLayout></RequireAuth>} />
          
          {/* Events & Facilities Sub-pages */}
          <Route path="/my-events" element={<RequireAuth><PageLayout><MyEvents /></PageLayout></RequireAuth>} />
          <Route path="/facilities" element={<RequireAuth><PageLayout><FacilitiesPage /></PageLayout></RequireAuth>} />
          
          {/* Booking Routes */}
          <Route path="/facilities/bookings" element={<RequireAuth><PageLayout><FacilityBookingsPage /></PageLayout></RequireAuth>} />
          <Route path="/facilities/my-bookings" element={<RequireAuth><PageLayout><FacilityBookingsPage /></PageLayout></RequireAuth>} />
          <Route path="/facilities/:id" element={<RequireAuth><PageLayout><FacilityDetails /></PageLayout></RequireAuth>} />
          
          {/* Admin Specific Routes */}
          <Route path="/admin/facilities" element={<RequireAuth><PageLayout><AdminFacilities /></PageLayout></RequireAuth>} />
          <Route path="/admin/refunds" element={<RequireAuth><PageLayout><AdminRefunds /></PageLayout></RequireAuth>} />

          <Route path="/maintenance" element={<RequireAuth><PageLayout><MaintenancePage /></PageLayout></RequireAuth>} />
          <Route path="/gate" element={<RequireAuth><PageLayout><GateManagementPage /></PageLayout></RequireAuth>} />
          <Route path="/my-parcels" element={<RequireAuth><PageLayout><MyParcelsPage /></PageLayout></RequireAuth>} />
          <Route path="/marketplace" element={<RequireAuth><PageLayout><MarketplacePage /></PageLayout></RequireAuth>} />
          <Route path="/marketplace/sellers" element={<RequireAuth><PageLayout><MarketplaceSellersAdminPage /></PageLayout></RequireAuth>} />
          
          {/* Receipt Pages */}
          <Route path="/payments/:id/receipt" element={<RequireAuth><PageLayout><ReceiptPage /></PageLayout></RequireAuth>} />
          <Route path="/marketplace/payments/:id/receipt" element={<RequireAuth><PageLayout><MarketplaceReceiptPage /></PageLayout></RequireAuth>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;