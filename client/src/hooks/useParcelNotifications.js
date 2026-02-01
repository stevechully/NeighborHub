import { useEffect } from "react";
import { supabase } from "../lib/supabase"; // ✅ make sure this path is correct

export default function useParcelNotifications(userId, onNewParcel) {
  useEffect(() => {
    if (!userId) return;

    console.log("📡 Parcel realtime listener started for:", userId);

    const channel = supabase
      .channel("parcel-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "parcels",
          filter: `resident_id=eq.${userId}`,
        },
        (payload) => {
          console.log("📦 New parcel received realtime:", payload.new);
          if (onNewParcel) onNewParcel(payload.new);
        }
      )
      .subscribe((status) => {
        console.log("📡 Parcel channel status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, onNewParcel]);
}
