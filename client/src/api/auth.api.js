import { publicFetch } from "./public.api";

export function signupUser(payload) {
  return publicFetch("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
