import React, { useState } from "react";

export default function TodoList() {
  const [items, setItems] = useState([
    { id: 1, text: "Connect bank account", done: false },
    { id: 2, text: "Set monthly budget", done: false },
  ]);
  const [text, setText] = useState("");

  function add() {
    if (!text.trim()) return;
    setItems((s) => [...s, { id: Date.now(), text: text.trim(), done: false }]);
    setText("");
  }

  function toggle(id) {
    setItems((s) => s.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  }

  return (
    <div className="min-h-[60vh] text-slate-200">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-semibold mb-2">To‑do List</h1>
        <p className="text-sm text-slate-400 mb-4">Keep track of setup tasks and financial reminders.</p>

        <div className="p-4 bg-slate-800/40 rounded-lg">
          <div className="flex gap-2 mb-4">
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a task" className="flex-1 bg-[#0B0B0B] border border-slate-700 rounded p-2 text-slate-100" />
            <button onClick={add} className="px-4 bg-blue-600 hover:bg-blue-500 rounded text-white">Add</button>
          </div>

          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.id} className="flex items-center justify-between bg-[#070707] border border-slate-700 rounded p-3">
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={it.done} onChange={() => toggle(it.id)} />
                  <span className={it.done ? "line-through text-slate-400" : ""}>{it.text}</span>
                </div>
                <div className="text-slate-400 text-sm">{it.done ? "Done" : "Pending"}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
