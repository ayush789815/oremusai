// Unified QuickBooks report catalog — the finalized report set only.
// This catalog matches the agreed client report sheet (Reports_v3, 15 Jun 26).
// Reports flagged with a `liveType` use the backend /api/accounting/<liveType>
// endpoint and render real data. Reports without a liveType fall back to the
// mock generator.

export const QB_CATEGORIES = [
  { id: 'all',        label: 'All reports',           icon: 'LayoutGrid' },
  { id: 'financials', label: 'Financials',            icon: 'TrendingUp' },
  { id: 'sales',      label: 'Sales',                 icon: 'ShoppingBag' },
  { id: 'arap',       label: 'Receivables and Payables', icon: 'ArrowLeftRight' },
  { id: 'purchases',  label: 'Purchases and Expenses', icon: 'ShoppingCart' },
  { id: 'inventory',  label: 'Inventory',             icon: 'Boxes' },
  { id: 'tax',        label: 'Taxes',                 icon: 'Percent' },
  { id: 'banking',    label: 'Banking',               icon: 'Landmark' },
  { id: 'ledger',     label: 'Ledger and Accounts',   icon: 'BookOpen' },
  { id: 'currency',   label: 'Currency',              icon: 'Coins' },
];

export const QB_REPORTS_BY_CAT = {
  financials: [
    { name: 'Profit and Loss',                    liveType: 'profitandloss', fav: true, desc: 'Income, cost of sales, expenses, and net income.' },
    { name: 'Executive Summary',                                              desc: 'High-level snapshot of financial performance and position.' },
    { name: 'Budget Summary',                                                 desc: 'Budgeted totals by account for the period.' },
    { name: 'Budget Variance',                                                desc: 'Actuals vs budget with variance per account.' },
    { name: 'Balance Sheet',                      liveType: 'balancesheet', fav: true, desc: 'Assets, liabilities, and equity snapshot.' },
    { name: 'Cash Flow Statement',                liveType: 'cashflow', fav: true, desc: 'Operating, investing, and financing cash flow.' },
    { name: 'Cash Summary',                                                   desc: 'Cash inflows and outflows broken down by account.' },
    { name: 'Statement of Cash Flows - Direct',                               desc: 'Direct-method statement of cash flows.' },
  ],

  sales: [
    { name: 'Sales by Customer',                                              desc: 'Total sales grouped by customer.' },
    { name: 'Sales by Product / Service Detail',  liveType: 'salesbyproductdetail', desc: 'Line-level revenue per product or service.' },
    { name: 'Credit Notes',                                                   desc: 'Credit notes issued and applied.' },
    { name: 'Recurring Invoices',                                             desc: 'Active recurring invoice schedules.' },
  ],

  arap: [
    { name: 'AR Aging Summary',                   liveType: 'aragingsummary', fav: true, desc: 'Outstanding receivables by ageing bucket.' },
    { name: 'AR Aging Detail',                    liveType: 'aragingdetail', desc: 'Line-level breakdown of overdue invoices.' },
    { name: 'AP Aging Summary',                   liveType: 'apagingsummary', fav: true, desc: 'Payables grouped by ageing bucket.' },
    { name: 'AP Aging Detail',                    liveType: 'apagingdetail', desc: 'Line-level breakdown of unpaid bills.' },
  ],

  purchases: [
    { name: 'Supplier Invoice Summary',                                       desc: 'Total billed per supplier (vendor).' },
    { name: 'Recurring Bills',                                                desc: 'Active recurring bill schedules.' },
    { name: 'Purchases by Vendor',                                            desc: 'Total purchases grouped by vendor.' },
    { name: 'Purchases by Item',                                              desc: 'Items procured with quantity and cost.' },
    { name: 'Purchase Orders Open',                                           desc: 'Purchase orders not yet fully received.' },
    { name: '1099 Contractor Balance',                                        desc: 'Amounts paid to 1099 contractors (US).' },
    { name: '1099 Transaction Detail',                                        desc: 'Line-level 1099 contractor transactions (US).' },
    { name: 'Expenses by Vendor Summary',                                     desc: 'Total spend grouped by vendor.' },
    { name: 'Vendor Contact List',                                            desc: 'All vendors with contact and balance details.' },
  ],

  inventory: [
    { name: 'Inventory Item Summary',                                         desc: 'On-hand quantity and value per item.' },
  ],

  tax: [
    { name: 'GST Returns Workbook',                                           desc: 'Consolidated GST return workbook (GSTR-1/2/3B).' },
    { name: 'TDS Summary',                                                    desc: 'Tax deducted at source per section.' },
    { name: 'Tax Liability',                                                  desc: 'Net tax payable for the period by tax type.' },
  ],

  banking: [
    { name: 'Bank Reconciliation',                                            fav: true, desc: 'Statement vs ledger reconciliation.' },
  ],

  ledger: [
    { name: 'Transaction Detail by Account',                                  desc: 'Every posting line grouped under its account.' },
    { name: 'Transaction List by Vendor',                                     desc: 'Every transaction grouped under its vendor.' },
    { name: 'Trial Balance',                      liveType: 'trialbalance', fav: true, desc: 'Debits and credits across every ledger.' },
    { name: 'General Ledger',                     liveType: 'generalledger', desc: 'Every posted transaction grouped by account.' },
    { name: 'Chart of Accounts',                                              desc: 'All accounts with type and balance.' },
  ],

  currency: [
    { name: 'Foreign Currency Gains and Losses',                              desc: 'Realised and unrealised FX results for the period.' },
    { name: 'Realised FX Gain or Loss',                                       desc: 'Settled FX gains and losses.' },
  ],
};
