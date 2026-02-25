import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function PageLayout({ children }) {
  return (
    <div style={{ 
      display: 'flex', 
      background: '#f5f7fb', // ✅ Modern soft background
      minHeight: '100vh',    // ✅ Ensures background covers full height
      maxWidth: '100vw',
      overflowX: 'hidden'
    }}>
      {/* Sidebar stays fixed on the left */}
      <Sidebar />

      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        minWidth: 0 // ✅ Prevents content from pushing the layout wide
      }}>
        {/* Navbar stays at the top of the content area */}
        <Navbar />

        {/* Main Content Area */}
        <main style={{ 
          padding: 24, 
          flex: 1,
          overflowY: 'auto' // ✅ Allows content to scroll independently of the sidebar
        }}> 
          {children}
        </main>
      </div>
    </div>
  );
}