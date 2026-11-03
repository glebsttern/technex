# Реестр компонентов и типов страниц

Составлено по слепку от 2026-10-20 (304 HTML-страницы). Проверено сравнением разметки, а не на глаз.

## Типы страниц — их всего два

| Тип | Корневая обёртка | Страниц | Пример |
|---|---|---|---|
| Главная | `.hero` (без `.layout`) | 1 | `index.html` |
| Внутренняя | `.layout` → `.hero.hero--inner` | 303 | `uslugi/remont/remont-podkranovykh-putej.html` |

Внутренние страницы делятся по содержимому контентной области на подтипы:

| Подтип | Признак в разметке | Страниц | Пример |
|---|---|---|---|
| Карточка (нода) | `<article>` + `.field--name-field-body` | 270 | `uslugi/novye-kran-balki.html` |
| Листинг раздела (Views) | `views-…` + `.pager` | 34 (27 с пагинацией) | `uslugi/index.html`, `katalog-tovarov/index.html` |
| Листинг новостей | Views + пагинация, 7 страниц пагинации | 1 + 7 | `novosti.html`, `novosti__q__page=0.html` |
| Карточка новости | `<article>`, раздел `/novosti/` | 60 | `novosti/montazh-dvukhbalochnykh-kranov.html` |
| Доступ запрещён (403) | рендерится темой, 22 КБ | 3 | см. `CRAWL-REPORT.md` |

## Общие компоненты (одинаковы на всех страницах)

Проверено хешированием: шапка на 304 страницах, подвал на 304 страницах различаются
**только классами активного пункта** (`is-active`, `is-current`, `aria-current="page"`).
То есть это настоящие компоненты, а не копипаста.

| Компонент | Селектор | Где | Вероятный Drupal-шаблон |
|---|---|---|---|
| Шапка с логотипом и меню | `header.mainmenu` | 304/304 | `block--technex-main-menu.html.twig` / region header |
| Главное меню + дропдауны | `nav.nav` → `.nav__item` → `ul.dropdown` | 304/304 | `menu--main.html.twig` |
| Мобильная кнопка закрытия меню | `button.nav__close#navClose` | 304/304 | там же + `js/app.js` |
| Поисковая строка | `form.searchbar#searchForm` → `/search/node` | 304/304 | `block--technex-search…` или шаблон темы |
| Панель-обёртка хедера | `.panel` внутри `.hero__inner` | 304/304 | `page.html.twig` |
| Заголовок страницы | `#block-technex-page-title` → `h1.h2` | 303/304 | `block--page-title-block.html.twig` |
| Хлебные крошки | `#block-technex-breadcrumbs` → `nav.crumbs` | 170/304 | `breadcrumb.html.twig` |
| Основной контент | `#block-technex-content` → `.block__content` | 304/304 | `block--system-main-block` |
| Подвал с контактами | `<footer>`, блок `contacts` | 304/304 | `page.html.twig` / region footer |
| Пагинация | `.pager` | 27 страниц | `pager.html.twig` + `css/pager.css` |
| Статистика (с 2008 / 3500+ / 1500+) | `.stats` | только главная | `page--front.html.twig` |
| Декоративные слои героя | `.hero__lines`, `.hero__crane` | главная + внутренние | то же |

## CSS и JS: как подключено на живом сайте

Порядок подключения из `<head>` (менять нельзя, см. правило 3):

```
/core/modules/system/css/components/align.module.css
/core/modules/system/css/components/container-inline.module.css
/core/modules/system/css/components/clearfix.module.css
/core/modules/system/css/components/hidden.module.css
/core/modules/system/css/components/js.module.css
/core/modules/views/css/views.module.css
https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap   (внешний)
/themes/technex/css/forms.css      6,9 КБ
/themes/technex/css/messages.css   3,4 КБ
/themes/technex/css/pager.css      4,8 КБ
/themes/technex/css/style.css      39,5 КБ   ← основной файл темы
```

JS: `/core/assets/vendor/once/once.min.js`, `/core/misc/drupal*.js`,
файл перевода `/sites/default/files/languages/ru_*.js`, `/themes/technex/js/app.js`.

## Вывод для мобильной работы

Правка любого из компонентов выше = правка в одном twig-шаблоне у программиста, но в нашем
зеркале её надо внести во все 304 файла механически. Поэтому компонентные правки делаются
скриптом по списку страниц, а не вручную по одной.
