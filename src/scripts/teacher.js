import { requireSession, signOut } from './auth.js';
requireSession('teacher');
const $ = (s) => document.querySelector(s);
const key = 'unischool-prototype-v1';
const escape = (s) =>
  String(s ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  );
const names = {
  available: 'Ещё не отправлено',
  locked: 'Сдача закрыта',
  review: 'На проверке',
  revision: 'На доработке',
  accepted: 'Принято',
};
let selected = 0,
  filter = 'all';
const drafts = ['', ''];
function read() {
  try {
    return JSON.parse(localStorage.getItem(key) || '{}');
  } catch {
    return {};
  }
}
function status(data, i) {
  return i === 0
    ? data.firstState || 'available'
    : data.firstState === 'accepted'
      ? data.secondState || 'available'
      : 'locked';
}
function messages(data, i) {
  return Array.isArray(data.messages?.[i])
    ? data.messages[i].filter((m) => typeof m?.text === 'string')
    : [];
}
function write(data) {
  localStorage.setItem(key, JSON.stringify(data));
}
function render() {
  const data = read();
  const statuses = [status(data, 0), status(data, 1)];
  $('#teacher-stats').innerHTML = [
    ['На проверке', statuses.filter((s) => s === 'review').length],
    ['На доработке', statuses.filter((s) => s === 'revision').length],
    ['Принято работ', statuses.filter((s) => s === 'accepted').length],
  ]
    .map(
      ([label, n]) =>
        `<div class="teacher-stat"><b>${n}</b><span>${label}</span></div>`,
    )
    .join('');
  const visible = [0, 1].filter(
    (i) =>
      filter === 'all' ||
      (filter === 'questions'
        ? messages(data, i).some((m) => !m.teacher && !m.submission)
        : statuses[i] === filter),
  );
  if (!visible.includes(selected)) selected = visible[0] ?? null;
  $('#work-list').innerHTML =
    visible
      .map(
        (i) =>
          `<button class="work-card ${selected === i ? 'selected' : ''}" data-work="${i}" aria-pressed="${selected === i}"><span class="work-status ${statuses[i]}">${names[statuses[i]]}</span><strong>Александра Соколова</strong><p>7 класс · Математика<br/>${i ? '1.5 Практика со скобками' : '1.3 Линейные уравнения'}</p><small>${messages(data, i).length} сообщений</small></button>`,
      )
      .join('') ||
    '<p class="review-empty">Работ с таким статусом пока нет. Выберите «Все работы».</p>';
  $('#teacher-notice-list').innerHTML =
    [0, 1]
      .filter((i) => statuses[i] === 'review')
      .map(
        (i) =>
          `<button class="work-card" data-notice="${i}"><strong>Работа ждёт проверки</strong><p>Александра · задание ${i + 1}</p></button>`,
      )
      .join('') || '<p class="teacher-local">Новых работ на проверке нет.</p>';
  if (selected === null) {
    $('#review-panel').innerHTML = '';
    return;
  }
  const i = selected,
    s = statuses[i],
    thread = messages(data, i);
  $('#review-panel').innerHTML =
    `<article class="review-card"><span class="eyebrow">МАТЕМАТИКА · 7 КЛАСС</span><h2>${i ? 'Практика со скобками' : 'Твоя первая практика'}</h2><p class="review-meta">Александра Соколова · Задание ${i + 1}<br/>Назначенный преподаватель: Елена Андреевна</p><h3>Условие задания</h3><div class="review-task">Реши уравнения, запиши ход решения и проверку.<br/>${i ? '1. 3(x + 2) = 15<br/>2. 2(x − 4) = 10' : '1. 2x + 3 = 11<br/>2. 5x − 7 = 18'}</div><h3>Работа и переписка</h3><span class="work-status ${s}">${names[s]}</span><div class="review-thread">${thread.map((m) => `<div class="review-message ${m.teacher ? 'teacher' : ''}"><strong>${m.teacher ? 'Елена Андреевна' : 'Александра'}</strong><small>${m.submission ? 'Работа отправлена' : m.decision === 'accepted' ? `Принято · Отметка ${escape(m.grade)}` : m.decision === 'revision' ? 'Возврат на доработку' : m.teacher ? 'Ответ преподавателя' : 'Вопрос по заданию'}</small><p>${escape(m.text)}</p>${(m.files || []).map((f) => `<small>Прикреплено: ${escape(f)} (в демо — только название)</small>`).join('')}</div>`).join('') || '<p class="review-empty">Ученик ещё не отправил работу или вопрос.</p>'}</div>${['accepted', 'locked'].includes(s) ? `<div class="review-empty">${s === 'accepted' ? 'Работа принята. Переписка закрыта; история и отметка сохранены.' : 'Сдача откроется после принятия предыдущей работы.'}</div>` : `<form id="review-form" class="review-form"><label for="teacher-comment">Комментарий или ответ ученику</label><textarea id="teacher-comment" maxlength="5000" placeholder="Объясните, что получилось и на что обратить внимание…">${escape(drafts[i])}</textarea>${s === 'review' ? '<label for="teacher-grade">Отметка при принятии</label><select id="teacher-grade"><option value="">Выберите отметку</option><option>5</option><option>4</option><option>3</option><option>2</option></select>' : ''}<p id="review-error" role="alert" class="review-error" hidden></p><div class="review-actions"><button class="secondary-button" type="submit">Ответить ученику</button>${s === 'review' ? '<button class="secondary-button" type="button" data-decision="revision">Вернуть на доработку</button><button class="primary-button" type="button" data-decision="accepted">Принять работу</button>' : ''}</div></form>${s === 'available' && !thread.some((m) => m.submission) ? '<div class="review-empty" style="margin-top:22px">Чтобы познакомиться с проверкой, загрузите пример. Уже написанные вопросы сохранятся.<br/><button class="outline-button" id="seed-work">Загрузить пример работы</button></div>' : ''}`}</article>`;
  if ($('#teacher-comment'))
    $('#teacher-comment').oninput = (e) => (drafts[i] = e.target.value);
  if ($('#review-form'))
    $('#review-form').onsubmit = (e) => {
      e.preventDefault();
      send();
    };
  document
    .querySelectorAll('[data-decision]')
    .forEach((b) => (b.onclick = () => send(b.dataset.decision)));
  if ($('#seed-work'))
    $('#seed-work').onclick = () => {
      const latest = read();
      if (status(latest, i) !== 'available') return render();
      latest.messages = [messages(latest, 0), messages(latest, 1)];
      latest.messages[i].push({
        text: i
          ? '3x + 6 = 15, x = 3. Проверка: 3 × (3 + 2) = 15.\n2x − 8 = 10, x = 9. Проверка: 2 × (9 − 4) = 10.'
          : '2x = 8, x = 4. Проверка: 2 × 4 + 3 = 11.\n5x = 25, x = 5. Проверка: 5 × 5 − 7 = 18.',
        submission: true,
        files: [],
      });
      latest[i ? 'secondState' : 'firstState'] = 'review';
      write(latest);
      render();
    };
}
function send(decision) {
  const data = read(),
    i = selected,
    s = status(data, i);
  if (['accepted', 'locked'].includes(s) || (decision && s !== 'review'))
    return render();
  const text = $('#teacher-comment').value.trim(),
    grade = $('#teacher-grade')?.value;
  const error = $('#review-error');
  if (
    (decision !== 'accepted' && !text) ||
    (decision === 'accepted' && !['2', '3', '4', '5'].includes(grade))
  ) {
    error.textContent =
      decision === 'accepted'
        ? 'Выберите отметку перед принятием работы.'
        : 'Напишите комментарий ученику.';
    error.hidden = false;
    return;
  }
  data.messages = [messages(data, 0), messages(data, 1)];
  data.messages[i].push({
    teacher: true,
    text: text || 'Работа принята. Спасибо за старание!',
    decision: decision || null,
    grade: decision === 'accepted' ? Number(grade) : null,
  });
  if (decision) data[i ? 'secondState' : 'firstState'] = decision;
  try {
    write(data);
    drafts[i] = '';
    render();
  } catch {
    error.textContent =
      'Не удалось сохранить ответ. Проверьте доступное место в браузере.';
    error.hidden = false;
  }
}
$('#work-filter').onchange = (e) => {
  filter = e.target.value;
  render();
};
$('#work-list').onclick = (e) => {
  const b = e.target.closest('[data-work]');
  if (b) {
    selected = Number(b.dataset.work);
    render();
    if (innerWidth < 650)
      $('#review-panel').scrollIntoView({ behavior: 'smooth' });
  }
};
$('#teacher-notice-list').onclick = (e) => {
  const b = e.target.closest('[data-notice]');
  if (b) {
    selected = Number(b.dataset.notice);
    filter = 'all';
    $('#work-filter').value = 'all';
    $('#teacher-notices').hidePopover();
    render();
  }
};
$('#teacher-logout').onclick = signOut;
$('#support-open').onclick = () => $('#teacher-support').showModal();
$('#support-close').onclick = () => $('#teacher-support').close();
$('#support-form').onsubmit = (e) => {
  e.preventDefault();
  const value = $('#support-message').value.trim();
  if (!value) return;
  for (const [text, user] of [
    [value, true],
    ['Это демочат. В рабочей версии здесь ответит сотрудник поддержки.', false],
  ]) {
    const el = document.createElement('div');
    el.className = `chat-bubble${user ? ' user' : ''}`;
    el.textContent = text;
    $('#support-thread').append(el);
  }
  $('#support-message').value = '';
  $('#support-thread').scrollTop = $('#support-thread').scrollHeight;
};
window.addEventListener('storage', (e) => {
  if (e.key === key) render();
  if (e.key === 'unischool-demo-session-v1') location.reload();
});
render();
