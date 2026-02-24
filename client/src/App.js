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







// ✅ Added Imports for Notices and Events
import NoticesPage from "./pages/notices/NoticesPage";
import EventsPage from "./pages/events/EventsPage";

// ✅ Added Imports for Facilities
import FacilitiesPage from "./pages/facilities/FacilitiesPage";
import FacilityBookingsPage from "./pages/facilities/FacilityBookingsPage";

import './App.css'; 

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* ✅ Protected Routes: RequireAuth ensures session is verified before layout renders */}
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <PageLayout>
                  <Dashboard />
                </PageLayout>
              </RequireAuth>
            }
          />

          <Route
            path="/complaints"
            element={
              <RequireAuth>
                <PageLayout>
                  <ComplaintsPage />
                </PageLayout>
              </RequireAuth>
            }
          />

          <Route
            path="/worker-services"
            element={
              <RequireAuth>
                <PageLayout>
                  <WorkerServicesPage />
                </PageLayout>
              </RequireAuth>
            }
          />

          {/* ✅ Added Protected Route - Notices */}
          <Route
            path="/notices"
            element={
              <RequireAuth>
                <PageLayout>
                  <NoticesPage />
                </PageLayout>
              </RequireAuth>
            }
          />

          {/* ✅ Added Protected Route - Events */}
          <Route
            path="/events"
            element={
              <RequireAuth>
                <PageLayout>
                  <EventsPage />
                </PageLayout>
              </RequireAuth>
            }
          />

          {/* ✅ Added Protected Route - Facilities */}
          <Route
            path="/facilities"
            element={
              <RequireAuth>
                <PageLayout>
                  <FacilitiesPage />
                </PageLayout>
              </RequireAuth>
            }
          />

          {/* ✅ Added Protected Route - Facility Bookings */}
          <Route
            path="/facilities/bookings"
            element={
              <RequireAuth>
                <PageLayout>
                  <FacilityBookingsPage />
                </PageLayout>
              </RequireAuth>
            }
          />

<Route
  path="/maintenance"
  element={
    <RequireAuth>
      <PageLayout>
        <MaintenancePage />
      </PageLayout>
    </RequireAuth>
  }
/>
<Route
  path="/payments/:id/receipt"
  element={
    <RequireAuth>
      <PageLayout>
        <ReceiptPage />
      </PageLayout>
    </RequireAuth>
  }
/>

<Route
  path="/gate"
  element={
    <RequireAuth>
      <PageLayout>
        <GateManagementPage />
      </PageLayout>
    </RequireAuth>
  }
/>
<Route
  path="/my-parcels"
  element={
    <RequireAuth>
      <PageLayout>
        <MyParcelsPage />
      </PageLayout>
    </RequireAuth>
  }
/>
<Route
  path="/marketplace"
  element={
    <RequireAuth>
      <PageLayout>
        <MarketplacePage />
      </PageLayout>
    </RequireAuth>
  }
/>
<Route
  path="/marketplace/payments/:id/receipt"
  element={
    <RequireAuth>
      <MarketplaceReceiptPage />
    </RequireAuth>
  }
/>
<Route path="/signup" element={<Signup />} />

<Route
  path="/marketplace/sellers"
  element={
    <RequireAuth>
      <PageLayout>
        <MarketplaceSellersAdminPage />
      </PageLayout>
    </RequireAuth>
  }
/>




          
          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          <Route path="/my-events" element={<MyEvents />} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;