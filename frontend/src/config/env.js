// API base URL.
//
// Priority:
//   1. REACT_APP_API_URL environment variable (set on Vercel / local .env)
//   2. Local development default: the backend running on localhost.
//
// The backend listens on the configured local port.
// For production deploys, override REACT_APP_API_URL to your hosted backend.
// Trailing slashes are stripped so axios never sends a doubled path like /api//auth/login.
const raw = process.env.REACT_APP_API_URL || "http://localhost:5000";

export const API_BASE_URL = raw.replace(/\/$/, "");