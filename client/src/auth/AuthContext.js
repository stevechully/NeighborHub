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

  // Unified Logout System
  const logout = async () => {
    try {
      // 1. Terminate the Supabase session
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Logout failed:", err.message);
    } finally {
      // 2. Explicitly clear local state
      setUser(null);
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("AuthContext: Session fetch error:", sessionError);
        }

        if (mounted) {
          const sessionUser = session?.user ?? null;
          setUser(sessionUser);

          if (sessionUser) {
            loadProfile(sessionUser.id).then(p => {
              if (mounted) {
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
          setLoading(false);
        }
      }
    }

    initializeAuth();

    // Listen for subsequent auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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

        // ✅ BUG FIXED: Removed the stray setProfile(null) that was here
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}