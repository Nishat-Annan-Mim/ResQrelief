import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

/*
 * DEV ONLY — send API calls to the local server instead of the deployed one.
 *
 * Every component hardcodes the Render URL, so in development the app would
 * otherwise talk to the deployed backend and ignore whatever you are running
 * locally. This interceptor rewrites those URLs at request time, so no
 * component code has to change.
 *
 * Controlled by VITE_API_URL in client/.env.local. Delete that file (or the
 * variable) to go back to the deployed backend. Production builds are never
 * affected — import.meta.env.DEV is false there.
 */
const DEPLOYED_API = 'https://resqrelief-fj7z.onrender.com'
const LOCAL_API = import.meta.env.VITE_API_URL

if (import.meta.env.DEV && LOCAL_API) {
  axios.interceptors.request.use((config) => {
    if (config.url?.startsWith(DEPLOYED_API)) {
      config.url = config.url.replace(DEPLOYED_API, LOCAL_API)
    }
    return config
  })
  console.info(`[dev] API calls redirected to ${LOCAL_API}`)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
