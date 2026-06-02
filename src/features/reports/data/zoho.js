// Zoho Books-style report catalog (86 reports across Zoho's official categories).
// Reports flagged with a `liveType` use the backend /api/zb-reports/<liveType>
// endpoint and render real Zoho data. Reports without a liveType fall back to
// the mock generator.

export const ZOHO_CATEGORIES = [
  { id: 'all',         label: 'All reports',          icon: 'LayoutGrid' },
  { id: 'business',    label: 'Business Overview',    icon: 'Building2' },
  { id: 'sales',       label: 'Sales',                icon: 'TrendingUp' },
  { id: 'receivables', label: 'Receivables',          icon: 'ArrowDownToLine' },
  { id: 'payments',    label: 'Payments Received',    icon: 'CreditCard' },
  { id: 'recurring',   label: 'Recurring Invoices',   icon: 'RotateCcw' },
  { id: 'payables',    label: 'Payables',             icon: 'ArrowUpFromLine' },
  { id: 'purchases',   label: 'Purchases and Expenses', icon: 'ShoppingCart' },
  { id: 'inventory',   label: 'Inventory',            icon: 'Boxes' },
  { id: 'tax',         label: 'Taxes',                icon: 'Percent' },
  { id: 'banking',     label: 'Banking',              icon: 'Landmark' },
  { id: 'projects',    label: 'Projects and Timesheet', icon: 'FolderKanban' },
  { id: 'accountant',  label: 'Accountant',           icon: 'BookOpen' },
  { id: 'currency',    label: 'Currency',             icon: 'Coins' },
  { id: 'activity',    label: 'Activity',             icon: 'Activity' },
];

export const ZOHO_REPORTS_BY_CAT = {
  // ── 1. Business Overview (9) ──
  business: [
    { name: 'Profit and Loss',              liveType: 'profitandloss',            fav: true, desc: 'Revenue, expenses, and net income for the period.' },
    { name: 'Profit and Loss (Schedule III)', liveType: 'profitandlossscheduleiii', desc: 'Schedule III-compliant P&L layout (Indian Companies Act).' },
    { name: 'Horizontal Profit and Loss',   liveType: 'horizontalprofitandloss',  desc: 'Income on one side, Expense on the other (T-format).' },
    { name: 'Cash Flow Statement',          liveType: 'cashflow',                 fav: true, desc: 'Operating, investing & financing cash flows.' },
    { name: 'Balance Sheet',                liveType: 'balancesheet',             fav: true, desc: 'Assets, liabilities, and equity as of a date.' },
    { name: 'Horizontal Balance Sheet',     liveType: 'horizontalbalancesheet',   desc: 'Side-by-side comparison of two periods.' },
    { name: 'Balance Sheet (Schedule III)', liveType: 'balancesheetscheduleiii',  desc: 'Schedule III-compliant balance sheet.' },
    { name: 'Business Performance Ratios',                                       desc: 'Liquidity, leverage and profitability ratios.' },
    { name: 'Movement of Equity',           liveType: 'movementofequity',        desc: 'Opening to closing equity reconciliation.' },
  ],

  // ── 2. Sales (7) ──
  sales: [
    { name: 'Sales by Customer',            liveType: 'salesbycustomer',         desc: 'Total sales grouped by customer.' },
    { name: 'Sales by Item',                liveType: 'salesbyitem',             desc: 'Units and revenue per item.' },
    { name: 'Sales by Sales Person',        liveType: 'salesbysalesperson',      desc: 'Bookings and closed revenue per rep.' },
    { name: 'Sales Return History',                                              desc: 'Sales returns / credit memos issued.' },
    { name: 'Order Fulfilment by Item',                                          desc: 'Open, partial, fulfilled per item.' },
    { name: 'Packing History',                                                   desc: 'Packing slips issued in the period.' },
    { name: 'Inventory Sales Summary',                                           desc: 'Items sold with stock movement.' },
  ],

  // ── 3. Receivables (8) ──
  receivables: [
    { name: 'Customer Balances',            liveType: 'customerbalance',         desc: 'Current outstanding for every customer.' },
    { name: 'Customer Balance Summary',     liveType: 'customerbalancesummary',  desc: 'Invoiced, received, closing balance per customer.' },
    { name: 'AR Aging Summary',             liveType: 'aragingsummary',          fav: true, desc: 'Outstanding receivables by ageing bucket.' },
    { name: 'AR Aging Details',                                                  desc: 'Line-level breakdown of overdue invoices.' },
    { name: 'Invoice Details',              liveType: 'invoicedetails',          desc: 'Every issued invoice with status & balance.' },
    { name: 'Sales Order Details',          liveType: 'salesorderdetails',       desc: 'Sales orders with status, customer, total.' },
    { name: 'Estimate Details',             liveType: 'estimatedetails',         desc: 'All estimates with status & value.' },
    { name: 'Delivery Challan Details',     liveType: 'deliverychallandetails',  desc: 'Goods delivered to customers.' },
  ],

  // ── 4. Payments Received (4) ──
  payments: [
    { name: 'Payments Received',                                                 desc: 'Inbound payments grouped by method.' },
    { name: 'Time to Get Paid',                                                  desc: 'Average days to settle invoices.' },
    { name: 'Credit Note Details',          liveType: 'creditnotedetails',       desc: 'Credit notes issued and applied.' },
    { name: 'Refund History',               liveType: 'refundhistory',           desc: 'Refunds issued in the selected window.' },
  ],

  // ── 5. Recurring Invoices (1) ──
  recurring: [
    { name: 'Recurring Invoice Details',    liveType: 'recurringinvoicedetails', desc: 'Active recurring invoice schedules.' },
  ],

  // ── 6. Payables (8) ──
  payables: [
    { name: 'Vendor Balances',              liveType: 'vendorbalance',           desc: 'Current balance for every vendor.' },
    { name: 'Vendor Balance Summary',       liveType: 'vendorbalancesummary',    desc: 'Billed, paid, closing balance per vendor.' },
    { name: 'AP Aging Summary',             liveType: 'apagingsummary',          fav: true, desc: 'Payables grouped by ageing bucket.' },
    { name: 'AP Aging Details',                                                  desc: 'Line-level breakdown of unpaid bills.' },
    { name: 'Bill Details',                 liveType: 'billdetails',             desc: 'All bills with status & balance.' },
    { name: 'Vendor Credit Details',        liveType: 'vendorcreditdetails',     desc: 'Vendor credits issued and applied.' },
    { name: 'Payments Made',                                                     desc: 'Outbound payments grouped by method.' },
    { name: 'Refunds Received',                                                  desc: 'Refunds received from vendors.' },
  ],

  // ── 7. Purchases and Expenses (10) ──
  purchases: [
    { name: 'Purchases by Vendor',                                               desc: 'Total purchases grouped by vendor.' },
    { name: 'Purchases by Item',                                                 desc: 'Items procured with quantity and cost.' },
    { name: 'Purchase Order Details',       liveType: 'purchaseorderdetails',    desc: 'All purchase orders with status.' },
    { name: 'Expense Details',                                                   desc: 'Every expense entry with category & vendor.' },
    { name: 'Expenses by Category',         liveType: 'expensesbycategory',      desc: 'Spend rolled up by expense account.' },
    { name: 'Expenses by Customer',                                              desc: 'Billable / non-billable expense by customer.' },
    { name: 'Expenses by Project',          liveType: 'expensesbyproject',       desc: 'Spend rolled up by project.' },
    { name: 'Expenses by Employee',         liveType: 'expensesbyemployee',      desc: 'Spend rolled up by employee.' },
    { name: 'Mileage Expenses Details',                                          desc: 'Mileage claims with distance and amount.' },
    { name: 'Billable Expenses Details',                                         desc: 'Expenses ready to invoice to customers.' },
  ],

  // ── 8. Inventory (6) ──
  inventory: [
    { name: 'Inventory Summary',            liveType: 'inventorysummary',        desc: 'Opening, purchased, sold, closing stock.' },
    { name: 'Inventory Valuation Summary',                                       desc: 'Stock on hand at cost & retail.' },
    { name: 'FIFO Cost Lot Tracking',                                            desc: 'Cost lots in FIFO order per item.' },
    { name: 'Inventory Aging Summary',                                           desc: 'Stock-age buckets per warehouse.' },
    { name: 'Stock Summary Report',                                              desc: 'Per-warehouse stock movements.' },
    { name: 'Product Sales Report',                                              desc: 'Product-wise revenue and margin.' },
  ],

  // ── 9. Taxes (6) ──
  tax: [
    { name: 'Tax Summary',                  liveType: 'taxsummary',              fav: true, desc: 'Output and input tax by rate.' },
    { name: 'Tax Details',                                                       desc: 'Per-transaction tax lines.' },
    { name: 'GSTR-1 (Outward Supplies)',                                         desc: 'GST returns workbook — sales.' },
    { name: 'GSTR-2 (Inward Supplies)',                                          desc: 'GST returns workbook — purchases.' },
    { name: 'GSTR-3B Summary',                                                   desc: 'Monthly GSTR-3B summary.' },
    { name: 'TDS Summary',                                                       desc: 'Tax deducted at source per section.' },
  ],

  // ── 10. Banking (4) ──
  banking: [
    { name: 'Bank Reconciliation',                                               fav: true, desc: 'Statement vs ledger reconciliation.' },
    { name: 'Bank Book',                                                         desc: 'All bank-account ledger movements.' },
    { name: 'Cash Book',                                                         desc: 'Cash-on-hand ledger movements.' },
    { name: 'Daily Cash Position',                                               desc: 'Closing cash by day across accounts.' },
  ],

  // ── 11. Projects and Timesheet (6) ──
  projects: [
    { name: 'Project Summary',              liveType: 'projectsummary',          desc: 'All projects with hours, billed, unbilled.' },
    { name: 'Project Details',                                                   desc: 'Full per-project drilldown.' },
    { name: 'Timesheet Details',            liveType: 'timesheetdetails',        desc: 'Time entries with user, task, billing flag.' },
    { name: 'Unbilled Time',                                                     desc: 'Logged hours awaiting invoicing.' },
    { name: 'Project Profitability',                                             desc: 'Revenue, cost, and margin per project.' },
    { name: 'Project Budget vs Actual',                                          desc: 'Spend vs budget per project.' },
  ],

  // ── 12. Accountant (8) ──
  accountant: [
    { name: 'Trial Balance',                liveType: 'trialbalance',            fav: true, desc: 'Debits and credits across every ledger.' },
    { name: 'General Ledger',               liveType: 'generalledger',           desc: 'Every posted transaction grouped by account.' },
    { name: 'Detailed General Ledger',                                           desc: 'Account-level GL with each posting line.' },
    { name: 'Journal Report',                                                    desc: 'Manual and system journal entries.' },
    { name: 'Account Transactions',                                              desc: 'Drilldown of a single account.' },
    { name: 'Account Type Summary',                                              desc: 'Net movement by account type.' },
    { name: 'Chart of Accounts',                                                 desc: 'All accounts with type and balance.' },
    { name: 'Audit Trail',                                                       desc: 'Who changed what and when.' },
  ],

  // ── 13. Currency (4) ──
  currency: [
    { name: 'Realised Gain or Loss',                                             desc: 'Settled FX gains and losses.' },
    { name: 'Unrealised Gain or Loss',                                           desc: 'Open FX exposure not yet realised.' },
    { name: 'Currency Revaluation',                                              desc: 'Period-end FX revaluation entries.' },
    { name: 'Multi-Currency Balances',                                           desc: 'Balances by currency, then reporting unit.' },
  ],

  // ── 14. Activity (5) ──
  activity: [
    { name: 'User Activity',                                                     desc: 'Per-user activity within the workspace.' },
    { name: 'Login History',                                                     desc: 'Sign-ins, devices, and locations.' },
    { name: 'Workflow Run History',                                              desc: 'Automation runs and their outcomes.' },
    { name: 'Scheduled Reports',                                                 desc: 'All report schedules and recipients.' },
    { name: 'Webhook Deliveries',                                                desc: 'Webhook attempts, status, and retries.' },
  ],
};
