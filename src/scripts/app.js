import { requireSession, signOut } from './auth.js';
requireSession();
const $ = (selector) => document.querySelector(selector);
const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`;
const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ],
  );
const lessons = [
  {
    title: 'Что такое уравнение?',
    short: '1.1 Что такое уравнение?',
    type: 'video',
    kind: 'ВИДЕОУРОК',
    subtitle: 'Узнаем, как находить неизвестное и проверять ответ',
    duration: 'Демонстрация · 12 секунд',
  },
  {
    title: 'Решаем уравнения по шагам',
    short: '1.2 Разбираем на примерах',
    type: 'text',
    kind: 'КОНСПЕКТ',
    subtitle: 'Главные правила и два понятных примера',
    duration: '3 минуты чтения',
  },
  {
    title: 'Твоя первая практика',
    short: '1.3 Домашнее задание',
    type: 'homework',
    kind: 'ПРАКТИКА',
    subtitle: 'Линейные уравнения · Задание 1',
    assignment: 0,
    duration: 'Проверяет преподаватель',
  },
  {
    title: 'Уравнения со скобками',
    short: '1.4 Раскрываем скобки',
    type: 'text',
    kind: 'КОНСПЕКТ',
    subtitle: 'Делаем ещё один шаг: распределительное свойство',
    duration: '4 минуты чтения',
  },
  {
    title: 'Практика со скобками',
    short: '1.5 Домашнее задание',
    type: 'homework',
    kind: 'ПРАКТИКА',
    subtitle: 'Линейные уравнения · Задание 2',
    assignment: 1,
    duration: 'Проверяет преподаватель',
  },
];
const stateNames = {
  available: 'Можно сдавать',
  locked: 'Сдача закрыта',
  review: 'На проверке',
  revision: 'Нужна доработка',
  accepted: 'Задание принято',
};
const storageKey = 'unischool-prototype-v1';
let saved = {};
try {
  saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
} catch {
  /* Storage is optional for the prototype. */
}
let current =
  Number.isInteger(saved.current) &&
  saved.current >= 0 &&
  saved.current < lessons.length
    ? saved.current
    : 0;
let firstState = Object.hasOwn(stateNames, saved.firstState)
  ? saved.firstState
  : 'available';
let secondState = ['available', 'review'].includes(saved.secondState)
  ? saved.secondState
  : 'available';
let messages =
  Array.isArray(saved.messages) && saved.messages.length === 2
    ? saved.messages.map((group) =>
        Array.isArray(group)
          ? group.filter((m) => typeof m?.text === 'string').slice(-30)
          : [],
      )
    : [[], []];
let drafts = Array.isArray(saved.drafts)
  ? saved.drafts.map((v) => (typeof v === 'string' ? v : ''))
  : ['', ''];
let attachmentNames = [];
let playerTimer;
let elapsed = 0;
let playing = false;
let speed = 1;
let toastTimer;
let overview = true;
let quizPassed = saved.quizPassed === true;
function persist() {
  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        current,
        firstState,
        secondState,
        messages,
        drafts,
        quizPassed,
      }),
    );
  } catch {
    /* Keep interactions working without storage. */
  }
}
function toast(text) {
  clearTimeout(toastTimer);
  $('#toast').textContent = text;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => {
    $('#toast').hidden = true;
  }, 4200);
}
function assignmentState(index) {
  return index === 0
    ? firstState
    : firstState === 'accepted'
      ? secondState
      : 'locked';
}
function stopPlayer() {
  clearInterval(playerTimer);
  playing = false;
}
function renderSidebar() {
  $('#lesson-list').innerHTML = lessons
    .map((lesson, index) => {
      const status =
        lesson.type === 'homework' ? assignmentState(lesson.assignment) : null;
      return `<button class="lesson-link ${current === index ? 'active' : ''}" data-lesson="${index}" ${current === index ? 'aria-current="page"' : ''}>${icon(lesson.type === 'video' ? 'play' : lesson.type === 'text' ? 'book' : 'paper')}<span>${lesson.short}<small>${status ? stateNames[status] : lesson.duration}</small></span>${status === 'accepted' ? '<span class="state-icon">✓</span>' : status === 'locked' ? icon('lock') : ''}</button>`;
    })
    .join('');
  const count = firstState === 'accepted' ? 1 : 0;
  $('#progress-label').textContent = `${count} из 2 заданий`;
  $('#course-progress').value = count;
}
function teacherCard() {
  return `<aside class="teacher-card"><span class="eyebrow">РЯДОМ С ТОБОЙ</span><div class="teacher-line"><span class="teacher-avatar">ЕА</span><div><strong>Елена Андреевна</strong><small>Преподаватель математики</small></div></div><p>Если что-то непонятно, задай вопрос в обсуждении домашнего задания.</p></aside>`;
}
function videoContent() {
  return `<section class="video-stage" aria-label="Демонстрация видеоплеера"><div class="video-copy"><span class="video-label">АЛГЕБРА БЕЗ СЛОЖНОСТЕЙ</span><h2>У каждого<br/>неизвестного<br/>есть <em>решение.</em></h2><p>Начнём с простого — научимся находить неизвестное число.</p></div><div class="algebra-art" aria-hidden="true"><div class="orbit"></div><span class="art-star">✳</span><div class="formula-card">2<b>x</b> + 3 = 11</div><div class="formula-mini">x = ?</div></div><button id="play-main" class="play-main" aria-label="Воспроизвести демонстрацию">${icon('play')}</button><div class="video-chapter"><span>01</span><div id="video-step">Знакомимся с неизвестным</div></div><div class="player-controls"><button id="play-control" aria-label="Воспроизвести демонстрацию">${icon('play')}</button><span id="video-time">0:00 / 0:12</span><input id="video-progress" type="range" min="0" max="12" value="0" step="0.1" aria-label="Позиция демонстрации"/><select id="video-speed" aria-label="Скорость демонстрации"><option value="1">1×</option><option value="1.5">1.5×</option><option value="2">2×</option></select><button id="fullscreen" aria-label="Полноэкранный режим">⛶</button></div></section><p class="video-caption">Демонстрация плеера · Учебное видео будет добавлено при наполнении курса</p><div class="lesson-below"><section><h2 class="section-title">Сегодня разберёмся</h2><p class="body-copy">Уравнение похоже на весы: обе его части должны оставаться равными. Научимся сохранять равновесие и находить x.</p><ul class="learning-points"><li>${icon('check')}Что называют корнем уравнения</li><li>${icon('check')}Как перенести число в другую часть</li><li>${icon('check')}Как проверить своё решение</li></ul><button class="material-download" id="download-notes">${icon('paper')}<span>Краткий конспект урока<small>Текстовый файл · правила и примеры</small></span><span aria-hidden="true">↓</span></button></section>${teacherCard()}</div>`;
}
function textContent() {
  const brackets = current === 3;
  return `<article class="reading-card"><span class="assignment-status">${icon('book')} Сохрани в памяти</span><h2>${brackets ? 'Сначала раскрываем скобки' : 'Одинаковое действие — с обеих сторон'}</h2><p>${brackets ? 'Чтобы умножить число на сумму, умножь его на каждое слагаемое. После раскрытия скобок решай уравнение привычным способом.' : 'Если к обеим частям уравнения прибавить одно и то же число или вычесть его, равенство сохранится. Так мы постепенно оставляем неизвестное с одной стороны.'}</p><div class="equation">${brackets ? '3(x + 2) = 15' : '2x + 3 = 11'}</div><h3>Шаг 1. ${brackets ? 'Раскрываем скобки' : 'Убираем лишнее'}</h3><p>${brackets ? 'Умножим 3 на оба слагаемых: получим 3x + 6 = 15.' : 'Вычтем 3 из обеих частей: 2x + 3 − 3 = 11 − 3. Получим 2x = 8.'}</p><h3>Шаг 2. Находим неизвестное</h3><p>${brackets ? 'Вычтем 6 из обеих частей: 3x = 9. Разделим на 3: x = 3.' : 'Разделим обе части на 2: x = 8 ÷ 2. Значит, x = 4.'}</p><h3>Шаг 3. Проверяем себя</h3><p>${brackets ? 'Подставим 3 вместо x: 3 × (3 + 2) = 15. Равенство верно.' : 'Подставим ответ вместо x: 2 × 4 + 3 = 11. Левая и правая части равны — всё получилось!'}</p></article>`;
}
function threadContent(index, status) {
  let html = messages[index]
    .map(
      (message) =>
        `<div class="thread-message"><div class="thread-author">Александра <small>${message.submission ? 'Работа отправлена' : 'Вопрос преподавателю'}</small></div><p>${escapeHtml(message.text)}</p>${Array.isArray(message.files) ? message.files.map((name) => `<span class="attachment-label">${escapeHtml(name)}</span>`).join('') : ''}</div>`,
    )
    .join('');
  if (['accepted', 'revision'].includes(status)) {
    if (!html)
      html =
        '<div class="thread-message"><div class="thread-author">Александра <small>Демонстрационная работа</small></div><p>1. x = 4. Проверка: 2 × 4 + 3 = 11.<br/>2. x = 5. Проверка: 5 × 5 − 7 = 18.</p></div>';
    html += `<div class="thread-message teacher"><div class="thread-author">Елена Андреевна <small>Преподаватель</small>${status === 'accepted' ? '<span class="grade">Отметка <b>5</b></span>' : ''}</div><p>${status === 'accepted' ? 'Всё верно! Ты правильно решила уравнения и проверила ответы. Работа принята.' : 'Ход решения верный. Добавь, пожалуйста, проверку для второго уравнения: подставь найденное значение вместо x.'}</p></div>`;
  }
  return html;
}
function homeworkContent(lesson) {
  const index = lesson.assignment;
  const status = assignmentState(index);
  const blocked = status === 'locked' || status === 'accepted';
  return `<article class="homework-card"><span class="assignment-status ${status}">${icon(status === 'accepted' ? 'check' : status === 'locked' ? 'lock' : 'paper')}${stateNames[status]}</span><h2>Теперь попробуй самостоятельно</h2><p>Реши два уравнения. Запиши ход решения и проверь каждый ответ подстановкой. Можно написать решение здесь или прикрепить фотографию тетради.</p><div class="exercise-list"><div class="exercise"><small>01</small><span>${index ? '3(x + 2) = 15' : '2x + 3 = 11'}</span></div><div class="exercise"><small>02</small><span>${index ? '2(x − 4) = 10' : '5x − 7 = 18'}</span></div><p>Преподаватель проверит ход решения и оставит комментарий. Если нужна помощь, напиши свой вопрос в обсуждении ниже.</p></article><section class="submission-section" aria-label="Сдача и обсуждение задания"><h2>Твоя работа и вопросы</h2>${threadContent(index, status)}${status === 'locked' ? `<div class="locked-message">${icon('lock')}<div><strong>Пока можно прочитать задание</strong><p>Сдача задания и обсуждение станут доступны после принятия предыдущей работы.</p></div></div>` : status === 'accepted' ? `<div class="accepted-message">${icon('check')}<div><strong>Задание принято</strong><p>Если остались вопросы, задайте их в обсуждении задания к следующему уроку.</p></div></div>` : ''}${status === 'review' ? '<p class="body-copy">Работа отправлена преподавателю. Пока идёт проверка, можно продолжать переписку.</p>' : ''}${!blocked ? `<form class="answer-form" id="answer-form"><label for="answer">${status === 'review' ? 'Сообщение преподавателю' : 'Твой ответ или вопрос преподавателю'}</label><textarea id="answer" placeholder="Напиши решение или задай вопрос…" maxlength="5000">${escapeHtml(drafts[index] || '')}</textarea><div id="selected-files" class="attachment-label"></div><div class="answer-actions"><label class="file-picker">${icon('attach')}Прикрепить файл<input id="answer-files" type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt" aria-label="Прикрепить файлы к работе"/></label><button class="secondary-button" type="button" id="ask-teacher">Задать вопрос</button>${status !== 'review' ? '<button class="primary-button" type="submit">Отправить на проверку</button>' : ''}</div><p class="form-note">Переписку видите только ты и преподаватель. В прототипе сохраняются текст и названия файлов; сами файлы не загружаются.</p></form>` : ''}</section>`;
}
function closeSidebar() {
  document.body.classList.remove('sidebar-open');
  $('#sidebar-shade').hidden = true;
  $('#contents-toggle').setAttribute(
    'aria-expanded',
    String(
      !document.body.classList.contains('sidebar-hidden') && innerWidth > 850,
    ),
  );
}
function render() {
  stopPlayer();
  elapsed = 0;
  attachmentNames = [];
  document.body.classList.toggle('overview-mode', overview);
  if (overview) {
    $('#material-kind').textContent = 'МОЁ ОБУЧЕНИЕ';
    $('#lesson-title').textContent = 'Привет, Александра!';
    $('#lesson-description').textContent =
      'Хороший день, чтобы разобраться в чём-то новом.';
    $('#prev').hidden = true;
    $('#next').hidden = true;
    $('#page-position').textContent = 'Твой учебный кабинет';
    $('#lesson-content').innerHTML =
      `<section class="dashboard-welcome"><div><span class="eyebrow">ТВОЙ МАЛЕНЬКИЙ ШАГ СЕГОДНЯ</span><h2>Сложное становится<br/><em>понятным.</em></h2><p>Продолжай в своём темпе. Уроки, практика и поддержка преподавателя — всё рядом.</p><button id="continue-course" class="primary-button">Продолжить обучение ${icon('arrow')}</button></div><div class="dashboard-equation" aria-hidden="true"><span>2x + 3 = 11</span><b>x = 4 <i>✓</i></b><small>У тебя всё получится</small></div></section><div class="dashboard-section-title"><h2>Мои предметы</h2><span>7 класс · Юни 1</span></div><div class="dashboard-grid"><section class="dashboard-course"><div class="dashboard-course-art"><span>x²</span><small>ДОСТУП ОТКРЫТ</small><b>Математика</b><p>Понять. Попробовать. Получится.</p></div><div class="dashboard-course-body"><span class="eyebrow">АЛГЕБРА · 7 КЛАСС</span><h3>Линейные уравнения</h3><p>Видеодемонстрация, 2 конспекта, самопроверка и 2 домашних задания.</p><div class="dashboard-progress"><span>${firstState === 'accepted' ? '1' : '0'} из 2 работ принято</span><strong>${firstState === 'accepted' ? '50' : '0'}%</strong></div><progress value="${firstState === 'accepted' ? 1 : 0}" max="2" aria-label="Прогресс по математике"></progress><button id="open-course" class="primary-button">Открыть предмет ↗</button></div></section><div class="dashboard-side"><section class="dashboard-guide"><span class="guide-symbol">✳</span><span class="eyebrow">ВКЛЮЧЕНО В ТВОЙ ТАРИФ</span><h3>Как учиться<br/>в Юнискул</h3><p>Простое начало для ученика и родителя. Здесь будут все необходимые инструкции.</p><button id="dashboard-guide" class="outline-button">Открыть раздел ↗</button></section><section class="dashboard-demo"><strong>Можно смело пробовать</strong><p>Это демопрофиль. После отправки работы выбери в нижней панели «Принято»: появится отметка и откроется сдача следующего задания. Настоящих платежей и отправки сообщений здесь нет.</p></section></div></div>`;
    renderSidebar();
    $('#continue-course').onclick = () => navigate(current);
    $('#open-course').onclick = () => navigate(current);
    $('#dashboard-guide').onclick = () => $('#guide').showModal();
    return;
  }
  $('#prev').hidden = false;
  $('#next').hidden = false;
  const lesson = lessons[current];
  $('#lesson-title').textContent = lesson.title;
  $('#lesson-description').textContent = lesson.subtitle;
  $('#material-kind').textContent = lesson.kind;
  $('#page-position').textContent =
    `Материал ${current + 1} из ${lessons.length}`;
  $('#prev').disabled = current === 0;
  $('#next').disabled = current === lessons.length - 1;
  $('#demo-state').value = firstState;
  $('#lesson-content').innerHTML =
    lesson.type === 'video'
      ? videoContent()
      : lesson.type === 'text'
        ? textContent()
        : homeworkContent(lesson);
  renderSidebar();
  bindContent();
}
function navigate(index) {
  overview = false;
  current = Math.max(0, Math.min(lessons.length - 1, index));
  persist();
  render();
  closeSidebar();
  window.scrollTo({ top: 0, behavior: 'instant' });
}
function updatePlayer() {
  const stage = $('.video-stage');
  if (!stage) return;
  stage.classList.toggle('playing', playing);
  $('#play-main').hidden = playing;
  $('#play-control').innerHTML = playing ? 'Ⅱ' : icon('play');
  $('#play-control').setAttribute(
    'aria-label',
    playing ? 'Пауза' : 'Воспроизвести демонстрацию',
  );
  $('#video-time').textContent =
    `0:${String(Math.floor(elapsed)).padStart(2, '0')} / 0:12`;
  $('#video-progress').value = elapsed;
  $('.formula-mini').textContent =
    elapsed < 4 ? 'x = ?' : elapsed < 8 ? '2x = 8' : 'x = 4';
  $('#video-step').textContent =
    elapsed < 4
      ? 'Знакомимся с неизвестным'
      : elapsed < 8
        ? 'Вычитаем 3 из обеих частей'
        : 'Делим обе части на 2';
}
function togglePlayer() {
  if (playing) stopPlayer();
  else {
    if (elapsed >= 12) elapsed = 0;
    playing = true;
    playerTimer = setInterval(() => {
      elapsed = Math.min(12, elapsed + 0.1 * speed);
      if (elapsed >= 12) stopPlayer();
      updatePlayer();
    }, 100);
  }
  updatePlayer();
}
function sendToTeacher(submission) {
  const index = lessons[current].assignment;
  const status = assignmentState(index);
  if (
    ['locked', 'accepted'].includes(status) ||
    (submission && status === 'review')
  )
    return;
  const text = $('#answer').value.trim();
  if (!text && attachmentNames.length === 0) {
    toast('Добавь текст или прикрепи файл.');
    $('#answer').focus();
    return;
  }
  messages[index].push({
    text: text || 'Прикреплена работа',
    files: [...attachmentNames],
    submission,
  });
  drafts[index] = '';
  if (submission) {
    if (index === 0) firstState = 'review';
    else secondState = 'review';
  }
  persist();
  render();
  toast(
    submission
      ? 'Демо: работа отправлена на проверку.'
      : 'Демо: вопрос сохранён в переписке с преподавателем.',
  );
}
function bindContent() {
  if (current === 1) {
    $('#lesson-content').insertAdjacentHTML(
      'beforeend',
      `<section class="quiz-card"><span class="eyebrow">БЫСТРАЯ САМОПРОВЕРКА</span><h2>Попробуем без подсказки?</h2><p>Чему равен x в уравнении 3x + 2 = 14?</p><form id="quiz-form"><fieldset><legend class="sr-only">Выбери значение x</legend>${[3, 4, 6].map((value) => `<label><input type="radio" name="quiz-answer" value="${value}" required ${quizPassed && value === 4 ? 'checked' : ''}/> x = ${value}</label>`).join('')}</fieldset><button class="primary-button" type="submit">Проверить ответ</button><p id="quiz-result" role="status">${quizPassed ? 'Верно! x = 4. Самопроверка пройдена.' : ''}</p></form><small class="muted">Проверяется автоматически. Уведомление преподавателю не отправляется.</small></section>`,
    );
    $('#quiz-form').onsubmit = (e) => {
      e.preventDefault();
      const correct = new FormData(e.target).get('quiz-answer') === '4';
      quizPassed = correct;
      persist();
      $('#quiz-result').textContent = correct
        ? 'Верно! 3 × 4 + 2 = 14. Самопроверка пройдена.'
        : 'Пока не сходится. Вычти 2 из обеих частей, а затем раздели на 3. Попробуй ещё раз.';
    };
  }
  if (lessons[current].type === 'video') {
    $('#play-main').onclick = togglePlayer;
    $('#play-control').onclick = togglePlayer;
    $('#video-progress').oninput = (e) => {
      elapsed = Number(e.target.value);
      updatePlayer();
    };
    $('#video-speed').onchange = (e) => {
      speed = Number(e.target.value);
    };
    $('#video-speed').value = String(speed);
    $('#fullscreen').onclick = async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await $('.video-stage').requestFullscreen();
      } catch {
        toast('Полноэкранный режим недоступен в этом браузере.');
      }
    };
    $('#download-notes').onclick = () => {
      const blob = new Blob(
        [
          'Юнискул · Математика · 7 класс\nЧто такое уравнение?\n\n2x + 3 = 11\nВычтем 3: 2x = 8\nРазделим на 2: x = 4\nПроверка: 2 × 4 + 3 = 11\n\nДемонстрационный конспект.',
        ],
        { type: 'text/plain;charset=utf-8' },
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Юнискул — конспект.txt';
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    };
  }
  if ($('#answer-form')) {
    $('#answer').oninput = (e) => {
      drafts[lessons[current].assignment] = e.target.value;
      persist();
    };
    $('#answer-files').onchange = (e) => {
      attachmentNames = Array.from(e.target.files).map((file) => file.name);
      $('#selected-files').textContent = attachmentNames.join(' · ');
    };
    $('#answer-form').onsubmit = (e) => {
      e.preventDefault();
      sendToTeacher(true);
    };
    $('#ask-teacher').onclick = () => sendToTeacher(false);
  }
}
$('#lesson-list').onclick = (e) => {
  const button = e.target.closest('[data-lesson]');
  if (button) navigate(Number(button.dataset.lesson));
};
$('#prev').onclick = () => navigate(current - 1);
$('#next').onclick = () => navigate(current + 1);
$('#contents-toggle').onclick = () => {
  if (innerWidth <= 850) {
    const open = document.body.classList.toggle('sidebar-open');
    $('#sidebar-shade').hidden = !open;
    $('#contents-toggle').setAttribute('aria-expanded', String(open));
  } else {
    const hidden = document.body.classList.toggle('sidebar-hidden');
    $('#contents-toggle').setAttribute('aria-expanded', String(!hidden));
  }
};
$('#sidebar-close').onclick = closeSidebar;
$('#sidebar-shade').onclick = closeSidebar;
$('#demo-state').onchange = (e) => {
  overview = false;
  firstState = e.target.value;
  if (firstState === 'accepted')
    addNotification(
      'Работа принята · Отметка 5',
      'Елена Андреевна проверила первое задание. Можно приступать к следующему.',
      2,
    );
  if (firstState === 'revision')
    addNotification(
      'Преподаватель оставил комментарий',
      'Первое задание нужно немного доработать.',
      2,
    );
  current = 2;
  persist();
  render();
  window.scrollTo({ top: 0, behavior: 'instant' });
};
function addNotification(title, body, lessonIndex) {
  const button = document.createElement('button');
  button.className = 'news-item';
  button.innerHTML = `<span class="notice-symbol">✓</span><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(body)}</p><small>Только что</small></div>`;
  button.onclick = () => {
    $('#notifications').hidePopover();
    navigate(lessonIndex);
  };
  $('#notification-list').prepend(button);
  $('.unread-dot').hidden = false;
}
$('#notifications').addEventListener('toggle', (e) => {
  if (e.newState === 'open') $('.unread-dot').hidden = true;
});
$('#support-open').onclick = () => $('#support').showModal();
$('#guide-open').onclick = () => {
  closeSidebar();
  $('#guide').showModal();
};
document
  .querySelectorAll('[data-close]')
  .forEach(
    (button) =>
      (button.onclick = () =>
        document.getElementById(button.dataset.close).close()),
  );
document.querySelectorAll('dialog').forEach((dialog) =>
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      )
        dialog.close();
    }
  }),
);
function chatMessage(text, user = false) {
  const div = document.createElement('div');
  div.className = `chat-bubble${user ? ' user' : ''}`;
  div.textContent = text;
  $('#support-messages').append(div);
  $('.chat-scroll').scrollTop = $('.chat-scroll').scrollHeight;
}
document.querySelectorAll('[data-topic]').forEach(
  (button) =>
    (button.onclick = () => {
      chatMessage(button.textContent, true);
      chatMessage(
        button.dataset.topic === 'lesson'
          ? 'Вопрос по учебному материалу можно задать преподавателю в конце нужного урока, в блоке сдачи домашнего задания. Там же сохраняется ваша переписка по теме.'
          : button.dataset.topic === 'payment'
            ? 'Уточните, с каким тарифом или платежом возникла проблема. Не присылайте данные банковской карты.'
            : 'Расскажите, на какой странице возникла проблема и что не получается сделать.',
      );
    }),
);
$('#support-form').onsubmit = (e) => {
  e.preventDefault();
  const text = $('#support-message').value.trim();
  if (!text) return;
  chatMessage(text, true);
  $('#support-message').value = '';
  chatMessage(
    'Это демонстрация чата. В рабочей версии сообщение получит сотрудник поддержки, а переписка сохранится в вашем аккаунте.',
  );
};
$('#tariff-info').onclick = () => {
  $('#profile').hidePopover();
  toast('В прототипе оплата не подключена. Здесь будет управление тарифом.');
};
$('#logout').onclick = signOut;
$('#dashboard-open').onclick = () => {
  overview = true;
  render();
  closeSidebar();
  window.scrollTo({ top: 0, behavior: 'instant' });
};
$('#reset-demo').onclick = () => {
  firstState = 'available';
  secondState = 'available';
  messages = [[], []];
  drafts = ['', ''];
  quizPassed = false;
  $('#support-messages').replaceChildren();
  $('#notification-list').innerHTML =
    '<div class="news-item"><span class="notice-symbol">✳</span><div><strong>Добро пожаловать в Юнискул!</strong><p>Математика за 7 класс уже доступна. Удачного начала!</p><small>Сегодня · 09:00</small></div></div>';
  navigate(0);
  toast('Демонстрация начата заново.');
};
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeSidebar();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopPlayer();
    updatePlayer();
  }
});
render();
$('#contents-toggle').setAttribute('aria-expanded', String(innerWidth > 850));
