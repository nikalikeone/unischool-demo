// Demo configuration, not server-side authorization. One assignment links
// a teacher to a subject (including its class) and one or more students.
export const demoCourse = Object.freeze({
  subjectId: 'math-7',
  studentId: 'alexandra-demo',
});
export const teachers = Object.freeze({
  'teacher-demo': Object.freeze({ name: 'Елена Андреевна', initials: 'ЕА' }),
});
export const teachingAssignments = Object.freeze([
  Object.freeze({
    teacherId: 'teacher-demo',
    subjectId: 'math-7',
    subjectName: 'Математика',
    grade: 7,
    studentIds: Object.freeze(['alexandra-demo']),
  }),
]);
export function canTeach(
  teacherId,
  subjectId,
  studentId,
  assignments = teachingAssignments,
) {
  if (!teacherId || !subjectId || !studentId) return false;
  return assignments.some(
    (a) =>
      a.teacherId === teacherId &&
      a.subjectId === subjectId &&
      a.studentIds.includes(studentId),
  );
}
export function assignedTeacher(subjectId, studentId) {
  const assignment = teachingAssignments.find(
    (a) => a.subjectId === subjectId && a.studentIds.includes(studentId),
  );
  return assignment ? teachers[assignment.teacherId] : null;
}
