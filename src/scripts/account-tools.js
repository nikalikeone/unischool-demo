import { isSignedIn, role, base, homeRoute, signOut } from './auth.js';
if (isSignedIn()) {
  const $ = (s) => document.querySelector(s);
  $('#account-tools').hidden = false;
  const teacher = role() === 'teacher';
  $('#account-name').textContent = teacher
    ? 'Елена Андреевна'
    : 'Александра Соколова';
  $('#account-role').textContent = teacher
    ? 'Преподаватель · Математика'
    : 'Ученик · 7 класс';
  $('#account-profile-button').textContent = teacher ? 'ЕА' : 'АС';
  $('#account-learning').href = homeRoute();
  $('#account-learning').textContent = teacher
    ? 'Проверка работ'
    : 'Моё обучение';
  $('#account-logout').onclick = signOut;
  let data = {};
  try {
    data = JSON.parse(localStorage.getItem('unischool-prototype-v1') || '{}');
  } catch {}
  const notice = document.createElement('p');
  const count = [data.firstState, data.secondState].filter(
    (s) => s === 'accepted',
  ).length;
  notice.textContent = teacher
    ? 'Назначенные работы и вопросы учеников доступны в преподавательском кабинете.'
    : count
      ? `Принято работ: ${count}. Комментарии и отметки доступны в учебном кабинете.`
      : 'Здесь появятся новости и результаты проверки письменных работ.';
  const link = document.createElement('a');
  link.href = homeRoute();
  link.textContent = teacher ? 'Открыть работы ↗' : 'Моё обучение ↗';
  link.className = 'text-button';
  $('#account-notice-content').append(notice, link);
  $('#account-support-open').onclick = () => $('#account-support').showModal();
  $('#account-support-close').onclick = () => $('#account-support').close();
  $('#account-support-form').onsubmit = (e) => {
    e.preventDefault();
    const value = $('#account-support-text').value.trim();
    if (!value) return;
    for (const text of [
      value,
      'Это демонстрация. В рабочей версии здесь ответит сотрудник поддержки.',
    ]) {
      const p = document.createElement('p');
      p.textContent = text;
      $('#account-chat-history').append(p);
    }
    $('#account-support-text').value = '';
    $('#account-chat-history').scrollTop = $(
      '#account-chat-history',
    ).scrollHeight;
  };
}
