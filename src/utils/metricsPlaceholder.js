/**
 * Period-aware placeholder data for the dashboard's Financial Metrics sections.
 *
 * The metric sections (Revenue / Profitability / Cash Flow / Expenses /
 * Liquidity / Efficiency) render demo figures from these generators instead of
 * the live API. The data is:
 *   - deterministic per period (seeded by from+to), so the same selection always
 *     shows the same numbers, but different periods (e.g. "Previous Year" vs
 *     "This Year") show different figures, and
 *   - shaped exactly like the API payloads the sections consume, so the existing
 *     charts / KPI tiles render unchanged.
 *
 * Each generator returns the same object shape the corresponding section reads.
 */

const SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Small deterministic PRNG (mulberry32 over an FNV-1a string hash).
function rng(seedStr) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seedStr.length; i++) {
    h ^= seedStr.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += 0x6d2b79f5;
    let t = h >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Months covered by [from, to] inclusive → [{ key, month }]; falls back to the
// trailing 12 months when the range is missing/invalid.
function monthList(from, to) {
  const start = from ? new Date(`${from}T00:00:00`) : null;
  const end   = to   ? new Date(`${to}T00:00:00`)   : null;
  const valid = start && end && !isNaN(start) && !isNaN(end) && end >= start;
  const out = [];
  if (!valid) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - 11);
    for (let i = 0; i < 12; i++) {
      out.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: SHORT[d.getMonth()] });
      d.setMonth(d.getMonth() + 1);
    }
    return out;
  }
  const d = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  let guard = 0;
  while (d <= last && guard++ < 120) {
    out.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: SHORT[d.getMonth()] });
    d.setMonth(d.getMonth() + 1);
  }
  return out.length ? out : [{ key: 'x', month: SHORT[start.getMonth()] }];
}

const seedOf = (from, to) => `${from || ''}__${to || ''}`;
const round = (n) => Math.round(n);

// A period "scale" so different periods read as clearly different magnitudes.
function periodScale(rand) {
  return 0.7 + rand() * 0.9; // 0.7×–1.6×
}

// ── Revenue ──────────────────────────────────────────────────────────────────
export function placeholderRevenue(from, to) {
  const rand = rng('rev_' + seedOf(from, to));
  const scale = periodScale(rand);
  const months = monthList(from, to);

  const base = 3200000 * scale; // ~₹32L/mo baseline
  const trend = months.map((mo, i) => {
    const wave = 1 + 0.35 * Math.sin((i / months.length) * Math.PI * 2) + (rand() - 0.5) * 0.3;
    return { month: mo.month, revenue: round(base * Math.max(0.25, wave)) };
  });
  const revenue = trend.reduce((s, r) => s + r.revenue, 0);

  const recurring = round(revenue * (0.45 + rand() * 0.2));
  const oneTime   = Math.max(0, revenue - recurring);
  const total     = recurring + oneTime;

  const products = ['Subscriptions', 'Professional Services', 'Implementation', 'Support', 'Licenses'];
  let remaining = revenue;
  const byProduct = products.map((name, i) => {
    const share = i === products.length - 1 ? remaining : round(revenue * (0.12 + rand() * 0.18));
    remaining = Math.max(0, remaining - share);
    return { name, amount: Math.max(0, share) };
  }).sort((a, b) => b.amount - a.amount);

  return {
    m: {
      revenue,
      growth: { growthPct: parseFloat(((rand() - 0.35) * 40).toFixed(1)) },
      recurring: {
        recurring, oneTime, total,
        recurringPct: total > 0 ? round((recurring / total) * 100) : 0,
      },
      byProduct,
      otherIncome: round(revenue * (0.02 + rand() * 0.04)),
    },
    trend,
  };
}

// ── Profitability ────────────────────────────────────────────────────────────
export function placeholderProfitability(from, to) {
  const rand = rng('prof_' + seedOf(from, to));
  const scale = periodScale(rand);
  const months = monthList(from, to);

  const baseRev = 3200000 * scale;
  const trend = months.map((mo, i) => {
    const wave = 1 + 0.3 * Math.sin((i / months.length) * Math.PI * 2) + (rand() - 0.5) * 0.25;
    const revenue  = round(baseRev * Math.max(0.3, wave));
    const expenses = round(revenue * (0.6 + rand() * 0.2));
    return { month: mo.month, revenue, expenses, netProfit: revenue - expenses };
  });

  const revenue = trend.reduce((s, r) => s + r.revenue, 0);
  const cogs    = round(revenue * (0.45 + rand() * 0.1));
  const grossProfit = revenue - cogs;
  const expenses = round(revenue * (0.2 + rand() * 0.08));
  const operatingProfit = grossProfit - expenses;
  const ebitda = round(operatingProfit * (1.05 + rand() * 0.1));
  const netProfit = round(operatingProfit * (0.7 + rand() * 0.15));
  const pct = (n) => (revenue > 0 ? round((n / revenue) * 100) : 0);

  return {
    m: {
      revenue, cogs, expenses,
      grossProfit, operatingProfit, ebitda, netProfit,
      grossMargin: pct(grossProfit),
      operatingMargin: pct(operatingProfit),
      ebitdaMargin: pct(ebitda),
      netMargin: pct(netProfit),
    },
    trend,
  };
}

// ── Cash Flow ────────────────────────────────────────────────────────────────
export function placeholderCashflow(from, to) {
  const rand = rng('cash_' + seedOf(from, to));
  const scale = periodScale(rand);
  const months = monthList(from, to);

  const base = 2800000 * scale;
  const trend = months.map((mo, i) => {
    const wave = 1 + 0.3 * Math.sin((i / months.length) * Math.PI * 2 + 1) + (rand() - 0.5) * 0.3;
    const inflow  = round(base * Math.max(0.3, wave));
    const outflow = round(inflow * (0.7 + rand() * 0.25));
    return { month: mo.month, inflow, outflow };
  });

  const inflow  = trend.reduce((s, r) => s + r.inflow, 0);
  const outflow = trend.reduce((s, r) => s + r.outflow, 0);
  const operatingCashFlow = round((inflow - outflow) * (0.9 + rand() * 0.2));
  const freeCashFlow = round(operatingCashFlow * (0.6 + rand() * 0.25));

  return {
    m: {
      operatingCashFlow,
      freeCashFlow,
      netChange: inflow - outflow,
      inflow,
      outflow,
    },
    trend,
  };
}

// ── Expenses ─────────────────────────────────────────────────────────────────
export function placeholderExpense(from, to) {
  const rand = rng('exp_' + seedOf(from, to));
  const scale = periodScale(rand);
  const months = monthList(from, to);

  const base = 2100000 * scale;
  const trend = months.map((mo, i) => {
    const wave = 1 + 0.25 * Math.sin((i / months.length) * Math.PI * 2 + 2) + (rand() - 0.5) * 0.25;
    return { month: mo.month, expenses: round(base * Math.max(0.3, wave)) };
  });
  const totalExpenses = trend.reduce((s, r) => s + r.expenses, 0);
  const avgMonthlyBurn = round(totalExpenses / Math.max(1, trend.length));

  const cats = ['Salaries & Wages', 'Cloud & Infrastructure', 'Marketing', 'Office & Rent', 'Software Licenses', 'Travel'];
  let remaining = totalExpenses;
  const breakdown = cats.map((name, i) => {
    const amt = i === cats.length - 1 ? remaining : round(totalExpenses * (0.1 + rand() * 0.22));
    remaining = Math.max(0, remaining - amt);
    return { account_name: name, totalAmount: Math.max(0, amt) };
  }).sort((a, b) => b.totalAmount - a.totalAmount);

  return {
    profData: { expenses: totalExpenses, expenseRatio: round(60 + rand() * 20) },
    burnData: { avgMonthlyBurn, trend },
    breakdown,
  };
}

// ── Liquidity ────────────────────────────────────────────────────────────────
export function placeholderLiquidity(from, to) {
  const rand = rng('liq_' + seedOf(from, to));
  const scale = periodScale(rand);

  const cash = round(1800000 * scale);
  const receivables = round(2400000 * scale);
  const payables = round(1500000 * scale);
  const otherCurrentAssets = round(900000 * scale);
  const currentAssets = cash + receivables + otherCurrentAssets;
  const currentLiabilities = payables + round(700000 * scale);
  const workingCapital = currentAssets - currentLiabilities;
  const totalAssets = currentAssets + round(3200000 * scale);

  return {
    currentRatio: parseFloat((currentAssets / Math.max(1, currentLiabilities)).toFixed(2)),
    quickRatio: parseFloat(((cash + receivables) / Math.max(1, currentLiabilities)).toFixed(2)),
    cash, receivables, payables, workingCapital,
    currentAssets, currentLiabilities, totalAssets,
  };
}

// ── Efficiency ───────────────────────────────────────────────────────────────
export function placeholderEfficiency(from, to) {
  const rand = rng('eff_' + seedOf(from, to));
  const scale = periodScale(rand);

  const revenue = round(38000000 * scale);
  const totalAssets = round(26000000 * scale);
  const receivables = round(2400000 * scale);
  const payables = round(1500000 * scale);

  return {
    arDays: round(28 + rand() * 30),
    apDays: round(25 + rand() * 28),
    assetTurnover: parseFloat((revenue / Math.max(1, totalAssets)).toFixed(2)),
    totalAssets, receivables, payables, revenue,
  };
}
