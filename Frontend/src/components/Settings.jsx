import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthProvider";
import fetchClient from "../fetchClient";

const Settings = () => {
  const [settings, setSettings] = useState({
    theme: "light",
    notifications: true,
    currency: "USD",
    language: "en",
    autoSave: true,
  });
  const { user, token } = useAuth();
  const [githubToken, setGithubToken] = useState("");
  const [githubStatus, setGithubStatus] = useState(null);
  const [currentUser, setCurrentUser] = useState(user);
  const [committing, setCommitting] = useState(false);
  const [timezone, setTimezone] = useState(currentUser?.timezone);
  const [autoCommit, setAutoCommit] = useState(currentUser?.autoCommit);
  const [commitTime, setCommitTime] = useState(currentUser?.commitTime);

  const handleSettingChange = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const me = await fetchClient.fetchJson("/auth/me", { method: "GET" });
        if (mounted && me && me.user) {
          setCurrentUser(me.user);
          if (me.user.github && me.user.github.username) {
            setGithubStatus({
              ok: true,
              username: me.user.github.username,
              repo: me.user.github.repo,
              avatarUrl: me.user.github.avatarUrl,
            });
          }
        }
      } catch (e) {
        console.error("Settings fetch /auth/me error", e && e.message);
      }

      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get("github_connected") === "1") {
          try {
            const me2 = await fetchClient.fetchJson("/auth/me", {
              method: "GET",
            });
            if (mounted && me2 && me2.user) {
              setCurrentUser(me2.user);
              if (me2.user.github && me2.user.github.username) {
                setGithubStatus({
                  ok: true,
                  username: me2.user.github.username,
                  repo: me2.user.github.repo,
                  avatarUrl: me2.user.github.avatarUrl,
                });
                alert("GitHub connected successfully");
              }
            }
          } catch (e) {}
        }
      } catch (e) {}
    })();
    return () => {
      mounted = false;
    };
  }, [token]);

  async function handleManualPush() {
    if (!user) return alert("login required");
    let serverUser = currentUser;
    try {
      const me = await fetchClient.fetchJson("/auth/me", {
        method: "GET",
      });
      serverUser = me.user || serverUser;
      setCurrentUser(serverUser);
    } catch (e) {}

    if (!serverUser || !serverUser.github || !serverUser.github.accessToken) {
      return alert(
        "Manual commit failed: GitHub not connected. Please connect your GitHub account or save a PAT in Settings."
      );
    }

    setCommitting(true);
    try {
      const r = await fetchClient.fetchJson("/commit/manual", {
        method: "POST",
      });
      alert(`Manual commit: pushed ${r.pushed} files`);
    } catch (e) {
      alert("Manual commit failed: " + (e?.body?.msg || e.message));
    } finally {
      setCommitting(false);
    }
  }

  async function handlePATSave() {
    if (!user || !user.email) return alert("Please login first");
    try {
      setGithubStatus(null);
      const res = await fetchClient.fetchJson("/settings/github/pat", {
        method: "POST",
        body: JSON.stringify({
          email: user.email,
          token: githubToken,
        }),
      });
      setGithubStatus({
        ok: true,
        msg: res.msg,
        username: res.username,
        repo: res.repo,
        avatarUrl: res.avatarUrl,
      });
      setCurrentUser((c) =>
        c
          ? {
              ...c,
              github: {
                ...(c.github || {}),
                username: res.username,
                avatarUrl: res.avatarUrl,
                repo: res.repo,
              },
            }
          : c
      );
    } catch (e) {
      setGithubStatus({
        ok: false,
        msg: e?.body?.msg || e.message || "Failed",
      });
    }
  }

  async function saveSettings() {
    if (!user || !user.email) return alert("Please login first");
    try {
      const payload = { email: user.email, timezone, autoCommit, commitTime };
      const res = await fetchClient.fetchJson("/settings/update-settings", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      alert("Settings saved");
    } catch (e) {
      alert("Save failed: " + (e?.message || e));
    }
  }

  async function removeGithub() {
    if (!user || !user.email) return alert("Please login first");
    try {
      if (!confirm("Disconnect GitHub from your account?")) return;
      const res = await fetchClient.fetchJson("/settings/github/remove", {
        method: "POST",
        body: JSON.stringify({ email: user.email }),
      });
      setGithubStatus(null);
      setCurrentUser((c) => (c ? { ...c, github: undefined } : c));
      alert("GitHub disconnected");
    } catch (e) {
      alert("Failed to disconnect GitHub: " + (e?.message || e));
    }
  }

  return (
    <div className="max-w-full mx-auto space-y-4">
      <div className="rounded-md shadow-sm border settings-card">
        <div className="space-y-6">
          {/* Notifications */}
          <div>
            <h3 className="text-lg font-medium text-white dark:text-white mb-4">
              Notifications
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-200">
                    Enable Notifications
                  </label>
                  <p className="text-sm text-slate-400">
                    Receive notifications for important updates
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) =>
                      handleSettingChange("notifications", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-500 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h3 className="text-lg font-medium text-white dark:text-white mb-4">
              Preferences
            </h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Currency
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) =>
                    handleSettingChange("currency", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[#0A0A0A] text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Language
                </label>
                <select
                  value={settings.language}
                  onChange={(e) =>
                    handleSettingChange("language", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[#0A0A0A] text-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            <h3 className="text-lg font-medium text-white dark:text-white mb-4">
              Data & Privacy
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-slate-200">
                    Auto-save
                  </label>
                  <p className="text-sm text-slate-400">
                    Automatically save changes as you work
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoSave}
                    onChange={(e) =>
                      handleSettingChange("autoSave", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-500 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-6 border-t border-[var(--border)] space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-200 mb-2">
                  Timezone
                </label>
                <input
                  value={currentUser.timezone || "Not Set"}
                  onChange={(e) => setTimezone(e.target.value)}
                  className={
                    "w-full px-3 py-2 border border-[var(--border)] rounded bg-[#0A0A0A] text-slate-200"
                  }
                />
              </div>
              <div>
                <label className="block text-sm text-slate-200 mb-2">
                  Auto Commit
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={autoCommit}
                    onChange={(e) => setAutoCommit(e.target.checked)}
                    className="mr-2"
                  />{" "}
                  Enable
                </label>
              </div>
              <div>
                <label className="block text-sm text-slate-200 mb-2">
                  Commit Time (HH:mm)
                </label>
                <input
                  value={currentUser.commitTime || "--:--"}
                  onChange={(e) => setCommitTime(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded bg-[#0A0A0A] text-slate-200"
                />
              </div>
            </div>

            <div>
              <button
                onClick={saveSettings}
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
              >
                Save Settings
              </button>
            </div>
          </div>
          <div>
            {/* GitHub Integration */}
            <div className="pt-6  space-y-1 settings-card border-t border-[var(--border)]">
              <h3 className="text-lg font-medium text-white dark:text-white mb-4">
                GitHub Integration
              </h3>
              {!currentUser?.github?.username && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 dark:text-dark-400">
                    Connect your GitHub account to automatically push daily
                    summaries to a private repo named <code>Fina</code>.
                  </p>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="grid md:grid-cols-3 gap-1 items-end">
                      <label className="block text-sm font-medium text-slate-200 md:col-span-3">
                        Personal Access Token (PAT)
                      </label>
                      <input
                        value={githubToken}
                        onChange={(e) => setGithubToken(e.target.value)}
                        placeholder="ghp_xxx..."
                        className=" border border-[var(--border)] rounded-md bg-[#0A0A0A] text-slate-200 sm:col-span-2 px-3 py-2 w-full"
                      />
                      <div className="">
                        <button
                          onClick={handlePATSave}
                          className=" px-4 py-2 bg-green-600 text-white rounded"
                        >
                          Save PAT
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white dark:text-dark-300 mb-2">
                        Or Connect via OAuth
                      </label>
                      {(() => {
                        const backendRoot = (
                          import.meta.env.VITE_API_URL ||
                          (process.env.NODE_ENV === "production"
                            ? "https://fina-nbnq.onrender.com/api"
                            : "http://localhost:4000/api")
                        ).replace(/\/api\/?$/i, "");
                        const linkState = token
                          ? `userToken:${encodeURIComponent(token)}`
                          : undefined;
                        const href = linkState
                          ? `${backendRoot}/auth/github/connect?linkState=${encodeURIComponent(
                              linkState
                            )}`
                          : `${backendRoot}/auth/github/connect`;
                        return (
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded"
                          >
                            Connect with GitHub
                          </a>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}
              {githubStatus && !githubStatus.ok && (
                <div className={`p-3 rounded bg-red-50 text-red-800`}>
                  Error: {githubStatus.msg}
                </div>
              )}

              {currentUser?.github?.username &&
                (() => {
                  const avatarSrc = `https://github.com/${currentUser.github.username}.png?size=80`;
                  return (
                    <div
                      className="p-3 rounded flex items-center gap-2"
                      style={{ background: "#05230a", color: "#bbf7d0" }}
                    >
                      <img
                        src={avatarSrc}
                        alt="avatar"
                        className="w-12 h-12 rounded-full"
                        style={{ objectFit: "cover", background: "#081010" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div className="font-medium">
                          <a
                            href={`https://github.com/${currentUser.github.username}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-100"
                          >
                            {currentUser.name}
                          </a>
                        </div>
                        <div className="text-sm text-slate-400">
                          Repo: {currentUser.github.repo || "Fina"}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={removeGithub}
                          className="px-3 py-1 bg-red-600 text-white rounded"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })()}

              <div className="pt-4">
                <button
                  onClick={handleManualPush}
                  className={
                    "px-4 py-2 bg-indigo-600 text-white rounded  btn-with-tooltip" +
                    (autoCommit ? " opacity-50 cursor-not-allowed " : "")
                  }
                  disabled={committing || autoCommit}
                >
                  {committing ? "Pushing..." : "Manual Push Now"}
                  {autoCommit && (
                    <span className="tooltip !bg-gray-900 text-white">
                      Auto Push Disabled and Save Settings
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
