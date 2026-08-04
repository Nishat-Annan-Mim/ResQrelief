/*
 * Single source of truth for the backend URL.
 *
 * Every component used to hardcode the deployed Render URL, which meant
 * local server changes were invisible to the frontend — you had to deploy
 * to test anything.
 *
 * Override for local development by creating `client/.env.local`:
 *
 *     VITE_API_URL=http://localhost:3001
 *
 * That file is gitignored, so it never affects anyone else or production.
 * With no override, this falls back to the deployed backend, so existing
 * builds and deployments behave exactly as before.
 */
export const BASE_URL =
  import.meta.env.VITE_API_URL || "https://resqrelief-fj7z.onrender.com";

/** Builds an absolute API URL from a path: api("/login") */
export const api = (path = "") =>
  `${BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

export default BASE_URL;
