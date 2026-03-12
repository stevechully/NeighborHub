export default function GreetingBanner({ user }) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-2xl font-semibold">
          Welcome back, {user || "Resident"} 👋
        </h2>
  
        <p className="text-gray-500 mt-1">
          Here is what's happening in your community today.
        </p>
      </div>
    );
  }