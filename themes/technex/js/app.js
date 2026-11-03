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

        // Шапка по макету: три режима, и переключаются они по ширине окна,
        // а не по замеру содержимого.
        //   is-full   (от 1200) — одна полоса: логотип 203, меню, номер справа
        //   is-mid    (1000–1199) — две полосы: логотип 162 + меню, номер полосой
        //   is-burger (до 999)  — две полосы: логотип 162 + «Меню», номер полосой
        //
        // Почему пороги, а не замер. Замер считал раскладку на лету и давал
        // три беды: решение зависело от момента (на недогруженной странице
        // ширина другая), при ручном перетаскивании окна оно отставало на
        // debounce в 120 мс, и на этом промежутке номер успевал перенестись
        // сам — тот самый четвёртый вид. matchMedia срабатывает в тот же кадр,
        // что и перерисовка, поэтому промежуточных состояний не бывает.
        //
        // Откуда числа. Одна полоса требует 203 (логотип) + 32 + 663 (меню)
        // + 32 + 158 (номер со значками) = 1088 плюс поля шапки 48, итого 1136.
        // На окне 1200 шапка шириной 1153 — запас 17 px. Ниже 1200 уже не
        // влезает, отсюда первый порог.
        // Две полосы с горизонтальным меню требуют 162 + 16 + 663 = 841 плюс
        // поля 32, итого 873. На окне 1000 шапка 953 — запас 80 px; меню
        // перестаёт помещаться около 920, поэтому второй порог 1000 взят
        // с запасом и совпадает с макетом («промежуточный» нарисован на 999).
        var mqFull = window.matchMedia('(min-width: 1200px)');
        var mqMenu = window.matchMedia('(min-width: 1000px)');

        function fit() {
          var wasBurger = menu.classList.contains('is-burger');

          menu.classList.remove('is-full', 'is-mid', 'is-burger', 'is-compact');
          if (mqFull.matches) menu.classList.add('is-full');
          else if (mqMenu.matches) menu.classList.add('is-mid');
          else menu.classList.add('is-burger');

          nav.classList.remove('is-open');
          var ov = document.getElementById('navOverlay');
          if (ov) ov.classList.remove('is-open');
          document.body.classList.remove('is-menu-open');

          document.body.classList.toggle('is-mobile', menu.classList.contains('is-burger'));
          document.body.classList.toggle('is-mid-header', menu.classList.contains('is-mid'));

          if (wasBurger && !menu.classList.contains('is-burger')) {
            Array.prototype.forEach.call(
              nav.querySelectorAll('.nav__item.is-open'),
              function (i) { i.classList.remove('is-open'); }
            );
          }
        }

        // Переключение режима — сразу по медиазапросу, без ожидания resize.
        function onMode() { fit(); measurePin(); syncPin(); }
        [mqFull, mqMenu].forEach(function (mq) {
          if (mq.addEventListener) mq.addEventListener('change', onMode);
          else if (mq.addListener) mq.addListener(onMode);
        });

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
          // Полоса контактов анимирует высоту и верхнюю отбивку. measurePin()
          // вызывается сразу после fit(), то есть в момент, когда переход из
          // однополосного режима в двухполосный ещё проигрывается, и замер
          // ловит промежуточное значение: на 375 выходило 100 px вместо 112
          // (не досчитывались 12 px отбивки), распорка оказывалась ниже шапки
          // и номер ложился на строку поиска. На время замера переходы снимаем.
          menu.classList.add('is-measuring');
          /* eslint-disable-next-line no-unused-expressions */
          menu.offsetHeight;   // принудительный рефлоу: стиль должен примениться до замера
          var rect = menu.getBoundingClientRect();
          menu.classList.remove('is-measuring');
          pinTop = rect.top + (window.pageYOffset || 0);
          pinHeight = rect.height;
          if (wasHidden) menu.classList.add('is-contacts-hidden');
          if (wasPinned) { menu.classList.add('is-pinned'); spacer.style.height = pinHeight + 'px'; }
        }

        function syncPin() {
          // Пока открыто меню, закрепление снято намеренно (см. setMenu):
          // закреплённая шапка — position: fixed, и она становится системой
          // координат для выдвижной панели, которая тоже fixed. Панель тогда
          // схлопывается до высоты шапки — замер при resize с открытым меню:
          // 116 px вместо 700, видны только последние пункты списка.
          // Без этой проверки resize возвращал закрепление прямо поверх
          // открытого меню и дефект, закрытый 03.11.2026, возвращался.
          if (document.body.classList.contains('is-menu-open')) return;
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

        // И ещё раз — когда страница догрузилась и когда изменилась ширина самой
        // шапки. Без этого режим выбирался один раз, по замеру на недогруженной
        // странице, и оставался неверным до первого ресайза окна: на 1190 шапка
        // держалась однополосной, хотя содержимое в строку уже не влезало
        // (нужно 1128 при доступных 1095), а стоило потянуть окно — вставала
        // двухполосной. Отсюда и «промежуточные варианты»: один и тот же размер
        // окна давал разную шапку в зависимости от того, когда её померили.
        // ResizeObserver ловит и появление полосы прокрутки, и сдвиги раскладки
        // от поздних картинок — это те самые 15–30 px, из-за которых замер
        // «до» и «после» расходился.
        window.addEventListener('load', function () { fit(); measurePin(); syncPin(); });
        if (window.ResizeObserver) {
          var lastWidth = menu.clientWidth;
          new ResizeObserver(function () {
            if (menu.clientWidth === lastWidth) return;
            lastWidth = menu.clientWidth;
            fit(); measurePin(); syncPin();
          }).observe(menu);
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

  // Номер телефона в полосе контактов набран акцидентным Onder. Он в 2–3 раза
  // шире основной гарнитуры и на телефонах рядом со значками мессенджеров не
  // помещается ни в одном читаемом кегле (замер: на 375 свободно 229 px, а
  // номер в Onder занимает 243 px уже при 10 px). Поэтому кегль подбирается
  // по месту, а не задаётся ступенями в CSS: ступени пришлось бы заводить на
  // каждую ширину, и любая правка отступов их ломала бы.
  // Два ограничения, берём меньшее:
  //   1) номер влезает в свободную ширину полосы;
  //   2) высота цифры не выше значка мессенджера (требование заказчика).
  // Ширину и высоту глифа меряем через canvas: measureText даёт реальные
  // границы начертания, а не строчный бокс, и ширина текста линейна по кеглю,
  // поэтому достаточно одного замера на 100 px вместо двоичного поиска.
  Drupal.behaviors.technexFitPhone = {
    attach: function (context) {
      once('technexFitPhone', '.mainmenu', context).forEach(function (menu) {
        var phone = menu.querySelector('.header-phone');
        var bar = menu.querySelector('.header-contacts');
        var icons = menu.querySelector('.header-messengers');
        if (!phone || !bar || !icons) return;

        var MIN_PX = 7;        // ниже номер перестаёт быть номером
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext && canvas.getContext('2d');
        if (!ctx) return;

        function fit() {
          // в однополосном режиме номер стоит в правой колонке и живёт по CSS
          var twoRows = menu.classList.contains('is-mid') || menu.classList.contains('is-burger');
          phone.style.fontSize = '';
          phone.style.lineHeight = '';
          if (!twoRows) return;

          var cs = getComputedStyle(bar);
          var avail = bar.clientWidth
            - (parseFloat(cs.paddingLeft) || 0)
            - (parseFloat(cs.paddingRight) || 0)
            - icons.getBoundingClientRect().width
            - (parseFloat(cs.columnGap) || 0);
          if (!(avail > 1)) return;

          var ps = getComputedStyle(phone);
          var text = (phone.textContent || '').trim();
          if (!text) return;
          ctx.font = ps.fontStyle + ' ' + ps.fontWeight + ' 100px ' + ps.fontFamily;

          var width100 = ctx.measureText(text).width;
          if (!width100) return;
          var byWidth = (avail * 100) / width100;

          var m = ctx.measureText('0');
          var digit100 = (m.actualBoundingBoxAscent || 0) + (m.actualBoundingBoxDescent || 0);
          var icon = icons.querySelector('.header-messenger');
          var iconH = icon ? icon.getBoundingClientRect().height : 22;
          var byIcon = digit100 ? (iconH * 100) / digit100 : byWidth;

          // третье ограничение: номер не крупнее заголовка раздела
          // («Проектирование», «Поставка», «Сервис»). Берём живой заголовок —
          // его мог уменьшить technexFitHeadings, и тогда номер идёт следом.
          // На внутренних страницах таких заголовков нет: меряем пустую
          // болванку с тем же классом, чтобы не зашивать кегль числом.
          var byTitle = Infinity;
          var title = document.querySelector('.cat__title');
          if (title) {
            byTitle = parseFloat(getComputedStyle(title).fontSize) || Infinity;
          } else {
            var probe = document.createElement('span');
            probe.className = 'h4 cat__title';
            probe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;';
            document.body.appendChild(probe);
            byTitle = parseFloat(getComputedStyle(probe).fontSize) || Infinity;
            probe.parentNode.removeChild(probe);
          }

          var size = Math.max(MIN_PX, Math.floor(Math.min(byWidth, byIcon, byTitle)));
          phone.style.fontSize = size + 'px';
          // строку держим по высоте значка, чтобы полоса не меняла высоту
          phone.style.lineHeight = Math.round(iconH) + 'px';
        }

        fit();
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(fit).catch(function () {});
          if (document.fonts.load) {
            document.fonts.load('1em Onder').then(fit).catch(function () {});
          }
        }
        window.addEventListener('load', fit);
        // ширина полосы меняется и при resize, и при смене режима шапки —
        // наблюдатель ловит оба случая одним способом
        if (window.ResizeObserver) {
          new ResizeObserver(fit).observe(bar);
        } else {
          var t = null;
          window.addEventListener('resize', function () {
            if (t) clearTimeout(t);
            t = setTimeout(fit, 120);
          });
        }
      });
    }
  };

  // Номер в подвале — ссылка `a.h3`, то есть строчный элемент. Подбор кегля
  // заголовков его не трогал (у строчных `clientWidth` всегда 0), а если бы и
  // трогал — он меряет самое длинное слово, а здесь все слова короткие
  // («+375», «486»), каждое влезает по отдельности. Рвался при этом весь
  // номер: на 375 он занимает 402 px при 311 доступных, на 320 — при 256.
  // Поэтому меряем строку целиком и ужимаем кегль, но не крупнее макетного.
  Drupal.behaviors.technexFitFooterPhone = {
    attach: function (context) {
      once('technexFitFooterPhone', '.footer__phone', context).forEach(function (phone) {
        var MIN_PX = 10;
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext && canvas.getContext('2d');
        if (!ctx) return;

        function fit() {
          phone.style.fontSize = '';
          phone.style.lineHeight = '';
          phone.style.whiteSpace = '';

          var host = phone.parentElement;
          while (host && host.clientWidth <= 0) host = host.parentElement;
          if (!host) return;
          var hs = getComputedStyle(host);
          var avail = host.clientWidth - (parseFloat(hs.paddingLeft) || 0) - (parseFloat(hs.paddingRight) || 0);
          if (!(avail > 1)) return;

          var ps = getComputedStyle(phone);
          var base = parseFloat(ps.fontSize);
          var baseLh = parseFloat(ps.lineHeight);
          var text = (phone.textContent || '').trim();
          if (!base || !text) return;

          ctx.font = ps.fontStyle + ' ' + ps.fontWeight + ' 100px ' + ps.fontFamily;
          var width100 = ctx.measureText(text).width;
          if (!width100) return;

          var size = Math.min(base, Math.floor((avail * 100) / width100));
          size = Math.max(MIN_PX, size);
          if (size >= base) return;                       // влезает как есть — не трогаем

          phone.style.fontSize = size + 'px';
          phone.style.whiteSpace = 'nowrap';
          if (!isNaN(baseLh) && baseLh > 0) {
            phone.style.lineHeight = Math.max(Math.round(baseLh * (size / base)), size + 2) + 'px';
          }
        }

        fit();
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(fit).catch(function () {});
          if (document.fonts.load) document.fonts.load('1em Onder').then(fit).catch(function () {});
        }
        window.addEventListener('load', fit);
        if (window.ResizeObserver) {
          new ResizeObserver(fit).observe(phone.parentElement || phone);
        } else {
          var t = null;
          window.addEventListener('resize', function () {
            if (t) clearTimeout(t);
            t = setTimeout(fit, 120);
          });
        }
      });
    }
  };

  // Плейсхолдер поиска: на узком экране длинная подсказка не читается —
  // по макету (Figma 803:2701) она заменяется одним словом «Поиск».
  // Текст плейсхолдера атрибутный, из CSS его не подменить, поэтому здесь.
  // Порог 480 — по ширине строки поиска; в мобильном режиме панель идёт
  // от края до края, так что ширина строки равна ширине окна.
  Drupal.behaviors.technexSearchPlaceholder = {
    attach: function (context) {
      once('technexSearchPlaceholder', '#searchInput', context).forEach(function (input) {
        var full = input.getAttribute('placeholder') || '';
        var SHORT = 'Поиск';
        var NARROW = 480;

        function sync() {
          var want = window.innerWidth < NARROW ? SHORT : full;
          if (input.getAttribute('placeholder') !== want) {
            input.setAttribute('placeholder', want);
          }
        }

        sync();
        var timer = null;
        window.addEventListener('resize', function () {
          if (timer) clearTimeout(timer);
          timer = setTimeout(sync, 120);
        });
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
        var SWAP_CLASS = 'is-fit-body-face';   // стиль класса — в mobile.css

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

        // Наибольший кегль из [floorPx, base], при котором самое длинное слово
        // влезает в строку. null — не влезает даже в минимальном.
        function searchSize(el, avail, base) {
          var floorPx = Math.max(Math.ceil(base * MIN_RATIO), MIN_PX);
          function fitsAt(px) {
            el.style.fontSize = px + 'px';
            return longestChunk(el) <= avail + TOLERANCE;
          }
          if (!fitsAt(floorPx)) return null;
          var lo = floorPx, hi = base;
          while (hi - lo > 1) {
            var mid = Math.floor((lo + hi) / 2);
            if (fitsAt(mid)) lo = mid; else hi = mid;
          }
          return lo;
        }

        function fitOne(el) {
          // Номер в подвале подбирается целиком, а не по самому длинному
          // слову (поведение technexFitFooterPhone): здесь слова короткие
          // («+375», «486»), каждое влезает, и подборщик просто ничего бы
          // не сделал — зато сбросил бы кегль, выставленный тем поведением.
          if (el.classList.contains('footer__phone')) return;
          el.style.fontSize = '';
          el.style.lineHeight = '';
          el.classList.remove(SWAP_CLASS);
          var cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') return;
          var avail = el.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
          // У строчных элементов clientWidth всегда 0 — такой заголовок
          // проверка пропускала целиком. Так телефон в подвале (`a.h3`,
          // display: inline) никогда не подбирался и рвался на две строки.
          // Для них доступную ширину берём у ближайшего блочного предка.
          if (!(avail > 1)) {
            var host = el.parentElement;
            while (host && host.clientWidth <= 0) host = host.parentElement;
            if (host) {
              var hs = getComputedStyle(host);
              avail = host.clientWidth - (parseFloat(hs.paddingLeft) || 0) - (parseFloat(hs.paddingRight) || 0);
            }
          }
          if (!(avail > 1)) return;                       // скрытые и нулевые пропускаем
          var base = parseFloat(cs.fontSize);
          if (!base) return;
          // межстрочный читаем здесь: `cs` живой, после правки font-size
          // он отдаст уже пересчитанное значение, и масштаб уедет
          var baseLh = parseFloat(cs.lineHeight);
          var accidental = cs.fontFamily.indexOf('Onder') !== -1;

          if (longestChunk(el) <= avail + TOLERANCE) return;   // всё помещается — не трогаем

          var size = searchSize(el, avail, base);

          // Минимального кегля не хватило — слово всё равно рвётся посередине.
          // Акцидентный Onder в 2–3 раза шире основного Onest: «Консультация»
          // при 20 px — 471 px против 190. Поэтому переводим заголовок на
          // основную гарнитуру и ищем кегль заново от исходного: так слово
          // влезает целиком и крупнее, чем 10 px, в которые упирался поиск.
          // Если заголовок и так на основной гарнитуре — менять нечего,
          // оставляем минимум.
          if (size === null && accidental) {
            el.classList.add(SWAP_CLASS);
            el.style.fontSize = '';
            if (longestChunk(el) <= avail + TOLERANCE) {
              size = base;                                 // в Onest влезает в исходном кегле
            } else {
              size = searchSize(el, avail, base);
            }
          }
          if (size === null) {
            size = Math.max(Math.ceil(base * MIN_RATIO), MIN_PX);
          }

          el.style.fontSize = size + 'px';
          if (!isNaN(baseLh) && baseLh > 0) {
            el.style.lineHeight = Math.max(Math.round(baseLh * (size / base)), size + 2) + 'px';
          }
        }

        // Группы одинаковых заголовков, стоящих рядом. Если одному из них
        // не хватило даже минимального кегля и он ушёл на основную гарнитуру,
        // а соседи остались акцидентными, разница бросается в глаза: при
        // одном и том же кегле Onest выглядит заметно мельче Onder
        // (замер на 375: «Консультация» в Onest 93 px против «Заявка»
        // в Onder 122 px при одинаковых 11 px). Поэтому переводим всю группу
        // и равняем её по самому мелкому кеглю.
        var GROUPS = ['.step__title', '.cat__title'];

        // подбор кегля без сброса гарнитуры: класс подмены уже стоит
        function fitKeepFace(el) {
          el.style.fontSize = '';
          el.style.lineHeight = '';
          var cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') return 0;
          var avail = el.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0);
          if (!(avail > 1)) return 0;
          var base = parseFloat(cs.fontSize);
          if (!base) return 0;
          if (longestChunk(el) <= avail + TOLERANCE) return base;
          var size = searchSize(el, avail, base);
          return size === null ? Math.max(Math.ceil(base * MIN_RATIO), MIN_PX) : size;
        }

        function unifyGroups() {
          for (var g = 0; g < GROUPS.length; g++) {
            var list = document.querySelectorAll(GROUPS[g]);
            if (list.length < 2) continue;
            var swapped = false, i;
            for (i = 0; i < list.length; i++) {
              if (list[i].classList.contains(SWAP_CLASS)) { swapped = true; break; }
            }
            if (!swapped) continue;

            var min = Infinity, base = 0, baseLh = 0;
            for (i = 0; i < list.length; i++) {
              list[i].classList.add(SWAP_CLASS);
              if (!base) {
                var cs0 = getComputedStyle(list[i]);
                base = parseFloat(cs0.fontSize) || 0;
                baseLh = parseFloat(cs0.lineHeight) || 0;
              }
              var s = fitKeepFace(list[i]);
              if (s > 0 && s < min) min = s;
            }
            if (!isFinite(min) || !base) continue;
            for (i = 0; i < list.length; i++) {
              list[i].style.fontSize = min + 'px';
              if (baseLh > 0) {
                list[i].style.lineHeight = Math.max(Math.round(baseLh * (min / base)), min + 2) + 'px';
              }
            }
          }
        }

        function fitAll() {
          var list = document.querySelectorAll(SELECTOR);
          for (var i = 0; i < list.length; i++) fitOne(list[i]);
          unifyGroups();
        }

        fitAll();
        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(fitAll).catch(function () {});
          // `fonts.ready` в Safari может разрешиться раньше, чем акцидентный
          // Onder реально подменит запасную гарнитуру. Первый проход тогда
          // меряет узкий запасной шрифт, решает, что слово помещается, и
          // кегль не трогает. Ширина самого блока при этом не меняется,
          // поэтому ResizeObserver молчит и пересчёта не будет. Просим
          // конкретные начертания и пересчитываем, когда они доехали.
          if (document.fonts.load) {
            ['1em Onder', '600 1em Onest', '800 1em Onest'].forEach(function (face) {
              document.fonts.load(face).then(fitAll).catch(function () {});
            });
          }
          if (document.fonts.addEventListener) {
            document.fonts.addEventListener('loadingdone', fitAll);
          }
        }
        window.addEventListener('load', fitAll);

        // Ширина блоков меняется уже после первого прохода: JS перестраивает
        // шапку, догружаются картинки, меняется раскладка. Ловить это таймерами
        // ненадёжно — следим за фактической шириной каждого заголовка.
        // Смена кегля меняет только высоту, поэтому зацикливания не будет.
        if (window.ResizeObserver) {
          var lastWidth = new WeakMap();
          var ro = new ResizeObserver(function (entries) {
            var touched = false;
            for (var i = 0; i < entries.length; i++) {
              var el = entries[i].target;
              var w = Math.round(el.clientWidth);
              if (lastWidth.get(el) === w) continue;
              lastWidth.set(el, w);
              fitOne(el);
              touched = true;
            }
            // Поэлементный пересчёт мог перевести на основную гарнитуру
            // один заголовок из группы и оставить соседей акцидентными —
            // выравниваем группу, иначе они стоят рядом в разных шрифтах.
            if (touched) unifyGroups();
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