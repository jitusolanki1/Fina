import { useState } from 'react';
import { createAccount } from '../../services/accountsService';
import toast from 'react-hot-toast';

export default function AccountForm({ onCreated, onOpenDetail }) {
  const [name, setName] = useState('');
  const [opening, setOpening] = useState('0');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name) return toast.error('Name required');
    try {
      const account = await createAccount({ name, openingBalance: Number(opening) });
      // NOTE: don't create a duplicate opening transaction here. The app
      // uses the account's `openingBalance` as the canonical opening amount.
      // Creating both `openingBalance` and an 'Opening Balance' transaction
      // caused the balance to be counted twice.
      toast.success('Account created');
      setName('');
      setOpening('0');
      onCreated && onCreated(account);
    } catch (err) {
      console.error(err);
      toast.error('Could not create account');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card-dark p-4 rounded">
      <h3 className="text-lg font-semibold mb-2">Add Account</h3>
      <div className="mb-2">
        <label className="block text-sm text-slate-300">Name</label>
        <input value={name} onChange={e=>setName(e.target.value)} className="p-2 w-full rounded bg-[#0A0A0A] border border-[var(--border)] text-slate-200" />
      </div>
      <div className="mb-2">
        <label className="block text-sm text-slate-300">Opening Balance</label>
        <input value={opening} onChange={e=>setOpening(e.target.value)} type="number" className="p-2 w-full rounded bg-[#0A0A0A] border border-[var(--border)] text-slate-200" />
      </div>
      <div className="flex gap-2">
        <button className="bg-blue-600 text-white px-3 py-1 rounded">Create</button>
        <button type="button" onClick={()=>onOpenDetail && onOpenDetail(null)} className="px-3 py-1 rounded border border-[var(--border)] text-slate-200">Open detailed form</button>
      </div>
    </form>
  );
}
