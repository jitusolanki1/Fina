import React, { useEffect, useState } from "react";
import { fetchJson } from "../fetchClient";
import { listAccounts } from "../services/accountsService";

function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function csvDownload(filename, rows) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function Reports() {
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [accountPanelOpen, setAccountPanelOpen] = useState(false);
  const [rangeType, setRangeType] = useState("last_week");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);

  const TPL_KEY = "reportTemplates_v1";

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TPL_KEY);
      setTemplates(raw ? JSON.parse(raw) : []);
    } catch (e) {
      setTemplates([]);
    }
  }, []);

  function saveTemplates(next) {
    setTemplates(next);
    localStorage.setItem(TPL_KEY, JSON.stringify(next));
  }

  function openAccountPanel() {
    setAccountPanelOpen(true);
    setShowCreateMenu(false);
    setRangeType("last_week");
    setCustomFrom("");
    setCustomTo("");
    setReportData(null);
  }

  function computeRange(type) {
    const today = new Date();
    const end = new Date();
    let start = new Date();
    if (type === "last_week") {
      start.setDate(end.getDate() - 6);
    } else if (type === "last_month") {
      start.setDate(end.getDate() - 29);
    } else if (type === "custom") {
      start = new Date(customFrom || "");
      end.setTime(new Date(customTo || "").getTime() || end.getTime());
    }
    return { start: fmtDate(start), end: fmtDate(end) };
  }

  async function generateAccountReport() {
    setLoading(true);
    setReportData(null);
    try {
      const { start, end } = computeRange(rangeType);
      // fetch accounts and transactions (live + archived) in parallel
      const [accounts, txRes, histRes, preTxRes, preHistRes] = await Promise.all([
        listAccounts(),
        fetchJson(`/transactions?date_gte=${start}&date_lte=${end}`),
        fetchJson(`/transactionsHistory?date_gte=${start}&date_lte=${end}`),
        fetchJson(`/transactions?date_lt=${start}`),
        fetchJson(`/transactionsHistory?date_lt=${start}`),
      ]);
      // accounts returned by listAccounts are normalized (include id)
      const txs = (txRes || []).concat(histRes || []);
      const preTxs = (preTxRes || []).concat(preHistRes || []);

      // initialize per-account aggregates
      const byAcc = {};
      for (const a of accounts) {
        byAcc[a.id] = {
          id: a.id,
          name: a.name,
          // opening at range start will be computed below
          opening: Number(a.openingBalance || 0),
          deposits: 0,
          withdrawals: 0,
          txCount: 0,
        };
      }

      // compute net of transactions BEFORE the range start to derive opening at start
      const preNetByAcc = {};
      for (const t of preTxs) {
        const id = t.accountId;
        if (!preNetByAcc[id]) preNetByAcc[id] = 0;
        const deposits = Number(t.deposit || 0) + Number(t.otherDeposit || 0);
        const withdrawals = Number(t.penalWithdrawal || 0) + Number(t.otherWithdrawal || 0);
        preNetByAcc[id] += deposits - withdrawals;
      }

      // aggregate transactions inside the selected range
      for (const t of txs) {
        const id = t.accountId;
        if (!byAcc[id]) continue;
        const deposits = Number(t.deposit || 0) + Number(t.otherDeposit || 0) + Number(t.penalDeposit || 0) + Number(t.upLineDeposit || 0);
        const withdrawals = Number(t.penalWithdrawal || 0) + Number(t.otherWithdrawal || 0) + Number(t.upLineWithdrawal || 0);
        byAcc[id].deposits += deposits;
        byAcc[id].withdrawals += withdrawals;
        byAcc[id].txCount += 1;
      }

      // build rows using opening at start = account.openingBalance + netBefore
      const rows = Object.values(byAcc).map((a) => {
        const netBefore = preNetByAcc[a.id] || 0;
        const openingAtStart = Number(a.opening || 0) + netBefore;
        const net = a.deposits - a.withdrawals;
        const closing = openingAtStart + net;
        return {
          ...a,
          opening: openingAtStart,
          net,
          closing,
        };
      });

      // enrich transactions with account name for transaction-level exports
      const accMap = Object.fromEntries((accounts || []).map((a) => [a.id, a.name]));
      const txRows = (txs || []).map((t) => ({
        date: t.date,
        accountId: t.accountId,
        accountName: accMap[t.accountId] || "-",
        description: t.description || "",
        deposit: Number(t.deposit || 0),
        penalDeposit: Number(t.penalDeposit || 0),
        otherDeposit: Number(t.otherDeposit || 0),
        upLineDeposit: Number(t.upLineDeposit || 0),
        penalWithdrawal: Number(t.penalWithdrawal || 0),
        otherWithdrawal: Number(t.otherWithdrawal || 0),
        upLineWithdrawal: Number(t.upLineWithdrawal || 0),
        createdBy: t.createdBy || "",
      }));

      setReportData({
        start: computeRange(rangeType).start,
        end: computeRange(rangeType).end,
        rows,
        txs: txRows,
      });
    } catch (err) {
      console.error(err);
      alert("Report generation failed. See console.");
    } finally {
      setLoading(false);
    }
  }

  function downloadCSV() {
    if (!reportData) return;
    const header = [
      "Account ID",
      "Account Name",
      "Opening",
      "Deposits",
      "Withdrawals",
      "Net",
      "Closing",
      "TxCount",
    ];
    const rows = [header].concat(
      reportData.rows.map((r) => [
        r.id,
        r.name,
        r.opening,
        r.deposits,
        r.withdrawals,
        r.net,
        r.closing,
        r.txCount,
      ])
    );
    const filename = `account-report-${reportData.start}_to_${reportData.end}.csv`;
    csvDownload(filename, rows);
  }

  function saveTemplate() {
    const name = prompt("Template name");
    if (!name) return;
    const tpl = {
      id: Date.now().toString(36),
      name,
      type: "account",
      params: { rangeType, customFrom, customTo },
    };
    saveTemplates([...(templates || []), tpl]);
  }

  function applyTemplate(tpl) {
    if (tpl.type !== "account") return;
    setRangeType(tpl.params.rangeType || "last_week");
    setCustomFrom(tpl.params.customFrom || "");
    setCustomTo(tpl.params.customTo || "");
    setReportData(null);
    setAccountPanelOpen(true);
  }

  function deleteTemplate(id) {
    const next = (templates || []).filter((t) => t.id !== id);
    saveTemplates(next);
  }

  return (
    <div data-tour="reports" className="space-y-4">
      <h3 className="text-lg font-semibold">Reports</h3>

      <div className="flex items-center gap-3">
        <div className="relative" onMouseLeave={() => setShowCreateMenu(false)}>
          <button
            onMouseEnter={() => setShowCreateMenu(true)}
            className="px-3 py-2 bg-[#0b1220] border border-[var(--border)] text-slate-200 rounded"
          >
            Create Report
          </button>
          {showCreateMenu && (
            <div className="absolute z-40 mt-1 left-0 w-48 bg-[#070708] border border-gray-800 rounded shadow p-2">
              <button
                className="w-full text-left p-2 rounded hover:bg-[#0f1113]"
                onClick={() => {
                  setShowCreateMenu(false);
                  /* TODO: CIW flow */ alert(
                    "CIW report flow not implemented yet"
                  );
                }}
              >
                CIW Report
              </button>
              <button
                className="w-full text-left p-2 rounded hover:bg-[#0f1113]"
                onClick={openAccountPanel}
              >
                Account Report
              </button>
              <button
                className="w-full text-left p-2 rounded hover:bg-[#0f1113]"
                onClick={() => {
                  setShowCreateMenu(false);
                  alert("Income report flow not implemented yet");
                }}
              >
                Income Report
              </button>
            </div>
          )}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <select
            className="control-btn"
            onChange={(e) => {
              const v = e.target.value;
              if (!v) return;
              try {
                applyTemplate(JSON.parse(v));
              } catch (err) {
                console.error("Invalid template payload", err);
              }
            }}
          >
            <option value="">Apply Template...</option>
            {(templates || []).map((t) => (
              <option key={t.id} value={JSON.stringify(t)}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            className="control-btn"
            onClick={() => {
              const n = prompt("New template name");
              if (!n) return;
              saveTemplates([
                ...(templates || []),
                {
                  id: Date.now().toString(36),
                  name: n,
                  type: "account",
                  params: { rangeType, customFrom, customTo },
                },
              ]);
            }}
          >
            Save Template
          </button>
        </div>
      </div>

      {accountPanelOpen && (
        <div className="card-dark p-4 rounded">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-slate-200">Account Report</h4>
              <div className="text-sm text-slate-300">
                Select a range to generate per-account balances and activity.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="control-btn"
                onClick={() => {
                  setAccountPanelOpen(false);
                  setReportData(null);
                }}
              >
                Close
              </button>
            </div>
          </div>

          <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-300">Range:</label>
              <select
                className="control-btn"
                value={rangeType}
                onChange={(e) => setRangeType(e.target.value)}
              >
                <option value="last_week">Last Week</option>
                <option value="last_month">Last Month</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {rangeType === "custom" && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  className="control-btn"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
                <span className="text-sm text-slate-300">to</span>
                <input
                  type="date"
                  className="control-btn"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </div>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button
                className="px-3 py-2 bg-blue-600 text-white rounded"
                onClick={generateAccountReport}
                disabled={loading}
              >
                {loading ? "Generating..." : "Generate"}
              </button>
              <button className="control-btn" onClick={saveTemplate}>
                Save Template
              </button>
            </div>
          </div>

          {reportData && (
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-300">
                  Preview: {reportData.start} → {reportData.end}
                </div>
                <div className="flex items-center gap-2">
                    <button className="control-btn" onClick={downloadCSV}>
                      Download Summary CSV
                    </button>
                    <button className="control-btn" onClick={() => {
                      // download transaction-level CSV with descriptions, totals and per-user breakdown
                      if (!reportData || !reportData.txs) return;
                      const header = ["Date", "Account", "Description", "Deposit", "PenalDeposit", "OtherDeposit", "UpLineDeposit", "PenalWithdrawal", "OtherWithdrawal", "UpLineWithdrawal", "CreatedBy"];
                      const rows = [header].concat(reportData.txs.map((r) => [r.date || "", r.accountName || "", r.description || "", r.deposit || 0, r.penalDeposit || 0, r.otherDeposit || 0, r.upLineDeposit || 0, r.penalWithdrawal || 0, r.otherWithdrawal || 0, r.upLineWithdrawal || 0, r.createdBy || ""]));

                      // compute totals
                      const totals = reportData.txs.reduce((acc, x) => {
                        acc.deposit += Number(x.deposit || 0);
                        acc.penalDeposit += Number(x.penalDeposit || 0);
                        acc.otherDeposit += Number(x.otherDeposit || 0);
                        acc.upLineDeposit += Number(x.upLineDeposit || 0);
                        acc.penalWithdrawal += Number(x.penalWithdrawal || 0);
                        acc.otherWithdrawal += Number(x.otherWithdrawal || 0);
                        acc.upLineWithdrawal += Number(x.upLineWithdrawal || 0);
                        return acc;
                      }, { deposit: 0, penalDeposit: 0, otherDeposit: 0, upLineDeposit: 0, penalWithdrawal: 0, otherWithdrawal: 0, upLineWithdrawal: 0 });

                      rows.push(["", "TOTALS", "", totals.deposit, totals.penalDeposit, totals.otherDeposit, totals.upLineDeposit, totals.penalWithdrawal, totals.otherWithdrawal, totals.upLineWithdrawal, ""]);

                      // per-user breakdown
                      const perUser = {};
                      for (const x of reportData.txs) {
                        const u = x.createdBy || 'Unknown';
                        if (!perUser[u]) perUser[u] = { count: 0, deposit: 0, penalDeposit: 0, otherDeposit: 0, upLineDeposit: 0, penalWithdrawal: 0, otherWithdrawal: 0, upLineWithdrawal: 0 };
                        perUser[u].count += 1;
                        perUser[u].deposit += Number(x.deposit || 0);
                        perUser[u].penalDeposit += Number(x.penalDeposit || 0);
                        perUser[u].otherDeposit += Number(x.otherDeposit || 0);
                        perUser[u].upLineDeposit += Number(x.upLineDeposit || 0);
                        perUser[u].penalWithdrawal += Number(x.penalWithdrawal || 0);
                        perUser[u].otherWithdrawal += Number(x.otherWithdrawal || 0);
                        perUser[u].upLineWithdrawal += Number(x.upLineWithdrawal || 0);
                      }

                      rows.push([]);
                      rows.push(["User","Count","Deposit","PenalDeposit","OtherDeposit","UpLineDeposit","PenalWithdrawal","OtherWithdrawal","UpLineWithdrawal","Net"]);
                      for (const [u, d] of Object.entries(perUser)) {
                        const net = d.deposit + d.penalDeposit + d.otherDeposit + d.upLineDeposit - d.penalWithdrawal - d.otherWithdrawal - d.upLineWithdrawal;
                        rows.push([u, d.count, d.deposit, d.penalDeposit, d.otherDeposit, d.upLineDeposit, d.penalWithdrawal, d.otherWithdrawal, d.upLineWithdrawal, net]);
                      }

                      const filename = `transactions-${reportData.start}_to_${reportData.end}.csv`;
                      csvDownload(filename, rows);
                    }}>
                      Download Transactions CSV
                    </button>
                </div>
              </div>

              <div className="mt-3 overflow-auto">
                <table className="min-w-full text-sm table-fixed">
                  <thead>
                    <tr className="text-left text-slate-400">
                      <th className="p-2">Account</th>
                      <th className="p-2 text-right">Opening</th>
                      <th className="p-2 text-right">Deposits</th>
                      <th className="p-2 text-right">Withdrawals</th>
                      <th className="p-2 text-right">Net</th>
                      <th className="p-2 text-right">Closing</th>
                      <th className="p-2 text-right">Tx</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.rows.map((r) => (
                      <tr key={r.id} className="border-t border-gray-800">
                        <td className="p-2">{r.name}</td>
                        <td className="p-2 text-right num-col">
                          {r.opening.toLocaleString()}
                        </td>
                        <td className="p-2 text-right num-col">
                          {r.deposits.toLocaleString()}
                        </td>
                        <td className="p-2 text-right num-col">
                          {r.withdrawals.toLocaleString()}
                        </td>
                        <td className="p-2 text-right num-col">
                          {r.net.toLocaleString()}
                        </td>
                        <td className="p-2 text-right num-col">
                          {r.closing.toLocaleString()}
                        </td>
                        <td className="p-2 text-right">{r.txCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="mt-4">
            <h5 className="text-sm text-slate-200">Saved Templates</h5>
            <div className="mt-2 space-y-2">
              {(templates || [])
                .filter((t) => t.type === "account")
                .map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-2 bg-[#060607] rounded"
                  >
                    <div className="text-sm text-slate-200">{t.name}</div>
                    <div className="flex items-center gap-2">
                      <button
                        className="control-btn"
                        onClick={() => applyTemplate(t)}
                      >
                        Apply
                      </button>
                      <button
                        className="control-btn"
                        onClick={() => {
                          const n = prompt("Rename template", t.name);
                          if (n) {
                            saveTemplates(
                              templates.map((x) =>
                                x.id === t.id ? { ...x, name: n } : x
                              )
                            );
                          }
                        }}
                      >
                        Rename
                      </button>
                      <button
                        className="control-btn"
                        onClick={() => deleteTemplate(t.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(Reports);
