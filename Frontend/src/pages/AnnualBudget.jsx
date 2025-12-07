import React from "react";

const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function AnnualBudget(){
  return (
    <div className="min-h-[60vh] text-slate-200">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">Annual Budget</h1>
        <p className="text-sm text-slate-400 mb-4">Overview of yearly allocation and progress.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-800/40 rounded-lg">
            <h2 className="font-medium mb-2">Summary</h2>
            <div className="text-3xl font-bold">$24,800</div>
            <div className="text-sm text-slate-400">Allocated this year</div>
          </div>

          <div className="md:col-span-2 p-4 bg-slate-800/40 rounded-lg">
            <h2 className="font-medium mb-3">Monthly Breakdown</h2>
            <div className="grid grid-cols-3 gap-2">
              {months.map((m)=> (
                <div key={m} className="p-3 bg-[#070707] rounded border border-slate-700 text-center">
                  <div className="text-sm text-slate-400">{m}</div>
                  <div className="font-semibold mt-1">${(Math.random()*2000+500).toFixed(0)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
