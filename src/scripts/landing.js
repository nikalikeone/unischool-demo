import { base, signIn, isSignedIn, homeRoute, role } from './auth.js';
import { getPlan, subjectCountLabel } from './plans.js';
const $ = (selector) => document.querySelector(selector);
const icon = (name) => `<svg aria-hidden="true"><use href="#l-${name}"/></svg>`;
const safe = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );
const subjects = {
  math: {
    name: 'Математика',
    glyph: 'x²',
    description: 'Учимся рассуждать и находить решения',
  },
  russian: {
    name: 'Русский язык',
    glyph: 'Аа',
    description: 'Пишем грамотно, выражаем мысли ясно',
  },
  literature: {
    name: 'Литература',
    glyph: '«»',
    description: 'Открываем новые смыслы в книгах',
  },
  english: {
    name: 'Английский язык',
    glyph: 'Aa',
    description: 'Понимаем, говорим и общаемся',
  },
  world: {
    name: 'Окружающий мир',
    glyph: '☼',
    description: 'Замечаем удивительное вокруг нас',
  },
  history: {
    name: 'История',
    glyph: '⌛',
    description: 'Разбираемся, как менялся наш мир',
  },
  biology: {
    name: 'Биология',
    glyph: '✳',
    description: 'Знакомимся с миром живой природы',
  },
  geography: {
    name: 'География',
    glyph: '◎',
    description: 'Изучаем планету и её закономерности',
  },
  physics: {
    name: 'Физика',
    glyph: 'F',
    description: 'Находим объяснение привычным вещам',
  },
  chemistry: {
    name: 'Химия',
    glyph: 'H₂',
    description: 'Исследуем вещества и превращения',
  },
  social: {
    name: 'Обществознание',
    glyph: '§',
    description: 'Человек, общество и отношения',
  },
};
let grade = 7;
let period = 1;
let selectedPlan = 1;
let selectedSubjects = ['math'];
let desiredSubject = null;
const amount = (plan) => getPlan(plan).monthly * period;
const chosenPlan = () => getPlan(selectedPlan);
const money = (value) => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
const months = () =>
  period === 1 ? '1 месяц' : period === 3 ? '3 месяца' : '6 месяцев';
function availableSubjects(g = grade) {
  if (g <= 4)
    return [
      'math',
      'russian',
      'literature',
      'world',
      ...(g >= 2 ? ['english'] : []),
    ];
  return [
    'math',
    'russian',
    'literature',
    'english',
    'history',
    'biology',
    'geography',
    ...(g >= 6 ? ['social'] : []),
    ...(g >= 7 ? ['physics'] : []),
    ...(g >= 8 ? ['chemistry'] : []),
  ];
}
function subjectName(id) {
  return id === 'literature' && grade <= 4
    ? 'Литературное чтение'
    : subjects[id].name;
}
function topicNames(id) {
  if (id === 'math')
    return grade <= 4
      ? [
          'Числа и действия с ними',
          'Задачи из повседневной жизни',
          'Геометрические фигуры',
        ]
      : grade <= 6
        ? ['Обыкновенные дроби', 'Десятичные дроби', 'Проценты и задачи']
        : grade <= 9
          ? [
              'Уравнения и их решения',
              'Выражения и преобразования',
              'Функции и графики',
            ]
          : [
              'Функции и их свойства',
              'Уравнения и неравенства',
              'Элементы теории вероятностей',
            ];
  return {
    russian:
      grade <= 4
        ? ['Звуки и буквы', 'Слово и его значение', 'Предложение и текст']
        : ['Слово и его строение', 'Части речи', 'Предложение и пунктуация'],
    literature: [
      'Читаем и обсуждаем',
      'Герои и их поступки',
      'Учимся понимать автора',
    ],
    english: [
      'Знакомимся и общаемся',
      'Слова в повседневной жизни',
      'Читаем и понимаем',
    ],
    world: ['Человек и природа', 'Мир вокруг нас', 'Наша страна'],
    history: ['Исторические источники', 'События и их причины', 'Люди и эпохи'],
    biology: [
      'Разнообразие живой природы',
      'Строение организмов',
      'Организмы и среда обитания',
    ],
    geography: [
      'Географическая карта',
      'Природные процессы',
      'Природа и человек',
    ],
    physics: [
      'Физические величины',
      'Движение и взаимодействие',
      'Наблюдения и опыты',
    ],
    chemistry: [
      'Вещества и их свойства',
      'Атомы и молекулы',
      'Химические реакции',
    ],
    social: [
      'Человек и общество',
      'Общение и отношения',
      'Права и обязанности',
    ],
  }[id];
}
function renderSubjects() {
  document
    .querySelectorAll('[data-grade]')
    .forEach((button) =>
      button.setAttribute(
        'aria-pressed',
        String(Number(button.dataset.grade) === grade),
      ),
    );
  $('#subject-grid').innerHTML = availableSubjects()
    .map(
      (id) =>
        `<button class="subject-card" data-subject="${id}" aria-label="${safe(subjectName(id))}, ${grade} класс: посмотреть программу"><span class="subject-top"><span class="subject-glyph" aria-hidden="true">${subjects[id].glyph}</span><small>${grade} класс</small></span><h3>${subjectName(id)}</h3><p>${subjects[id].description}</p><span class="subject-cta">Посмотреть программу ${icon('arrow')}</span></button>`,
    )
    .join('');
}
function renderPrices() {
  document
    .querySelectorAll('[data-price]')
    .forEach(
      (el) => (el.textContent = money(amount(Number(el.dataset.price)))),
    );
  document
    .querySelectorAll('[data-period-label]')
    .forEach((el) => (el.textContent = `за ${months()}`));
}
function openSubject(id) {
  desiredSubject = id;
  $('#subject-grade').textContent = `${grade} КЛАСС · ПРОГРАММА ПРЕДМЕТА`;
  $('#subject-title').textContent = subjectName(id);
  $('#subject-program').innerHTML = topicNames(id)
    .map(
      (name, index) =>
        `<section class="topic-item"><h3>${index + 1}. ${name}</h3><div><button class="locked-material" data-locked="video">${icon('play')}Видеоурок ${icon('lock')}</button><button class="locked-material" data-locked="homework">${icon('book')}Задание ${icon('lock')}</button></div></section>`,
    )
    .join('');
  $('#subject-dialog').showModal();
}
function normaliseSelection() {
  const allowed = availableSubjects();
  selectedSubjects = selectedSubjects
    .filter((id) => allowed.includes(id))
    .slice(0, chosenPlan().subjects);
  for (const id of allowed) {
    if (selectedSubjects.length >= chosenPlan().subjects) break;
    if (!selectedSubjects.includes(id)) selectedSubjects.push(id);
  }
}
function classOptions() {
  return Array.from(
    { length: 11 },
    (_, i) =>
      `<option value="${i + 1}" ${i + 1 === grade ? 'selected' : ''}>${i + 1} класс</option>`,
  ).join('');
}
function subjectOptions(selected) {
  return availableSubjects()
    .map(
      (id) =>
        `<option value="${id}" ${id === selected ? 'selected' : ''}>${subjectName(id)}</option>`,
    )
    .join('');
}
function renderPickers() {
  $('#subject-pickers').innerHTML = selectedSubjects
    .map(
      (id, index) =>
        `<label class="field-label">${selectedPlan === 7 ? (index === 0 ? 'Предмет с онлайн-занятиями' : `Дополнительный предмет ${index}`) : chosenPlan().subjects === 1 ? 'Предмет' : `Предмет ${index + 1}`}<select name="subject-${index}" data-pick="${index}" required>${subjectOptions(id)}</select></label>`,
    )
    .join('');
}
function registrationFields() {
  if (isSignedIn())
    return '<p class="selection-note">Вы вошли в демопрофиль. Повторная регистрация не требуется.</p>';
  return `<label class="field-label">Имя ученика<input name="student" autocomplete="given-name" placeholder="Как тебя зовут?" required maxlength="80"/></label><label class="field-label">Электронная почта<input name="email" type="email" autocomplete="email" placeholder="name@example.ru" required maxlength="200"/></label><label class="field-label">Пароль<input name="password" type="password" autocomplete="new-password" placeholder="Не менее 8 символов" required minlength="8" maxlength="128"/></label>`;
}
function registerMarkup() {
  return `<span class="eyebrow">${isSignedIn() ? 'ТВОЙ ПЛАН ОБУЧЕНИЯ' : 'СНАЧАЛА ЗНАКОМИМСЯ'}</span><h2 id="auth-title">${isSignedIn() ? 'Выбери свои предметы' : 'Создай свой аккаунт'}</h2><p class="dialog-subtitle">${isSignedIn() ? 'Выбери предметы для нового тарифа.' : 'Аккаунт сохранит твои уроки, работы и прогресс.'}</p><div class="order-summary"><div>${chosenPlan().name} · ${months()}<small>${subjectCountLabel(chosenPlan().subjects)} в выбранном классе</small></div><strong>${money(amount(selectedPlan))}</strong></div><form id="registration-form" class="auth-form"><label class="field-label">Класс ученика<select id="registration-grade" required>${classOptions()}</select></label><div class="field-grid" id="subject-pickers"></div><p class="selection-note">Доступ только к выбранному классу. «Как учиться в Юнискул» включено.</p>${registrationFields()}<p id="registration-error" class="form-error" role="alert" hidden></p><button class="button orange" type="submit">Продолжить к оплате ${icon('arrow')}</button></form>${isSignedIn() ? '' : '<p class="auth-switch">Уже есть аккаунт? <button class="text-button" id="switch-login">Войти</button></p>'}<p class="demo-note">Прототип: данные не отправляются и аккаунт не создаётся. Для проверки можно использовать вымышленные данные. Регистрация и оплата будут подключены отдельно.</p>`;
}
function loginMarkup() {
  return `<span class="eyebrow">ТВОЁ ПРОСТРАНСТВО ДЛЯ УЧЁБЫ</span><h2 id="auth-title">С возвращением!</h2><p class="dialog-subtitle">Войди в готовый демонстрационный профиль.</p><form class="auth-form login-form" id="login-form"><label class="field-label">Логин<input name="login" autocomplete="username" placeholder="Твой логин" required maxlength="80" autocapitalize="none" spellcheck="false"/></label><label class="field-label">Пароль<input type="password" name="password" autocomplete="current-password" placeholder="Твой пароль" required maxlength="128"/></label><p class="form-error" id="login-error" role="alert" hidden></p><button class="button blue" type="submit">Войти ${icon('arrow')}</button></form><p class="demo-note">Учебный демопрофиль. Не вводи здесь пароли от других сервисов. Прогресс сохраняется только в этом браузере.</p>`;
}
function openAuth(mode) {
  if (
    mode === 'login' &&
    isSignedIn() &&
    !(
      new URLSearchParams(location.search).get('role') === 'teacher' &&
      role() !== 'teacher'
    )
  ) {
    location.href = homeRoute();
    return;
  }
  normaliseSelection();
  $('#auth-content').innerHTML =
    mode === 'login' ? loginMarkup() : registerMarkup();
  if (mode !== 'login') renderPickers();
  if (!$('#auth-dialog').open) $('#auth-dialog').showModal();
  $('#auth-dialog').scrollTop = 0;
}
function renderCheckout() {
  $('#auth-content').innerHTML =
    `<span class="eyebrow">ПРОВЕРЬ СВОЙ ВЫБОР</span><h2 id="auth-title">Твой план обучения</h2><p class="dialog-subtitle">Так будет выглядеть заказ перед оплатой.</p><div class="checkout-summary"><div><span>Тариф</span><strong>${chosenPlan().name}</strong></div><div><span>Класс</span><strong>${grade}</strong></div><div><span>Предметы</span><strong>${selectedSubjects.map((id, index) => `${subjectName(id)}${selectedPlan === 7 ? (index === 0 ? ' — онлайн-занятия' : ' — материалы') : ''}`).join('<br/>')}</strong></div><div><span>Срок доступа</span><strong>${months()}</strong></div><div><span>Включено</span><strong>«Как учиться в Юнискул»</strong></div><div class="checkout-total"><span>Итого</span><strong>${money(amount(selectedPlan))}</strong></div></div><p class="demo-note">Это демонстрация заказа; оплата не проведена. Реальную регистрацию и платёжный сервис подключим на этапе разработки платформы.</p><div class="checkout-actions"><button class="button blue" id="edit-selection">Изменить выбор</button></div>`;
  $('#auth-dialog').scrollTop = 0;
}
document.querySelectorAll('[data-grade]').forEach(
  (button) =>
    (button.onclick = () => {
      grade = Number(button.dataset.grade);
      desiredSubject = null;
      renderSubjects();
    }),
);
$('#subject-grid').onclick = (e) => {
  const button = e.target.closest('[data-subject]');
  if (button) openSubject(button.dataset.subject);
};
$('#subject-program').onclick = (e) => {
  const button = e.target.closest('[data-locked]');
  if (!button) return;
  $('#subject-dialog').close();
  $('#access-description').textContent =
    `${subjectName(desiredSubject)}, ${grade} класс. ${button.dataset.locked === 'video' ? 'Видеоурок' : 'Задание'} станет доступно после регистрации и оплаты тарифа.`;
  $('#access-dialog').showModal();
};
$('#access-plans').onclick = () => {
  $('#access-dialog').close();
  $('#plans').scrollIntoView({
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'instant'
      : 'smooth',
  });
};
$('#plan-period').onchange = (e) => {
  period = Number(e.target.value);
  renderPrices();
};
document.querySelectorAll('[data-plan]').forEach(
  (button) =>
    (button.onclick = () => {
      selectedPlan = Number(button.dataset.plan);

      if (desiredSubject && availableSubjects().includes(desiredSubject))
        selectedSubjects = [desiredSubject];
      openAuth('register');
    }),
);
document
  .querySelectorAll('[data-auth]')
  .forEach((button) => (button.onclick = () => openAuth(button.dataset.auth)));
$('#auth-content').addEventListener('change', (e) => {
  if (e.target.id === 'registration-grade') {
    grade = Number(e.target.value);
    normaliseSelection();
    renderPickers();
    renderSubjects();
  }
  if (e.target.matches('[data-pick]')) {
    selectedSubjects[Number(e.target.dataset.pick)] = e.target.value;
    $('#registration-error').hidden = true;
  }
});
$('#auth-content').addEventListener('click', (e) => {
  if (e.target.id === 'switch-login') openAuth('login');
  if (e.target.id === 'switch-register' || e.target.id === 'edit-selection')
    openAuth('register');
});
$('#auth-content').addEventListener('submit', async (e) => {
  e.preventDefault();
  if (e.target.id === 'login-form') {
    const form = e.target;
    const button = form.querySelector('button[type="submit"]');
    const error = form.querySelector('#login-error');
    button.disabled = true;
    button.textContent = 'Входим…';
    error.hidden = true;
    try {
      const data = new FormData(form);
      if (await signIn(data.get('login'), data.get('password'))) {
        location.href = role() === 'student' ? base : homeRoute();
        return;
      }
      error.textContent =
        'Неверный логин или пароль. Проверь данные и попробуй ещё раз.';
    } catch {
      error.textContent =
        'Не удалось войти. Разреши сохранение данных сайта в браузере и попробуй снова.';
    }
    error.hidden = false;
    button.disabled = false;
    button.textContent = 'Войти';
    return;
  }
  if (e.target.id !== 'registration-form') return;
  if (new Set(selectedSubjects).size !== chosenPlan().subjects) {
    $('#registration-error').textContent =
      `Выбери ${chosenPlan().subjects} разных предмета для тарифа «${chosenPlan().name}».`;
    $('#registration-error').hidden = false;
    return;
  }
  e.target.reset();
  renderCheckout();
});
document
  .querySelectorAll('[data-close]')
  .forEach(
    (button) =>
      (button.onclick = () =>
        document.getElementById(button.dataset.close).close()),
  );
document.querySelectorAll('dialog').forEach((dialog) =>
  dialog.addEventListener('click', (e) => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      dialog.close();
  }),
);
$('#auth-dialog').addEventListener('close', () => {
  $('#auth-content').replaceChildren();
});
$('#menu-toggle').onclick = () => {
  const open = $('#mobile-menu').hidden;
  $('#mobile-menu').hidden = !open;
  $('#menu-toggle').setAttribute('aria-expanded', String(open));
};
$('#mobile-menu').onclick = (e) => {
  if (e.target.closest('a')) {
    $('#mobile-menu').hidden = true;
    $('#menu-toggle').setAttribute('aria-expanded', 'false');
  }
};
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    $('#mobile-menu').hidden = true;
    $('#menu-toggle').setAttribute('aria-expanded', 'false');
  }
});
renderSubjects();
renderPrices();
if (isSignedIn())
  document.querySelector('[data-auth="login"]').innerHTML =
    `${role() === 'student' ? 'Моё обучение' : 'Мой кабинет'} ${icon('arrow')}`;
if (new URLSearchParams(location.search).has('login')) openAuth('login');
