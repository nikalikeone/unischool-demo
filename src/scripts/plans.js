const core = [
  'Все темы по выбранным предметам',
  'Видеоклипы по каждой теме',
  'Тесты по каждой теме',
];
export const plans = [
  {
    id: 1,
    name: 'Юни1',
    subjects: 1,
    monthly: 99,
    daily: 5,
    description: 'Один предмет. Понятное начало.',
    features: core,
  },
  {
    id: 2,
    name: 'Юни2',
    subjects: 2,
    monthly: 149,
    daily: 7,
    description: 'Два предмета в своём темпе.',
    features: core,
  },
  {
    id: 3,
    name: 'Юни3',
    subjects: 3,
    monthly: 199,
    daily: 9,
    description: 'Больше предметов — больше открытий.',
    features: core,
  },
  {
    id: 4,
    name: 'Юни4',
    subjects: 4,
    monthly: 249,
    daily: 12,
    description: 'Четыре предмета в одном месте.',
    features: core,
  },
  {
    id: 5,
    name: 'ЮниBig',
    subjects: 4,
    monthly: 399,
    daily: 19,
    description: 'Разбираемся глубже с видеолекциями.',
    features: [...core, 'Видеолекции по всем темам'],
  },
  {
    id: 6,
    name: 'ЮниBig Pro',
    subjects: 4,
    monthly: 999,
    daily: 149,
    description: 'Видеолекции и конспекты под рукой.',
    features: [
      ...core,
      'Видеолекции по всем темам',
      'Конспекты по каждой теме',
    ],
  },
  {
    id: 7,
    name: 'BigProMax',
    subjects: 4,
    monthly: 5199,
    perLesson: 1399,
    description: 'Учимся вместе с настоящим преподавателем.',
    features: [
      'Все онлайн-занятия по расписанию по 1 предмету',
      'Конспекты к онлайн-занятиям по 1 предмету',
      'Материалы по 3 дополнительным предметам',
      ...core,
      'Видеолекции по всем темам',
      'Проверка письменных работ экспертами',
    ],
  },
];
export const getPlan = (id) => plans.find((plan) => plan.id === Number(id));
export const subjectCountLabel = (count) =>
  count === 1 ? '1 предмет на выбор' : `${count} предмета на выбор`;
