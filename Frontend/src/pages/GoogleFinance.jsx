import React, { useState } from "react";

export default function GoogleFinance(){
  const [q, setQ] = useState("");
  const [mock, setMock] = useState(null);

  function search(){
    if(!q.trim()) return;
    // placeholder mock data
    setMock({ symbol: q.toUpperCase(), price: (Math.random()*1200).toFixed(2) });
  }

  return (
    <div className="min-h-[60vh] text-slate-200">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">Google Finance (Mock)</h1>
        <p className="text-sm text-slate-400 mb-4">Quick symbol price lookup. This is a UI placeholder for integrating real finance APIs.</p>

        <div className="p-4 bg-slate-800/40 rounded-lg">
          <div className="flex gap-2 mb-4">
            <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="e.g. AAPL" className="flex-1 bg-[#0B0B0B] border border-slate-700 rounded p-2 text-slate-100" />
            <button onClick={search} className="px-4 bg-blue-600 hover:bg-blue-500 rounded text-white">Search</button>
          </div>

          {mock ? (
            <div className="mt-2 p-3 bg-[#070707] rounded border border-slate-700">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{mock.symbol}</div>
                  <div className="text-sm text-slate-400">Price (mock)</div>
                </div>
                <div className="text-xl font-bold">${mock.price}</div>
              </div>
            </div>
          ) : (
            <div className="text-slate-400">No results yet — try searching a ticker.</div>
          )}
        </div>
      </div>
    </div>
  )
}
