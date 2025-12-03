import express from "express";
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { promisify } from "util";
import { exec } from "child_process";

const execAsync = promisify(exec);
const router = express.Router();

// POST /api/uploads/presign { filename, contentType }
// Returns an uploadUrl (server endpoint) and an objectUrl where the file will be available after commit
router.post("/presign", async (req, res) => {
  const { filename, contentType } = req.body || {};
  if (!filename || !contentType) return res.status(400).json({ error: "filename and contentType required" });

  const safeFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  const key = safeFilename; // store directly under public/uploads

  // uploadUrl is a server PUT endpoint that accepts the raw file body
  const host = req.get("host");
  const protocol = req.protocol;
  const uploadUrl = `${protocol}://${host}/api/uploads/upload/${encodeURIComponent(key)}`;
  const objectUrl = `${protocol}://${host}/uploads/${encodeURIComponent(key)}`;

  res.json({ uploadUrl, objectUrl, key });
});

// PUT /api/uploads/upload/:key  (raw body expected)
router.put("/upload/:key", express.raw({ type: "*/*", limit: "20mb" }), async (req, res) => {
  const { key } = req.params;
  if (!key) return res.status(400).json({ error: "missing key" });

  try {
    const uploadsDir = path.join(process.cwd(), "Backend", "public", "uploads");
    // ensure directory exists
    if (!fsSync.existsSync(uploadsDir)) {
      await fs.mkdir(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, key);
    // write raw buffer
    const body = req.body;
    if (!body || (Buffer.isBuffer(body) && body.length === 0)) {
      return res.status(400).json({ error: "empty upload body" });
    }

    await fs.writeFile(filePath, body);

    // attempt to git add, commit and push
    try {
      const relPath = path.relative(process.cwd(), filePath).replace(/\\/g, "/");
      await execAsync(`git add ${relPath}`);
      const commitMsg = `Add summary ${key}`;
      await execAsync(`git commit -m "${commitMsg}" || echo "no changes to commit"`);
      await execAsync(`git push || echo "git push failed"`);
    } catch (gitErr) {
      console.error("git operations failed:", gitErr && gitErr.message);
      // continue — file is saved even if git push fails
    }

    const host = req.get("host");
    const protocol = req.protocol;
    const objectUrl = `${protocol}://${host}/uploads/${encodeURIComponent(key)}`;

    res.json({ objectUrl, key });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "could not save upload" });
  }
});

export default router;
