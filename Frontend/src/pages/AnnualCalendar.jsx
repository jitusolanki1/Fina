import React from "react";

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function AnnualCalendar(){
  return (
    <div className="min-h-[60vh] text-slate-200">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">Annual Calendar</h1>
        <p className="text-sm text-slate-400 mb-4">Year overview for planning budgets, bills, and important dates.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {months.map((m)=> (
            <div key={m} className="p-3 bg-slate-800/40 rounded-lg border border-slate-700">
              <div className="font-medium mb-1">{m}</div>
              <div className="text-sm text-slate-400">Add budget milestones, bills, and reminders for {m}.</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
