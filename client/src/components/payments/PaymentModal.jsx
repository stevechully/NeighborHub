import { useState } from "react";
import QRCode from "react-qr-code";
import { IndianRupee, Loader2, ShieldCheck, Check, ChevronLeft, X } from "lucide-react";
import { confirmPayment } from "../../api/payments.api";

export default function PaymentModal({
  isOpen,
  onClose,
  module,
  itemName,
  amount,
  referenceId,
  onSuccess
}) {
  // ✅ NEW: 4-Step State Machine (METHOD -> PAY -> PROCESSING -> SUCCESS)
  const [step, setStep] = useState("METHOD"); 
  const [method, setMethod] = useState("UPI");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const upiString = `upi://pay?pa=neighborhub@upi&pn=NeighborHub&am=${amount}&cu=INR`;

  const processPayment = async () => {
    try {
      setLoading(true);
      setStep("PROCESSING"); // Transition to loading screen

      await confirmPayment(module, referenceId, amount, method);

      setStep("SUCCESS"); // Transition to success screen

      // Wait 1.5 seconds for the user to see the success checkmark before closing
      setTimeout(() => {
        onSuccess();
        setStep("METHOD"); // Reset for future use
      }, 1500);

    } catch (err) {
      alert(err.message || "Payment failed");
      setStep("METHOD"); // Kick back to method selection on failure
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("METHOD");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100 relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button (Hide during processing/success) */}
        {step !== "PROCESSING" && step !== "SUCCESS" && (
          <button 
            onClick={handleClose} 
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        )}

        {/* Invoice Header (Hide during processing/success) */}
        {(step === "METHOD" || step === "PAY") && (
          <div className="text-center mb-8 mt-2">
            <div className="flex justify-center items-center gap-2 text-indigo-600 mb-3">
              <ShieldCheck size={28} />
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Secure Checkout</h2>
            </div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">{module}</p>
            <h3 className="text-lg font-semibold text-slate-700 leading-tight mt-1">{itemName}</h3>
            
            <div className="flex justify-center items-center gap-1 text-4xl font-black text-indigo-600 mt-4">
              <IndianRupee size={28} strokeWidth={3} />
              {amount}
            </div>
          </div>
        )}

        {/* --- STEP 1: CHOOSE METHOD --- */}
        {step === "METHOD" && (
          <div className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
            <p className="text-sm font-semibold text-slate-500 text-center mb-2">
              Select a payment method
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => { setMethod("UPI"); setStep("PAY"); }}
                className="flex flex-col items-center justify-center gap-2 border-2 border-slate-100 rounded-2xl p-4 hover:border-indigo-500 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 font-semibold transition-all"
              >
                UPI / QR
              </button>

              <button
                onClick={() => { setMethod("CASH"); setStep("PAY"); }}
                className="flex flex-col items-center justify-center gap-2 border-2 border-slate-100 rounded-2xl p-4 hover:border-indigo-500 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 font-semibold transition-all"
              >
                Cash
              </button>
            </div>
          </div>
        )}

        {/* --- STEP 2: PAY UI --- */}
        {step === "PAY" && method === "UPI" && (
          <div className="text-center space-y-5 animate-in slide-in-from-right-2 duration-300">
            <p className="text-sm font-medium text-slate-500">
              Scan using any UPI app
            </p>

            <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm inline-block">
              <QRCode value={upiString} size={160} />
            </div>

            <button
              onClick={processPayment}
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold shadow-md transition-colors"
            >
              Confrim Payment
            </button>

            <button
              onClick={() => setStep("METHOD")}
              className="flex items-center justify-center gap-1 w-full text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ChevronLeft size={16} /> Back to methods
            </button>
          </div>
        )}

        {step === "PAY" && method === "CASH" && (
          <div className="text-center space-y-5 animate-in slide-in-from-right-2 duration-300">
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-2">
              <p className="text-sm font-medium text-amber-800">
                Please visit the community office to pay the exact amount in cash and confirm your booking.
              </p>
            </div>

            <button
              onClick={processPayment}
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-xl font-bold shadow-md transition-colors"
            >
              Confirm Cash Payment
            </button>

            <button
              onClick={() => setStep("METHOD")}
              className="flex items-center justify-center gap-1 w-full text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ChevronLeft size={16} /> Back to methods
            </button>
          </div>
        )}

        {/* --- STEP 3: PROCESSING --- */}
        {step === "PROCESSING" && (
          <div className="text-center py-12 animate-in fade-in duration-300">
            <Loader2 className="animate-spin mx-auto text-indigo-600 mb-4" size={48} />
            <h3 className="text-lg font-bold text-slate-800">Processing Payment</h3>
            <p className="mt-1 text-sm text-slate-500 font-medium">Please do not close this window...</p>
          </div>
        )}

        {/* --- STEP 4: SUCCESS --- */}
        {step === "SUCCESS" && (
          <div className="text-center py-10 animate-in zoom-in duration-300">
            <div className="w-20 h-20 mx-auto bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
              <Check size={40} strokeWidth={3} className="animate-in zoom-in delay-150" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800">Payment Successful</h3>
            <p className="mt-2 text-slate-500 font-medium">Your transaction has been confirmed.</p>
          </div>
        )}

      </div>
    </div>
  );
}