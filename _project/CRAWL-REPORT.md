# Отчёт по слепку http://web.mydns.su

Снято: 2026-10-20. Полный обход по ссылкам с главной, вглубь, без ограничения глубины.
Карты сайта (`sitemap.xml`) на сервере нет — обход только по ссылкам.

## Что получилось

| Показатель | Значение |
|---|---|
| Всего запросов | 1017 |
| HTML-страниц со статусом 200 | 304 |
| из них уникальных (без пагинации) | 275 |
| страниц пагинации (`?page=N`) и фильтров (`?id=N`) | 29 |
| файлов на диске | 982 |
| объём | 95 МБ (из них 85 МБ — `/sites/default/files` — контентные картинки) |
| не-200 ответов | 36 (33 × 404, 3 × 403) |
| внешних ресурсов (не скачаны) | 14 |

## Платформа

Drupal 11.4.6, кастомная тема `technex`. То есть вёрстка натянута на Drupal, а контент залит
со старого сайта. URL-ы — старые SEO-слаги старого сайта (`/uslugi/remont/….html`,
`/izgotovlenie/kran-balk.html`), с расширением `.html` в путях.

## Страницы по разделам

| Раздел | Страниц |
|---|---|
| `/` (главная) | 1 |
| `/novosti` + `/novosti.html` | 61 |
| `/katalog-tovarov` | 50 |
| `/uslugi` | 37 |
| `/gruzopod-emnoe-oborudovanie-i-komplektuyushchie` | 36 |
| `/uncategorised` | 33 |
| `/v-nalichii-na-sklade` | 21 |
| `/izgotovlenie` | 9 |
| `/prodazha-oborudovaniya` | 9 |
| `/about-tekhneks` | 7 |
| `/o-nas` | 4 |
| `/remont` | 3 |
| `/krany-mostovye-elektricheskie` | 3 |
| `/modernization` | 1 |

Обрати внимание: есть раздел `/uncategorised` (33 страницы) — похоже, мусорная категория,
приехавшая с миграцией. И дубль смыслов: `/o-nas` и `/about-tekhneks`, `/remont` и `/uslugi/remont`,
`/izgotovlenie` и `/prodazha-oborudovaniya`.

## Следы миграции в разметке (это и есть источник мобильных проблем)

| Признак старой вёрстки | Вхождений | На страницах |
|---|---|---|
| `<iframe …>` (метрика, карты) | 305 | 304 |
| инлайн-`style="…"` | 625 | 304 |
| жёсткий атрибут `width="…"` | 810 | 198 |
| `&nbsp;` | 4734 | 235 |
| `<br>` вместо абзацев | 736 | 105 |
| `<table>` в вёрстке контента | 23 | 22 |
| атрибут `align="…"` | 21 | 14 |

Главные кандидаты на поломку мобилки: `width="…"` на картинках и таблицах (810 штук) и
инлайн-стили с пиксельными размерами. Они перебивают CSS темы, поэтому на узком экране
элементы выезжают за вьюпорт.

## Битые ссылки и ресурсы на живом сайте (фиксируем как BUG, не правим молча)

**19 страниц отдают 404** — это ссылки старого сайта, которые при миграции не переехали:

```
/2-uncategorised/2-device.html
/2-uncategorised/3-servic.html
/24-uslugi/proektirovanie-gruzopod-emnykh-sistem/85-proektirovanie.html
/component/content/article.html?id=236&Itemid=138
/gallery/category/6--q-2012q-.html
/gruzopod-emnye-krany-abus/krany-konsolno-povorotnye.html
/gruzopod-emnye-krany-abus/krany-konsolnye-peredvizhnye-iz-komplektuyushchikh-abus.html
/gruzopod-emnye-krany-abus/krany-mostovye-dvukhbalochnye-opornye.html
/gruzopod-emnye-krany-abus/krany-mostovye-odnobalochnye-opornye-kranov.html
/gruzopod-emnye-krany-abus/krany-mostovye-odnobalochnye-podvesnye.html
/gruzopod-emnye-krany-abus/legkie-podvesnye-sistemy-abus.html
/gruzopod-emnye-krany-abus/legkij-portalnyj-kran.html
/gruzopod-emnye-krany-abus/tali-elektricheskie-tsepnye-abus.html
/photo-video/photo-abus/category/3-kranekspo-2012-moskva.html
/photo-video/photo-abus/category/8-montazh-kranbalki-abus.html
/photo-video/photo-abus/category/10-rrekonstruktsiya-tsekha-v-minske-abus-elk-10t.html
/photo-video/photo-abus/category/14-transportirovka-kranbalki-tipa-abus-v-molodechno.html
/photo-video/photo-abus/category/23-vstrecha-ooo-tekhneks-i-ooo-shnejder-v-vengrii-2012g.html
/photo-video/photo-abus/category/26-gruzopod-emnoe-oborudovanie-proizvodstva-tekhneks.html
```

**14 картинок и файлов отдают 404** — то есть на живом сайте это битые картинки:

```
/sites/default/files/images/elekroshema_na_pol.jpg
/sites/default/files/images/elekroshema_na_radio.jpg
/sites/default/files/images/razreshenia/deklaracia_technex_1.jpg … _4.jpg
/sites/default/files/images/razreshenia/dillerstvo.jpg
/sites/default/files/images/razreshenia/konsolniki.jpg
/sites/default/files/images/razreshenia/opornia.jpg
/sites/default/files/images/razreshenia/podvesnia.jpg
/sites/default/files/images/razreshenia/sertifikat_tam_sous_dwuhbalochnie.jpg
/sites/default/files/images/razreshenia/tuv.jpg
/sites/default/files/images/razreshenia/tuv 2.jpg
/upload/tali.pdf
```

Фактически целиком не работает страница разрешений и сертификатов (`/o-nas/razresheniya-i-sertifikaty.html`).

**3 страницы отдают 403 «Доступ запрещён»** — закрыты правами в Drupal, контента в слепке нет:

```
/gruzopod-emnoe-oborudovanie-i-komplektuyushchie/konsolnye-krany/peredvizhnoj-odnobalochnyj-konsolnyj-kran-ekl.html
/v-nalichii-na-sklade/radioupravlenie-podrobnee.html
/v-nalichii-na-sklade/tali-elektricheskie-kanatnye-pr-va-kitaj.html
```

## Внешние ресурсы (в слепок не скачаны, тянутся из интернета)

- `fonts.googleapis.com` — шрифт Manrope (400/500/600/700/800). Без интернета страница будет
  без фирменного шрифта.
- `mc.yandex.ru/watch/113195240` — Яндекс.Метрика.
- `yandex.ru/map-widget/v1/…` и `google.com/maps/embed?…` — карты в контактах.
- 6 картинок на `i.ibb.co` (внешний хостинг изображений) — контент залит со ссылками на чужой хост.
- Ссылки наружу: `technex.by` и `www.technex.by` (ссылки на старый домен внутри контента!),
  `belveb.by`, `crane-expo.ru`.

Ссылки на `technex.by` внутри контента нового сайта — тоже след миграции, кандидат в BUG.

## Как смотреть слепок

HTML в слепке **не переписан**: ссылки абсолютные (`/themes/…`), с query-строками Drupal
(`?tn5mhr`). Поэтому через `file://` он не откроется правильно. Смотреть так:

```
cd C:\Work\technex\new-site
node _project/serve.js 8080
```

и открыть `http://localhost:8080/`. Сервер понимает живые URL, включая `/uslugi` и `?page=1`.

Полная машинная расшифровка обхода (url → локальный файл → статус → размер): `crawl-manifest.json`.
