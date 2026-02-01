import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function PageLayout({ children }) {
  return (
    <div style={{ 
      display: 'flex', 
      background: '#f5f7fb', // ✅ Modern soft background
      minHeight: '100vh'     // ✅ Ensures background covers full height
    }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Navbar stays at the top */}
        <Navbar />

        {/* Main Content Area */}
        <div style={{ padding: 24 }}> {/* ✅ Increased padding for a more "airy" feel */}
          {children}
        </div>
      </div>
    </div>
  );
}