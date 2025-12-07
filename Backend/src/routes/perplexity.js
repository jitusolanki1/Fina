import express from "express";
import fetch from "node-fetch";
import { requireAuth } from "../middleware/auth.js";
import Account from "../models/Account.js";
import Transaction from "../models/Transaction.js";
import { generateAccountXLS } from "../utils/fileGenerator.js";
import { todayDate } from "../utils/date.js";

const router = express.Router();

// small helper: fetch with limited retries for transient Perplexity errors
async function fetchWithRetry(url, opts = {}, retries = 2, backoffMs = 500) {
  let attempt = 0;
  while (true) {
    try {
      const r = await fetch(url, opts);
      if (!r.ok && (r.status === 502 || r.status === 503 || r.status === 504 || r.status === 429) && attempt < retries) {
        attempt++;
        await new Promise((res) => setTimeout(res, backoffMs * attempt));
        continue;
      }
      return r;
    } catch (err) {
      if (attempt < retries) {
        attempt++;
        await new Promise((res) => setTimeout(res, backoffMs * attempt));
        continue;
      }
      throw err;
    }
  }
}

// POST /api/perplexity/ask
// body: { q: string }
// forwards query to Perplexity API and returns the response
// simple intent: if user asks to download account excel (contains 'download' and 'account'),
// try to find account by name and return generated Excel as attachment link (base64).
router.post("/ask", requireAuth, async (req, res) => {
  try {
    const userId = req.user && req.user.sub;
    if (!userId) return res.status(401).json({ error: "unauthorized" });

    const { q, action, accountName } = req.body || {};
    // support structured calls from the frontend: { action: 'download', accountName }
    if (action === 'download' && accountName) {
      // handle download intent directly without forwarding to Perplexity
      const acc = await Account.findOne({ createdBy: String(userId), name: accountName }) || (await Account.findOne({ createdBy: String(userId), name: new RegExp('^' + accountName + '$', 'i') }));
      if (!acc) {
        const accs = await Account.find({ createdBy: String(userId) }).lean();
        const names = (accs || []).map((a) => a.name).slice(0, 10);
        return res.json({ type: 'prompt', text: `Account not found: ${accountName}. Which of these accounts did you mean?`, options: names });
      }

      const txs = await Transaction.find({ accountId: acc._id }).lean();
      const rows = (txs || []).map((t) => ({
        Date: t.date || '',
        Description: t.description || '',
        Deposit: Number(t.deposit || 0),
        PenalDeposit: Number(t.penalDeposit || 0),
        OtherDeposit: Number(t.otherDeposit || 0),
        UpLineDeposit: Number(t.upLineDeposit || 0),
        PenalWithdrawal: Number(t.penalWithdrawal || 0),
        OtherWithdrawal: Number(t.otherWithdrawal || 0),
        UpLineWithdrawal: Number(t.upLineWithdrawal || 0),
      }));
      const buffer = generateAccountXLS(acc.name, rows.length ? rows : [{ Account: acc.name, OpeningBalance: acc.openingBalance || 0 }]);
      const base64 = Buffer.from(buffer).toString('base64');
      return res.json({ type: 'file', filename: `${acc.name.replace(/[^a-z0-9_-]/gi, '_')}-${todayDate(req.user && req.user.timezone || 'Asia/Kolkata')}.xlsx`, dataBase64: base64 });
    }

    if (!q || String(q).trim().length === 0) return res.status(400).json({ error: "missing query" });

    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      // Friendly developer message — don't leak secrets but guide operator to configure the key.
      // In dev, allow a helpful simulated reply so the frontend doesn't break during local development.
      if (process.env.NODE_ENV !== 'production') {
        return res.json({ type: 'answer', data: { text: 'Perplexity API not configured on server (DEV mode). Set PERPLEXITY_API_KEY to enable live queries.' } });
      }
      return res.status(500).json({ error: "PERPLEXITY_API_KEY not configured on server" });
    }

    // simple intent detection for download request
    const text = String(q).toLowerCase();
    const wantsDownload = /download|export|get\b.*excel|xls|csv/i.test(q);
    const mentionsAccount = /account[s]?|ledger|sheet/i.test(q);

    if (wantsDownload && mentionsAccount) {
      // try to extract account name from query (robust): look for quoted name, 'account <name>' pattern,
      // or attempt to match any existing account name appearing in the query (case-insensitive).
      let accountName = null;
      const quoted = q.match(/"([^"]+)"|'([^']+)'/);
      if (quoted) accountName = (quoted[1] || quoted[2] || '').trim();
      if (!accountName) {
        // fallback: find 'account <name>' pattern (allow quotes optional)
        const m = q.match(/account\s+["']?([A-Za-z0-9 _\-]+?)["']?(?:\s|$)/i);
        if (m) accountName = (m[1] || '').trim().split(/[\n\r]/)[0];
      }

      // fetch user's accounts for matching/fallback
      const accs = await Account.find({ createdBy: String(userId) }).lean();
      // try fuzzy match: check if any account name appears in the query
      if (!accountName && accs && accs.length) {
        const escapeRegExp = (s) => String(s || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        for (const a of accs) {
          try {
            const re = new RegExp('\\b' + escapeRegExp(a.name) + '\\b', 'i');
            if (re.test(q)) {
              accountName = a.name;
              break;
            }
          } catch (e) {}
        }
      }

      // if still no accountName and user has only one account, use that
      if (!accountName && accs && accs.length === 1) accountName = accs[0].name;

      if (!accountName) {
        // prompt the user with available account names so frontend can render options
        const names = (accs || []).map((a) => a.name).slice(0, 10);
        return res.json({ type: 'prompt', text: 'Which account would you like to download? Choose one of your accounts:', options: names });
      }

      // find account by exact or case-insensitive match
      const acc = (await Account.findOne({ createdBy: String(userId), name: accountName })) || (await Account.findOne({ createdBy: String(userId), name: new RegExp('^' + accountName + '$', 'i') }));
      if (!acc) {
        // if not found, offer a prompt with account list to help the user choose
        const names = (accs || []).map((a) => a.name).slice(0, 10);
        return res.json({ type: 'prompt', text: `Account not found: ${accountName}. Which of these accounts did you mean?`, options: names });
      }

      // fetch transactions for account (all dates)
      const txs = await Transaction.find({ accountId: acc._id }).lean();

      const rows = (txs || []).map((t) => ({
        Date: t.date || '',
        Description: t.description || '',
        Deposit: Number(t.deposit || 0),
        PenalDeposit: Number(t.penalDeposit || 0),
        OtherDeposit: Number(t.otherDeposit || 0),
        UpLineDeposit: Number(t.upLineDeposit || 0),
        PenalWithdrawal: Number(t.penalWithdrawal || 0),
        OtherWithdrawal: Number(t.otherWithdrawal || 0),
        UpLineWithdrawal: Number(t.upLineWithdrawal || 0),
      }));

      const buffer = generateAccountXLS(acc.name, rows.length ? rows : [{ Account: acc.name, OpeningBalance: acc.openingBalance || 0 }]);

      // return base64 payload so frontend can download
      const base64 = Buffer.from(buffer).toString('base64');
      return res.json({ type: 'file', filename: `${acc.name.replace(/[^a-z0-9_-]/gi, '_')}-${todayDate(req.user && req.user.timezone || 'Asia/Kolkata')}.xlsx`, dataBase64: base64 });
    }

    // Otherwise, forward to Perplexity's Answers/Quickstart endpoint
    // Perplexity API quickstart: POST https://api.perplexity.ai/answers with {query}
    const endpoint = 'https://api.perplexity.ai/answers';
    const body = { query: q };

    let r;
    try {
      r = await fetchWithRetry(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }, 3, 600);
    } catch (err) {
      console.error('perplexity.fetch error', err && err.message, { requestId: req.requestId });
      return res.status(502).json({ error: 'Perplexity API unreachable', details: err && err.message });
    }

    if (!r.ok) {
      const txt = await r.text().catch(() => '');
      console.error('perplexity.api returned non-ok', { status: r.status, body: txt, requestId: req.requestId });
      const detailSnippet = (txt && txt.slice ? txt.slice(0, 1000) : String(txt || '')).replace(/\n/g, ' ');
      if (r.status === 401 || r.status === 403) {
        return res.status(502).json({ error: 'Perplexity API authentication failed', status: r.status, details: detailSnippet });
      }

      // If Perplexity responds 404, try a couple of known alternate endpoints before failing.
      if (r.status === 404) {
        const alternates = [
          'https://api.perplexity.ai/v1/answers',
          'https://api.perplexity.ai/search',
        ];
        for (const alt of alternates) {
          try {
            console.log('perplexity: retrying alternate endpoint', { alt, requestId: req.requestId });
            const rr = await fetchWithRetry(alt, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(body),
            }, 2, 500);
            if (rr && rr.ok) {
              const altJson = await rr.json().catch(() => null);
              return res.json({ type: 'answer', data: altJson });
            }
            const altText = await (rr && rr.text ? rr.text().catch(() => '') : '');
            console.warn('perplexity: alternate endpoint failed', { alt, status: rr && rr.status, body: (altText || '').slice(0,200), requestId: req.requestId });
          } catch (e) {
            console.warn('perplexity: alternate endpoint error', { alt, err: e && e.message, requestId: req.requestId });
            continue;
          }
        }

        return res.status(502).json({ error: 'Perplexity API endpoint not found (tried alternatives)', status: r.status, details: detailSnippet });
      }

      return res.status(502).json({ error: 'Perplexity API error', status: r.status, details: detailSnippet });
    }

    const json = await r.json();
    // Try to extract a concise human-readable summary from Perplexity response
    let replyText = null;
    try {
      if (json && typeof json === 'object') {
        // Common quick fields
        if (json.answer && typeof json.answer === 'string') replyText = json.answer;
        else if (json.text && typeof json.text === 'string') replyText = json.text;
        else if (json.summary && typeof json.summary === 'string') replyText = json.summary;
        // Perplexity may return results array with title/snippet/url
        else if (Array.isArray(json.results) && json.results.length) {
          replyText = json.results
            .slice(0, 3)
            .map((r) => {
              const t = r.title || r.name || '';
              const s = r.snippet || r.description || r.text || '';
              const u = r.url || r.link || '';
              return `${t}${t && '\n'}${s}${u ? '\n' + u : ''}`.trim();
            })
            .join('\n\n');
        } else if (Array.isArray(json.web_results) && json.web_results.length) {
          replyText = json.web_results
            .slice(0, 3)
            .map((r) => `${r.title || ''}\n${r.snippet || r.description || ''}\n${r.url || ''}`.trim())
            .join('\n\n');
        }
      }
    } catch (e) {
      // ignore extraction errors and fall back to raw JSON
    }

    if (!replyText) {
      // As a last resort, produce a short JSON snippet (trimmed)
      try {
        const raw = JSON.stringify(json);
        replyText = raw.length > 2000 ? raw.slice(0, 2000) + '... (truncated)' : raw;
      } catch (e) {
        replyText = 'Perplexity returned an unparseable response.';
      }
    }

    // return a structured payload: a short `text` for UI and the full `data` if needed
    return res.json({ type: 'answer', text: replyText, data: json });
  } catch (err) {
    console.error('perplexity.ask error', err && err.message);
    res.status(500).json({ error: err && err.message || String(err) });
  }
});

export default router;
