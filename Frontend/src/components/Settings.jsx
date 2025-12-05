import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import fetchClient from '../fetchClient';

const Settings = () => {
  const [settings, setSettings] = useState({
    theme: 'light',
    notifications: true,
    currency: 'USD',
    language: 'en',
    autoSave: true,
  });
  const { user, token } = useAuth();
  const [githubToken, setGithubToken] = useState('');
  const [githubStatus, setGithubStatus] = useState(null);
  const [currentUser, setCurrentUser] = useState(user || null);
  const [committing, setCommitting] = useState(false);
  const [timezone, setTimezone] = useState(user?.timezone || 'Asia/Kolkata');
  const [autoCommit, setAutoCommit] = useState(user?.autoCommit ?? true);
  const [commitTime, setCommitTime] = useState(user?.commitTime || '00:00');

  const handleSettingChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  // On mount or when token changes, refresh server-side user info so
  // GitHub connection state (which may have been updated via OAuth callback)
  // is reflected in the settings UI.
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await fetchClient.fetchJson('/auth/me', { method: 'GET' });
        if (mounted && me && me.user) {
          setCurrentUser(me.user);
          if (me.user.github && me.user.github.username) {
            setGithubStatus({ ok: true, username: me.user.github.username, repo: me.user.github.repo });
          }
        }
      } catch (e) {
        // ignore — user may not be logged in
      }

      // detect OAuth redirect flag in URL (e.g. ?github_connected=1)
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('github_connected') === '1') {
          try {
            const me2 = await fetchClient.fetchJson('/auth/me', { method: 'GET' });
            if (mounted && me2 && me2.user) {
              setCurrentUser(me2.user);
              if (me2.user.github && me2.user.github.username) {
                setGithubStatus({ ok: true, username: me2.user.github.username, repo: me2.user.github.repo });
                alert('GitHub connected successfully');
              }
            }
          } catch (e) {}
        }
      } catch (e) {}
    })();
    return () => { mounted = false; };
  }, [token]);

  async function saveSettings() {
    if (!user || !user.email) return alert('Please login first');
    try {
      const payload = { email: user.email, timezone, autoCommit, commitTime };
      const res = await fetchClient.fetchJson('/settings/update-settings', { method: 'POST', body: JSON.stringify(payload) });
      alert('Settings saved');
    } catch (e) {
      alert('Save failed: ' + (e?.message || e));
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Settings</h2>

        <div className="space-y-6">
          {/* Theme Settings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Appearance</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
                  Theme
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) => handleSettingChange('theme', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Notifications</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-dark-300">
                    Enable Notifications
                  </label>
                  <p className="text-sm text-gray-500 dark:text-dark-400">
                    Receive notifications for important updates
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Preferences</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
                  Currency
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) => handleSettingChange('currency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
            </div>
          </div>

          {/* Data & Privacy */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Data & Privacy</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-dark-300">
                    Auto-save
                  </label>
                  <p className="text-sm text-gray-500 dark:text-dark-400">
                    Automatically save changes as you work
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoSave}
                    onChange={(e) => handleSettingChange('autoSave', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-6 border-t border-gray-200 dark:border-dark-700 space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700 mb-2">Timezone</label>
                <input value={timezone} onChange={(e) => setTimezone(e.target.value)} className="w-full px-3 py-2 border rounded" />
                <p className="text-xs text-gray-500 mt-1">IANA timezone (e.g. Asia/Kolkata)</p>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Auto Commit</label>
                <label className="inline-flex items-center">
                  <input type="checkbox" checked={autoCommit} onChange={(e) => setAutoCommit(e.target.checked)} className="mr-2" /> Enable
                </label>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">Commit Time (HH:mm)</label>
                <input value={commitTime} onChange={(e) => setCommitTime(e.target.value)} className="w-full px-3 py-2 border rounded" />
              </div>
            </div>

            <div>
              <button onClick={saveSettings} className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium">Save Settings</button>
            </div>
          </div>

          {/* GitHub Integration */}
          <div className="pt-6 border-t border-gray-200 dark:border-dark-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">GitHub Integration</h3>
            <div className="space-y-4">
              <p className="text-sm text-gray-500 dark:text-dark-400">Connect your GitHub account to automatically push daily summaries to a private repo named <code>Fina</code>.</p>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">Personal Access Token (PAT)</label>
                  <input value={githubToken} onChange={(e) => setGithubToken(e.target.value)} placeholder="ghp_xxx..." className="w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg bg-white dark:bg-dark-700 text-gray-900 dark:text-white" />
                  <p className="text-xs text-gray-500 mt-1">Requires <code>repo</code> scope for private repo access. You can also connect via OAuth below.</p>
                  <div className="mt-2">
                    <button onClick={async () => {
                      if (!user || !user.email) return alert('Please login first');
                      try {
                        setGithubStatus(null);
                        const res = await fetchClient.fetchJson('/settings/github/pat', { method: 'POST', body: JSON.stringify({ email: user.email, token: githubToken }) });
                        setGithubStatus({ ok: true, msg: res.msg, username: res.username, repo: res.repo });
                      } catch (e) {
                        setGithubStatus({ ok: false, msg: e?.body?.msg || e.message || 'Failed' });
                      }
                    }} className="mt-2 px-4 py-2 bg-green-600 text-white rounded">Save PAT</button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-dark-300 mb-2">Or Connect via OAuth</label>
                  <p className="text-sm text-gray-500 dark:text-dark-400">This opens GitHub to authorize the app. Requires a registered OAuth application on the backend.</p>
                  {/* Open backend OAuth connect endpoint (use Vite env or fallback to localhost backend) */}
                  {
                    (() => {
                      const backendRoot = (import.meta.env.VITE_API_URL || (process.env.NODE_ENV === 'production' ? 'https://fina-nbnq.onrender.com/api' : 'http://localhost:4000/api')).replace(/\/api\/?$/i, '');
                      // If user is logged in and we have a token, encode it into the linkState so
                      // the backend can associate the OAuth callback with the logged-in user.
                      const linkState = token ? `userToken:${encodeURIComponent(token)}` : undefined;
                      const href = linkState ? `${backendRoot}/auth/github/connect?linkState=${encodeURIComponent(linkState)}` : `${backendRoot}/auth/github/connect`;
                      return (
                        <a href={href} target="_blank" rel="noreferrer" className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded">Connect with GitHub</a>
                      );
                    })()
                  }
                </div>
              </div>

              {githubStatus && (
                <div className={`p-3 rounded ${githubStatus.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  {githubStatus.ok ? `Connected: ${githubStatus.username} (repo: ${githubStatus.repo})` : `Error: ${githubStatus.msg}`}
                </div>
              )}

              {/* Show current linked status for the authenticated user (fresh from server) */}
              {currentUser && currentUser.github && currentUser.github.accessToken && (
                <div className="p-3 rounded bg-green-50 text-green-800">Connected (saved on your account): {currentUser.github.username || currentUser.github.repo}</div>
              )}

              <div className="pt-4">
                <button onClick={async () => {
                  if (!user) return alert('login required');
                  // Prefer the freshest server-side user info (may have been updated by OAuth callback)
                  let serverUser = currentUser;
                  try {
                    const me = await fetchClient.fetchJson('/auth/me', { method: 'GET' });
                    serverUser = me.user || serverUser;
                    setCurrentUser(serverUser);
                  } catch (e) {
                    // ignore — we'll proceed with whatever we have locally
                  }

                  if (!serverUser || !serverUser.github || !serverUser.github.accessToken) {
                    return alert('Manual commit failed: GitHub not connected. Please connect your GitHub account or save a PAT in Settings.');
                  }

                  setCommitting(true);
                  try {
                    const r = await fetchClient.fetchJson('/commit/manual', { method: 'POST' });
                    alert(`Manual commit: pushed ${r.pushed} files`);
                  } catch (e) {
                    alert('Manual commit failed: ' + (e?.body?.msg || e.message));
                  } finally { setCommitting(false); }
                }} className="px-4 py-2 bg-indigo-600 text-white rounded" disabled={committing}>{committing ? 'Pushing...' : 'Manual Push Now'}</button>
                <p className="text-xs text-gray-500 mt-2">Scheduled automatic push runs at the time configured below (local timezone).</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
