// Отдаёт страницы, сохранённые с query-строкой: пагинация листингов
// (?page=1 -> novosti__q__page=1.html) и карточки с ?id=.
// Повторяет логику _project/serve.js: статический хостинг query игнорирует,
// поэтому без этого пагинатор всегда показывал бы первую страницу.
export async function onRequest({ request, next }) {
  const url = new URL(request.url);
  if (!url.search) return next();

  let p = decodeURIComponent(url.pathname);
  if (p === '/' || p === '') p = '/index.html';
  else if (p.endsWith('/')) p += 'index.html';
  else if (!/\.[A-Za-z0-9]+$/.test(p)) p += '/index.html';

  const q = url.search.slice(1).replace(/[^A-Za-z0-9=_\-.&]/g, '_').replace(/&/g, '__');
  const dot = p.lastIndexOf('.');
  const candidate = p.slice(0, dot) + '__q__' + q + p.slice(dot);

  const hit = await fetch(new URL(candidate, url.origin), request);
  if (hit.status === 200) return hit;
  return next();
}
