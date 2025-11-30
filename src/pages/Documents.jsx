import React, { useState } from 'react';

export default function Documents() {
  const [docs] = useState([
    { id: 'd1', name: 'Invoice-001.pdf', type: 'PDF', uploadedBy: 'Sienna', date: '2025-11-10', size: '120KB' },
    { id: 'd2', name: 'Contract.docx', type: 'DOCX', uploadedBy: 'Phoenix', date: '2025-11-12', size: '86KB' },
  ]);

  return (
    <div className="space-y-4">
      <div className="table-card">
        <div className="table-header-bar">
          <h3 className="text-lg font-semibold">Documents</h3>
          <div className="controls">
            <label className="control-btn">
              Upload
              <input type="file" style={{ display: 'none' }} />
            </label>
            <button className="control-btn">New Folder</button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="min-w-full text-sm table-fixed table-dark">
            <thead>
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">Uploaded By</th>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-right">Size</th>
                <th className="p-3"> </th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d, idx) => (
                <tr key={d.id} className={`${idx%2===0? '': 'bg-[#07070733]'} hover:bg-[#111216]`}>
                  <td className="p-3 font-medium text-slate-100">{d.name}</td>
                  <td className="p-3">{d.type}</td>
                  <td className="p-3">{d.uploadedBy}</td>
                  <td className="p-3">{d.date}</td>
                  <td className="p-3 text-right">{d.size}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button className="control-btn">Preview</button>
                      <button className="control-btn">Download</button>
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
