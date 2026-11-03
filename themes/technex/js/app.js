(function (Drupal, once, drupalSettings) {
  'use strict';

  function currentPath() {
    var parts = window.location.pathname.split('/').filter(Boolean);
    return parts.length ? parts[parts.length - 1] : 'index.html';
  }

  function getQueryParam(name) {
    try {
      return new URLSearchParams(window.location.search).get(name);
    } catch (e) {
      return null;
    }
  }
  
  Drupal.behaviors.technexContentTables = {
    attach: function (context, settings) {
      const blocks = once('technex-table-transform', '#block-technex-content', context);
      
      blocks.forEach(function (block) {
        const tables = block.querySelectorAll('table');
        
        tables.forEach(function (table) {
          const cells = table.querySelectorAll('td');
          
          cells.forEach(function (td) {
            // Find the required elements inside the td
            const strong = td.querySelector('p');
            const img = td.querySelector('img');
            const link = td.querySelector('a');
            
            // Skip if this doesn't look like the structure we expect
            if (!strong || !strong.querySelector('strong') || !img || !link) {
              return;
            }
            
            const name = strong.textContent.trim();
            if (!name) return;
            const imgSrc = img.getAttribute('src') || '';
            const href = link.getAttribute('href') || '#';
            
            // Build the new structure
            const newLink = document.createElement('a');
            newLink.className = 'item';
            newLink.setAttribute('href', href);
            
            const nameP = document.createElement('p');
            nameP.className = 'item__name';
            nameP.innerHTML = strong.innerHTML;
            
            const imgDiv = document.createElement('div');
            imgDiv.className = 'item__img';
            
            const newImg = document.createElement('img');
            newImg.setAttribute('src', imgSrc);
            newImg.setAttribute('alt', name);
            newImg.setAttribute('loading', 'lazy');
            
            imgDiv.appendChild(newImg);
            newLink.appendChild(nameP);
            newLink.appendChild(imgDiv);
            
            // Clear the td and insert the new structure
            td.innerHTML = '';
            td.removeAttribute('style');
            td.appendChild(newLink);
          });
        });
      });
    }
  };

  Drupal.behaviors.technexActiveSection = {
    attach: function (context) {
      once('technexActiveSection', 'body', context).forEach(function () {
        var activeSection =
          drupalSettings.technex && drupalSettings.technex.activeSection
            ? drupalSettings.technex.activeSection
            : null;

        var here = currentPath();
        var items = document.querySelectorAll('.nav__item');
        if (!items.length) return;

        var matched = null;

        // Match by top-level link href.
        Array.prototype.forEach.call(items, function (item) {
          var link = item.querySelector('.nav__link');
          if (!link) return;
          var href = link.getAttribute('href') || '';
          var target = href.split('#')[0].split('/').filter(Boolean).pop();
          if (target && target === here) matched = item;
        });

        // Match by dropdown link.
        if (!matched) {
          Array.prototype.forEach.call(items, function (item) {
            Array.prototype.forEach.call(
              item.querySelectorAll('.dropdown a'),
              function (a) {
                var href = a.getAttribute('href') || '';
                var target = href.split('#')[0].split('/').filter(Boolean).pop();
                if (target && target === here) {
                  if (!matched) matched = item;
                  a.classList.add('is-current');
                  a.setAttribute('aria-current', 'page');
                }
              }
            );
          });
        }

        // Match by activeSection data attribute (set server-side).
        if (!matched && activeSection) {
          Array.prototype.forEach.call(items, function (item) {
            var link = item.querySelector('.nav__link');
            if (!link) return;
            if (link.textContent.trim() === activeSection) matched = item;
          });
        }

        if (!matched) {
          var segs = window.location.pathname.split('/').filter(Boolean);
          if (segs.length > 1) {
            Array.prototype.forEach.call(items, function (item) {
              var link = item.querySelector('.nav__link');
              if (!link) return;
              var href = link.getAttribute('href') || '';
              if (href.indexOf('/' + segs[0]) !== -1) matched = item;
            });
          }
        }

        if (matched) {
          matched.classList.add('is-active');
        }
      });
    }
  };

  Drupal.behaviors.technexMenu = {
    attach: function (context) {
      once('technexMenu', '#nav', context).forEach(function (nav) {
        var burger = document.getElementById('burger');
        var overlay = document.getElementById('navOverlay');
        var closeBtn = document.getElementById('navClose');
        var menu = document.querySelector('.mainmenu');
        if (!menu) return;

        var items = nav.querySelectorAll('.nav__item');

        function isBurger() {
          return menu.classList.contains('is-burger');
        }

        function closeAll(except) {
          Array.prototype.forEach.call(items, function (item) {
            if (item === except) return;
            item.classList.remove('is-open');
            var caret = item.querySelector('.nav__caret');
            if (caret) caret.setAttribute('aria-expanded', 'false');
          });
        }

        function setMenu(open) {
          // Закреплённая шапка (position: fixed) становится системой координат
          // для панели меню, которая тоже fixed, — из-за этого панель
          // схлопывалась до высоты шапки. На время показа меню снимаем
          // закрепление: прокрутка всё равно заблокирована, а панель
          // раскрывается на весь экран.
          if (open) {
            if (menu.classList.contains('is-pinned')) {
              menu.classList.add('was-pinned');
              menu.classList.remove('is-pinned');
            }
          } else if (menu.classList.contains('was-pinned')) {
            menu.classList.remove('was-pinned');
            menu.classList.add('is-pinned');
          }
          nav.classList.toggle('is-open', open);
          if (overlay) overlay.classList.toggle('is-open', open);
          document.body.classList.toggle('is-menu-open', open);
          if (burger) burger.setAttribute('aria-expanded', String(open));
          if (!open) closeAll(null);
        }

        if (burger) {
          burger.addEventListener('click', function () {
            setMenu(!nav.classList.contains('is-open'));
          });
        }

        if (closeBtn) {
          closeBtn.addEventListener('click', function () {
            setMenu(false);
          });
        }

        if (overlay) {
          overlay.addEventListener('click', function () {
            setMenu(false);
          });
        }

        function toggleItem(item, caret) {
          var open = !item.classList.contains('is-open');
          closeAll(item);
          item.classList.toggle('is-open', open);
          if (caret) caret.setAttribute('aria-expanded', String(open));
        }

        Array.prototype.forEach.call(items, function (item) {
          var caret = item.querySelector('.nav__caret');
          var link = item.querySelector('.nav__link');
          var list = item.querySelector('.dropdown');

          if (caret) {
            caret.addEventListener('click', function (e) {
              e.preventDefault();
              toggleItem(item, caret);
            });
          }

          // In burger mode tapping a section toggles sub-items;
          // navigation to the section is done via "Все: …" item.
          if (link && list) {
            link.addEventListener('click', function (e) {
              if (!isBurger()) return;
              e.preventDefault();
              toggleItem(item, caret);
            });
          }
        });

        // Close panel when a link is followed (non-toggling link).
        nav.addEventListener('click', function (e) {
          var t = e.target;
          if (!t || t.tagName !== 'A') return;
          if (isBurger() && t.classList.contains('nav__link')) return;
          setMenu(false);
        });

        // Click outside (desktop) or Esc closes everything.
        document.addEventListener('click', function (e) {
          if (isBurger()) return;
          if (!nav.contains(e.target) && e.target !== burger) closeAll(null);
        });

        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') {
            closeAll(null);
            setMenu(false);
          }
        });
      });
    }
  };

  Drupal.behaviors.technexFitMenu = {
    attach: function (context) {
      once('technexFitMenu', '.mainmenu', context).forEach(function (menu) {
        var nav = document.getElementById('nav');
        var logo = menu.querySelector('.logo');
        var phone = menu.querySelector('.header-phone');
        if (!nav || !logo || !phone) return;

        // Шапка по макету: три режима.
        //   is-full   — одна полоса: логотип 203, меню, контакты справа
        //   is-mid    — две полосы: логотип 162 + меню, контакты отдельной полосой
        //   is-burger — две полосы: логотип 162 + «Меню», контакты отдельной полосой
        // Между режимами 24 px запаса, чтобы на граничных ширинах раскладка
        // не переключалась туда-обратно на каждом пикселе.
        var FIT_GUARD = 24;
        var contacts = menu.querySelector('.header-contacts');

        function navWidth() {
          var w = 0;
          Array.prototype.forEach.call(nav.children, function (item) {
            w += item.getBoundingClientRect().width;
          });
          return w;
        }

        function fit() {
          var wasBurger = menu.classList.contains('is-burger');

          // Меряем в режиме «всё в одну полосу». Флаг is-mobile снимаем тоже:
          // в мобильной раскладке панель раскрывается в край и контейнер
          // становится на 32 px шире — иначе замер «переворачивается» и
          // раскладка дребезжит на соседних ширинах.
          menu.classList.remove('is-burger', 'is-mid', 'is-compact');
          menu.classList.add('is-full');
          document.body.classList.remove('is-mobile');
          nav.classList.remove('is-open');
          var ov = document.getElementById('navOverlay');
          if (ov) ov.classList.remove('is-open');
          document.body.classList.remove('is-menu-open');

          var styles = getComputedStyle(menu);
          var gap = parseFloat(styles.columnGap) || 40;
          var available = menu.clientWidth
            - (parseFloat(styles.paddingLeft) || 0)
            - (parseFloat(styles.paddingRight) || 0);
          if (available <= 0) return;

          var navNeeds = navWidth();
          var contactsWidth = contacts ? contacts.getBoundingClientRect().width : 0;
          var fullRow = logo.getBoundingClientRect().width + navNeeds + contactsWidth + gap * 2;

          if (fullRow + FIT_GUARD > available) {
            // Контакты уезжают во вторую полосу, логотип уменьшается.
            menu.classList.remove('is-full');
            menu.classList.add('is-mid');

            // Отступы и промежутки в этом режиме другие (16 вместо 24, gap 16
            // вместо 40), а панель шире — поэтому доступную ширину меряем заново,
            // иначе меню уходит под кнопку раньше, чем перестаёт помещаться.
            var midStyles = getComputedStyle(menu);
            var midGap = parseFloat(midStyles.columnGap) || 16;
            var midAvailable = menu.clientWidth
              - (parseFloat(midStyles.paddingLeft) || 0)
              - (parseFloat(midStyles.paddingRight) || 0);
            var midRow = logo.getBoundingClientRect().width + navWidth() + midGap;
            if (midRow + FIT_GUARD > midAvailable) {
              menu.classList.remove('is-mid');
              menu.classList.add('is-burger');
            }
          }

          document.body.classList.toggle('is-mobile', menu.classList.contains('is-burger'));
          document.body.classList.toggle('is-mid-header', menu.classList.contains('is-mid'));

          if (wasBurger && !menu.classList.contains('is-burger')) {
            Array.prototype.forEach.call(
              nav.querySelectorAll('.nav__item.is-open'),
              function (i) { i.classList.remove('is-open'); }
            );
          }
        }

        // Полоса контактов: первые 1080 px (примерно полтора-два экрана) видна
        // при листании вниз и возвращается при листании вверх.
        var ALWAYS_VISIBLE_UNTIL = 1080;
        var lastY = window.pageYOffset || 0;
        var ticking = false;

        function onScroll() {
          var y = window.pageYOffset || 0;
          var twoRows = menu.classList.contains('is-mid') || menu.classList.contains('is-burger');

          if (!twoRows || document.body.classList.contains('is-menu-open')) {
            menu.classList.remove('is-contacts-hidden');
            lastY = y;
            return;
          }
          if (y <= ALWAYS_VISIBLE_UNTIL) {
            menu.classList.remove('is-contacts-hidden');
          } else if (y > lastY + 4) {
            menu.classList.add('is-contacts-hidden');
          } else if (y < lastY - 4) {
            menu.classList.remove('is-contacts-hidden');
          }
          lastY = y;
        }

        // Шапка держится у верха экрана на всей странице. Через position: sticky
        // этого не добиться: она лежит внутри панели, и ниже панели прилипание
        // заканчивается. Поэтому с момента, когда шапка дошла до верха окна,
        // переводим её в fixed, а на её место подставляем распорку той же высоты.
        var spacer = document.createElement('div');
        spacer.className = 'mainmenu-spacer';
        spacer.setAttribute('aria-hidden', 'true');
        menu.parentNode.insertBefore(spacer, menu.nextSibling);

        var pinTop = 0;
        var pinHeight = 0;   // высота шапки с раскрытой полосой контактов:
                             // распорка всегда такая, иначе контент дёргается,
                             // когда полоса с номером прячется
        function measurePin() {
          var wasPinned = menu.classList.contains('is-pinned');
          var wasHidden = menu.classList.contains('is-contacts-hidden');
          if (wasPinned) { menu.classList.remove('is-pinned'); spacer.style.height = '0px'; }
          menu.classList.remove('is-contacts-hidden');
          var rect = menu.getBoundingClientRect();
          pinTop = rect.top + (window.pageYOffset || 0);
          pinHeight = rect.height;
          if (wasHidden) menu.classList.add('is-contacts-hidden');
          if (wasPinned) { menu.classList.add('is-pinned'); spacer.style.height = pinHeight + 'px'; }
        }

        function syncPin() {
          var y = window.pageYOffset || 0;
          if (y >= pinTop) {
            if (!menu.classList.contains('is-pinned')) {
              // пока полоса контактов раскрыта, высота шапки — эталонная:
              // запоминаем её, чтобы распорка не менялась при её скрытии
              if (!menu.classList.contains('is-contacts-hidden')) {
                pinHeight = menu.getBoundingClientRect().height;
              }
              spacer.style.height = pinHeight + 'px';
              menu.classList.add('is-pinned');
              if (menu.parentNode && menu.parentNode.classList) {
                menu.parentNode.classList.add('is-pinned-host');
              }
            }
          } else if (menu.classList.contains('is-pinned')) {
            menu.classList.remove('is-pinned');
            if (menu.parentNode && menu.parentNode.classList) {
              menu.parentNode.classList.remove('is-pinned-host');
            }
            spacer.style.height = '0px';
          }
        }

        window.addEventListener('scroll', function () {
          if (ticking) return;
          ticking = true;
          window.requestAnimationFrame(function () { syncPin(); onScroll(); ticking = false; });
        }, { passive: true });

        // Fit now and on resize (debounced).
        fit();
        measurePin();
        syncPin();

        var resizeTimer = null;
        window.addEventListener('resize', function () {
          if (resizeTimer) clearTimeout(resizeTimer);
          resizeTimer = setTimeout(function () { fit(); measurePin(); syncPin(); }, 120);
        });

        // Re-fit after fonts load (logo/text width may change).
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(function () { fit(); measurePin(); syncPin(); }).catch(function () {});
        }
      });
    }
  };

  Drupal.behaviors.technexSectionLinks = {
    attach: function (context) {
      once('technexSectionLinks', '.nav__item', context).forEach(function (item) {
        var link = item.querySelector('.nav__link');
        var list = item.querySelector('.dropdown');
        if (!link || !list) return;
        if (list.querySelector('.dropdown__all')) return;

        var li = document.createElement('li');
        li.className = 'dropdown__all';
        var a = document.createElement('a');
        a.href = link.getAttribute('href');
        a.textContent = 'Все: ' + link.textContent.trim();
        li.appendChild(a);
        list.appendChild(li);
      });
    }
  };

  Drupal.behaviors.technexCranes = {
    attach: function (context) {
      once('technexCranes', '#cranes', context).forEach(function () {
        var track = document.getElementById('cranesTrack');
        var prevBtn = document.getElementById('prevBtn');
        var nextBtn = document.getElementById('nextBtn');
        if (!track || !prevBtn || !nextBtn) return;

        var index = 0;
        var total = track.children.length;
        if (!total) return;

        function render() {
          track.style.transform = 'translateX(' + -index * 100 + '%)';
        }

        prevBtn.addEventListener('click', function () {
          index = (index - 1 + total) % total;
          render();
        });

        nextBtn.addEventListener('click', function () {
          index = (index + 1) % total;
          render();
        });

        // Swipe support (touch).
        var startX = 0;
        var tracking = false;
        track.addEventListener(
          'touchstart',
          function (e) {
            tracking = true;
            startX = e.touches[0].clientX;
          },
          { passive: true }
        );
        track.addEventListener(
          'touchend',
          function (e) {
            if (!tracking) return;
            tracking = false;
            var dx = e.changedTouches[0].clientX - startX;
            if (Math.abs(dx) < 40) return;
            if (dx < 0) index = (index + 1) % total;
            else index = (index - 1 + total) % total;
            render();
          },
          { passive: true }
        );

        render();
      });
    }
  };

  Drupal.behaviors.technexSearchField = {
    attach: function (context) {
      once('technexSearchField', '#searchForm', context).forEach(function (form) {
        var input = document.getElementById('searchInput');
        var clear = document.getElementById('searchClear');
        if (!input) return;

        if (clear) {
          clear.addEventListener('click', function () {
            input.value = '';
            sync();
            input.focus();
          });
        }
      });
    }
  };

  Drupal.behaviors.technexSmoothScroll = {
    attach: function (context) {
      once('technexSmoothScroll', 'a[href^="#"]', context).forEach(function (a) {
        a.addEventListener('click', function (e) {
          var id = a.getAttribute('href');
          if (!id || id === '#') return;
          var target = document.querySelector(id);
          if (!target) return;
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.replaceState(null, '', id);
        });
      });
    }
  };

  Drupal.behaviors.technexReveal = {
    attach: function (context) {
      if (!('IntersectionObserver' in window)) return;
      once('technexReveal', '.reveal', context).forEach(function (el) {
        var io = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                io.unobserve(entry.target);
              }
            });
          },
          { threshold: 0.15 }
        );
        io.observe(el);
      });
    }
  };

  Drupal.behaviors.searchAutofill = {
    attach: function (context, settings) {
      // Use once() to ensure this only runs once per element
      once('searchAutofill', '#searchInput', context).forEach(function (element) {
        // Get the current URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const keys = urlParams.get('keys');

        // If 'keys' parameter exists and is not empty, fill the input
        if (keys !== null && keys.trim() !== '') {
          element.value = keys;

          // Optional: trigger input/change events for other JS listeners
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    }
  }

  // Блоки направлений на главной: на мобильном видны три пункта,
  // остальные раскрываются кнопкой «Подробнее». Свернуть обратно нельзя —
  // после раскрытия кнопка убирается (это задано в CSS).
  Drupal.behaviors.technexCatMore = {
    attach: function (context) {
      once('technexCatMore', '.cat__more', context).forEach(function (btn) {
        var cat = btn.closest('.cat');
        if (!cat) return;

        // Если скрывать нечего, кнопку не показываем.
        var items = cat.querySelectorAll('.cat__list > li');
        if (items.length <= 3) {
          btn.hidden = true;
          return;
        }

        btn.addEventListener('click', function () {
          cat.classList.add('is-expanded');
        });
      });
    }
  };

  // ===========================================================
  // Заголовки: подгонка кегля (text fitting).
  // Если ОДНО слово не помещается в строку и браузер рвёт его посередине
  // («грузоподъем-ных»), подбираем кегль, при котором слово влезает.
  //
  // Переделано 2026-11-03. Прежний вариант мерил текст «линейкой» —
  // отдельным <span> с копией шрифта, куда клали el.textContent. Из-за
  // этого страдали заголовки, с которыми всё было в порядке:
  //   1. textContent склеивает строки, разделённые <br>. В заголовке
  //      главной «Грузоподъемное<br>оборудование» выходило одно слово
  //      «Грузоподъемноеоборудование» — 1400 px при 1200 доступных,
  //      и заголовок ужимался там, где ничего не ломалось.
  //   2. При неудаче менялся не только кегль, но и гарнитура: с
  //      акцидентного Onder на основной Onest. Onder при том же кегле
  //      рисует буквы примерно вдвое крупнее, поэтому подмена визуально
  //      «съедала» заголовок. Гарнитуру больше не трогаем: там, где
  //      Onder не годится (узкий экран), он уже заменён в CSS.
  //
  // Теперь меряем не линейкой, а Range по реальным текстовым узлам:
  // <br>, вложенные <span> и собственные стили кусков учитываются сами
  // собой. Кегль уменьшаем, только если неразрывное слово действительно
  // шире строки; гарнитура, цвет и разметка остаются как есть.
  // ===========================================================
  Drupal.behaviors.technexFitHeadings = {
    attach: function (context) {
      once('technexFitHeadings', 'body', context).forEach(function () {
        var SELECTOR = 'h1, h2, h3, h4, .h-display, .h1, .h2, .h3, .h4, .cat__title, .step__title, .banner__kicker';
        var MIN_RATIO = 0.7;   // ниже этой доли от исходного кегля не опускаемся
        var MIN_PX = 10;
        var TOLERANCE = 1;     // запас на округление, px

        var range = document.createRange();

        // Ширина самого длинного неразрывного куска текста.
        // Если браузер уже разорвал слово, Range отдаёт несколько
        // прямоугольников — складываем их: так получается ширина слова
        // в одну строку, а не ширина колонки.
        function longestChunk(el) {
          var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
          var max = 0, node;
          while ((node = walker.nextNode())) {
            var text = node.nodeValue;
            if (!text) continue;
            // кусок = подряд идущие символы без пробелов и дефисов:
            // по пробелу и дефису перенос штатный
            var re = /[^\s \-–—]+/g, m;
            while ((m = re.exec(text))) {
              range.setStart(node, m.index);
              range.setEnd(node, m.index + m[0].length);
              var rects = range.getClientRects(), w = 0;
              for (var i = 0; i < rects.length; i++) w += rects[i].width;
              if (w > max) max = w;
            }
          }
          return max;
        }

        function fitOne(el) {
          el.style.fontSize = '';
          el.style.lineHeight = '';
          var cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') return;
          var avail = el.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
          if (!(avail > 1)) return;                       // скрытые и нулевые пропускаем
          var base = parseFloat(cs.fontSize);
          if (!base) return;
          if (longestChunk(el) <= avail + TOLERANCE) return;   // всё помещается — не трогаем

          var floorPx = Math.max(Math.ceil(base * MIN_RATIO), MIN_PX);

          // наибольший кегль, при котором слово целиком влезает в строку:
          // двоичный поиск по [floorPx, base]
          function fitsAt(px) {
            el.style.fontSize = px + 'px';
            return longestChunk(el) <= avail + TOLERANCE;
          }
          var size;
          if (!fitsAt(floorPx)) {
            size = floorPx;                               // уже минимум, дальше некуда
          } else {
            var lo = floorPx, hi = base;
            while (hi - lo > 1) {
              var mid = Math.floor((lo + hi) / 2);
              if (fitsAt(mid)) lo = mid; else hi = mid;
            }
            size = lo;
          }
          el.style.fontSize = size + 'px';

          var baseLh = parseFloat(cs.lineHeight);
          if (!isNaN(baseLh) && baseLh > 0) {
            el.style.lineHeight = Math.max(Math.round(baseLh * (size / base)), size + 2) + 'px';
          }
        }

        function fitAll() {
          var list = document.querySelectorAll(SELECTOR);
          for (var i = 0; i < list.length; i++) fitOne(list[i]);
        }

        fitAll();
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(fitAll).catch(function () {});
        }
        window.addEventListener('load', fitAll);

        // Ширина блоков меняется уже после первого прохода: JS перестраивает
        // шапку, догружаются картинки, меняется раскладка. Ловить это таймерами
        // ненадёжно — следим за фактической шириной каждого заголовка.
        // Смена кегля меняет только высоту, поэтому зацикливания не будет.
        if (window.ResizeObserver) {
          var lastWidth = new WeakMap();
          var ro = new ResizeObserver(function (entries) {
            for (var i = 0; i < entries.length; i++) {
              var el = entries[i].target;
              var w = Math.round(el.clientWidth);
              if (lastWidth.get(el) === w) continue;
              lastWidth.set(el, w);
              fitOne(el);
            }
          });
          var observed = document.querySelectorAll(SELECTOR);
          for (var k = 0; k < observed.length; k++) ro.observe(observed[k]);
        }
        var timer = null;
        window.addEventListener('resize', function () {
          if (timer) clearTimeout(timer);
          timer = setTimeout(fitAll, 150);
        });
      });
    }
  };

  Drupal.behaviors.technexReady = {
    attach: function (context) {
      once('technexReady', 'body', context).forEach(function () {
        document.body.classList.add('is-ready');
      });
    }
  };

  // Fallback: if Drupal behavior didn't run for any reason, still show the page.
  setTimeout(function () {
    document.body.classList.add('is-ready');
  }, 1500);

})(Drupal, once, drupalSettings);