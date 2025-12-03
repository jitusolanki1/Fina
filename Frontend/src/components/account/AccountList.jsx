import { useEffect, useState } from "react";
import { ArrowRight, Edit3, Trash2, Plus } from "lucide-react";
import api from "../../api";
import { totalsFor } from "../../utils/logic";
import AccountForm from "./AccountForm";
import AccountDetail from "./AccountDetail";
import toast from "react-hot-toast";

export default function AccountList({ onOpen }) {
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [q, setQ] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    try {
      const [aRes, tRes] = await Promise.all([
        api.get("/accounts"),
        api.get("/transactions"),
      ]);
      setAccounts(aRes.data || []);
      setTransactions(tRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Could not load accounts");
    }
  }

  const filtered = accounts.filter((a) =>
    a.name.toLowerCase().includes(q.toLowerCase())
  );
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const startIdx = (page - 1) * perPage;
  const paged = filtered.slice(startIdx, startIdx + perPage);

  async function handleDelete(account) {
    if (
      !confirm(
        `Delete account "${account.name}" and its transactions? This cannot be undone.`
      )
    )
      return;
    try {
      // delete related transactions first
      const txRes = await api.get(`/transactions?accountId=${account.id}`);
      const txs = txRes.data || [];
      await Promise.all(txs.map((t) => api.delete(`/transactions/${t.id}`)));
      await api.delete(`/accounts/${account.id}`);
      toast.success("Account deleted");
      fetchAll();
    } catch (err) {
      console.error(err);
      toast.error("Delete failed");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Accounts</h3>
        <div className="flex items-center gap-2">
          <input
            placeholder="Search accounts..."
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            className="p-2 rounded bg-[#0A0A0A] border border-[var(--border)] text-slate-200"
          />
          <button
            onClick={() => setShowAdd(true)}
            className="px-3 py-1 bg-blue-600 text-white rounded flex items-center gap-2"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      {/* Compact dark list */}
      <ul className="divide-y divide-gray-800 rounded-lg overflow-hidden bg-[#070708]">
        {paged.map((a) => {
          const t = totalsFor(a, transactions);
          const history = a.openingHistory || {};
          const keys = Object.keys(history || {}).sort();
          const latestKey = keys.length ? keys[keys.length - 1] : null;
          const latest = latestKey ? history[latestKey] : null;
          return (
            <li
              key={a.id}
              className="flex items-center justify-between p-3 sm:p-4 hover:bg-[#0f1113] transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 flex-shrink-0 rounded-md bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                  <div className="text-sm font-semibold text-slate-200">
                    {(a.name || "").slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className="min-w-0">
                  <button onClick={() => onOpen(a)} className="text-left block">
                    <div className="text-sm font-medium text-slate-100 truncate">
                      {a.name}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {a.description || ""}
                    </div>
                  </button>
                </div>
              </div>

              <div className="ml-4 flex items-center gap-6">
                <div className="text-right">
                  <div className="text-xs text-slate-400">Balance</div>
                  <div className="text-sm font-medium text-slate-100 num-col">
                    {Number(t.finalBalance || 0).toLocaleString()}
                  </div>
                </div>

                <div className="hidden sm:block text-right">
                  <div className="text-xs text-slate-400">Opening</div>
                  <div className="text-sm text-slate-200 num-col">
                    {Number(a.openingBalance || 0).toLocaleString()}
                  </div>
                </div>

                <div className="hidden lg:block text-right">
                  <div className="text-xs text-slate-400">Last Roll</div>
                  <div className="text-sm text-slate-200">
                    {latest
                      ? `${latest.date}: ${Number(
                          latest.openingAfter || 0
                        ).toLocaleString()}`
                      : "-"}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onOpen(a)}
                    className="px-2 py-1 bg-green-600 text-white rounded flex items-center gap-2"
                  >
                    <ArrowRight size={14} />
                  </button>
                  <button
                    onClick={() => setEditing(a)}
                    className="px-2 py-1 bg-[#111214] border border-[var(--border)] text-gray-300 rounded"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(a)}
                    className="px-2 py-1 bg-[#2a1a1a] border border-red-700 text-red-400 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="table-footer mt-4">
        <div>
          Showing {total === 0 ? 0 : startIdx + 1} -{" "}
          {Math.min(total, startIdx + paged.length)} of {total} account(s)
        </div>
        <div className="pager">
          <div className="page-btn" onClick={() => setPage(1)} title="First">
            ⟪
          </div>
          <div
            className="page-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            title="Prev"
          >
            ⟨
          </div>
          <div className="page-btn">
            {page} of {totalPages}
          </div>
          <div
            className="page-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            title="Next"
          >
            ⟩
          </div>
          <div
            className="page-btn"
            onClick={() => setPage(totalPages)}
            title="Last"
          >
            ⟫
          </div>
          <select
            className="control-btn"
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setPage(1);
            }}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowAdd(false)}
          />
          <div className="relative card-dark rounded shadow max-w-xl w-full p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Create Account</h3>
              <button
                onClick={() => setShowAdd(false)}
                className="px-2 py-1 bg-[#111214] border border-[var(--border)] text-gray-300 rounded"
              >
                Close
              </button>
            </div>
            <AccountForm
              onCreated={(a) => {
                setShowAdd(false);
                fetchAll();
              }}
              onOpenDetail={() => {
                setShowAdd(false);
                setEditing(null);
              }}
            />
          </div>
        </div>
      )}

      {editing && (
        <AccountDetail
          account={editing}
          onSaved={(a) => {
            setEditing(null);
            fetchAll();
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
