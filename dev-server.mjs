// 로컬 테스트 전용 서버 (배포와 무관)
// 실행: node --env-file=.env.local dev-server.mjs
// 그 다음 브라우저에서 http://localhost:3000/Portfolio.html 열기
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize, extname } from 'node:path';
import { sendContactEmail } from './api/_email.js';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = createServer(async (req, res) => {
  // API: 메일 발송
  if (req.url === '/api/send' && req.method === 'POST') {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    let parsed = {};
    try { parsed = JSON.parse(raw || '{}'); } catch { /* keep {} */ }
    const { status, body } = await sendContactEmail(parsed);
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(body));
  }

  // 정적 파일 서빙
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath === '/') urlPath = '/Portfolio.html';
  const filePath = normalize(join(ROOT, urlPath));
  if (!filePath.startsWith(ROOT)) { // 디렉터리 탈출 방지
    res.writeHead(403); return res.end('Forbidden');
  }
  try {
    const data = await readFile(filePath);
    res.writeHead(200, {
      'Content-Type': MIME[extname(filePath)] || 'application/octet-stream',
      'Content-Length': data.length, // 프리로더 진행률 계산용
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  const keyOk = process.env.RESEND_API_KEY ? '있음' : '없음(!)';
  console.log(`▶ http://localhost:${PORT}/Portfolio.html`);
  console.log(`  RESEND_API_KEY: ${keyOk}`);
});
