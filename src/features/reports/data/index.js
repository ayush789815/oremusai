// Aggregator that maps a provider id ('zoho' | 'quickbooks' | 'xero') to its
// category list, report-by-category dictionary, and a flattened "all reports"
// list. Used by reportsSlice and any component that needs provider-scoped
// catalog access.

import { ZOHO_CATEGORIES,  ZOHO_REPORTS_BY_CAT } from './zoho.js';
import { QB_CATEGORIES,    QB_REPORTS_BY_CAT }   from './quickbooks.js';
import { XERO_CATEGORIES,  XERO_REPORTS_BY_CAT } from './xero.js';

function flatten(byCat) {
  return Object.entries(byCat).flatMap(([cat, list]) =>
    list.map((r) => ({ ...r, category: cat })),
  );
}

export const CATALOGS = {
  zoho: {
    categories:       ZOHO_CATEGORIES,
    reportsByCategory: ZOHO_REPORTS_BY_CAT,
    allReports:       flatten(ZOHO_REPORTS_BY_CAT),
  },
  quickbooks: {
    categories:       QB_CATEGORIES,
    reportsByCategory: QB_REPORTS_BY_CAT,
    allReports:       flatten(QB_REPORTS_BY_CAT),
  },
  xero: {
    categories:       XERO_CATEGORIES,
    reportsByCategory: XERO_REPORTS_BY_CAT,
    allReports:       flatten(XERO_REPORTS_BY_CAT),
  },
};

export function getCatalog(providerId) {
  return CATALOGS[providerId] || CATALOGS.zoho;
}
