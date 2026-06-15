// Unified QuickBooks report catalog — the curated report set only.
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
  { id: 'packs',      label: 'Report Packs',          icon: 'FileStack' },
];

export const QB_REPORTS_BY_CAT = {
  financials: [
    { name: 'Profit and Loss',                    liveType: 'profitandloss', fav: true, desc: 'Income, cost of sales, expenses, and net income.' },
    { name: 'Budget Summary',                                                 desc: 'Budgeted totals by account for the period.' },
    { name: 'Budget Variance',                                                desc: 'Actuals vs budget with variance per account.' },
    { name: 'Balance Sheet',                      liveType: 'balancesheet', fav: true, desc: 'Assets, liabilities, and equity snapshot.' },
    { name: 'Cash Flow Statement',                liveType: 'cashflow', fav: true, desc: 'Operating, investing, and financing cash flow.' },
    { name: 'Cash Summary',                                                   desc: 'Cash inflows and outflows broken down by account.' },
    { name: 'Statement of Cash Flows - Indirect',                             desc: 'Indirect-method statement of cash flows.' },
    { name: 'Foreign Currency Gains and Losses',                              desc: 'Realised and unrealised FX results for the period.' },
    { name: 'Year-on-Year Trend',                                             desc: 'P&L compared across the last several years.' },
  ],

  sales: [
    { name: 'Sales by Customer',                                              desc: 'Total sales grouped by customer.' },
    { name: 'Sales by Product / Service Detail',                              desc: 'Line-level revenue per product or service.' },
    { name: 'Receivable Invoice Summary',                                     desc: 'Open invoice totals per customer.' },
    { name: 'Open Sales Orders by Customer',                                  desc: 'Unfulfilled sales orders grouped by customer.' },
    { name: 'Open Sales Orders by Item',                                      desc: 'Unfulfilled sales orders grouped by item.' },
    { name: 'Credit Notes',                                                   desc: 'Credit notes issued and applied.' },
    { name: 'Recurring Invoices',                                             desc: 'Active recurring invoice schedules.' },
    { name: 'Taxable Sales Summary',                                          desc: 'Taxable sales totals by tax rate.' },
    { name: 'Taxable Sales Detail',                                           desc: 'Line-level taxable sales with tax applied.' },
  ],

  arap: [
    { name: 'AR Aging Summary',                   liveType: 'aragingsummary', fav: true, desc: 'Outstanding receivables by ageing bucket.' },
    { name: 'AR Aging Detail',                    liveType: 'aragingdetail', desc: 'Line-level breakdown of overdue invoices.' },
    { name: 'AP Aging Summary',                   liveType: 'apagingsummary', fav: true, desc: 'Payables grouped by ageing bucket.' },
    { name: 'AP Aging Detail',                    liveType: 'apagingdetail', desc: 'Line-level breakdown of unpaid bills.' },
  ],

  purchases: [
    { name: 'Supplier Invoice Summary',                                       desc: 'Total billed per supplier (vendor).' },
    { name: 'Purchases by Vendor',                                            desc: 'Total purchases grouped by vendor.' },
    { name: 'Purchases by Item',                                              desc: 'Items procured with quantity and cost.' },
    { name: 'Purchase Orders Open',                                           desc: 'Purchase orders not yet fully received.' },
    { name: 'Expense Claims',                                                 desc: 'Employee expense claims and reimbursement status.' },
    { name: 'Expenses by Vendor Summary',                                     desc: 'Total spend grouped by vendor.' },
    { name: 'Expenses by Vendor Detail',                                      desc: 'Line-level expenses grouped by vendor.' },
    { name: '1099 Contractor Balance',                                        desc: 'Amounts paid to 1099 contractors (US).' },
    { name: '1099 Contractor Transaction Detail',                             desc: 'Line-level 1099 contractor transactions (US).' },
    { name: 'Recurring Bills',                                                desc: 'Active recurring bill schedules.' },
    { name: 'Vendor Contact List',                                            desc: 'All vendors with contact and balance details.' },
  ],

  inventory: [
    { name: 'Inventory Item Summary',                                         desc: 'On-hand quantity and value per item.' },
    { name: 'Inventory Valuation Detail',                                     desc: 'Line-level inventory valuation per item lot.' },
  ],

  tax: [
    { name: 'GST Returns Workbook',                                           desc: 'Consolidated GST return workbook (GSTR-1/2/3B).' },
    { name: 'TDS Summary',                                                    desc: 'Tax deducted at source per section.' },
    { name: 'Tax Liability',                                                  desc: 'Net tax payable for the period by tax type.' },
    { name: 'GST Audit Report',                                               desc: 'Detail of GST-applied transactions for audit.' },
    { name: 'GST Calculation Worksheet',                                      desc: 'Worksheet computing GST owed or refundable.' },
    { name: 'GST Reconciliation',                                             desc: 'GST control account vs filed return reconciliation.' },
    { name: 'VAT Return',                                                     desc: 'Filing-ready VAT return.' },
  ],

  banking: [
    { name: 'Bank Reconciliation',                                            fav: true, desc: 'Statement vs ledger reconciliation.' },
    { name: 'Bank Book',                                                      desc: 'All bank-account ledger movements.' },
    { name: 'Cash Book',                                                      desc: 'Cash-on-hand ledger movements.' },
    { name: 'Daily Cash Position',                                            desc: 'Closing cash by day across accounts.' },
  ],

  ledger: [
    { name: 'Trial Balance',                      liveType: 'trialbalance', fav: true, desc: 'Debits and credits across every ledger.' },
    { name: 'General Ledger',                     liveType: 'generalledger', desc: 'Every posted transaction grouped by account.' },
    { name: 'Chart of Accounts',                                              desc: 'All accounts with type and balance.' },
    { name: 'Transaction Detail by Account',                                  desc: 'Every posting line grouped under its account.' },
  ],

  currency: [
    { name: 'Currency Revaluation',                                           desc: 'Period-end FX revaluation entries.' },
    { name: 'Realised FX Gain or Loss',                                       desc: 'Settled FX gains and losses.' },
    { name: 'Multi-Currency Balances',                                        desc: 'Balances by currency, then reporting unit.' },
  ],

  packs: [
    { name: 'Management Report Pack',                                         desc: 'Bundled P&L, Balance Sheet, and cash flow for management review.' },
    { name: 'Monthly Board Pack',                                             desc: 'Board-ready monthly performance and KPI pack.' },
    { name: 'Investor Update Pack',                                           desc: 'Summary financials and metrics for investor updates.' },
  ],
};
