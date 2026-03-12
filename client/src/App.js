import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import RequireAuth from './auth/RequireAuth';
import RequireRole from './auth/RequireRole'; // ✅ Added Role Protector

// Layout & Styling
import AppLayout from "./components/layout/AppLayout";
import './App.css'; 

// Auth Pages
import Login from './pages/auth/Login';
import Signup from "./pages/auth/Signup";

// Feature Pages
import Dashboard from './pages/dashboard/Dashboard';
import ComplaintsPage from './pages/complaints/ComplaintsPage';
import WorkerServicesPage from "./pages/workerServices/WorkerServicesPage";
import MaintenancePage from "./pages/maintenance/MaintenancePage";
import ReceiptPage from "./pages/payments/ReceiptPage";
import GateManagementPage from "./pages/gate/GateManagementPage";
import MyParcelsPage from "./pages/gate/MyParcelsPage";
import MarketplacePage from "./pages/marketplace/MarketplacePage";
import MarketplaceReceiptPage from "./pages/marketplace/MarketplaceReceiptPage";
import MarketplaceSellersAdminPage from "./pages/marketplace/MarketplaceSellersAdminPage";
import MyEvents from "./pages/events/MyEvents";
import FacilityDetails from "./pages/facilities/FacilityDetails";
import AdminFacilities from "./pages/admin/AdminFacilities";
import NoticesPage from "./pages/notices/NoticesPage";
import EventsPage from "./pages/events/EventsPage";
import FacilitiesPage from "./pages/facilities/FacilitiesPage";
import FacilityBookingsPage from "./pages/facilities/FacilityBookingsPage";
import AdminRefunds from "./pages/admin/AdminRefunds";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes - No Layout Needed */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 🟢 GLOBAL PROTECTED ROUTES (All authenticated users can access) */}
          <Route path="/dashboard" element={<RequireAuth><AppLayout><Dashboard /></AppLayout></RequireAuth>} />
          <Route path="/marketplace" element={<RequireAuth><AppLayout><MarketplacePage /></AppLayout></RequireAuth>} />
          <Route path="/payments/:id/receipt" element={<RequireAuth><AppLayout><ReceiptPage /></AppLayout></RequireAuth>} />
          <Route path="/marketplace/payments/:id/receipt" element={<RequireAuth><AppLayout><MarketplaceReceiptPage /></AppLayout></RequireAuth>} />

          {/* 🔵 MULTI-ROLE ROUTES (Residents, Workers, Admins) */}
          <Route path="/complaints" element={
            <RequireAuth><RequireRole allowedRoles={["RESIDENT", "WORKER", "ADMIN"]}><AppLayout><ComplaintsPage /></AppLayout></RequireRole></RequireAuth>
          } />
          <Route path="/worker-services" element={
            <RequireAuth><RequireRole allowedRoles={["RESIDENT", "WORKER", "ADMIN"]}><AppLayout><WorkerServicesPage /></AppLayout></RequireRole></RequireAuth>
          } />

          {/* 🟠 RESIDENT & ADMIN ROUTES */}
          <Route path="/notices" element={
            <RequireAuth><RequireRole allowedRoles={["RESIDENT", "ADMIN"]}><AppLayout><NoticesPage /></AppLayout></RequireRole></RequireAuth>
          } />
          <Route path="/events" element={
            <RequireAuth><RequireRole allowedRoles={["RESIDENT", "ADMIN"]}><AppLayout><EventsPage /></AppLayout></RequireRole></RequireAuth>
          } />
          <Route path="/facilities" element={
            <RequireAuth><RequireRole allowedRoles={["RESIDENT", "ADMIN"]}><AppLayout><FacilitiesPage /></AppLayout></RequireRole></RequireAuth>
          } />
          <Route path="/facilities/:id" element={
            <RequireAuth><RequireRole allowedRoles={["RESIDENT", "ADMIN"]}><AppLayout><FacilityDetails /></AppLayout></RequireRole></RequireAuth>
          } />
          <Route path="/maintenance" element={
            <RequireAuth><RequireRole allowedRoles={["RESIDENT", "ADMIN"]}><AppLayout><MaintenancePage /></AppLayout></RequireRole></RequireAuth>
          } />

          {/* 🟣 RESIDENT ONLY ROUTES */}
          <Route path="/my-events" element={
            <RequireAuth><RequireRole allowedRoles={["RESIDENT"]}><AppLayout><MyEvents /></AppLayout></RequireRole></RequireAuth>
          } />
          <Route path="/my-parcels" element={
            <RequireAuth><RequireRole allowedRoles={["RESIDENT"]}><AppLayout><MyParcelsPage /></AppLayout></RequireRole></RequireAuth>
          } />
          <Route path="/facilities/my-bookings" element={
            <RequireAuth><RequireRole allowedRoles={["RESIDENT"]}><AppLayout><FacilityBookingsPage /></AppLayout></RequireRole></RequireAuth>
          } />

          {/* 🛡️ SECURITY & ADMIN ROUTES */}
          <Route path="/gate" element={
            <RequireAuth><RequireRole allowedRoles={["SECURITY", "ADMIN"]}><AppLayout><GateManagementPage /></AppLayout></RequireRole></RequireAuth>
          } />

          {/* 🔴 ADMIN ONLY ROUTES */}
          <Route path="/facilities/bookings" element={
            <RequireAuth><RequireRole allowedRoles={["ADMIN"]}><AppLayout><FacilityBookingsPage /></AppLayout></RequireRole></RequireAuth>
          } />
          <Route path="/admin/facilities" element={
            <RequireAuth><RequireRole allowedRoles={["ADMIN"]}><AppLayout><AdminFacilities /></AppLayout></RequireRole></RequireAuth>
          } />
          <Route path="/admin/refunds" element={
            <RequireAuth><RequireRole allowedRoles={["ADMIN"]}><AppLayout><AdminRefunds /></AppLayout></RequireRole></RequireAuth>
          } />
          <Route path="/marketplace/sellers" element={
            <RequireAuth><RequireRole allowedRoles={["ADMIN"]}><AppLayout><MarketplaceSellersAdminPage /></AppLayout></RequireRole></RequireAuth>
          } />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;