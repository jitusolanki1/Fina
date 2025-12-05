import crypto from "crypto";

// expects process.env.ENCRYPTION_KEY to be set (passphrase)
// The frontend derives the AES key using PBKDF2 with salt "fina-salt" and
// 100000 iterations. To be compatible we derive the same key here.
const KEY = process.env.ENCRYPTION_KEY || "36edf64284417658f03d83fa56b5fec9";

function decipherBase64(input) {
  // input is base64 of iv + ciphertext
  try {
    const raw = Buffer.from(input, "base64");
    // first 16 bytes iv, rest ciphertext
    const iv = raw.slice(0, 16);
    const ct = raw.slice(16);
    // derive the same key parameters used by the browser
    const SALT = "fina-salt";
    const ITER = 100000;
    const key = crypto.pbkdf2Sync(String(KEY), SALT, ITER, 32, "sha256");
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
