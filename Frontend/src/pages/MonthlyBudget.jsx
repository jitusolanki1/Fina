import React from "react";

const categories = [
  { name: "Housing", value: 1200 },
  { name: "Food", value: 450 },
  { name: "Transport", value: 160 },
  { name: "Savings", value: 500 },
  { name: "Entertainment", value: 120 },
];

export default function MonthlyBudget(){
  const total = categories.reduce((s,c)=>s+c.value,0);
  return (
    <div className="min-h-[60vh] text-slate-200">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">Monthly Budget</h1>
        <p className="text-sm text-slate-400 mb-4">Track category spending for the current month.</p>

        <div className="p-4 bg-slate-800/40 rounded-lg">
          <div className="mb-4">
            <div className="text-sm text-slate-400">Total budget</div>
            <div className="text-2xl font-bold">${total}</div>
          </div>

          <div className="space-y-3">
            {categories.map((c)=> (
              <div key={c.name} className="flex items-center justify-between bg-[#070707] p-3 rounded border border-slate-700">
                <div>
                  <div className="font-medium">{c.name}</div>
                  <div className="text-sm text-slate-400">${c.value}</div>
                </div>
                <div className="w-48 bg-slate-700 rounded h-3 overflow-hidden">
                  <div className="h-3 bg-green-500" style={{width: `${(c.value/total)*100}%`}} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
