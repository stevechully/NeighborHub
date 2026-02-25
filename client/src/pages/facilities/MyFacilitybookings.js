import React, { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "../../lib/supabase";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function MyFacilityBookings() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    const res = await axios.get(
      `${BACKEND_URL}/facilities/my-bookings`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      }
    );

    setBookings(res.data);
  };

  const requestRefund = async (paymentId) => {
    if (!window.confirm("Request refund for this booking?")) return;

    const {
      data: { session }
    } = await supabase.auth.getSession();

    await axios.post(
      `${BACKEND_URL}/refunds/facility/request`,
      {
        payment_id: paymentId,
        reason: "Change of plans"
      },
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      }
    );

    fetchBookings();
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>My Facility Bookings</h2>

      {bookings.length === 0 && <p>No bookings yet</p>}

      {bookings.map((booking) => (
        <div
          key={booking.id}
          style={{
            border: "1px solid #ddd",
            padding: "15px",
            marginBottom: "15px",
            borderRadius: "10px"
          }}
        >
          <h4>{booking.facilities?.name}</h4>

          <p>
            {new Date(booking.start_time).toLocaleString()} -{" "}
            {new Date(booking.end_time).toLocaleString()}
          </p>

          <p>Status: {booking.status}</p>

          {booking.facility_payments && (
            <>
              <p>
                Payment Status:{" "}
                {booking.facility_payments.refund_status}
              </p>

              {booking.facility_payments.refund_status === "NONE" &&
                booking.status !== "CANCELLED" && (
                  <button
                    style={{
                      backgroundColor: "orange",
                      color: "white"
                    }}
                    onClick={() =>
                      requestRefund(
                        booking.facility_payments.id
                      )
                    }
                  >
                    Request Refund
                  </button>
                )}

              {booking.facility_payments.refund_status ===
                "REQUESTED" && (
                <p style={{ color: "orange" }}>
                  Refund Pending Approval
                </p>
              )}

              {booking.facility_payments.refund_status ===
                "REFUNDED" && (
                <p style={{ color: "green" }}>
                  Refund Completed
                </p>
              )}
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default MyFacilityBookings;