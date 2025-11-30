import React, { useState } from 'react';

export default function DataLibrary(){
  const [items, setItems] = useState([
    { id:'m1', name:'Country List', category:'Master', tags:['geo'] },
    { id:'m2', name:'Product Templates', category:'Template', tags:['sales','invoice'] }
  ]);

  return (
    <div className="space-y-4">
      <div className="table-card">
        <div className="table-header-bar">
          <h3 className="text-lg font-semibold">Data Library</h3>
          <div className="controls">
            <button className="control-btn">Add Item</button>
          </div>
        </div>

        <div className="table-wrap">
          <table className="min-w-full text-sm table-fixed table-dark">
            <thead>
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Tags</th>
                <th className="p-3"> </th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx)=> (
                <tr key={it.id} className={`${idx%2===0? '': 'bg-[#07070733]'} hover:bg-[#111216]`}>
                  <td className="p-3 font-medium text-slate-100">{it.name}</td>
                  <td className="p-3">{it.category}</td>
                  <td className="p-3">{it.tags.join(', ')}</td>
                  <td className="p-3">
                    <div className="flex justify-end gap-2">
                      <button className="control-btn">Edit</button>
                      <button className="control-btn">Delete</button>
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
