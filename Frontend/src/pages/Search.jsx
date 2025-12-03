import React, { useEffect, useMemo, useState } from "react";
import api from "../api";
import { listAccounts } from "../services/accountsService";
import { Search as SearchIcon } from "lucide-react";

function csvDownload(filename, rows) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""') }"`).join(",")).join("\n");
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

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("account"); // 'account' or 'description'
  const [accounts, setAccounts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [history, setHistory] = useState(() => {
    try {
      const raw = localStorage.getItem("searchHistory_v1");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const a = await listAccounts();
        setAccounts(a || []);
      } catch (err) {
        console.error('Could not load accounts', err);
        setAccounts([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const q = query.trim().toLowerCase();

    // account name suggestions
    const accSug = accounts
      .filter((a) => a.name && a.name.toLowerCase().includes(q))
      .slice(0, 6)
      .map((a) => ({ type: "account", id: a.id, label: a.name }));

    // description suggestions: query transactions and transactionHistory
    const fetchDesc = async () => {
      try {
        const [t1, t2] = await Promise.all([
          api.get(`/transactions?description_like=${encodeURIComponent(q)}&_limit=6`),
          api.get(`/transactionsHistory?description_like=${encodeURIComponent(q)}&_limit=6`),
        ]);
        const txs = (t1.data || []).concat(t2.data || []);
        const seen = new Set();
        const descs = [];
        for (const tx of txs) {
          const d = (tx.description || "").trim();
          if (!d) continue;
          const low = d.toLowerCase();
          if (!low.includes(q)) continue;
          if (seen.has(low)) continue;
          seen.add(low);
          descs.push({ type: "desc", label: d });
          if (descs.length >= 6) break;
        }
        setSuggestions([...accSug, ...descs].slice(0, 10));
      } catch (err) {
        console.error(err);
        setSuggestions(accSug);
      }
    };

    fetchDesc();
  }, [query, accounts]);

  function saveHistory(entry) {
    const next = [entry, ...history.filter((h) => h.key !== entry.key)].slice(0, 30);
    setHistory(next);
    localStorage.setItem("searchHistory_v1", JSON.stringify(next));
  }

  async function runSearch(q = query, selectedSuggestion = null) {
    const text = (q || "").trim();
    if (!text) return;
    setLoading(true);
    try {
      let txs = [];
      if (selectedSuggestion && selectedSuggestion.type === "account") {
        const id = selectedSuggestion.id;
        const [r1, r2] = await Promise.all([
          api.get(`/transactions?accountId=${id}&_sort=date&_order=asc`),
          api.get(`/transactionsHistory?accountId=${id}&_sort=date&_order=asc`),
        ]);
        txs = (r1.data || []).concat(r2.data || []);
      } else if (mode === "account") {
        // attempt to find account by name
        const acc = accounts.find((a) => a.name && a.name.toLowerCase() === text.toLowerCase()) || accounts.find((a) => a.name && a.name.toLowerCase().includes(text.toLowerCase()));
        if (acc) {
          const [r1, r2] = await Promise.all([
            api.get(`/transactions?accountId=${acc.id}&_sort=date&_order=asc`),
            api.get(`/transactionsHistory?accountId=${acc.id}&_sort=date&_order=asc`),
          ]);
          txs = (r1.data || []).concat(r2.data || []);
        } else {
          // no account found, return empty
          txs = [];
        }
      } else {
        // description search: fetch then strictly filter client-side to avoid unrelated results
        const [r1, r2] = await Promise.all([
          api.get(`/transactions?description_like=${encodeURIComponent(text)}&_sort=date&_order=asc`),
          api.get(`/transactionsHistory?description_like=${encodeURIComponent(text)}&_sort=date&_order=asc`),
        ]);
        txs = (r1.data || []).concat(r2.data || []);
        const qLower = text.toLowerCase();
        txs = txs.filter((t) => (t.description || "").toLowerCase().includes(qLower));
      }

      // attach account name and openingBalance. If some account ids are missing from the cached `accounts`, fetch them individually.
      const accMap = Object.fromEntries(accounts.map((a) => [a.id, { name: a.name, openingBalance: Number(a.openingBalance || 0) }]));

      const missingIds = Array.from(new Set(txs.map((t) => t.accountId).filter((id) => id && !accMap[id])));
      if (missingIds.length) {
        try {
          const { getAccount } = await import("../services/accountsService");
          const fetched = await Promise.all(
            missingIds.map((id) => getAccount(id).catch(() => null))
          );
          for (let i = 0; i < missingIds.length; i++) {
            const id = missingIds[i];
            const res = fetched[i];
            if (res) {
              accMap[id] = { name: res.name, openingBalance: Number(res.openingBalance || 0) };
            }
          }
        } catch (err) {
          console.error('Error fetching missing accounts', err);
        }
      }

      const enriched = txs.map((t) => ({
        ...t,
        accountName: (accMap[t.accountId] && accMap[t.accountId].name) || "-",
        accountOpening: (accMap[t.accountId] && accMap[t.accountId].openingBalance) || 0,
      }));

      setResults(enriched);

      // save history
      saveHistory({ key: `${mode}:${text}`, mode, text, at: new Date().toISOString() });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function clearHistory() {
    setHistory([]);
    localStorage.removeItem("searchHistory_v1");
  }

  function downloadResultsCSV() {
    if (!results || results.length === 0) return;
    const header = ["Date", "Account", "Description", "Deposit", "OtherDeposit", "PenalWithdrawal", "OtherWithdrawal"];
    const rows = [header].concat(results.map((r) => [r.date || "", r.accountName || "", r.description || "", r.deposit || 0, r.otherDeposit || 0, r.penalWithdrawal || 0, r.otherWithdrawal || 0]));
    csvDownload(`search-results-${new Date().toISOString().slice(0,10)}.csv`, rows);
  }

  const suggestionList = useMemo(() => suggestions, [suggestions]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Search</h3>
          <div className="text-sm text-slate-400">Find transactions by account name or description.</div>
        </div>
      </div>

      <div className="card-dark p-4 rounded">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2 bg-[#060607] p-2 rounded flex-1">
            <div className="flex items-center gap-2">
              <label className="text-sm text-slate-300">Mode</label>
              <select className="control-btn" value={mode} onChange={(e) => setMode(e.target.value)}>
                <option value="account">Account Name</option>
                <option value="description">Description</option>
              </select>
            </div>
            <div className="flex-1">
              <input
                className="w-full bg-transparent px-3 py-2 text-slate-100"
                placeholder={mode === "account" ? "Search account name (type ≥2 chars)" : "Search description (type ≥2 chars)"}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') runSearch(); }}
              />
            </div>
            <div>
              <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={() => runSearch()}>
                <SearchIcon size={14} />
              </button>
            </div>
          </div>
        </div>

        {suggestionList.length > 0 && (
          <div className="mt-2 bg-[#050506] border border-gray-800 rounded overflow-hidden">
            {suggestionList.map((s, i) => (
              <button key={i} className="w-full text-left p-2 hover:bg-[#0f1113] flex justify-between" onClick={() => { setQuery(s.type === 'account' ? s.label : s.label); runSearch(s.type === 'account' ? s.label : s.label, s); }}>
                <div>
                  <div className="text-sm text-slate-100">{s.label}</div>
                  <div className="text-xs text-slate-400">{s.type === 'account' ? 'Account' : 'Description'}</div>
                </div>
                <div className="text-xs text-slate-400">Select</div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-400">Search History</div>
            <div className="flex items-center gap-2">
              <button className="control-btn" onClick={clearHistory}>Clear</button>
            </div>
          </div>
          <div className="mt-2 space-y-2">
            {history.length === 0 && <div className="text-sm text-slate-500">No recent searches</div>}
            {history.map((h) => (
              <div key={h.key} className="flex items-center justify-between p-2 bg-[#060607] rounded">
                <div className="text-sm text-slate-200">{h.mode === 'account' ? 'Account: ' : 'Desc: '}{h.text}</div>
                <div className="flex items-center gap-2">
                  <button className="control-btn" onClick={() => { setMode(h.mode); setQuery(h.text); runSearch(h.text); }}>Run</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">Results</h4>
          <div className="flex items-center gap-2">
            <div className="text-sm text-slate-400">{loading ? 'Loading...' : `${results.length} transactions`}</div>
            <button className="control-btn" onClick={downloadResultsCSV}>Download CSV</button>
          </div>
        </div>

        <div className="overflow-auto rounded bg-[#070708] border border-gray-800">
          <table className="min-w-full text-sm table-fixed">
            <thead>
                <tr className="text-left text-slate-400">
                  <th className="p-2">Date</th>
                  <th className="p-2">Account</th>
                  <th className="p-2">Opening</th>
                  <th className="p-2">Description</th>
                  <th className="p-2 text-right">Deposit</th>
                  <th className="p-2 text-right">OtherDep</th>
                  <th className="p-2 text-right">PenalW</th>
                  <th className="p-2 text-right">OtherW</th>
                </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="border-t border-gray-800 hover:bg-[#0f1113]">
                  <td className="p-2">{r.date || ""}</td>
                  <td className="p-2">{r.accountName}</td>
                  <td className="p-2 text-right num-col">{Number(r.accountOpening || 0).toLocaleString()}</td>
                  <td className="p-2 truncate" style={{maxWidth: 360}}>{r.description}</td>
                  <td className="p-2 text-right num-col">{Number(r.deposit||0).toLocaleString()}</td>
                  <td className="p-2 text-right num-col">{Number(r.otherDeposit||0).toLocaleString()}</td>
                  <td className="p-2 text-right num-col">{Number(r.penalWithdrawal||0).toLocaleString()}</td>
                  <td className="p-2 text-right num-col">{Number(r.otherWithdrawal||0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
