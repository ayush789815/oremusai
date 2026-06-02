import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice.js';
import uiReducer from '../features/ui/uiSlice.js';
import clientsReducer from '../features/clients/clientsSlice.js';
import dashboardReducer from '../features/dashboard/dashboardSlice.js';
import filtersReducer from '../features/filters/filtersSlice.js';
import zohoReducer from '../features/zoho/zohoSlice.js';
import qboReducer from '../features/quickbooks/quickbooksSlice.js';
import xeroReducer from '../features/xero/xeroSlice.js';
import reportsReducer from '../features/reports/reportsSlice.js';
import orgsReducer from '../features/orgs/orgsSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    clients: clientsReducer,
    dashboard: dashboardReducer,
    filters: filtersReducer,
    zoho: zohoReducer,
    qbo: qboReducer,
    xero: xeroReducer,
    reports: reportsReducer,
    orgs: orgsReducer,
  },
});

if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
  window.__REDUX_STORE__ = store;
}
