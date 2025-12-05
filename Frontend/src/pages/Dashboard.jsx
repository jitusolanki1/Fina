import React, { useEffect, useState, useMemo } from "react";
import { ArrowUpRight, ArrowDownRight, IndianRupee } from "lucide-react";
import { fetchJson } from "../fetchClient";
import { listAccounts } from "../services/accountsService";
// Recharts is large; load it only when the Dashboard actually renders charts.
// We'll dynamically import it at runtime to keep the initial vendor chunk small.

function isoWeekNumber(d) {
  // Copy date so don't modify original
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return `${date.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function formatMonthKey(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function Dashboard({ focusedAccount = null }) {
  const [accounts, setAccounts] = useState([]);
  const [txs, setTxs] = useState([]);
  const [range, setRange] = useState("3m"); // '3m' | '30d' | '7d'

  useEffect(() => {
    load();
  }, []);
  async function load() {
    try {
      const [aRes, tRes] = await Promise.all([
        listAccounts(),
        fetchJson('/transactions'),
      ]);
      setAccounts(aRes || []);
      setTxs((tRes || []).map((t) => ({ ...t, date: t.date })));
    } catch (err) {
      console.error('Dashboard load failed', err);
      setAccounts([]);
      setTxs([]);
    }
  }

  // If focusedAccount is provided, filter txs to only that account
    // dynamic load of recharts to avoid bundling it into the main vendor chunk
    const [RC, setRC] = useState(null);
    useEffect(() => {
      let mounted = true;
      import("recharts")
        .then((mod) => {
          if (mounted) setRC(mod);
        })
        .catch((err) => {
          console.debug("Recharts dynamic import failed", err);
        });
      return () => {
        mounted = false;
      };
    }, []);

  const filteredTxs = useMemo(() => {
    if (!focusedAccount) return txs;
    const id = focusedAccount.id || focusedAccount;
    return txs.filter((t) => t.accountId === id);
  }, [txs, focusedAccount]);

  // Compute per-account summary when no focus
  const accountRows = useMemo(() => {
    return accounts.map((a) => {
      const my = txs.filter((t) => t.accountId === a.id);
      const totalDeposit = my.reduce((s, t) => s + (Number(t.deposit) || 0), 0);
      const totalOtherDeposit = my.reduce(
        (s, t) => s + (Number(t.otherDeposit) || 0),
        0
      );
      const totalPenal = my.reduce(
        (s, t) => s + (Number(t.penalWithdrawal) || 0),
        0
      );
      const totalOtherW = my.reduce(
        (s, t) => s + (Number(t.otherWithdrawal) || 0),
        0
      );
      const final =
        a.openingBalance +
        totalDeposit +
        totalOtherDeposit -
        totalPenal -
        totalOtherW;
      return {
        id: a.id,
        name: a.name,
        totalDeposit,
        totalOtherDeposit,
        totalPenal,
        totalOtherW,
        final,
      };
    });
  }, [accounts, txs]);

  // Top metrics derived from data
  const topMetrics = useMemo(() => {
    const totalRevenue = txs.reduce(
      (s, t) => s + (Number(t.deposit) || 0) + (Number(t.otherDeposit) || 0),
      0
    );
    const now = new Date();
    const days30 = new Date(now);
    days30.setDate(now.getDate() - 30);
    const days60 = new Date(now);
    days60.setDate(now.getDate() - 60);

    const txsLast30 = txs.filter((t) => new Date(t.date) >= days30);
    const txsPrev30 = txs.filter(
      (t) => new Date(t.date) >= days60 && new Date(t.date) < days30
    );

    const depositLast30 = txsLast30.reduce(
      (s, t) => s + (Number(t.deposit) || 0) + (Number(t.otherDeposit) || 0),
      0
    );
    const depositPrev30 = txsPrev30.reduce(
      (s, t) => s + (Number(t.deposit) || 0) + (Number(t.otherDeposit) || 0),
      0
    );
    const growthRate =
      depositPrev30 === 0
        ? depositLast30 > 0
          ? 100
          : 0
        : Math.round(
            ((depositLast30 - depositPrev30) / depositPrev30) * 10000
          ) / 100;

    const activeAccountIds = new Set(txsLast30.map((t) => t.accountId));

    return {
      totalRevenue,
      newCustomers: accounts.length,
      activeAccounts: activeAccountIds.size,
      growthRate,
    };
  }, [txs, accounts]);

  // Analytics for filteredTxs (either overall or focused account)
  const analytics = useMemo(() => {
    if (filteredTxs.length === 0) {
      return {
        balanceSeries: [],
        monthly: [],
        weekly: [],
        yearly: [],
        totals: { deposit: 0, withdrawal: 0 },
      };
    }

    // Need opening balance per account (if focused, get its opening)
    let opening = 0;
    if (focusedAccount) {
      const find = accounts.find(
        (a) => a.id === (focusedAccount.id || focusedAccount)
      );
      opening = find ? Number(find.openingBalance || 0) : 0;
    } else {
      // overall opening is sum of openings
      opening = accounts.reduce(
        (s, a) => s + (Number(a.openingBalance) || 0),
        0
      );
    }

    // Build daily sorted events
    const events = filteredTxs
      .slice()
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    // Balance series
    const balanceSeries = [];
    let bal = opening;
    // If no transactions on earliest date, include opening at first date
    if (events.length === 0) {
      balanceSeries.push({
        date: new Date().toISOString().slice(0, 10),
        balance: bal,
      });
    } else {
      // Add a point before first transaction showing opening balance
      const firstDate = events[0].date;
      balanceSeries.push({ date: firstDate, balance: bal });
      events.forEach((ev) => {
        bal =
          bal +
          (Number(ev.deposit) || 0) +
          (Number(ev.otherDeposit) || 0) -
          (Number(ev.penalWithdrawal) || 0) -
          (Number(ev.otherWithdrawal) || 0);
        balanceSeries.push({ date: ev.date, balance: bal });
      });
    }

    // Monthly, weekly, yearly aggregations
    const monthlyMap = new Map();
    const weeklyMap = new Map();
    const yearlyMap = new Map();
    let totalDeposit = 0,
      totalWithdrawal = 0;

    events.forEach((ev) => {
      const d = new Date(ev.date);
      const mKey = formatMonthKey(d);
      const wKey = isoWeekNumber(d);
      const yKey = String(d.getFullYear());

      const dep = (Number(ev.deposit) || 0) + (Number(ev.otherDeposit) || 0);
      const wit =
        (Number(ev.penalWithdrawal) || 0) + (Number(ev.otherWithdrawal) || 0);

      totalDeposit += dep;
      totalWithdrawal += wit;

      const mo = monthlyMap.get(mKey) || {
        month: mKey,
        deposit: 0,
        withdrawal: 0,
      };
      mo.deposit += dep;
      mo.withdrawal += wit;
      monthlyMap.set(mKey, mo);

      const wk = weeklyMap.get(wKey) || {
        week: wKey,
        deposit: 0,
        withdrawal: 0,
      };
      wk.deposit += dep;
      wk.withdrawal += wit;
      weeklyMap.set(wKey, wk);

      const yr = yearlyMap.get(yKey) || {
        year: yKey,
        deposit: 0,
        withdrawal: 0,
      };
      yr.deposit += dep;
      yr.withdrawal += wit;
      yearlyMap.set(yKey, yr);
    });

    const monthly = Array.from(monthlyMap.values()).sort((a, b) =>
      a.month.localeCompare(b.month)
    );
    const weekly = Array.from(weeklyMap.values()).sort((a, b) =>
      a.week.localeCompare(b.week)
    );
    const yearly = Array.from(yearlyMap.values()).sort((a, b) =>
      a.year.localeCompare(b.year)
    );

    return {
      balanceSeries,
      monthly,
      weekly,
      yearly,
      totals: { deposit: totalDeposit, withdrawal: totalWithdrawal },
    };
  }, [filteredTxs, accounts, focusedAccount]);

  // Global chart series for the main AreaChart when no focused account
  const globalChartSeries = useMemo(() => {
    const hasSeries = analytics.balanceSeries && analytics.balanceSeries.length;
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;

    if (hasSeries) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const filtered = analytics.balanceSeries.filter((p) => new Date(p.date) >= cutoff);
      filtered.sort((a, b) => new Date(a.date) - new Date(b.date));
      return filtered;
    }

    if (accounts && accounts.length) {
      const openingSum = accounts.reduce((s, a) => s + (Number(a.openingBalance) || 0), 0);
      const arr = [];
      for (let i = days; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        arr.push({ date: d.toISOString().slice(0, 10), balance: openingSum });
      }
      return arr;
    }

    // fallback: no real data -> produce a flat zero series (don't show demo/sine)
    const now = new Date();
    const arr = [];
    for (let i = days; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      arr.push({ date: d.toISOString().slice(0, 10), balance: 0 });
    }
    return arr;
  }, [analytics, range, accounts]);

  const pieData = [
    { name: "Deposit", value: analytics.totals.deposit },
    { name: "Withdrawal", value: analytics.totals.withdrawal },
  ];
  const COLORS = ["#10b981", "#ef4444"];

  return (
    <div className="space-y-6">
      {/* Top metric cards */}
      <div className="metric-grid">
        <div className="metric-card">
          <div className="metric-badge">
            <ArrowUpRight size={12} /> +12.5%
          </div>
          <div className="text-sm text-slate-300">Total Revenue</div>
          <div className="metric-value">
            <IndianRupee className="inline w-6 h-6 mb-1" />
            {topMetrics.totalRevenue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
          <div className="metric-sub">
            Trending up this month — Visitors for the last 6 months
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-badge">
            <ArrowDownRight size={12} /> -20%
          </div>
          <div className="text-sm text-slate-300">New Customers</div>
          <div className="metric-value">{topMetrics.newCustomers}</div>
          <div className="metric-sub">
            Down 20% this period — Acquisition needs attention
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-badge">
            <ArrowUpRight size={12} /> +12.5%
          </div>
          <div className="text-sm text-slate-300">Active Accounts</div>
          <div className="metric-value">
            {topMetrics.activeAccounts.toLocaleString()}
          </div>
          <div className="metric-sub">
            Strong user retention — Engagement exceed targets
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-badge">
            <ArrowUpRight size={12} /> +4.5%
          </div>
          <div className="text-sm text-slate-300">Growth Rate</div>
          <div className="metric-value">{topMetrics.growthRate}%</div>
          <div className="metric-sub">
            Steady performance increase — Meets growth projections
          </div>
        </div>
      </div>

      {/* Lightweight chart area — only rendered when recharts is loaded */}
      <div>
        {RC ? (
          <div className="card-dark p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-slate-800">Balance</h4>
            <div className="w-full h-56 md:h-72">
              <RC.ResponsiveContainer width="100%" height="100%">
              <RC.AreaChart data={globalChartSeries}>
                <RC.CartesianGrid strokeDasharray="3 3" />
                <RC.XAxis dataKey="date" />
                <RC.YAxis />
                <RC.Tooltip />
                <RC.Area type="monotone" dataKey="balance" stroke="#a24a4aff" fill="#10b98133" />
              </RC.AreaChart>
              </RC.ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="card-dark p-4 rounded-lg text-sm text-slate-400">Charts loading…</div>
        )}
      </div>

      {/* Main content */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-slate-100">
          {focusedAccount
            ? `Analytics — ${focusedAccount.name || focusedAccount}`
            : "Analytics"}
        </h2>
        <div className="flex items-center gap-3">
          <button onClick={load} className="control-btn">
            Refresh
          </button>
          {focusedAccount && (
            <div className="text-sm text-slate-300">
              Viewing data only for this account
            </div>
          )}
        </div>
      </div>

      {focusedAccount ? (
        <>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="card-dark p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-slate-200">Key Metrics</h4>
              <div className="space-y-2 text-sm text-slate-300">
                <div>
                  Total Deposit:{" "}
                  <strong className="text-slate-100">
                    {analytics.totals.deposit}
                  </strong>
                </div>
                <div>
                  Total Withdrawal:{" "}
                  <strong className="text-slate-100">
                    {analytics.totals.withdrawal}
                  </strong>
                </div>
                <div>
                  Transactions:{" "}
                  <strong className="text-slate-100">
                    {filteredTxs.length}
                  </strong>
                </div>
                <div>
                  Opening Balance:{" "}
                  <strong className="text-slate-100">
                    {(() => {
                      const f = accounts.find(
                        (a) => a.id === (focusedAccount.id || focusedAccount)
                      );
                      return f ? f.openingBalance : 0;
                    })()}
                  </strong>
                </div>
                <div>
                  Current Balance:{" "}
                  <strong className="text-slate-100">
                    {analytics.balanceSeries.length
                      ? analytics.balanceSeries[
                          analytics.balanceSeries.length - 1
                        ].balance
                      : "—"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="card-dark p-4 rounded-lg md:col-span-2">
              <h4 className="font-medium mb-2 text-slate-200">
                Balance Over Time
              </h4>
              <div className="w-full h-64 md:h-72">
                {RC ? (
                  <RC.ResponsiveContainer>
                    <RC.LineChart data={analytics.balanceSeries}>
                      <RC.CartesianGrid strokeDasharray="3 3" stroke="#0f1720" />
                      <RC.XAxis dataKey="date" tick={{ fill: "#94a3b8" }} />
                      <RC.YAxis tick={{ fill: "#94a3b8" }} />
                      <RC.Tooltip
                        wrapperStyle={{
                          background: "#0b1220",
                          border: "1px solid #1f2937",
                          color: "#e6eef8",
                        }}
                      />
                      <RC.Line
                        type="monotone"
                        dataKey="balance"
                        stroke="#60a5fa"
                        strokeWidth={2}
                        dot={false}
                      />
                    </RC.LineChart>
                    </RC.ResponsiveContainer>
                  ) : (
                  <div className="card-dark p-4 rounded-lg text-sm text-slate-400">Charts loading…</div>
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="card-dark p-3 rounded shadow">
              <h4 className="font-medium mb-2">Deposit vs Withdrawal</h4>
                <div className="w-full h-44 md:h-48">
                {RC ? (
                  <RC.ResponsiveContainer>
                    <RC.PieChart>
                      <RC.Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={70}
                        label
                      >
                        {pieData.map((entry, idx) => (
                          <RC.Cell
                            key={`cell-${idx}`}
                            fill={COLORS[idx % COLORS.length]}
                          />
                        ))}
                      </RC.Pie>
                      <RC.Tooltip />
                      <RC.Legend />
                    </RC.PieChart>
                    </RC.ResponsiveContainer>
                ) : (
                  <div className="card-dark p-4 rounded-lg text-sm text-slate-400">Charts loading…</div>
                )}
              </div>
            </div>

            <div className="card-dark p-3 rounded shadow md:col-span-2">
              <h4 className="font-medium mb-2">
                Monthly Deposits vs Withdrawals
              </h4>
                <div className="w-full h-56 md:h-60">
                {RC ? (
                  <RC.ResponsiveContainer>
                    <RC.BarChart data={analytics.monthly}>
                      <RC.XAxis dataKey="month" />
                      <RC.YAxis />
                      <RC.Tooltip />
                      <RC.Bar dataKey="deposit" fill="#10b981" />
                      <RC.Bar dataKey="withdrawal" fill="#ef4444" />
                    </RC.BarChart>
                    </RC.ResponsiveContainer>
                ) : (
                  <div className="card-dark p-4 rounded-lg text-sm text-slate-400">Charts loading…</div>
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="card-dark p-3 rounded shadow">
              <h4 className="font-medium mb-2">Weekly Trend</h4>
                <div className="w-full h-44 md:h-48">
                {RC ? (
                  <RC.ResponsiveContainer>
                    <RC.AreaChart data={analytics.weekly}>
                      <RC.XAxis dataKey="week" />
                      <RC.YAxis />
                      <RC.Tooltip />
                      <RC.Area
                        type="monotone"
                        dataKey="deposit"
                        stackId="1"
                        stroke="#10b981"
                        fill="#bbf7d0"
                      />
                      <RC.Area
                        type="monotone"
                        dataKey="withdrawal"
                        stackId="2"
                        stroke="#ef4444"
                        fill="#fecaca"
                      />
                    </RC.AreaChart>
                    </RC.ResponsiveContainer>
                ) : (
                  <div className="card-dark p-4 rounded-lg text-sm text-slate-400">Charts loading…</div>
                )}
              </div>
            </div>

            <div className="card-dark p-3 rounded shadow">
              <h4 className="font-medium mb-2">Yearly Overview</h4>
                <div className="w-full h-44 md:h-48">
                {RC ? (
                  <RC.ResponsiveContainer>
                    <RC.BarChart data={analytics.yearly}>
                      <RC.XAxis dataKey="year" />
                      <RC.YAxis />
                      <RC.Tooltip />
                      <RC.Bar dataKey="deposit" fill="#10b981" />
                      <RC.Bar dataKey="withdrawal" fill="#ef4444" />
                    </RC.BarChart>
                    </RC.ResponsiveContainer>
                ) : (
                  <div className="card-dark p-4 rounded-lg text-sm text-slate-400">Charts loading…</div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        // Global summary layout when no focused account
        <>
          <div className="grid md:grid-cols-1 gap-4">
            <div className="chart-card">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <div>
                  <h4 className="font-medium mb-1 text-slate-200">
                    Total Visitors
                  </h4>
                  <div className="text-sm text-slate-400">
                    Total for the last 3 months
                  </div>
                </div>
                <div className="chart-controls">
                  <button
                    className={`range-btn ${range === "3m" ? "active" : ""}`}
                    onClick={() => setRange("3m")}
                  >
                    Last 3 months
                  </button>
                  <button
                    className={`range-btn ${range === "30d" ? "active" : ""}`}
                    onClick={() => setRange("30d")}
                  >
                    Last 30 days
                  </button>
                  <button
                    className={`range-btn ${range === "7d" ? "active" : ""}`}
                    onClick={() => setRange("7d")}
                  >
                    Last 7 days
                  </button>
                </div>
              </div>

              {(!analytics.balanceSeries || analytics.balanceSeries.length === 0) && accounts && accounts.length > 0 && (
                <div className="text-sm text-slate-400 mb-2">No transactions found — showing opening balances across accounts.</div>
              )}
              <div className="w-full h-80 md:h-[28rem] rounded-md overflow-hidden">
                {RC ? (
                  <RC.ResponsiveContainer>
                    <RC.AreaChart data={globalChartSeries}>
                      <defs>
                        <linearGradient id="gradA" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#9ca3af" stopOpacity={0.28} />
                          <stop offset="100%" stopColor="#020202" stopOpacity={0.06} />
                        </linearGradient>
                        <linearGradient id="gradB" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.18} />
                          <stop offset="100%" stopColor="#ffffff" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <RC.CartesianGrid strokeDasharray="3 3" stroke="#0f1720" />
                      <RC.XAxis dataKey="date" tick={{ fill: "#94a3b8" }} />
                      <RC.YAxis tick={{ fill: "#94a3b8" }} />
                      <RC.Tooltip wrapperStyle={{ background: "#0b1220", border: "1px solid #1f2937", color: "#e6eef8" }} />
                      <RC.Area type="monotone" dataKey="balance" stroke="#e5e7eb" strokeWidth={2} fill="url(#gradA)" dot={false} />
                      <RC.Area type="monotone" dataKey="balance" stroke="#9ca3af" strokeWidth={1} fill="url(#gradB)" dot={false} opacity={0.6} />
                    </RC.AreaChart>
                    </RC.ResponsiveContainer>
                ) : (
                  <div className="card-dark p-4 rounded-lg text-sm text-slate-400">Charts loading…</div>
                )}
              </div>
            </div>

            <div className="card-dark p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-slate-200">Deposits vs Withdrawals</h4>
              <div className="w-full h-60 md:h-64">
                {accountRows && accountRows.length > 0 ? (
                  RC ? (
                    <RC.ResponsiveContainer>
                      <RC.BarChart
                        data={accountRows.map((r) => ({
                          name: r.name,
                          deposit: r.totalDeposit + r.totalOtherDeposit,
                          withdrawal: r.totalPenal + r.totalOtherW,
                        }))}
                      >
                        <RC.XAxis dataKey="name" tick={{ fill: "#94a3b8" }} />
                        <RC.YAxis tick={{ fill: "#94a3b8" }} />
                        <RC.Tooltip wrapperStyle={{ background: "#0b1220", border: "1px solid #1f2937", color: "#e6eef8" }} />
                        <RC.Bar dataKey="deposit" fill="#10b981" />
                        <RC.Bar dataKey="withdrawal" fill="#ef4444" />
                      </RC.BarChart>
                    </RC.ResponsiveContainer>
                  ) : (
                    <div className="card-dark p-4 rounded-lg text-sm text-slate-400">Charts loading…</div>
                  )
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-slate-400">
                    <div className="text-center">
                      <div className="mb-2">No deposit/withdrawal data available.</div>
                      <div className="text-sm">Add accounts or transactions to populate this chart.</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default React.memo(Dashboard);
