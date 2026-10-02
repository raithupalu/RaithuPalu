// API base URL.
//
// Priority:
//   1. REACT_APP_API_URL environment variable (set on Vercel / local .env)
//   2. Production fallback: deployed Render backend
//   3. Local development fallback: backend running on localhost
//
// This keeps localhost only for local development while production builds target
// the deployed API instead of accidentally calling a local development server.
const raw =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === "production" ? "https://raithupalu.onrender.com" : "http://localhost:5000");

export const API_BASE_URL = raw.replace(/\/$/, "");