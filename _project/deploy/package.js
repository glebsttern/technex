// Архив для передачи программисту: node _project/deploy/package.js [папка-назначение]
// По умолчанию кладёт technex-site-ГГГГ-ММ-ДД.zip рядом с new-site.
//
// Внутрь идёт вся рабочая копия: зеркало сайта с нашими правками и папка
// _project (журнал правок, реестр компонентов, правила, локальный сервер).
// Не идёт личное и служебное: .git, .gitignore, .gitattributes, CLAUDE.md
// и папка сборки стенда _site.
// Первым файлом кладётся записка README.md — чтобы HTML зеркала
// не приняли за исходники темы. Имя латиницей: кириллица в именах внутри
// zip на macOS читается как мусор.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const SKIP = new Set(['.git', '.gitignore', '.gitattributes', 'CLAUDE.md', 'netlify.toml', '_site']);
const stamp = new Date().toISOString().slice(0, 10);
const DEST = path.resolve(process.argv[2] || path.join(ROOT, '..'));
const STAGE = path.join(DEST, 'technex-site-' + stamp);
const ZIP = STAGE + '.zip';

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

fs.rmSync(STAGE, { recursive: true, force: true });
fs.rmSync(ZIP, { force: true });
copyDir(ROOT, STAGE);
fs.copyFileSync(path.join(__dirname, 'README.md'), path.join(STAGE, 'README.md'));
files++;

// Архивируем системным tar (bsdtar, есть в Windows 10+): он пишет имена через
// прямой слеш. И Compress-Archive, и .NET-архиватор Windows PowerShell пишут
// их через обратный — на macOS и Linux такой архив распаковывается в файлы
// с обратным слешем в имени, а программист может сидеть не на Windows.
// -C: архивируем папку целиком, чтобы архив разворачивался в одну папку.
const TAR = path.join(process.env.SystemRoot || 'C:\Windows', 'System32', 'tar.exe');
execFileSync(fs.existsSync(TAR) ? TAR : 'tar',
  ['-a', '-c', '-f', ZIP, '-C', DEST, path.basename(STAGE)],
  { stdio: 'inherit' });
fs.rmSync(STAGE, { recursive: true, force: true });

const mb = (fs.statSync(ZIP).size / 1024 / 1024).toFixed(1);
console.log('Собрано: ' + ZIP);
console.log('Файлов: ' + files + ', архив: ' + mb + ' МБ');
