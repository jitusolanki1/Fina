import { useEffect, useRef, useState } from 'react';
import api from '../api';
import { listAccounts } from '../services/accountsService';

export default function CommandPalette({ open, onClose, onSelect, mode = 'open' }){
  const [accounts, setAccounts] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef(null);

  useEffect(()=>{
    if(!open) return;
    (async () => {
      try {
        const a = await listAccounts();
        setAccounts(a || []);
      } catch (err) {
        console.error('Could not load accounts', err);
        setAccounts([]);
      }
    })();
    setQuery('');
    setSelected(0);
    setTimeout(()=> inputRef.current && inputRef.current.focus(), 50);
  }, [open]);

  useEffect(()=>{
    function onKey(e){
      if(!open) return;
      const filtered = accounts.filter(a => a.name.toLowerCase().includes(query.toLowerCase()));
      if(e.key === 'ArrowDown'){
        e.preventDefault(); setSelected(s => Math.min(s+1, filtered.length-1));
      } else if(e.key === 'ArrowUp'){
        e.preventDefault(); setSelected(s => Math.max(s-1, 0));
      } else if(e.key === 'Enter'){
        e.preventDefault(); if(filtered[selected]) select(filtered[selected]);
      } else if(e.key === 'Escape'){
        e.preventDefault(); onClose();
      }
    }
    window.addEventListener('keydown', onKey);
    return ()=> window.removeEventListener('keydown', onKey);
  }, [open, accounts, query, selected, onClose]);

  const filtered = accounts.filter(a => a.name.toLowerCase().includes(query.toLowerCase()));

  function select(account){
    onSelect && onSelect(account);
    onClose && onClose();
  }

  if(!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute right-0 top-0 bottom-0 w-full md:w-96 bg-white shadow-lg p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-semibold">{mode === 'focus' ? 'Focus Account' : 'Quick Open'}</div>
          <div className="text-sm text-gray-500">{mode === 'focus' ? 'Ctrl+I' : 'Ctrl+K'}</div>
        </div>

        <div className="mb-3">
          <input
            ref={inputRef}
            value={query}
            onChange={e=>{ setQuery(e.target.value); setSelected(0); }}
            placeholder="Search accounts..."
            className="w-full border p-2 rounded"
          />
        </div>

        <div className="flex-1 overflow-auto">
          {filtered.length === 0 && (
            <div className="text-sm text-gray-500">No accounts found</div>
          )}

          <ul className="space-y-1">
            {filtered.map((a, idx) => (
              <li key={a.id}>
                <button
                  onClick={()=>select(a)}
                  className={`w-full text-left p-2 rounded flex justify-between items-center ${idx===selected ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}`}
                  onMouseEnter={()=>setSelected(idx)}
                >
                  <div>
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs text-gray-500">Opening: {a.openingBalance}</div>
                  </div>
                  <div className="text-sm">{mode === 'focus' ? 'Focus' : 'Open'}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-3 text-xs text-gray-500">Use arrow keys to navigate · Enter to open · Esc to close</div>
      </aside>
    </div>
  );
}
