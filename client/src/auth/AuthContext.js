import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*, roles(name)")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("profile error", error);
      return null;
    }
    return data;
  }

  useEffect(() => {
    let mounted = true;


    async function initializeAuth() {
      try {
        console.log("AuthContext: Starting initialization...");

        // 1. Explicitly check for an existing session on mount
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("AuthContext: Session fetch error:", sessionError);
        }

        if (mounted) {
          const sessionUser = session?.user ?? null;
          console.log("AuthContext: Initial session user:", sessionUser?.email || "none");
          setUser(sessionUser);

          if (sessionUser) {
            console.log("AuthContext: Fetching profile (non-blocking)...");
            // 💡 Don't await profile load here to avoid blocking the UI
            loadProfile(sessionUser.id).then(p => {
              if (mounted) {
                console.log("AuthContext: Profile loaded successfully");
                setProfile(p);
              }
            }).catch(err => {
              console.error("AuthContext: Profile load failed intermittently:", err);
            });
          }
        }
      } catch (err) {
        console.error("AuthContext: Unexpected initialization error:", err);
      } finally {
        if (mounted) {
          console.log("AuthContext: Initialization flow complete, setting loading=false");
          setLoading(false);
        }
      }
    }

    initializeAuth();

    // 2. Listen for subsequent auth state changes (login, logout, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(`AuthContext: Auth event fired: ${event}`);
        if (!mounted) return;

        const sessionUser = session?.user ?? null;
        setUser(sessionUser);

        if (sessionUser) {
          loadProfile(sessionUser.id).then(p => {
            if (mounted) setProfile(p);
          });
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}