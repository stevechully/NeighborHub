export default function Topbar() {
    return (
      <header className="h-16 bg-white border-b flex items-center justify-between px-6">
  
        <h1 className="font-semibold text-lg">
          Dashboard
        </h1>
  
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Resident
          </div>
  
          <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
        </div>
  
      </header>
    );
  }