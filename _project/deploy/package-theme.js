// Пакет для программиста: node _project/deploy/package-theme.js [папка-назначение]
// По умолчанию кладёт technex-mobile.zip рядом с new-site.
//
// Внутрь идут только те файлы, которые реально подключаются в Drupal:
// mobile.css, app.js и README.md с инструкцией. Зеркало сайта сюда не входит —
// для него есть package.js.
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..', '..');
const DEST = path.resolve(process.argv[2] || path.join(ROOT, '..'));
const STAGE = path.join(DEST, 'technex-mobile');
const ZIP = STAGE + '.zip';

fs.rmSync(STAGE, { recursive: true, force: true });
fs.rmSync(ZIP, { force: true });
fs.mkdirSync(path.join(STAGE, 'css'), { recursive: true });
fs.mkdirSync(path.join(STAGE, 'js'), { recursive: true });

fs.copyFileSync(path.join(ROOT, 'themes/technex/css/mobile.css'), path.join(STAGE, 'css', 'mobile.css'));
fs.copyFileSync(path.join(ROOT, 'themes/technex/js/app.js'), path.join(STAGE, 'js', 'app.js'));
fs.copyFileSync(path.join(__dirname, 'README-theme.md'), path.join(STAGE, 'README.md'));

// Системный tar: пишет имена через прямой слеш, архив читается и на macOS.
const TAR = path.join(process.env.SystemRoot || 'C:\Windows', 'System32', 'tar.exe');
execFileSync(fs.existsSync(TAR) ? TAR : 'tar',
  ['-a', '-c', '-f', ZIP, '-C', DEST, path.basename(STAGE)],
  { stdio: 'inherit' });
fs.rmSync(STAGE, { recursive: true, force: true });

const kb = (fs.statSync(ZIP).size / 1024).toFixed(1);
console.log('Собрано: ' + ZIP);
console.log('Размер: ' + kb + ' КБ');
