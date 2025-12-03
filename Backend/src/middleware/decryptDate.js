import crypto from "crypto";

// expects process.env.ENCRYPTION_KEY to be set (32 bytes recommended)
const KEY = process.env.ENCRYPTION_KEY || "default_key_please_change_32bytes!!";

function decipherBase64(input) {
  // input is base64 of iv:ciphertext
  try {
    const raw = Buffer.from(input, "base64");
    // assume first 16 bytes iv, rest ciphertext
    const iv = raw.slice(0, 16);
    const ct = raw.slice(16);
    const key = crypto.createHash("sha256").update(KEY).digest();
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    let out = decipher.update(ct, undefined, "utf8");
    out += decipher.final("utf8");
    return out;
  } catch (err) {
    return null;
  }
}

export default function decryptDateMiddleware(req, res, next) {
  if (req.body && req.body.dateEncrypted) {
    const dec = decipherBase64(req.body.dateEncrypted);
    if (dec) {
      req.body.date = dec;
      delete req.body.dateEncrypted;
    }
  }
  next();
}
