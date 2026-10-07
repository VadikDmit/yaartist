/* ЯАртист — интерактив страницы */
(function () {
  'use strict';

  // Куда отправлять заявки (например, Formspree: 'https://formspree.io/f/xxxxxxx').
  // Пока пусто — форма показывает экран успеха без отправки.
  var FORM_ENDPOINT = '';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var isMobile = function () { return window.innerWidth < 768; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  /* ---------- Данные ---------- */
  var TEACHERS = [
    ['Никитин', 'Константин', 'Иванович', 'Директор театральной студии «ЯАртист», преподаватель по актёрскому мастерству, сценической речи', ['Актёр Удмуртского Национального театра', 'Выпускник ВТУ им. Щепкина', 'Член Союза театральных деятелей', 'Обладатель диплома за лучшую мужскую роль на фестивале профессиональных театров УР'], null],
    ['Никитина', 'Надежда', 'Анатольевна', 'Художественный руководитель, педагог по актёрскому мастерству и сценической речи', ['Выпускница ВТУ им. М.С. Щепкина', 'Актриса театра и кино', 'Актриса Удмуртского Национального театра', 'Член Союза театральных деятелей', 'Сертифицированный специалист по гриму'], 'nikitina'],
    ['Беляева', 'Ангелина', 'Анатольевна', 'Педагог-режиссёр по актёрскому мастерству и сценической речи', ['Пермский государственный институт культуры', 'Педагог дополнительного образования в области сценической деятельности', 'Руководитель любительского театра', 'Работает в Государственном национальном театре Удмуртской Республики'], 'belyaeva'],
    ['Ложкин', 'Константин', 'Михайлович', 'Педагог-режиссёр по актёрскому мастерству', ['Актёр Удмуртского Национального театра', 'Режиссёр Удмуртского Национального театра', 'Выпускник ВТУ им. Щепкина', 'Педагог дополнительного образования детей в области сценической деятельности'], 'lozhkin'],
    ['Власова', 'Варвара', 'Вадимовна', 'Педагог-режиссёр по актёрскому мастерству и сценической речи', ['Артистка Русского драматического театра Удмуртии', 'Казанское театральное училище', 'Куратор-режиссёр театральных смен «Движение Первых»', 'Режиссёр детских театральных лабораторий в Казани'], 'vlasova'],
    ['Глухова', 'Софья', 'Андреевна', 'Педагог-режиссёр по актёрскому мастерству и сценической речи', ['Артистка Русского драматического театра Удмуртии', 'Екатеринбургский государственный театральный институт', 'Лауреат и дипломант международных и всероссийских конкурсов по сценической речи'], 'gluhova'],
    ['Созонова', 'Яна', 'Николаевна', 'Педагог-режиссёр по актёрскому мастерству и сценической речи', ['Выпускница Удмуртского республиканского колледжа культуры', 'Режиссёр культурно-массовых мероприятий и театрализованных представлений Дома культуры «Спартак»', 'Студентка Пермского государственного института культуры'], 'sozonova'],
    ['Оболенский', 'Роман', 'Павлович', 'Педагог по сценическому движению, пластике и фехтованию', ['Артист Русского драматического театра Удмуртии', 'Пермский краевой колледж искусств и культуры', 'Екатеринбургский государственный театральный институт', 'Режиссёр драмы', 'Стипендиат Союза театральных деятелей РФ и Правительства РФ'], 'obolensky'],
    ['Ноговицына', 'Галина', 'Эдуардовна', 'Педагог по актёрскому мастерству, сценической речи', ['Актриса театра «Молодой человек»', 'Выпускница актёрского отделения', 'Студентка Пермского государственного института культуры и искусств'], null],
    ['Парфёнова', 'Софья', 'Павловна', 'Педагог-режиссёр, куратор профессиональной группы', ['Выпускница Удмуртского республиканского колледжа культуры', 'Выпускница Санкт-Петербургского института культуры', 'Режиссёр спектаклей в Театре кукол УР и театре «ПапаМамаБэби»', 'Лауреат фестиваля «Театральное Приволжье» за лучший спектакль и лучшую режиссуру'], null],
    ['Юргенсон', 'Елизавета', 'Владимировна', 'Педагог по актёрскому мастерству, сценической речи', ['Выпускница Пермского государственного института культуры'], null],
    ['Кайсина', 'Ирина', 'Алексеевна', 'Педагог по актёрскому мастерству, сценической речи', ['Выпускница Удмуртского республиканского колледжа культуры', 'Организатор культурно-массовых мероприятий'], null],
    ['Заварзина', 'Елизавета', 'Дмитриевна', 'Педагог по актёрскому мастерству, сценической речи', ['Выпускница театральной студии «ЯАртист»', 'Студентка Удмуртского республиканского колледжа культуры и искусств'], null]
  ].map(function (t) {
    return { last: t[0], first: t[1], patr: t[2], role: t[3], facts: t[4], photo: t[5] ? 'assets/img/teachers/' + t[5] + '.jpg' : null };
  });

  // Коллаж «Жизнь студии»: позиции из макета (поле 1312×740)
  var GALLERY = [
    { img: 'assets/img/card-intensive.jpg', label: 'интенсивы', left: 0, top: 6, width: 34, aspect: '318/225', rot: -3, z: 2, pos: '50% 0' },
    { img: 'assets/img/life-rehearsal.jpg', label: 'репетиции', left: 31, top: 0, width: 22, aspect: '3/4', rot: 2, z: 1 },
    { img: 'assets/img/feed-backstage.jpg', label: 'backstage', left: 51, top: 9, width: 28, aspect: '545/475', rot: -2, z: 3 },
    { img: 'assets/img/life-class.jpg', label: 'занятия', left: 79, top: 2, width: 21, aspect: '4/5', rot: 3, z: 2 },
    { img: 'assets/img/life-kids.jpg', label: 'участники студии', left: 5, top: 54, width: 23, aspect: '1/1', rot: 2, z: 2 },
    { img: 'assets/img/life-show.jpg', label: 'спектакли', left: 31, top: 60, width: 32, aspect: '16/10', rot: -2, z: 2 }
  ];

  var FAQ = [
    ['С какого возраста можно заниматься?', 'В студии занимаются дети и подростки от 5 до 18 лет. Для детей 5–9 лет есть отдельная группа.'],
    ['Нужен ли опыт занятий в театре?', null],
    ['Что взять с собой на первое занятие?', null],
    ['Как проходит пробное занятие?', null],
    ['Где проходят занятия?', 'Ижевск: Красная улица, 131; проспект Калашникова, 27; ул. Клубная, 24.'],
    ['Сколько стоят занятия?', 'Группа 5–9 лет — 5 500 ₽, Группы по воскресеньям — 4 000 ₽, Театральный интенсив — 22 500 ₽.'],
    ['Как выбрать подходящую группу?', null],
    ['Можно ли прийти на пробное занятие бесплатно?', 'Да, первое занятие — бесплатно.']
  ];

  var ADDRS = ['Красная улица, 131', 'проспект Калашникова, 27', 'ул. Клубная, 24'];

  /* ---------- Header ---------- */
  var header = $('#header');
  var sticky = $('#stickyCta');
  function onScroll() {
    var y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    sticky.classList.toggle('is-shown', isMobile() && y > 560 && !document.body.classList.contains('is-locked'));
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  // Подсветка активного пункта меню
  var navLinks = $$('.nav a');
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) spy.observe(s); });
  }

  /* ---------- Overlays: меню и модалки ---------- */
  var openLayers = [];
  var lastFocus = null;
  function lock() { document.body.classList.toggle('is-locked', openLayers.length > 0); onScroll(); }
  function openLayer(el) {
    if (openLayers.indexOf(el) === -1) openLayers.push(el);
    lastFocus = document.activeElement;
    el.classList.add('is-open');
    el.setAttribute('aria-hidden', 'false');
    lock();
    var f = el.querySelector('[data-autofocus]') || el.querySelector('button, a, input');
    if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 60);
  }
  function closeLayer(el) {
    el.classList.remove('is-open');
    el.setAttribute('aria-hidden', 'true');
    openLayers = openLayers.filter(function (x) { return x !== el; });
    lock();
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  var menu = $('#menu');
  var burger = $('[data-menu-open]');
  burger.addEventListener('click', function () { openLayer(menu); burger.setAttribute('aria-expanded', 'true'); });
  $$('[data-menu-close]', menu).forEach(function (el) {
    el.addEventListener('click', function () { closeLayer(menu); burger.setAttribute('aria-expanded', 'false'); });
  });
  window.addEventListener('resize', function () { if (window.innerWidth >= 1100 && menu.classList.contains('is-open')) closeLayer(menu); });

  $$('.modal').forEach(function (m) {
    m.addEventListener('click', function (e) { if (e.target === m) closeLayer(m); });
    $$('[data-close]', m).forEach(function (b) { b.addEventListener('click', function () { closeLayer(m); }); });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openLayers.length) closeLayer(openLayers[openLayers.length - 1]);
    if (e.key === 'Tab' && openLayers.length) {
      var layer = openLayers[openLayers.length - 1];
      var f = $$('a[href], button:not([disabled]), input, select, [tabindex]:not([tabindex="-1"])', layer).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
    if (layerIs(teacherModal) && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) stepTeacher(e.key === 'ArrowLeft' ? -1 : 1);
  });
  function layerIs(el) { return openLayers[openLayers.length - 1] === el; }

  /* ---------- Запись ---------- */
  var signup = $('#signup');
  var form = $('#signupForm');
  var formState = $('[data-state="form"]', signup);
  var sentState = $('[data-state="sent"]', signup);
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#signup"]');
    if (!a) return;
    e.preventDefault();
    if (menu.classList.contains('is-open')) closeLayer(menu);
    formState.hidden = false; sentState.hidden = true;
    $('#formError').classList.remove('is-shown');
    form.group.value = a.getAttribute('data-group') || '';
    openLayer(signup);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    [form.name, form.phone].forEach(function (inp) {
      var bad = inp === form.phone ? inp.value.replace(/\D/g, '').length < 10 : !inp.value.trim();
      inp.classList.toggle('is-invalid', bad);
      if (bad && ok) { inp.focus(); ok = false; }
    });
    if (!ok) return;
    var btn = form.querySelector('[type="submit"]');
    var done = function () { formState.hidden = true; sentState.hidden = false; form.reset(); btn.disabled = false; sentState.querySelector('button').focus(); };
    if (!FORM_ENDPOINT) { done(); return; }
    btn.disabled = true;
    fetch(FORM_ENDPOINT, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (r) { if (!r.ok) throw new Error(r.status); done(); })
      .catch(function () { btn.disabled = false; $('#formError').classList.add('is-shown'); });
  });
  $$('input', form).forEach(function (i) { i.addEventListener('input', function () { i.classList.remove('is-invalid'); }); });

  // Маска телефона
  form.phone.addEventListener('input', function () {
    var d = this.value.replace(/\D/g, '');
    if (!d) { this.value = ''; return; }
    if (d[0] === '8') d = '7' + d.slice(1);
    if (d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    var out = '+7';
    if (d.length > 1) out += ' (' + d.slice(1, 4);
    if (d.length >= 4) out += ')';
    if (d.length > 4) out += ' ' + d.slice(4, 7);
    if (d.length > 7) out += '-' + d.slice(7, 9);
    if (d.length > 9) out += '-' + d.slice(9, 11);
    this.value = out;
  });

  /* ---------- Преподаватели ---------- */
  var grid = $('#teachersGrid');
  var initials = function (t) { return t.first[0] + t.last[0]; };
  var photoHTML = function (t, lazy) {
    return t.photo
      ? '<img src="' + t.photo + '" alt="' + esc(t.first + ' ' + t.last) + '"' + (lazy ? ' loading="lazy"' : '') + '>'
      : '<span class="initials" aria-hidden="true">' + esc(initials(t)) + '</span>';
  };
  grid.innerHTML = TEACHERS.map(function (t, i) {
    var more = Math.max(0, t.facts.length - 2);
    return '<button type="button" class="tcard" data-teacher="' + i + '" data-reveal style="--d:' + (i % 3) * 0.08 + 's">' +
      '<div class="tcard__media"><div class="tcard__plate"></div><div class="tcard__photo">' + photoHTML(t, true) + '</div></div>' +
      '<h3>' + esc(t.first + ' ' + t.last) + '</h3>' +
      '<p class="tcard__role">' + esc(t.role) + '</p>' +
      '<ul class="facts">' + t.facts.slice(0, 2).map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>' +
      '<span class="tcard__more">' + (more ? 'Подробнее · ещё ' + more : 'Подробнее') + ' +</span>' +
      '</button>';
  }).join('');

  var teacherModal = $('#teacherModal');
  var current = 0;
  function renderTeacher(i) {
    var t = TEACHERS[i];
    current = i;
    $('#tmPhoto').innerHTML = photoHTML(t, false);
    $('#tmName').innerHTML = esc(t.first + ' ' + t.last) + '<small>' + esc(t.last + ' ' + t.first + ' ' + t.patr) + '</small>';
    $('#tmRole').textContent = t.role;
    $('#tmFacts').innerHTML = t.facts.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('');
  }
  function stepTeacher(d) { renderTeacher((current + d + TEACHERS.length) % TEACHERS.length); }
  grid.addEventListener('click', function (e) {
    var c = e.target.closest('.tcard');
    if (!c) return;
    renderTeacher(+c.getAttribute('data-teacher'));
    openLayer(teacherModal);
  });
  $$('[data-step]', teacherModal).forEach(function (b) { b.addEventListener('click', function () { stepTeacher(+b.getAttribute('data-step')); }); });

  /* ---------- Жизнь студии ---------- */
  var collage = $('#collage');
  var strip = $('#strip');
  var itemImg = function (g) { return '<div class="collage__img"><img src="' + g.img + '" alt="' + esc(g.label) + '" loading="lazy"' + (g.pos ? ' style="object-position:' + g.pos + '"' : '') + '></div><span class="tag">' + esc(g.label) + '</span>'; };
  collage.insertAdjacentHTML('afterbegin', GALLERY.map(function (g, i) {
    return '<div class="collage__item" data-reveal="scale" style="--d:' + i * 0.07 + 's;left:' + g.left + '%;top:' + g.top + '%;width:' + g.width + '%;aspect-ratio:' + g.aspect + ';--rot:' + g.rot + 'deg;z-index:' + g.z + '">' + itemImg(g) + '</div>';
  }).join(''));
  strip.innerHTML = GALLERY.map(function (g) {
    return '<div class="strip__item" style="aspect-ratio:' + g.aspect + '">' + itemImg(g) + '</div>';
  }).join('');

  /* ---------- Отзывы ---------- */
  var slider = $('#reviewsSlider');
  $$('[data-slide]').forEach(function (b) {
    b.addEventListener('click', function () {
      slider.scrollBy({ left: +b.getAttribute('data-slide') * Math.min(440, slider.clientWidth * 0.9), behavior: 'smooth' });
    });
  });

  /* ---------- FAQ ---------- */
  var faqList = $('#faqList');
  faqList.innerHTML = FAQ.map(function (f, i) {
    var body = f[1] ? '<p>' + esc(f[1]) + '</p>' : '<span class="pill-dashed">Ответ уточнить у студии перед публикацией</span>';
    return '<div class="qa' + (i === 0 ? ' is-open' : '') + '">' +
      '<button type="button" class="qa__q" aria-expanded="' + (i === 0) + '" aria-controls="qa' + i + '"><span>' + esc(f[0]) + '</span><span class="qa__icon" aria-hidden="true">+</span></button>' +
      '<div class="qa__a" id="qa' + i + '" role="region"><div>' + body + '</div></div></div>';
  }).join('');
  faqList.addEventListener('click', function (e) {
    var q = e.target.closest('.qa__q');
    if (!q) return;
    var item = q.parentNode;
    var open = !item.classList.contains('is-open');
    $$('.qa', faqList).forEach(function (x) { x.classList.remove('is-open'); x.firstChild.setAttribute('aria-expanded', 'false'); });
    item.classList.toggle('is-open', open);
    q.setAttribute('aria-expanded', String(open));
  });

  /* ---------- Адреса и карта ---------- */
  var addrsEl = $('#addrs');
  var map = $('#map');
  addrsEl.innerHTML = ADDRS.map(function (s, i) {
    var full = 'Ижевск, ' + s;
    return '<div class="addr' + (i === 0 ? ' is-active' : '') + '" role="button" tabindex="0" data-addr="' + i + '" data-reveal style="--d:' + i * 0.08 + 's">' +
      '<div class="addr__l"><span class="addr__n">0' + (i + 1) + '</span><div><div class="addr__city">ИЖЕВСК</div><div class="addr__street">' + esc(s) + '</div></div></div>' +
      '<a class="addr__route" target="_blank" rel="noopener" href="https://yandex.ru/maps/?rtext=~' + encodeURIComponent(full) + '&rtt=auto">Маршрут →</a></div>';
  }).join('');
  function selectAddr(i) {
    $$('.addr', addrsEl).forEach(function (a, j) { a.classList.toggle('is-active', i === j); });
    map.src = 'https://yandex.ru/map-widget/v1/?text=' + encodeURIComponent('Ижевск, ' + ADDRS[i]) + '&z=16';
  }
  addrsEl.addEventListener('click', function (e) {
    if (e.target.closest('.addr__route')) return;
    var a = e.target.closest('.addr');
    if (a) selectAddr(+a.getAttribute('data-addr'));
  });
  addrsEl.addEventListener('keydown', function (e) {
    var a = e.target.closest('.addr');
    if (a && e.target === a && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); selectAddr(+a.getAttribute('data-addr')); }
  });
  // Карту грузим, когда секция близко к экрану
  if ('IntersectionObserver' in window) {
    var mio = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { selectAddr(0); mio.disconnect(); } }, { rootMargin: '600px' });
    mio.observe(map);
  } else { selectAddr(0); }

  /* ---------- Reveal ---------- */
  var reveal = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-visible'); rio.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveal.forEach(function (el) {
      // Первый экран показываем сразу, не дожидаясь наблюдателя
      if (el.getBoundingClientRect().top < window.innerHeight) requestAnimationFrame(function () { el.classList.add('is-visible'); });
      else rio.observe(el);
    });
  } else {
    reveal.forEach(function (el) { el.classList.add('is-visible'); });
  }

  $('#year').textContent = new Date().getFullYear();
})();
