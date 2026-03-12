import Sidebar from "./Sidebar";
// ✅ Fixed path: Go up one level (..) out of the 'layout' folder to find Navbar.js
import Navbar from "../Navbar"; 

export default function AppLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50">

      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0">

        <Navbar />

        <main className="p-6 overflow-y-auto">
          {children}
        </main>

      </div>

    </div>
  );
}