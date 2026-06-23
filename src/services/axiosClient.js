import axios from 'axios';
import { getSelectedOrgId } from '../features/orgs/orgsSlice.js';
import { getViewAsClientId } from '../features/viewAs/viewAsSlice.js';

// In development Vite proxies /api → http://localhost:5001/api (no CORS).
// In production set VITE_API_URL to the deployed backend origin.
const BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

const axiosClient = axios.create({
  baseURL: BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

axiosClient.interceptors.request.use((config) => {
  try {
    const raw   = localStorage.getItem('oremus_current_v1');
    const token = raw ? JSON.parse(raw)?.token : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  try {
    // Admin "view as client" takes precedence — the backend resolves the
    // client's own org, so the admin's X-Org-Id must NOT be sent alongside it.
    const viewAsClientId = getViewAsClientId();
    if (viewAsClientId) {
      config.headers['X-Client-Id'] = viewAsClientId;
    } else {
      const orgId = getSelectedOrgId();
      if (orgId) config.headers['X-Org-Id'] = orgId;
    }
  } catch {}
  return config;
});

axiosClient.interceptors.response.use(
  (r) => r,
  (err) => Promise.reject(err)
);

export default axiosClient;
