// Report data generators.
// Each generator returns { columns, rows, renderMode, currency } in the canonical shape.
// rows: [{ label, level?, isTotal?, isSubtotal?, cells: { colKey: number }, drill?: [{name,ref,date,amount}] }]
//
// The dispatcher (generateReport) looks up by exact name first, then by alias,
// and finally falls back to a deterministic generic generator. This lets the
// QuickBooks and Xero catalogs reuse signature reports while still having
// names that match their native UIs.

const CURRENCY = 'USD';

// ----------------------------------------------------------------------------
// Helpers

const periodCols = (current = 'Apr 2026', prior = 'Apr 2025') => [
  { key: 'label', label: 'Account', align: 'left' },
  { key: 'cur',   label: current,   align: 'right' },
  { key: 'prv',   label: prior,     align: 'right' },
];

const header   = (label, cells = {}) => ({ label, level: 0, cells });
const data     = (label, cells, drill) => ({ label, cells, ...(drill && { drill }) });
const subtotal = (label, cells) => ({ label, isSubtotal: true, cells });
const total    = (label, cells) => ({ label, isTotal: true, cells });

const sum = (rows, key) => rows.reduce((acc, r) => acc + (r.cells?.[key] || 0), 0);

const drill = (entries) =>
  entries.map(([name, ref, date, amount]) => ({ name, ref, date, amount }));

// Deterministic pseudo-random in [0,1) seeded by a string.
function seeded(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    return ((h >>> 0) % 1_000_000) / 1_000_000;
  };
}

// ----------------------------------------------------------------------------
// Flagship reports (used by every provider)

export function profitAndLoss() {
  const revenueRows = [
    data('Product Sales',     { cur: 1_842_000, prv: 1_456_000 },
      drill([
        ['Acme Logistics',     'INV-2104', '2026-04-02', 184_000],
        ['Northbeam Studios',  'INV-2105', '2026-04-09', 126_500],
        ['Foundry Labs',       'INV-2117', '2026-04-21',  98_750],
      ])),
    data('Services',          { cur:   428_000, prv:   360_000 }),
    data('Subscriptions',     { cur:   211_000, prv:   170_000 }),
    data('Other Income',      { cur:    18_000, prv:    14_500 }),
  ];
  const revSubtotal = subtotal('Total Revenue', {
    cur: sum(revenueRows, 'cur'),
    prv: sum(revenueRows, 'prv'),
  });

  const cogsRows = [
    data('Cost of Goods Sold',{ cur:   642_000, prv:   534_000 }),
    data('Hosting & Infra',   { cur:    62_300, prv:    47_900 }),
  ];
  const cogsSubtotal = subtotal('Total Cost of Sales', {
    cur: sum(cogsRows, 'cur'),
    prv: sum(cogsRows, 'prv'),
  });

  const grossProfit = total('Gross Profit', {
    cur: revSubtotal.cells.cur - cogsSubtotal.cells.cur,
    prv: revSubtotal.cells.prv - cogsSubtotal.cells.prv,
  });

  const opexRows = [
    data('Salaries & Wages',  { cur:   486_000, prv:   402_000 },
      drill([
        ['Payroll · Engineering','PR-04-01','2026-04-30',186_000],
        ['Payroll · GTM',        'PR-04-02','2026-04-30',122_000],
        ['Contractors',          'PR-04-03','2026-04-30', 38_000],
      ])),
    data('Marketing',         { cur:    98_200, prv:    71_500 }),
    data('Rent & Utilities',  { cur:    32_500, prv:    31_200 }),
    data('Software & Tools',  { cur:    24_700, prv:    19_300 }),
    data('Travel',            { cur:    12_400, prv:     8_600 }),
    data('Other Operating',   { cur:    18_900, prv:    16_400 }),
  ];
  const opexSubtotal = subtotal('Total Operating Expenses', {
    cur: sum(opexRows, 'cur'),
    prv: sum(opexRows, 'prv'),
  });

  const operatingIncome = total('Operating Income', {
    cur: grossProfit.cells.cur - opexSubtotal.cells.cur,
    prv: grossProfit.cells.prv - opexSubtotal.cells.prv,
  });

  const taxRow = data('Income Tax', {
    cur: Math.round(operatingIncome.cells.cur * 0.22),
    prv: Math.round(operatingIncome.cells.prv * 0.22),
  });

  const netIncome = total('Net Income', {
    cur: operatingIncome.cells.cur - taxRow.cells.cur,
    prv: operatingIncome.cells.prv - taxRow.cells.prv,
  });

  return {
    columns: periodCols(),
    renderMode: 'normal',
    currency: CURRENCY,
    rows: [
      header('Revenue'),
      ...revenueRows,
      revSubtotal,
      header('Cost of Sales'),
      ...cogsRows,
      cogsSubtotal,
      grossProfit,
      header('Operating Expenses'),
      ...opexRows,
      opexSubtotal,
      operatingIncome,
      taxRow,
      netIncome,
    ],
  };
}

export function balanceSheet() {
  const currentAssets = [
    data('Cash & Cash Equivalents', { cur: 1_204_000, prv:   942_000 }),
    data('Accounts Receivable',     { cur:   486_000, prv:   391_000 }),
    data('Inventory',               { cur:   238_000, prv:   212_000 }),
    data('Prepaid Expenses',        { cur:    42_000, prv:    38_000 }),
  ];
  const caTotal = subtotal('Total Current Assets', {
    cur: sum(currentAssets, 'cur'),
    prv: sum(currentAssets, 'prv'),
  });
  const ncAssets = [
    data('Property & Equipment',    { cur:   612_000, prv:   598_000 }),
    data('Intangible Assets',       { cur:   145_000, prv:   145_000 }),
    data('Long-term Investments',   { cur:    78_000, prv:    62_000 }),
  ];
  const ncaTotal = subtotal('Total Non-current Assets', {
    cur: sum(ncAssets, 'cur'),
    prv: sum(ncAssets, 'prv'),
  });
  const assets = total('Total Assets', {
    cur: caTotal.cells.cur + ncaTotal.cells.cur,
    prv: caTotal.cells.prv + ncaTotal.cells.prv,
  });

  const currentLiab = [
    data('Accounts Payable',        { cur:   228_000, prv:   186_000 }),
    data('Accrued Expenses',        { cur:    84_000, prv:    72_000 }),
    data('Short-term Debt',         { cur:    62_000, prv:    58_000 }),
    data('Taxes Payable',           { cur:    41_000, prv:    33_000 }),
  ];
  const clTotal = subtotal('Total Current Liabilities', {
    cur: sum(currentLiab, 'cur'),
    prv: sum(currentLiab, 'prv'),
  });
  const ltLiab = [
    data('Long-term Debt',          { cur:   348_000, prv:   396_000 }),
    data('Deferred Tax',            { cur:    28_000, prv:    24_000 }),
  ];
  const lltTotal = subtotal('Total Long-term Liabilities', {
    cur: sum(ltLiab, 'cur'),
    prv: sum(ltLiab, 'prv'),
  });
  const liab = total('Total Liabilities', {
    cur: clTotal.cells.cur + lltTotal.cells.cur,
    prv: clTotal.cells.prv + lltTotal.cells.prv,
  });

  const equity = [
    data('Paid-in Capital',         { cur:   500_000, prv:   500_000 }),
    data('Retained Earnings',       { cur: 1_618_000, prv: 1_174_000 }),
    data('Other Comprehensive',     { cur:    50_000, prv:    35_000 }),
  ];
  const eqTotal = subtotal('Total Equity', {
    cur: sum(equity, 'cur'),
    prv: sum(equity, 'prv'),
  });

  return {
    columns: periodCols('As of Apr 2026', 'As of Apr 2025'),
    renderMode: 'normal',
    currency: CURRENCY,
    rows: [
      header('Assets'),
      header('Current Assets'),
      ...currentAssets,
      caTotal,
      header('Non-current Assets'),
      ...ncAssets,
      ncaTotal,
      assets,
      header('Liabilities'),
      header('Current Liabilities'),
      ...currentLiab,
      clTotal,
      header('Long-term Liabilities'),
      ...ltLiab,
      lltTotal,
      liab,
      header('Equity'),
      ...equity,
      eqTotal,
      total('Total Liabilities + Equity', {
        cur: liab.cells.cur + eqTotal.cells.cur,
        prv: liab.cells.prv + eqTotal.cells.prv,
      }),
    ],
  };
}

export function cashFlow() {
  const op = [
    data('Net Income',              { cur:   420_000, prv:   316_000 }),
    data('Depreciation',            { cur:    62_000, prv:    58_000 }),
    data('Change in Receivables',   { cur:   -95_000, prv:   -72_000 }),
    data('Change in Payables',      { cur:    42_000, prv:    28_000 }),
    data('Change in Inventory',     { cur:   -26_000, prv:   -18_000 }),
  ];
  const opTotal = subtotal('Cash from Operations', {
    cur: sum(op, 'cur'), prv: sum(op, 'prv'),
  });

  const inv = [
    data('Purchase of Equipment',   { cur:   -76_000, prv:   -62_000 }),
    data('Investments',             { cur:   -16_000, prv:   -22_000 }),
  ];
  const invTotal = subtotal('Cash from Investing', {
    cur: sum(inv, 'cur'), prv: sum(inv, 'prv'),
  });

  const fin = [
    data('Debt Repayments',         { cur:   -48_000, prv:   -54_000 }),
    data('Dividends Paid',          { cur:   -36_000, prv:   -24_000 }),
  ];
  const finTotal = subtotal('Cash from Financing', {
    cur: sum(fin, 'cur'), prv: sum(fin, 'prv'),
  });

  const net = total('Net Change in Cash', {
    cur: opTotal.cells.cur + invTotal.cells.cur + finTotal.cells.cur,
    prv: opTotal.cells.prv + invTotal.cells.prv + finTotal.cells.prv,
  });

  return {
    columns: periodCols(),
    renderMode: 'normal',
    currency: CURRENCY,
    rows: [
      header('Operating Activities'),
      ...op, opTotal,
      header('Investing Activities'),
      ...inv, invTotal,
      header('Financing Activities'),
      ...fin, finTotal,
      net,
    ],
  };
}

export function trialBalance() {
  const cols = [
    { key: 'label', label: 'Account', align: 'left' },
    { key: 'dr',    label: 'Debit',   align: 'right' },
    { key: 'cr',    label: 'Credit',  align: 'right' },
  ];

  const accounts = [
    ['Cash',                   1_204_000, 0],
    ['Accounts Receivable',      486_000, 0],
    ['Inventory',                238_000, 0],
    ['Property & Equipment',     612_000, 0],
    ['Accounts Payable',               0,  228_000],
    ['Short-term Debt',                0,   62_000],
    ['Long-term Debt',                 0,  348_000],
    ['Paid-in Capital',                0,  500_000],
    ['Retained Earnings',              0, 1_618_000],
    ['Revenue',                        0, 2_499_000],
    ['Cost of Sales',            704_300, 0],
    ['Operating Expenses',       672_700, 0],
  ];
  const rows = accounts.map(([label, dr, cr]) => data(label, { dr, cr }));
  const drSum = sum(rows, 'dr');
  const crSum = sum(rows, 'cr');

  return {
    columns: cols,
    renderMode: 'normal',
    currency: CURRENCY,
    rows: [
      header('Accounts'),
      ...rows,
      total('Total', { dr: drSum, cr: crSum }),
    ],
  };
}

// ----------------------------------------------------------------------------
// Aging report (shared between AR / AP — bucket columns match QBO/Xero shapes)

function agingReport(label, parties) {
  const cols = [
    { key: 'label',  label, align: 'left' },
    { key: 'c0',     label: 'Current',     align: 'right' },
    { key: 'c1_30',  label: '1–30 days',   align: 'right' },
    { key: 'c31_60', label: '31–60 days',  align: 'right' },
    { key: 'c61_90', label: '61–90 days',  align: 'right' },
    { key: 'c90',    label: '90+ days',    align: 'right' },
    { key: 'total',  label: 'Total',       align: 'right' },
  ];
  const rows = parties.map((p) => {
    const cells = {
      c0:     p[1] || 0,
      c1_30:  p[2] || 0,
      c31_60: p[3] || 0,
      c61_90: p[4] || 0,
      c90:    p[5] || 0,
    };
    cells.total = cells.c0 + cells.c1_30 + cells.c31_60 + cells.c61_90 + cells.c90;
    return data(p[0], cells);
  });
  const tot = {
    c0:     sum(rows, 'c0'),
    c1_30:  sum(rows, 'c1_30'),
    c31_60: sum(rows, 'c31_60'),
    c61_90: sum(rows, 'c61_90'),
    c90:    sum(rows, 'c90'),
  };
  tot.total = tot.c0 + tot.c1_30 + tot.c31_60 + tot.c61_90 + tot.c90;
  return {
    columns: cols,
    renderMode: 'normal',
    currency: CURRENCY,
    rows: [...rows, total('Total', tot)],
  };
}

export function arAging() {
  return agingReport('Customer', [
    ['Acme Logistics',       42_000, 28_500, 14_200, 6_400, 0],
    ['Northbeam Studios',    18_400, 12_900,  3_300, 0,     0],
    ['Foundry Labs',         28_700,      0,      0, 8_100, 4_200],
    ['Linear Inc.',          62_000, 18_000,      0, 0,     0],
    ['Ramp',                 21_400,  6_400,      0, 0,     0],
    ['ABC Corporate Pvt Ltd',12_800,  4_200,  3_100, 2_400, 1_200],
    ['Short Pvt Ltd',         7_400,  2_300,  1_900,   600, 300],
  ]);
}

export function apAging() {
  return agingReport('Vendor', [
    ['WeWork Bandra',         14_200,  6_400, 1_200, 0,     0],
    ['AWS',                   18_900, 12_400, 4_200, 0,     0],
    ['Bharti Airtel Ltd.',     4_400,  3_200,   800, 200,   0],
    ['Upender Traders',        3_800,  2_600,   400, 0,     0],
    ['Stripe Atlas',           1_600,    800,   200, 0,     0],
  ]);
}

// ----------------------------------------------------------------------------
// Single-period grouped reports (Sales by Customer, Expenses by Vendor, etc.)

function singlePeriodTable(labelHeader, rows) {
  const cols = [
    { key: 'label',  label: labelHeader, align: 'left' },
    { key: 'count',  label: 'Txns',      align: 'right' },
    { key: 'amount', label: 'Amount',    align: 'right' },
  ];
  const dataRows = rows.map(([name, count, amount]) =>
    data(name, { count, amount }));
  return {
    columns: cols,
    renderMode: 'normal',
    currency: CURRENCY,
    rows: [
      ...dataRows,
      total('Total', { count: sum(dataRows, 'count'), amount: sum(dataRows, 'amount') }),
    ],
  };
}

export function salesByCustomer() {
  return singlePeriodTable('Customer', [
    ['Linear Inc.',           18, 482_000],
    ['Ramp',                  14, 318_000],
    ['ABC Corporate Pvt Ltd', 22, 287_400],
    ['Northbeam Studios',     11, 196_800],
    ['Foundry Labs',           9, 142_500],
    ['Acme Logistics',         8,  98_750],
  ]);
}

export function expensesByVendor() {
  return singlePeriodTable('Vendor', [
    ['WeWork Bandra',         12, 168_000],
    ['AWS',                   24, 124_820],
    ['Google Workspace',       6,  18_400],
    ['Bharti Airtel Ltd.',    11,  82_420],
    ['Upender Traders',        9,  64_080],
    ['Stripe Atlas',           4,  18_900],
  ]);
}

export function purchasesByVendor() {
  return singlePeriodTable('Vendor', [
    ['Foxconn Components',     8, 312_400],
    ['Reliance Industries',    6, 268_900],
    ['Tata Steel',             4, 184_200],
    ['Allied Hardware',       12,  82_400],
    ['Office Depot',           5,  18_400],
  ]);
}

export function unpaidBills() {
  const cols = [
    { key: 'label',  label: 'Vendor',       align: 'left' },
    { key: 'ref',    label: 'Bill #',       align: 'left' },
    { key: 'date',   label: 'Bill date',    align: 'left' },
    { key: 'due',    label: 'Due date',     align: 'left' },
    { key: 'amount', label: 'Open amount',  align: 'right' },
  ];
  const rows = [
    ['WeWork Bandra',      'BILL-04-014', '2026-04-04', '2026-05-04',  168_000],
    ['AWS',                'BILL-04-022', '2026-04-12', '2026-05-12',   42_400],
    ['Bharti Airtel Ltd.', 'BILL-04-031', '2026-04-18', '2026-05-18',    8_900],
    ['Upender Traders',    'BILL-04-040', '2026-04-22', '2026-05-22',    6_400],
    ['Stripe Atlas',       'BILL-04-044', '2026-04-26', '2026-05-26',    1_900],
  ];
  const dataRows = rows.map(([label, ref, date, due, amount]) =>
    data(label, { ref, date, due, amount }));
  return {
    columns: cols,
    renderMode: 'normal',
    currency: CURRENCY,
    rows: [...dataRows, total('Total', { amount: sum(dataRows, 'amount') })],
  };
}

// ----------------------------------------------------------------------------
// Chart of Accounts / Account List

export function accountList() {
  const cols = [
    { key: 'label',   label: 'Account',      align: 'left' },
    { key: 'type',    label: 'Type',         align: 'left' },
    { key: 'balance', label: 'Balance',      align: 'right' },
  ];
  const rows = [
    ['Cash',                   'Bank',                  1_204_000],
    ['Accounts Receivable',    'Asset',                   486_000],
    ['Inventory',              'Asset',                   238_000],
    ['Property & Equipment',   'Fixed Asset',             612_000],
    ['Accounts Payable',       'Liability',               228_000],
    ['Sales Tax Payable',      'Liability',                41_000],
    ['Long-term Debt',         'Liability',               348_000],
    ['Retained Earnings',      'Equity',                1_618_000],
    ['Revenue',                'Income',                2_499_000],
    ['Cost of Sales',          'Cost of Goods Sold',      704_300],
    ['Operating Expenses',     'Expense',                 672_700],
  ];
  const dataRows = rows.map(([label, type, balance]) =>
    data(label, { type, balance }));
  return {
    columns: cols,
    renderMode: 'normal',
    currency: CURRENCY,
    rows: dataRows,
  };
}

// ----------------------------------------------------------------------------
// Executive Summary (Xero-style)

export function executiveSummary() {
  const cols = [
    { key: 'label', label: 'Metric',      align: 'left' },
    { key: 'cur',   label: 'This month',  align: 'right' },
    { key: 'prv',   label: 'Last month',  align: 'right' },
  ];
  const rows = [
    data('Income',                    { cur: 2_499_000, prv: 2_000_000 }),
    data('Cost of sales',             { cur:   704_300, prv:   581_900 }),
    subtotal('Gross profit',          { cur: 1_794_700, prv: 1_418_100 }),
    data('Operating expenses',        { cur:   672_700, prv:   549_000 }),
    total('Net profit',               { cur: 1_122_000, prv:   869_100 }),
    data('Cash received',             { cur: 1_864_000, prv: 1_412_000 }),
    data('Cash paid',                 { cur: 1_492_000, prv: 1_184_000 }),
    data('Bank balance',              { cur: 1_204_000, prv:   942_000 }),
    data('Average debtor days',       { cur: 32,         prv: 38 }),
    data('Average creditor days',     { cur: 28,         prv: 30 }),
  ];
  return { columns: cols, renderMode: 'normal', currency: CURRENCY, rows };
}

// ----------------------------------------------------------------------------
// Sales Tax Liability / Summary

export function taxLiability() {
  const cols = [
    { key: 'label',    label: 'Tax agency',     align: 'left' },
    { key: 'taxable',  label: 'Taxable sales',  align: 'right' },
    { key: 'rate',     label: 'Rate',           align: 'left' },
    { key: 'collected',label: 'Collected',      align: 'right' },
    { key: 'owed',     label: 'Owed',           align: 'right' },
  ];
  const rows = [
    ['State of California',  812_000, '7.25%',  58_870,  58_870],
    ['State of New York',    412_000, '8.875%', 36_565,  36_565],
    ['Karnataka GST',        298_000, '18%',    53_640,  53_640],
    ['Maharashtra GST',      184_000, '18%',    33_120,  33_120],
  ];
  const dataRows = rows.map(([label, taxable, rate, collected, owed]) =>
    data(label, { taxable, rate, collected, owed }));
  return {
    columns: cols,
    renderMode: 'normal',
    currency: CURRENCY,
    rows: [
      ...dataRows,
      total('Total', {
        taxable: sum(dataRows, 'taxable'),
        collected: sum(dataRows, 'collected'),
        owed: sum(dataRows, 'owed'),
      }),
    ],
  };
}

// ----------------------------------------------------------------------------
// Generic fallback — deterministic table built from the report name.

export function genericReport(name) {
  const rng = seeded(name);
  const baseLabels = [
    'Operating Group A', 'Operating Group B', 'Operating Group C',
    'Strategic Initiatives', 'Recurring Items', 'One-time Items',
    'External Services', 'Internal Allocation',
  ];
  const rowCount = 6 + Math.floor(rng() * 4); // 6–9 rows
  const rows = Array.from({ length: rowCount }, (_, i) => {
    const cur = Math.round(10_000 + rng() * 240_000);
    const prv = Math.round(cur * (0.6 + rng() * 0.6));
    return data(`${baseLabels[i % baseLabels.length]} ${i + 1}`, { cur, prv });
  });
  const totalRow = total('Total', {
    cur: sum(rows, 'cur'),
    prv: sum(rows, 'prv'),
  });

  return {
    columns: periodCols(),
    renderMode: 'normal',
    currency: CURRENCY,
    rows: [header(name), ...rows, totalRow],
  };
}

// ----------------------------------------------------------------------------
// Dispatcher — match by canonical report name, with aliases for the variants
// used by QuickBooks Online and Xero so we don't have to duplicate generators.

const REGISTRY = {
  // Profit and Loss family
  'Profit and Loss':                       profitAndLoss,
  'Profit and Loss Comparison':            profitAndLoss,
  'Profit and Loss Detail':                profitAndLoss,
  'Profit and Loss YTD Comparison':        profitAndLoss,
  'Profit and Loss by Branch':             profitAndLoss,
  'Comparative P&L':                       profitAndLoss,
  'YoY Trend':                             profitAndLoss,
  'Horizontal Balance Sheet':              balanceSheet,

  // Balance Sheet family
  'Balance Sheet':                         balanceSheet,
  'Balance Sheet Comparison':              balanceSheet,
  'Balance Sheet Detail':                  balanceSheet,
  'Balance Sheet Summary':                 balanceSheet,
  'Movements in Equity':                   balanceSheet,
  'Movement of Equity':                    balanceSheet,

  // Cash flow family
  'Cash Flow Statement':                   cashFlow,
  'Statement of Cash Flows':               cashFlow,
  'Statement of Cash Flows - Direct':      cashFlow,
  'Statement of Cash Flows - Indirect':    cashFlow,
  'Cash Summary':                          cashFlow,
  'Future Cash Flow':                      cashFlow,
  'Daily Cash Position':                   cashFlow,

  // Trial balance / journals / GL
  'Trial Balance':                         trialBalance,
  'Adjusted Trial Balance':                trialBalance,
  'General Ledger':                        trialBalance,
  'Journal':                               trialBalance,
  'Journal Report':                        trialBalance,
  'Manual Journals':                       trialBalance,
  'Adjusting Journal Entries':             trialBalance,
  'Account Transactions':                  trialBalance,
  'Detailed Account Transactions':         trialBalance,
  'Transaction Detail by Account':         trialBalance,
  'Transaction List by Vendor':            expensesByVendor,

  // Aging
  'AR Aging Summary':                      arAging,
  'AR Aging Detail':                       arAging,
  'A/R Aging Summary':                     arAging,
  'A/R Aging Detail':                      arAging,
  'Aged Receivables Summary':              arAging,
  'Aged Receivables Detail':               arAging,

  'AP Aging Summary':                      apAging,
  'AP Aging Detail':                       apAging,
  'A/P Aging Summary':                     apAging,
  'A/P Aging Detail':                      apAging,
  'Aged Payables Summary':                 apAging,
  'Aged Payables Detail':                  apAging,

  // Sales / expenses / purchases grouped reports
  'Sales by Customer':                     salesByCustomer,
  'Sales by Customer Summary':             salesByCustomer,
  'Sales by Customer Detail':              salesByCustomer,
  'Customer Balance Summary':              salesByCustomer,
  'Customer Balance Detail':               salesByCustomer,
  'Income by Customer Summary':            salesByCustomer,
  'Receivable Invoice Summary':            salesByCustomer,
  'Receivable Invoice Detail':             salesByCustomer,
  'Customer Invoice Summary':              salesByCustomer,
  'Customer Invoice Detail':               salesByCustomer,
  'Customer Invoice Activity':             salesByCustomer,

  'Expenses by Vendor':                    expensesByVendor,
  'Expenses by Vendor Summary':            expensesByVendor,
  'Expenses by Vendor Detail':             expensesByVendor,
  'Vendor Balance Summary':                expensesByVendor,
  'Vendor Balance Detail':                 expensesByVendor,
  'Supplier Invoice Summary':              expensesByVendor,
  'Supplier Invoice Detail':               expensesByVendor,
  'Supplier Invoice Activity':             expensesByVendor,
  'Payable Invoice Summary':               expensesByVendor,
  'Payable Invoice Detail':                expensesByVendor,

  'Purchases by Vendor':                   purchasesByVendor,
  'Purchases by Vendor Detail':            purchasesByVendor,
  'Purchases by Item':                     purchasesByVendor,
  'Purchases by Class Detail':             purchasesByVendor,
  'Purchases by Location Detail':          purchasesByVendor,
  'Purchases by Product/Service Detail':   purchasesByVendor,

  'Unpaid Bills':                          unpaidBills,
  'Bills by Vendor':                       unpaidBills,
  'Bill Payment List':                     unpaidBills,
  'Bills and Applied Payments':            unpaidBills,

  // Account lists
  'Chart of Accounts':                     accountList,
  'Account List':                          accountList,

  // Executive / snapshot
  'Executive Summary':                     executiveSummary,
  'Business Snapshot':                     executiveSummary,
  'Business Performance Ratios':           executiveSummary,

  // Tax
  'Tax Summary':                           taxLiability,
  'Tax Liability':                         taxLiability,
  'Sales Tax Liability Report':            taxLiability,
  'Tax Summary Report':                    taxLiability,
  'Tax Detail Report':                     taxLiability,
  'Taxable Sales Detail':                  taxLiability,
  'Taxable Sales Summary':                 taxLiability,
  'Sales Tax Report':                      taxLiability,
};

export function generateReport(name) {
  const gen = REGISTRY[name];
  return gen ? gen() : genericReport(name);
}
