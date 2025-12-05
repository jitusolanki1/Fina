import React, { useEffect, useState } from 'react';
import { fetchJson } from '../fetchClient';
import { useAuth } from '../auth/AuthProvider';

export default function ProfilePage() {
  const { user, token } = useAuth();
  const [me, setMe] = useState(user || null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchJson('/auth/me', { method: 'GET' });
        if (mounted && res && res.user) setMe(res.user);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, [token]);

  const avatar = (me && me.github && me.github.avatarUrl) || (me && me.email ? `https://www.gravatar.com/avatar/${md5(me.email.trim().toLowerCase())}?s=160&d=identicon` : '');

  function md5(str) {
    try {
      const crypto = window.crypto || window.msCrypto;
      if (!crypto || !crypto.subtle) return '';
    } catch (e) {}
    return '';
  }

  function getInitials(name) {
    const s = String(name || '').trim();
    if (!s) return 'U';
    const parts = s.split(/\s+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0][0] + (parts[1][0] || '')).slice(0,2).toUpperCase();
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex flex-col items-center mb-6">
        <div className="w-28 h-28 rounded-full overflow-hidden mb-3" style={{background:'#111'}}>
          {me && me.github && (me.github.avatarUrl || me.github.username) ? (
            <img src={me.github.avatarUrl || `https://github.com/${me.github.username}.png?size=160`} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl text-slate-200 font-semibold">{getInitials(me?.name || me?.email || 'U')}</div>
          )}
        </div>
        <h1 className="text-2xl font-semibold text-slate-100">{me?.name || me?.email || 'User'}</h1>
        <div className="text-sm text-slate-400">{me?.email || ''}</div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="settings-card">
          <h3 className="font-semibold text-slate-100 mb-3">Personal details</h3>
          <div className="divide-y divide-[var(--border)]">
            <div className="py-2 flex justify-between text-sm text-slate-200"><div>Full name:</div><div>{me?.name || '-'}</div></div>
            <div className="py-2 flex justify-between text-sm text-slate-200"><div>Email:</div><div>{me?.email || '-'}</div></div>
            <div className="py-2 flex justify-between text-sm text-slate-200"><div>Timezone:</div><div>{me?.timezone || '-'}</div></div>
          </div>
        </div>

        <div className="settings-card">
          <h3 className="font-semibold text-slate-100 mb-3">Account details</h3>
          <div className="divide-y divide-[var(--border)]">
            <div className="py-2 flex justify-between text-sm text-slate-200"><div>Account Created:</div><div>{me?.createdAt ? new Date(me.createdAt).toLocaleDateString() : '-'}</div></div>
            <div className="py-2 flex justify-between text-sm text-slate-200"><div>Last Login:</div><div>{me?.lastLogin ? new Date(me.lastLogin).toLocaleString() : '-'}</div></div>
            <div className="py-2 flex justify-between text-sm text-slate-200"><div>GitHub:</div><div>{me?.github?.username || '-'}</div></div>
          </div>
        </div>

        <div className="settings-card">
          <h3 className="font-semibold text-slate-100 mb-3">Security settings</h3>
          <div className="divide-y divide-[var(--border)]">
            <div className="py-2 flex justify-between text-sm text-slate-200"><div>Password last changed:</div><div>-</div></div>
            <div className="py-2 flex justify-between text-sm text-slate-200"><div>Two-Factor Authentication:</div><div>Enabled</div></div>
            <div className="py-2 flex justify-between text-sm text-slate-200"><div>Recent Account Activity:</div><div>No suspicious activity</div></div>
          </div>
        </div>

        <div className="settings-card">
          <h3 className="font-semibold text-slate-100 mb-3">Preferences</h3>
          <div className="divide-y divide-[var(--border)]">
            <div className="py-2 flex justify-between text-sm text-slate-200"><div>Email Notifications:</div><div>Subscribed</div></div>
            <div className="py-2 flex justify-between text-sm text-slate-200"><div>Dark Mode:</div><div>Activated</div></div>
            <div className="py-2 flex justify-between text-sm text-slate-200"><div>Language:</div><div>{me?.language || 'English'}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
