import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { SchoolClass, Student } from '../types';
import { StorageService } from '../utils/storage';

export const useClassesStore = defineStore('classes', () => {
  const classes = ref<SchoolClass[]>(StorageService.getClasses());
  const students = ref<Student[]>(StorageService.getStudents());

  function syncClasses() {
    StorageService.saveClasses(classes.value);
  }

  function syncStudents() {
    StorageService.saveStudents(students.value);
  }

  function addClass(data: { number: number; letter: string; subject: string; description?: string }): SchoolClass {
    const newClass: SchoolClass = {
      id: 'cls-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      number: Number(data.number),
      letter: data.letter.toUpperCase().trim(),
      subject: data.subject.trim(),
      description: data.description?.trim() || '',
      createdAt: new Date().toISOString(),
    };
    classes.value.unshift(newClass);
    syncClasses();
    return newClass;
  }

  function updateClass(id: string, data: Partial<Omit<SchoolClass, 'id' | 'createdAt'>>) {
    const idx = classes.value.findIndex((c) => c.id === id);
    const existing = classes.value[idx];
    if (idx !== -1 && existing) {
      classes.value[idx] = {
        ...existing,
        ...data,
        letter: data.letter ? data.letter.toUpperCase().trim() : existing.letter,
      };
      syncClasses();
    }
  }

  function deleteClass(id: string) {
    classes.value = classes.value.filter((c) => c.id !== id);
    students.value = students.value.filter((s) => s.classId !== id);
    syncClasses();
    syncStudents();
  }

  function getClassById(id: string): SchoolClass | undefined {
    return classes.value.find((c) => c.id === id);
  }

  function getStudentsByClass(classId: string): Student[] {
    return students.value
      .filter((s) => s.classId === classId)
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'));
  }

  function addStudent(classId: string, fullName: string): Student {
    const trimmed = fullName.trim();
    if (!trimmed) throw new Error('ФИО ученика не может быть пустым');

    const newStudent: Student = {
      id: 'std-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      classId,
      fullName: trimmed,
      createdAt: new Date().toISOString(),
    };
    students.value.push(newStudent);
    syncStudents();
    return newStudent;
  }

  function addStudentsBatch(classId: string, rawText: string): number {
    const lines = rawText
      .split('\n')
      .map((l) => l.trim().replace(/^\d+[\.\)\s]+/, ''))
      .filter((l) => l.length > 0);

    let count = 0;
    for (const name of lines) {
      addStudent(classId, name);
      count++;
    }
    return count;
  }

  function removeStudent(studentId: string) {
    students.value = students.value.filter((s) => s.id !== studentId);
    syncStudents();
  }

  function updateStudent(studentId: string, fullName: string) {
    const student = students.value.find((s) => s.id === studentId);
    if (student) {
      student.fullName = fullName.trim();
      syncStudents();
    }
  }

  return {
    classes,
    students,
    addClass,
    updateClass,
    deleteClass,
    getClassById,
    getStudentsByClass,
    addStudent,
    addStudentsBatch,
    removeStudent,
    updateStudent,
  };
});
