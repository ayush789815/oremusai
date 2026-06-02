// Seed clients for the client switcher
export const SEED_CLIENTS = [
  { id: 'c-acme',      name: 'Acme Logistics Pvt Ltd', company: 'Acme Logistics Pvt Ltd', integration: 'zoho',      connected: true,  status: 'Active' },
  { id: 'c-northbeam', name: 'Northbeam Studios',      company: 'Northbeam Studios LLP',  integration: 'xero',      connected: false, status: 'Active' },
  { id: 'c-luxor',     name: 'Luxor Retail Co.',       company: 'Luxor Retail Co.',       integration: 'quickbook', connected: false, status: 'Pending' },
];

export const INTEGRATIONS = [
  { id: 'zoho',      label: 'Zoho Books', color: '#E42527', initial: 'Z' },
  { id: 'quickbook', label: 'QuickBooks', color: '#2CA01C', initial: 'Q' },
  { id: 'xero',      label: 'Xero',       color: '#13B5EA', initial: 'X' },
];
