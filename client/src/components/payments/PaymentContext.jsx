import React, { createContext, useContext, useState } from "react";
import PaymentModal from "./PaymentModal";

// 1. Create the Context
const PaymentContext = createContext();

// 2. Create the Custom Hook for easy importing
export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error("usePayment must be used within a PaymentProvider");
  }
  return context;
};

// 3. Create the Provider Wrapper
export const PaymentProvider = ({ children }) => {
  const [paymentConfig, setPaymentConfig] = useState(null);

  const openPayment = ({ module, referenceId, amount, itemName, onSuccess }) => {
    setPaymentConfig({
      module,
      referenceId,
      amount,
      itemName,
      onSuccess,
    });
  };

  const closePayment = () => {
    setPaymentConfig(null);
  };

  return (
    <PaymentContext.Provider value={{ openPayment, closePayment }}>
      {children}
      
      {/* The ONE global modal that handles everything */}
      <PaymentModal
        isOpen={!!paymentConfig}
        onClose={closePayment}
        module={paymentConfig?.module}
        itemName={paymentConfig?.itemName}
        amount={paymentConfig?.amount}
        referenceId={paymentConfig?.referenceId}
        onSuccess={() => {
          if (paymentConfig?.onSuccess) {
            paymentConfig.onSuccess();
          }
          closePayment();
        }}
      />
    </PaymentContext.Provider>
  );
};