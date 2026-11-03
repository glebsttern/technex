// Сборка папки для выкладки стенда: node _project/deploy/build.js [выходная папка]
// По умолчанию _site в корне рабочей копии.
//
// Кладёт в выходную папку зеркало сайта и ничего служебного:
// _project, CLAUDE.md, .git и .gitattributes в публикацию не попадают.
// Сверху добавляет robots.txt, _headers (запрет индексации), _redirects
// (отдача страниц с query-строкой на Netlify) и functions (то же самое
// на Cloudflare Pages).
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.resolve(ROOT, process.argv[2] || '_site');
const SKIP = new Set(['_project', '.git', '.github', '.gitattributes', '.gitignore', 'CLAUDE.md', 'netlify.toml', path.basename(OUT)]);

let files = 0;
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    if (from === ROOT && SKIP.has(e.name)) continue;
    const src = path.join(from, e.name);
    const dst = path.join(to, e.name);
    if (e.isDirectory()) copyDir(src, dst);
    else { fs.copyFileSync(src, dst); files++; }
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
copyDir(ROOT, OUT);

for (const name of ['robots.txt', '_headers']) {
  fs.copyFileSync(path.join(__dirname, name), path.join(OUT, name));
  files++;
}

// _redirects — то же, что functions/_middleware.js, но для Netlify: там страницы
// с query-строкой отдаются правилом, а не функцией. Восклицательный знак после 200 —
// это force: без него Netlify не применяет правило, если по этому адресу уже лежит
// файл (а он лежит: /novosti.html существует). Правила собираются из самих
// файлов `__q__`, чтобы список не расходился с зеркалом.
const rules = [];
(function scan(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { scan(full); continue; }
    if (!e.name.includes('__q__') || !e.name.endsWith('.html')) continue;
    const rel = path.relative(OUT, full).split(path.sep).join('/');
    const parts = rel.split('__q__');
    const base = parts[0];
    const query = parts[1].slice(0, -'.html'.length).split('__').join(' ');
    const isIndex = base.endsWith('/index');
    const from = isIndex ? '/' + base.slice(0, -'/index'.length) : '/' + base + '.html';
    rules.push(from + ' ' + query + ' /' + rel + ' 200!');
    if (isIndex) rules.push(from + '/ ' + query + ' /' + rel + ' 200!');
  }
})(OUT);
rules.sort();
const header = [
  '# Страницы, сохранённые с query-строкой: пагинация листингов и карточки с ?id=.',
  '# Собрано автоматически из файлов __q__ (см. _project/deploy/build.js).',
  ''
].join('\n');
fs.writeFileSync(path.join(OUT, '_redirects'), header + rules.join('\n') + '\n');
files++;

const fnFrom = path.join(__dirname, 'functions');
const fnTo = path.join(OUT, 'functions');
fs.mkdirSync(fnTo, { recursive: true });
for (const f of fs.readdirSync(fnFrom)) { fs.copyFileSync(path.join(fnFrom, f), path.join(fnTo, f)); files++; }

console.log('Собрано в ' + OUT + ': ' + files + ' файлов');
console.log('Правил в _redirects: ' + rules.length);
