import React, { useEffect, useState, useCallback } from 'react';
import { fetchJson } from '../fetchClient';
import { MoreHorizontal, Search } from 'lucide-react';
import toast from 'react-hot-toast';

function Avatar({name}){
  const initials = (name||'').split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase();
  return <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-sm font-semibold">{initials}</div>
}

function Team(){
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({name:'', email:'', teams:'', role:'Member'});
  const per = 8;

  const load = useCallback(async () => {
    try{
      const res = await fetchJson('/users');
      setUsers(res || []);
    }catch(e){ console.error(e); toast.error('Could not load users'); }
  }, []);

  useEffect(()=>{ load(); }, [load]);

  const filtered = users.filter(u=> (u.name||'').toLowerCase().includes(q.toLowerCase()) || (u.email||'').toLowerCase().includes(q.toLowerCase()));
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / per));
  const pageItems = filtered.slice((page-1)*per, page*per);

  const downloadCSV = useCallback(() => {
    const cols = ['Name','Email','Date added','Last login','Teams','Role'];
    const rows = users.map(u=>[u.name, u.email, u.dateAdded || '', u.lastLogin || '', (u.teams||[]).join('; '), u.role || '']);
    let csv = cols.join(',') + '\n' + rows.map(r=> r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'team.csv'; a.click(); URL.revokeObjectURL(url);
  }, [users]);

  const handleAdd = useCallback(async (e) => {
    e.preventDefault();
    if(!form.name || !form.email) return toast.error('Name and email required');
    try{
      const newUser = { id: `u${Date.now()}`, name: form.name, email: form.email, dateAdded: new Date().toISOString().slice(0,10), lastLogin: new Date().toISOString().slice(0,10), teams: form.teams ? form.teams.split(',').map(s=>s.trim()).filter(Boolean): [], role: form.role };
      await fetchJson('/users', { method: 'POST', body: JSON.stringify(newUser) });
      toast.success('Member added');
      setShowAdd(false); setForm({name:'',email:'',teams:'',role:'Member'});
      load();
    }catch(err){ console.error(err); toast.error('Could not add member'); }
  }, [form, load]);

  return (
    <div>
      <div className="table-card mb-4">
        <div className="table-header-bar">
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <div className="chips">
              <div className="chip">Manage your team</div>
            </div>
          </div>
          <div className="controls">
            <div className="flex items-center gap-2">
              <div className="relative">
                <input value={q} onChange={e=>{ setQ(e.target.value); setPage(1); }} placeholder="Search" className="auth-input pl-8" />
                <Search className="absolute left-2 top-2 text-slate-400" size={16} />
              </div>
              <button className="control-btn" onClick={downloadCSV}>Download CSV</button>
              <button className="control-btn" onClick={()=>setShowAdd(true)}>+ Add team member</button>
            </div>
          </div>
        </div>

        <div className="table-wrap overflow-x-auto">
          <table className="min-w-full text-sm table-fixed table-dark">
            <thead className="sticky top-0" style={{background:'#0A0A0A', color:'#e6eef8', borderBottom:'1px solid #1f2937'}}>
              <tr>
                <th className="p-3" style={{width:48}}></th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3">Date added</th>
                <th className="p-3">Last login</th>
                <th className="p-3">Teams</th>
                <th className="p-3"> </th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((u, idx)=> (
                <tr key={u.id} className={`${idx%2===0 ? '' : 'bg-[#07070733]'} hover:bg-[#111216]`}>
                  <td className="p-3"><input type="checkbox" className="row-checkbox"/></td>
                  <td className="p-3 flex items-center gap-3">
                    <Avatar name={u.name} />
                    <div>
                      <div className="font-medium">{u.name} <span className="text-xs text-slate-400 ml-2">{u.role}</span></div>
                      <div className="text-xs text-slate-400">{u.email}</div>
                    </div>
                  </td>
                  <td className="p-3">{u.dateAdded}</td>
                  <td className="p-3">{u.lastLogin}</td>
                  <td className="p-3">
                    <div className="flex gap-2 flex-wrap">
                      {u.teams && u.teams.map(t=> <div key={t} className="pill">{t}</div>)}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <button className="page-btn"><MoreHorizontal size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="table-footer">
          <div>{total===0?0:((page-1)*per + 1)} - {Math.min(page*per, total)} of {total} users</div>
          <div className="pager">
            <button className="page-btn" onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
            <div className="page-btn">{page} of {pages}</div>
            <button className="page-btn" onClick={()=>setPage(p=>Math.min(pages,p+1))}>Next</button>
          </div>
        </div>
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-6">
          <div className="absolute inset-0 bg-black/50" onClick={()=>setShowAdd(false)} />
          <div className="relative card-dark rounded shadow max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-100">Add team member</h3>
              <button onClick={()=>setShowAdd(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Name</label>
                <input value={form.name} onChange={e=>setForm(f=>({...f, name:e.target.value}))} className="p-2 w-full rounded bg-[#0A0A0A] border border-[var(--border)] text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Email</label>
                <input value={form.email} onChange={e=>setForm(f=>({...f, email:e.target.value}))} className="p-2 w-full rounded bg-[#0A0A0A] border border-[var(--border)] text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Teams (comma separated)</label>
                <input value={form.teams} onChange={e=>setForm(f=>({...f, teams:e.target.value}))} className="p-2 w-full rounded bg-[#0A0A0A] border border-[var(--border)] text-white" />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Role</label>
                <select value={form.role} onChange={e=>setForm(f=>({...f, role:e.target.value}))} className="p-2 w-full rounded bg-[#0A0A0A] border border-[var(--border)] text-white">
                  <option>Member</option>
                  <option>Admin</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={()=>setShowAdd(false)} className="control-btn">Cancel</button>
                <button className="px-3 py-1 bg-blue-600 text-white rounded">Add member</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(Team);
