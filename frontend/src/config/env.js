// API base URL.
//
// Priority:
//   1. REACT_APP_API_URL environment variable (set on Vercel / local .env)
//   2. Production default: the Render backend.
//
// Production uses https://raithupalu.onrender.com. In local development you can
// point REACT_APP_API_URL at http://localhost:5000. Trailing slashes are
// stripped so axios never sends a doubled path like /api//auth/login.
const raw = process.env.REACT_APP_API_URL || "https://raithupalu.onrender.com";

export const API_BASE_URL = raw.replace(/\/$/, "");