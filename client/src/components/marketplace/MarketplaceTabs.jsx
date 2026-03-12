import { useState } from "react";

export default function MarketplaceTabs({ browseContent, ordersContent, paymentsContent }) {
  const [activeTab, setActiveTab] = useState("browse");

  const tabStyle = (tab) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition ${
      activeTab === tab
        ? "bg-indigo-600 text-white"
        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
    }`;

  return (
    <div className="space-y-6">

      {/* Tabs */}
      <div className="flex gap-2">

        <button
          onClick={() => setActiveTab("browse")}
          className={tabStyle("browse")}
        >
          Browse Marketplace
        </button>

        <button
          onClick={() => setActiveTab("orders")}
          className={tabStyle("orders")}
        >
          My Orders
        </button>

        <button
          onClick={() => setActiveTab("payments")}
          className={tabStyle("payments")}
        >
          Payments
        </button>

      </div>

      {/* Content */}

      {activeTab === "browse" && browseContent}
      {activeTab === "orders" && ordersContent}
      {activeTab === "payments" && paymentsContent}

    </div>
  );
}