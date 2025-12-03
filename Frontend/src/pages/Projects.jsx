import React, { useState } from 'react';

export default function Projects() {
  const [items, setItems] = useState([
    { id: 'p1', name: 'Website Redesign', client: 'Acme', status: 'In Progress', due: '2025-12-10', team: 'Design' },
    { id: 'p2', name: 'Mobile App', client: 'Beta', status: 'Planning', due: '2026-01-15', team: 'Engineering' },
  ]);

  return (
    <div className="space-y-4">
      <div className="table-card">
        <div className="table-header-bar">
          <h3 className="text-lg font-semibold">Projects</h3>
          <div className="controls">
            <button className="control-btn">Add Project</button>
            <button className="control-btn">Kanban View</button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="min-w-full text-sm table-fixed table-dark">
            <thead>
              <tr>
                <th className="p-3 text-left">Project Name</th>
                <th className="p-3 text-left">Client</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Due Date</th>
                <th className="p-3 text-left">Team</th>
                <th className="p-3"> </th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={it.id} className={`${idx%2===0? '': 'bg-[#07070733]'} hover:bg-[#111216]`}>
                  <td className="p-3 font-medium text-slate-100">{it.name}</td>
                  <td className="p-3">{it.client}</td>
                  <td className="p-3">{it.status}</td>
                  <td className="p-3">{it.due}</td>
                  <td className="p-3">{it.team}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button className="control-btn">Open</button>
                      <button className="control-btn">Edit</button>
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
