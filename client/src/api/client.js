import { supabase } from "../lib/supabase";

const API_BASE = process.env.REACT_APP_API_BASE_URL || "http://localhost:4000";

export async function apiFetch(path, options = {}) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;

  if (!token) {
    throw new Error("Missing auth token. Please login again.");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
      ...(options.headers || {}), // This allows you to override headers if needed
    },
  });

  // Handle empty responses (204 No Content) safely
  if (res.status === 204) return null;

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    // If the server sends a specific error message, use it; otherwise, use status text
    throw new Error(json?.error || json?.message || `Error ${res.status}: ${res.statusText}`);
  }

  return json;
}