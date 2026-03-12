import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function AppLayout({ children }) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* Sidebar stays fixed on the left */}
      <Sidebar />

      {/* Main Content wrapper */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        
        {/* Navbar stays at the top of the content area */}
        <Navbar />

        {/* Main Content Area that scrolls independently */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8"> 
          {children}
        </main>
        
      </div>
    </div>
  );
}