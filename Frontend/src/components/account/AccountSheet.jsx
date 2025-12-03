import { useEffect, useMemo, useState } from "react";
import { Trash2, Edit3 } from "lucide-react";
import api from "../../api";
import toast from "react-hot-toast";
import { runningBalances } from "../../utils/logic";

export default function AccountSheet({
  account,
  onClose,
  historyRange = null,
}) {
  const [rows, setRows] = useState([]);
  const [rawTxs, setRawTxs] = useState([]);

  const fmt = (v) => Number(v || 0).toLocaleString();
  const [form, setForm] = useState({
    description: "",
    deposit: "",
    otherDeposit: "",
    penalWithdrawal: "",
    otherWithdrawal: "",
  });
  const [editingCell, setEditingCell] = useState(null);
  const [latest, setLatest] = useState(null);
  const [breakdown, setBreakdown] = useState(null);

  async function load() {
    try {
      // If historyRange is provided, load archived transactions for that summaryRange
      let txs = [];
      if (historyRange) {
        const q = encodeURIComponent(historyRange);
        const res = await api.get(
          `/transactionsHistory?summaryRange=${q}&accountId=${account.id}&_sort=date&_order=asc`
        );
        txs = res.data || [];
      } else {
        // Fetch live transactions in ascending date order
        const res = await api.get(
          `/transactions?accountId=${account.id}&_sort=date&_order=asc`
        );
        txs = res.data || [];
      }
      setRawTxs(txs);
      const withBalances = runningBalances(account.openingBalance, txs);
      setRows(withBalances);
      // compute automatic breakdown (group by name/description key)
      try {
        const opening = Number(account.openingBalance || 0);
        const extractKey = (desc) => {
          if (!desc) return "Unknown";
          const d = String(desc).trim();
          const m = d.match(/^([\p{L}0-9 .'-]+?)\s+ne\b/i);
          if (m) return m[1].trim();
          const first = d.split(/\s+/)[0];
          return first || d;
        };
        const byKey = {};
        let totalCr = 0;
        let totalDr = 0;
        for (const t of txs) {
          const key = extractKey(t.description || "");
          const cr = Number(t.deposit || 0) + Number(t.otherDeposit || 0);
          const dr = Number(t.penalWithdrawal || 0) + Number(t.otherWithdrawal || 0);
          if (!byKey[key]) byKey[key] = { key, cr: 0, dr: 0 };
          byKey[key].cr += cr;
          byKey[key].dr += dr;
          totalCr += cr;
          totalDr += dr;
        }
        const rowsB = Object.values(byKey).sort((a, b) => b.cr - a.cr);
        const closing = opening + totalCr - totalDr;
        setBreakdown({ opening, rows: rowsB, totalCr, totalDr, closing });
      } catch (err) {
        console.error('breakdown compute failed', err);
      }
    } catch (err) {
      console.error(err);
      toast.error("Could not load transactions");
    }

    try {
      const res = await api.get(`/summaries?_sort=date&_order=desc`);
      const summaries = res.data;
      for (const s of summaries) {
        const accSummary = s.perAccount.find(
          (p) => String(p.accountId) === String(account.id)
        );
        if (accSummary) {
          setLatest(accSummary);
          break;
        }
      }
    } catch (err) {
      console.error("Could not load latest summary", err);
    }
  }
  useEffect(() => {
    load();
  }, [account]);

  const hasOpeningTx = (rawTxs || []).some((t) =>
    String(t.description || "")
      .toLowerCase()
      .includes("opening")
  );

  const openingRow = !hasOpeningTx
    ? (() => {
        const ob = Number(account.openingBalance || 0);
        return (
          <tr key="__opening" className="border-t border-[#1f2937]">
            <td className="p-2">{new Date().toISOString().slice(0, 10)}</td>
            <td className="p-2">Opening Balance</td>
            <td className="p-2 text-center">{ob}</td>
            <td className="p-2 text-center">0</td>
            <td className="p-2 text-center">0</td>
            <td className="p-2 text-center">0</td>
            <td className="p-2 font-medium text-slate-100 text-center">{ob}</td>
            <td className="p-2 text-center">&nbsp;</td>
          </tr>
        );
      })()
    : null;

  async function addTx(e) {
    e.preventDefault();
    try {
      await api.post("/transactions", {
        accountId: account.id,
        description: form.description,
        deposit: Number(form.deposit) || 0,
        otherDeposit: Number(form.otherDeposit) || 0,

        penalWithdrawal: Number(form.penalWithdrawal) || 0,
        otherWithdrawal: Number(form.otherWithdrawal) || 0,
        date: new Date().toISOString().slice(0, 10),
      });
      toast.success("Transaction added");
      setForm({
        description: "",
        deposit: "",

        otherDeposit: "",
        penalWithdrawal: "",
        otherWithdrawal: "",
      });
      load();
    } catch (err) {
      console.error(err);
      toast.error("Could not add transaction");
    }
  }

  return (
    <div className="">
      <div
        className="card-dark p-4 rounded"
        style={{ maxHeight: "calc(100vh - 200px)", overflow: "auto" }}
      >
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              {account.name}
            </h3>
            {latest ? (
              <div className="text-xs text-slate-400">
                Last roll ({latest.date}): Next Opening{" "}
                {fmt(latest.openingAfter)}
              </div>
            ) : (
              <div className="text-xs text-slate-400">
                Opening: {fmt(account.openingBalance)}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <div className="text-sm text-slate-200">
              Current Opening: {fmt(account.openingBalance)}
            </div>
            <button
              onClick={() => {
                window.history.back();
              }}
              className="px-2 py-1 bg-slate-700 text-slate-100 rounded"
            >
              Close
            </button>
          </div>
        </div>

        {/* Aggregate breakdown panel (moved to top) */}
        <div className="p-3 mb-4 rounded border">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-slate-400">Aggregated breakdown</div>
            <div className="text-xs text-slate-500">Grouped by name/description</div>
          </div>

          {breakdown ? (
            <div className="mt-1">
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="text-sm text-slate-400">Opening balance</div>
                <div className="col-span-2 text-right font-medium text-slate-100">{Number(breakdown.opening).toLocaleString()}</div>
              </div>

              <div className="overflow-auto rounded border" style={{ borderColor: '#1f2937' }}>
                <table className="min-w-full text-sm table-fixed table-dark">
                  <thead style={{ background: '#0A0A0A', color: '#e6eef8', borderBottom: '1px solid #1f2937' }}>
                    <tr>
                      <th className="p-2 text-left">Name / Desc</th>
                      <th className="p-2 text-right">CR</th>
                      <th className="p-2 text-right">DR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdown.rows.map((r) => (
                      <tr key={r.key} className="border-t border-[#1f2937]">
                        <td className="p-2">{r.key}</td>
                        <td className="p-2 text-right font-medium text-green-400">{Number(r.cr).toLocaleString()}</td>
                        <td className="p-2 text-right font-medium text-red-400">{Number(r.dr).toLocaleString()}</td>
                      </tr>
                    ))}
                    <tr className="border-t border-[#1f2937] bg-[#0b0b0b]">
                      <td className="p-2 font-semibold">Total</td>
                      <td className="p-2 text-right font-semibold text-green-400">{Number(breakdown.totalCr).toLocaleString()}</td>
                      <td className="p-2 text-right font-semibold text-red-400">{Number(breakdown.totalDr).toLocaleString()}</td>
                    </tr>
                    <tr className="border-t border-[#1f2937]">
                      <td className="p-2 font-semibold">Closing balance</td>
                      <td colSpan={2} className="p-2 text-right font-semibold text-slate-100">{Number(breakdown.closing).toLocaleString()}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-sm text-slate-400">No transactions to aggregate</div>
          )}
        </div>

        {/* Archived notice (show under breakdown at top) */}
        {historyRange && (
          <div className="p-3 mb-4 rounded border text-sm text-amber-200 bg-[#070705]" style={{ borderColor: '#3b3b3b' }}>
            Viewing archived transactions for <strong className="text-slate-100">{historyRange}</strong>. These entries are <span className="font-semibold">read-only</span>.
          </div>
        )}

        {/* hide add form when viewing archived history */}
        {!historyRange && (
          <form
            onSubmit={addTx}
            className="grid grid-cols-1 md:grid-cols-6 gap-2 mb-4 add-form items-end"
          >
            <div className="md:col-span-3">
              <input
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="bg-[#0A0A0A] border border-[#1f2937] p-2 w-full text-slate-200 rounded"
              />
            </div>
            <div className="md:col-span-1">
              <input
                type="number"
                placeholder="Deposit"
                value={form.deposit}
                onChange={(e) => setForm({ ...form, deposit: e.target.value })}
                className="bg-[#0A0A0A] border border-[#1f2937] p-2 w-full text-slate-200 rounded"
              />
            </div>
            <div className="md:col-span-1">
              <input
                type="number"
                placeholder="Other Deposit"
                value={form.otherDeposit}
                onChange={(e) =>
                  setForm({ ...form, otherDeposit: e.target.value })
                }
                className="bg-[#0A0A0A] border border-[#1f2937] p-2 w-full text-slate-200 rounded"
              />
            </div>
            <div className="md:col-span-1">
              <input
                type="number"
                placeholder="Penal Withdrawal"
                value={form.penalWithdrawal}
                onChange={(e) =>
                  setForm({ ...form, penalWithdrawal: e.target.value })
                }
                className="bg-[#0A0A0A] border border-[#1f2937] p-2 w-full text-slate-200 rounded"
              />
            </div>
            <div className="md:col-span-1">
              <input
                type="number"
                placeholder="Other Withdrawal"
                value={form.otherWithdrawal}
                onChange={(e) =>
                  setForm({ ...form, otherWithdrawal: e.target.value })
                }
                className="bg-[#0A0A0A] border border-[#1f2937] p-2 w-full text-slate-200 rounded"
              />
            </div>
            <div className="md:col-span-6 flex justify-end">
              <button
                className="btn-primary bg-blue-700 p-2 rounded-md"
                type="submit"
              >
                Add Transaction
              </button>
            </div>
          </form>
        )}
        {/* archived message moved below aggregated breakdown for better layout */}

        <div
          className="overflow-auto rounded border"
          style={{ borderColor: "#1f2937" }}
        >
          <table className="min-w-full text-sm table-fixed table-dark">
            <thead
              className="sticky top-0"
              style={{
                background: "#0A0A0A",
                color: "#e6eef8",
                borderBottom: "1px solid #1f2937",
              }}
            >
              <tr>
                <th className="p-2" style={{ width: "12%" }}>
                  Date
                </th>
                <th className="p-2" style={{ width: "36%" }}>
                  Desc
                </th>
                <th className="p-2" style={{ width: "10%" }}>
                  Deposit
                </th>
                <th className="p-2" style={{ width: "10%" }}>
                  Other Dep
                </th>
                <th className="p-2" style={{ width: "10%" }}>
                  Penal W
                </th>
                <th className="p-2" style={{ width: "10%" }}>
                  Other W
                </th>
                <th className="p-2" style={{ width: "12%" }}>
                  Balance
                </th>
                <th className="p-2" style={{ width: "8%" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {openingRow}
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-[#1f2937]">
                  <td className="p-2">{r.date}</td>
                  <td
                    className="p-2"
                    onDoubleClick={() =>
                      setEditingCell({
                        id: r.id,
                        field: "description",
                        value: r.description,
                      })
                    }
                  >
                    {editingCell &&
                    editingCell.id === r.id &&
                    editingCell.field === "description" ? (
                      <input
                        type="text"
                        value={editingCell.value}
                        onChange={(e) =>
                          setEditingCell((s) => ({
                            ...s,
                            value: e.target.value,
                          }))
                        }
                        onBlur={async (e) => {
                          try {
                            await api.patch(`/transactions/${r.id}`, {
                              description: editingCell.value,
                            });
                            setEditingCell(null);
                            load();
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.target.blur();
                        }}
                        autoFocus
                        className="bg-[#0A0A0A] border border-[#1f2937] p-1 w-full text-slate-200 rounded"
                      />
                    ) : (
                      r.description
                    )}
                  </td>
                  <td
                    className="p-2 num-col"
                    onDoubleClick={() =>
                      setEditingCell({
                        id: r.id,
                        field: "deposit",
                        value: r.deposit,
                      })
                    }
                  >
                    {editingCell &&
                    editingCell.id === r.id &&
                    editingCell.field === "deposit" ? (
                      <input
                        type="number"
                        value={editingCell.value}
                        onChange={(e) =>
                          setEditingCell((s) => ({
                            ...s,
                            value: e.target.value,
                          }))
                        }
                        onBlur={async (e) => {
                          try {
                            await api.patch(`/transactions/${r.id}`, {
                              deposit: Number(editingCell.value),
                            });
                            setEditingCell(null);
                            load();
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.target.blur();
                        }}
                        autoFocus
                        className="bg-[#0A0A0A] border border-[#1f2937] p-1 w-24 text-slate-200 rounded text-center"
                      />
                    ) : (
                      fmt(r.deposit)
                    )}
                  </td>
                  <td
                    className="p-2 num-col"
                    onDoubleClick={() =>
                      setEditingCell({
                        id: r.id,
                        field: "otherDeposit",
                        value: r.otherDeposit,
                      })
                    }
                  >
                    {editingCell &&
                    editingCell.id === r.id &&
                    editingCell.field === "otherDeposit" ? (
                      <input
                        type="number"
                        value={editingCell.value}
                        onChange={(e) =>
                          setEditingCell((s) => ({
                            ...s,
                            value: e.target.value,
                          }))
                        }
                        onBlur={async (e) => {
                          try {
                            await api.patch(`/transactions/${r.id}`, {
                              otherDeposit: Number(editingCell.value),
                            });
                            setEditingCell(null);
                            load();
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.target.blur();
                        }}
                        autoFocus
                        className="bg-[#0A0A0A] border border-[#1f2937] p-1 w-24 text-slate-200 rounded text-center"
                      />
                    ) : (
                      fmt(r.otherDeposit)
                    )}
                  </td>
                  <td
                    className="p-2 num-col"
                    onDoubleClick={() =>
                      setEditingCell({
                        id: r.id,
                        field: "penalWithdrawal",
                        value: r.penalWithdrawal,
                      })
                    }
                  >
                    {editingCell &&
                    editingCell.id === r.id &&
                    editingCell.field === "penalWithdrawal" ? (
                      <input
                        type="number"
                        value={editingCell.value}
                        onChange={(e) =>
                          setEditingCell((s) => ({
                            ...s,
                            value: e.target.value,
                          }))
                        }
                        onBlur={async (e) => {
                          try {
                            await api.patch(`/transactions/${r.id}`, {
                              penalWithdrawal: Number(editingCell.value),
                            });
                            setEditingCell(null);
                            load();
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.target.blur();
                        }}
                        autoFocus
                        className="bg-[#0A0A0A] border border-[#1f2937] p-1 w-24 text-slate-200 rounded text-center"
                      />
                    ) : (
                      fmt(r.penalWithdrawal)
                    )}
                  </td>
                  <td
                    className="p-2 num-col"
                    onDoubleClick={() =>
                      setEditingCell({
                        id: r.id,
                        field: "otherWithdrawal",
                        value: r.otherWithdrawal,
                      })
                    }
                  >
                    {editingCell &&
                    editingCell.id === r.id &&
                    editingCell.field === "otherWithdrawal" ? (
                      <input
                        type="number"
                        value={editingCell.value}
                        onChange={(e) =>
                          setEditingCell((s) => ({
                            ...s,
                            value: e.target.value,
                          }))
                        }
                        onBlur={async (e) => {
                          try {
                            await api.patch(`/transactions/${r.id}`, {
                              otherWithdrawal: Number(editingCell.value),
                            });
                            setEditingCell(null);
                            load();
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") e.target.blur();
                        }}
                        autoFocus
                        className="bg-[#0A0A0A] border border-[#1f2937] p-1 w-24 text-slate-200 rounded text-center"
                      />
                    ) : (
                      fmt(r.otherWithdrawal)
                    )}
                  </td>
                  <td className="p-2 balance-cell num-col">{fmt(r.balance)}</td>
                  <td className="p-2">
                    <div className="flex items-center justify-center gap-2">
                      {!historyRange && (
                        <>
                          <button
                            onClick={() =>
                              setEditingCell({
                                id: r.id,
                                field: "description",
                                value: r.description,
                              })
                            }
                            className="px-2 py-1 bg-transparent hover:bg-[#111214] rounded"
                            title="Edit description"
                          >
                            <Edit3 size={14} className="text-slate-300" />
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm("Delete this transaction?")) return;
                              try {
                                await api.delete(`/transactions/${r.id}`);
                                toast.success("Transaction deleted");
                                load();
                              } catch (err) {
                                console.error(err);
                                toast.error("Delete failed");
                              }
                            }}
                            className="px-2 py-1 bg-transparent hover:bg-[#221515] rounded"
                            title="Delete transaction"
                          >
                            <Trash2 size={14} className="text-red-400" />
                          </button>
                        </>
                      )}
                      {historyRange && (
                        <div className="archived-label">archived</div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
