// Сборка папки для выкладки стенда: node _project/deploy/build.js [выходная папка]
// По умолчанию _site в корне рабочей копии.
//
// Кладёт в выходную папку зеркало сайта и ничего служебного:
// _project, CLAUDE.md, .git и .gitattributes в публикацию не попадают.
// Сверху добавляет robots.txt, _headers (запрет индексации) и functions
// (отдача страниц с query-строкой — пагинация и ?id=).
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const OUT = path.resolve(ROOT, process.argv[2] || '_site');
const SKIP = new Set(['_project', '.git', '.github', '.gitattributes', 'CLAUDE.md', path.basename(OUT)]);

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
const fnFrom = path.join(__dirname, 'functions');
const fnTo = path.join(OUT, 'functions');
fs.mkdirSync(fnTo, { recursive: true });
for (const f of fs.readdirSync(fnFrom)) { fs.copyFileSync(path.join(fnFrom, f), path.join(fnTo, f)); files++; }

console.log('Собрано в ' + OUT + ': ' + files + ' файлов');
