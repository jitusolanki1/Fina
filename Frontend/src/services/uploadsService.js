import api from "../api";

export async function presignUpload(filename, contentType) {
  const r = await api.post('/uploads/presign', { filename, contentType });
  return r.data;
}

export async function putToUploadUrl(uploadUrl, blob) {
  // browser PUT to uploadUrl (may be server endpoint)
  const res = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': blob.type || 'application/octet-stream' }, body: blob });
  if (!res.ok) throw new Error('Upload failed');
  return res;
}

export default { presignUpload, putToUploadUrl };
