import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { fetchJson } from '../fetchClient';

export default function PerplexityChat() {
  const { user } = useAuth() || {};
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastFailedQuery, setLastFailedQuery] = useState(null);
  const suggestions = [
    'Download account "Main" as excel',
    'Show archived history for account "Main"',
    'Export transactions CSV for last 30 days',
  ];

  // send optionally accepts a query string `qArg` (used by suggestion chips and retry)
  async function send(qArg = null) {
    const qSource = qArg !== null && qArg !== undefined ? String(qArg) : input;
    if (!qSource || !String(qSource).trim()) return;
    const q = String(qSource).trim();
    setMessages((m) => [...m, { role: 'user', text: q }]);
    // clear input so user sees it was sent
    setInput('');
    setLoading(true);
    setLastFailedQuery(null);
    try {
      // use centralized fetchJson so Authorization header and refresh logic are applied
      const json = await fetchJson('/perplexity/ask', { method: 'POST', body: JSON.stringify({ q }) });

      if (json.type === 'file' && json.dataBase64) {
        // prepare download link
        const bytes = atob(json.dataBase64);
        const buf = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
        const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        setMessages((m) => [...m, { role: 'assistant', text: `Generated file: ${json.filename}`, file: { url, filename: json.filename } }]);
        return;
      }

      if (json.type === 'prompt' && json.text) {
        // if backend provided options, attach them so UI can render choice buttons
        const msg = { role: 'assistant', text: json.text };
        if (Array.isArray(json.options) && json.options.length) msg.options = json.options;
        setMessages((m) => [...m, msg]);
        return;
      }

      if (json.type === 'answer') {
        // Prefer concise `text` provided by the server; also keep raw `data` for structured UI
        const text = json.text || (json.data && (json.data.answer || json.data.text)) || (json.data ? JSON.stringify(json.data) : '');
        setMessages((m) => [...m, { role: 'assistant', text, data: json.data }]);
        return;
      }

      setMessages((m) => [...m, { role: 'assistant', text: JSON.stringify(json) }]);
    } catch (err) {
      console.error('perplexity chat error', err);
      // fetchJson throws Error with .body for API errors — prefer that for messages
      const body = err && err.body;
      const msg = (body && (typeof body === 'string' ? body : body.error || JSON.stringify(body))) || err.message || String(err);
      // push a structured error message so UI can render retry/diagnostics
      setLastFailedQuery(q);
      setMessages((m) => [...m, { role: 'assistant', error: true, errorText: msg, errorBody: body, text: `Error: ${msg}` }]);
    } finally {
      setLoading(false);
    }
  }

  // handle option click from a 'prompt' message; perform structured download action
  async function handleOptionClick(opt) {
    if (!opt) return;
    // show as user message
    setMessages((m) => [...m, { role: 'user', text: opt }]);
    setLoading(true);
    setLastFailedQuery(null);
    try {
      // call backend with structured action to avoid Perplexity forwarding
      const json = await fetchJson('/perplexity/ask', { method: 'POST', body: JSON.stringify({ action: 'download', accountName: opt }) });

      if (json.type === 'file' && json.dataBase64) {
        const bytes = atob(json.dataBase64);
        const buf = new Uint8Array(bytes.length);
        for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i);
        const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        setMessages((m) => [...m, { role: 'assistant', text: `Generated file: ${json.filename}`, file: { url, filename: json.filename } }]);
        return;
      }

      if (json.type === 'prompt' && json.text) {
        const msg = { role: 'assistant', text: json.text };
        if (Array.isArray(json.options) && json.options.length) msg.options = json.options;
        setMessages((m) => [...m, msg]);
        return;
      }

      if (json.type === 'answer') {
        const text = json.text || (json.data && (json.data.answer || json.data.text)) || (json.data ? JSON.stringify(json.data) : '');
        setMessages((m) => [...m, { role: 'assistant', text, data: json.data }]);
        return;
      }

      setMessages((m) => [...m, { role: 'assistant', text: JSON.stringify(json) }]);
    } catch (err) {
      console.error('perplexity chat error', err);
      const body = err && err.body;
      const msg = (body && (typeof body === 'string' ? body : body.error || JSON.stringify(body))) || err.message || String(err);
      setLastFailedQuery(opt);
      setMessages((m) => [...m, { role: 'assistant', error: true, errorText: msg, errorBody: body, text: `Error: ${msg}` }]);
    } finally {
      setLoading(false);
    }
  }

  // retry the last failed query
  async function retryLast() {
    if (!lastFailedQuery) return;
    await send(lastFailedQuery);
  }

  function toggleExpand(idx) {
    setMessages((prev) => prev.map((mm, i) => (i === idx ? { ...mm, expanded: !mm.expanded } : mm)));
  }

  return (
    <div>
      <div style={{ position: 'fixed', right: 18, bottom: 18, zIndex: 60 }}>
        <div>
          {open && (
            <div className="card-dark shadow p-3 w-80 max-h-96 overflow-y-auto rounded mb-2">
              <div className="text-sm font-semibold mb-2">Assistant</div>
              <div className="space-y-2 text-sm">
                {messages.map((m, idx) => (
                  <div key={idx} className={m.role === 'user' ? 'text-right' : 'text-left'}>
                    <div className={m.role === 'user' ? 'inline-block bg-slate-700 px-2 py-1 rounded' : 'inline-block bg-[#071018] px-2 py-1 rounded max-w-[22rem]'} style={{ textAlign: m.role === 'user' ? 'right' : 'left' }}>
                      {/* If structured data with web results exists, render result cards */}
                      {m.data && (Array.isArray(m.data.results) || Array.isArray(m.data.web_results)) ? (
                        <div className="space-y-2">
                          {(m.data.results || m.data.web_results).slice(0, 5).map((r, i) => (
                            <div key={i} className="p-2 border border-[var(--border)] rounded bg-[#051018]">
                              <div className="font-semibold text-xs">
                                {r.title || r.name || r.title_raw || r.url || 'Result'}
                              </div>
                              <div className="text-xs mt-1">
                                {(r.snippet || r.description || r.text || '').slice(0, 300)}{(r.snippet || r.description || r.text || '').length > 300 ? '...' : ''}
                              </div>
                              {r.url && (
                                <div className="mt-1 text-xs">
                                  <a className="underline" href={r.url} target="_blank" rel="noreferrer">Open link</a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div>
                          <div style={{ maxWidth: '22rem' }}>
                            <div style={{ maxHeight: m.expanded ? 'none' : '4.5rem', overflow: 'hidden', whiteSpace: 'pre-wrap' }}>
                              {m.text}
                            </div>
                            {String(m.text || '').length > 300 && (
                              <div className="mt-1">
                                <button onClick={() => toggleExpand(idx)} className="text-xs underline">
                                  {m.expanded ? 'Show less' : 'Show more'}
                                </button>
                              </div>
                            )}
                          </div>

                          {m.file && (
                            <div className="mt-1">
                              <a className="underline text-xs" href={m.file.url} download={m.file.filename}>Download {m.file.filename}</a>
                            </div>
                          )}

                          {m.error && (
                            <div className="mt-2 p-2 border border-red-600 rounded bg-[#2a0b0b] text-xs">
                              <div className="font-semibold">Request failed</div>
                              <div className="mt-1 text-[11px]">{m.errorText}</div>
                              <div className="mt-2 flex gap-2">
                                <button onClick={retryLast} className="text-xs btn-primary px-2 py-1 rounded">Retry</button>
                                <button onClick={() => { try { navigator.clipboard.writeText(JSON.stringify({ error: m.errorBody || m.errorText })); } catch (e) {} }} className="text-xs underline">Copy details</button>
                              </div>
                            </div>
                          )}
                      
                     
                        {m.options && Array.isArray(m.options) && m.options.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {m.options.slice(0, 6).map((opt, i) => (
                              <button key={i} onClick={() => send(opt)} className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600">{opt}</button>
                            ))}
                          </div>
                        )
                      }
                        </div>
                  )}
                    </div>
                  </div>
                  ))}
                
                {/* suggestion chips */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => send(s)} className="text-xs px-2 py-1 rounded bg-slate-700 hover:bg-slate-600">{s}</button>
                  ))}
                </div>
                {loading && (
                  <div className="text-left text-xs text-muted">Assistant is typing…</div>
                )}
              </div>

              <div className="mt-3 flex gap-2">
                <input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 p-2 bg-[#0A0A0A] border border-[var(--border)] rounded" />
                <button onClick={send} disabled={loading} className="btn-primary px-3 py-1 rounded">Send</button>
              </div>
            </div>
          )}

          <button onClick={() => setOpen((o) => !o)} title="Open assistant" className="rounded-full bg-blue-600 text-white w-12 h-12 flex items-center justify-center shadow">
            💬
          </button>
        </div>
      </div>
    </div>
  );
}
