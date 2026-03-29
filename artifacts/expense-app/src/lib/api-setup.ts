import { setAuthTokenGetter } from "@workspace/api-client-react";

// Initialize the generated API client to automatically use our auth token
export function setupApiAuth() {
  setAuthTokenGetter(() => {
    return localStorage.getItem("auth_token");
  });
}
