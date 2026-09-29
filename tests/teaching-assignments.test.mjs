import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canTeach,
  assignedTeacher,
} from '../src/scripts/teaching-assignments.js';
test('demo teacher can review assigned student in assigned subject', () => {
  assert.equal(canTeach('teacher-demo', 'math-7', 'alexandra-demo'), true);
  assert.equal(
    assignedTeacher('math-7', 'alexandra-demo').name,
    'Елена Андреевна',
  );
});
test('other teachers, subjects, classes and students are outside assignment', () => {
  for (const args of [
    ['other', 'math-7', 'alexandra-demo'],
    ['teacher-demo', 'russian-7', 'alexandra-demo'],
    ['teacher-demo', 'math-8', 'alexandra-demo'],
    ['teacher-demo', 'math-7', 'other'],
    [null, 'math-7', 'alexandra-demo'],
  ])
    assert.equal(canTeach(...args), false);
  assert.equal(assignedTeacher('russian-7', 'alexandra-demo'), null);
});
test('a teacher can be assigned to several students for a subject', () => {
  const assignments = [
    {
      teacherId: 'teacher-a',
      subjectId: 'math-7',
      studentIds: ['student-a', 'student-b'],
    },
  ];
  assert.equal(canTeach('teacher-a', 'math-7', 'student-a', assignments), true);
  assert.equal(canTeach('teacher-a', 'math-7', 'student-b', assignments), true);
  assert.equal(
    canTeach('teacher-a', 'math-7', 'student-c', assignments),
    false,
  );
  assert.equal(
    canTeach('teacher-a', 'history-7', 'student-b', assignments),
    false,
  );
});
test('each subject/student pairing is checked together, not independently', () => {
  const assignments = [
    { teacherId: 'teacher-a', subjectId: 'math-7', studentIds: ['student-a'] },
    {
      teacherId: 'teacher-a',
      subjectId: 'russian-7',
      studentIds: ['student-b'],
    },
  ];
  assert.equal(
    canTeach('teacher-a', 'math-7', 'student-b', assignments),
    false,
  );
});
