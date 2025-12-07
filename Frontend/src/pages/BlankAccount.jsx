import React from "react";

export default function BlankAccount() {
  return (
    <div className="min-h-[60vh] bg-transparent text-slate-200">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold">Create Blank Account</h1>
          <p className="text-sm text-slate-400">Start with an empty account template to customize.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-800/40 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-2">Account Details</h2>
            <div className="space-y-3">
              <label className="block text-sm text-slate-300">Account name</label>
              <input className="w-full bg-[#0B0B0B] border border-slate-700 rounded p-2 text-slate-100" placeholder="e.g. Savings" />

              <label className="block text-sm text-slate-300">Currency</label>
              <select className="w-full bg-[#0B0B0B] border border-slate-700 rounded p-2 text-slate-100">
                <option>USD</option>
                <option>EUR</option>
                <option>INR</option>
              </select>

              <label className="block text-sm text-slate-300">Starting balance</label>
              <input className="w-full bg-[#0B0B0B] border border-slate-700 rounded p-2 text-slate-100" placeholder="0.00" />
            </div>
          </div>

          <div className="p-4 bg-slate-800/40 rounded-lg shadow-sm">
            <h2 className="text-lg font-medium mb-2">Quick Actions</h2>
            <div className="flex flex-col gap-3">
              <button className="py-2 px-3 bg-slate-700 hover:bg-slate-600 rounded text-slate-100">Save as Template</button>
              <button className="py-2 px-3 bg-transparent border border-slate-700 rounded text-slate-100">Import Transactions</button>
              <button className="py-2 px-3 bg-transparent border border-red-600 rounded text-red-300">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
