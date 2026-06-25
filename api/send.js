import { sendContactEmail } from './_email.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // body 파싱 (Vercel은 보통 자동 파싱하지만, 안전하게 방어)
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const { name, from, message } = body || {};

  const { status, body: result } = await sendContactEmail({ name, from, message });
  return res.status(status).json(result);
}
