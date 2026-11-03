// Локальный статический сервер для просмотра слепка/рабочей копии.
// Запуск из new-site:  node _project/serve.js [порт]
// Понимает «живые» URL сайта: /uslugi -> /uslugi/index.html, ?page=1 -> __q__page=1.html
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.argv[2]) || 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon', '.pdf': 'application/pdf',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.eot': 'application/vnd.ms-fontobject',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
};

function candidates(urlPath, search) {
  let p = decodeURIComponent(urlPath);
  if (p === '/' || p === '') p = '/index.html';
  if (p.endsWith('/')) p += 'index.html';
  const list = [];
  const ext = path.extname(p);
  const withQuery = (base) => {
    if (!search) return null;
    const q = search.slice(1).replace(/[^A-Za-z0-9=_\-.&]/g, '_').replace(/&/g, '__');
    const e = path.extname(base);
    return base.slice(0, base.length - e.length) + '__q__' + q + e;
  };
  if (ext) {
    const q = withQuery(p);
    if (q) list.push(q);
    list.push(p);
  } else {
    const idx = p + '/index.html';
    const q = withQuery(idx);
    if (q) list.push(q);
    list.push(idx, p);
  }
  return list;
}

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://localhost');
  const send = (file) => {
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    fs.createReadStream(file).pipe(res);
  };
  for (const rel of candidates(u.pathname, u.search)) {
    const file = path.join(ROOT, rel.replace(/^\//, ''));
    if (!file.startsWith(ROOT)) continue;
    if (fs.existsSync(file) && fs.statSync(file).isFile()) return send(file);
  }
  // запрос без query к файлу, который скачан с cache-busting query (style.css?tn5mhr -> style__q__tn5mhr.css)
  const plain = decodeURIComponent(u.pathname).replace(/^\//, '');
  const ext = path.extname(plain);
  if (ext) {
    const dir = path.join(ROOT, path.dirname(plain));
    const stem = path.basename(plain, ext) + '__q__';
    if (fs.existsSync(dir)) {
      const hit = fs.readdirSync(dir).find(n => n.startsWith(stem) && n.endsWith(ext));
      if (hit) return send(path.join(dir, hit));
    }
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404: ' + u.pathname + u.search);
}).listen(PORT, () => console.log(`Сервер: http://localhost:${PORT}/  (корень: ${ROOT})`));
