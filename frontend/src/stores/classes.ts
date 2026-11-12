import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { SchoolClass, Student } from '../types';
import { StorageService } from '../utils/storage';
import { useAuthStore } from './auth';

export const useClassesStore = defineStore('classes', () => {
  const authStore = useAuthStore();
  const allClasses = ref<SchoolClass[]>(StorageService.getClasses());
  const allStudents = ref<Student[]>(StorageService.getStudents());

  // Классы, принадлежащие текущему авторизованному пользователю
  const classes = computed(() => {
    const currentUserId = authStore.user?.id;
    if (!currentUserId) return [];
    return allClasses.value.filter(
      (c) => c.userId === currentUserId || (!c.userId && currentUserId === 'usr-1')
    );
  });

  // Ученики, принадлежащие текущему пользователю
  const students = computed(() => {
    const currentUserId = authStore.user?.id;
    if (!currentUserId) return [];
    const userClassIds = new Set(classes.value.map((c) => c.id));
    return allStudents.value.filter((s) => userClassIds.has(s.classId));
  });

  function syncClasses() {
    StorageService.saveClasses(allClasses.value);
  }

  function syncStudents() {
    StorageService.saveStudents(allStudents.value);
  }

  function addClass(data: { number: number; letter: string; subject: string; description?: string }): SchoolClass {
    const newClass: SchoolClass = {
      id: 'cls-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      userId: authStore.user?.id || 'usr-1',
      number: Number(data.number),
      letter: data.letter.toUpperCase().trim(),
      subject: data.subject.trim(),
      description: data.description?.trim() || '',
      createdAt: new Date().toISOString(),
    };
    allClasses.value.unshift(newClass);
    syncClasses();
    return newClass;
  }

  function updateClass(id: string, data: Partial<Omit<SchoolClass, 'id' | 'createdAt'>>) {
    const idx = allClasses.value.findIndex((c) => c.id === id);
    const existing = allClasses.value[idx];
    if (idx !== -1 && existing) {
      allClasses.value[idx] = {
        ...existing,
        ...data,
        letter: data.letter ? data.letter.toUpperCase().trim() : existing.letter,
      };
      syncClasses();
    }
  }

  function deleteClass(id: string) {
    allClasses.value = allClasses.value.filter((c) => c.id !== id);
    allStudents.value = allStudents.value.filter((s) => s.classId !== id);
    syncClasses();
    syncStudents();
  }

  function getClassById(id: string): SchoolClass | undefined {
    return allClasses.value.find((c) => c.id === id);
  }

  function getStudentsByClass(classId: string): Student[] {
    return allStudents.value
      .filter((s) => s.classId === classId)
      .sort((a, b) => a.fullName.localeCompare(b.fullName, 'ru'));
  }

  function addStudent(classId: string, fullName: string): Student {
    const trimmed = fullName.trim();
    if (!trimmed) throw new Error('ФИО ученика не может быть пустым');

    const newStudent: Student = {
      id: 'std-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      userId: authStore.user?.id || 'usr-1',
      classId,
      fullName: trimmed,
      createdAt: new Date().toISOString(),
    };
    allStudents.value.push(newStudent);
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
    allStudents.value = allStudents.value.filter((s) => s.id !== studentId);
    syncStudents();
  }

  function updateStudent(studentId: string, fullName: string) {
    const student = allStudents.value.find((s) => s.id === studentId);
    if (student) {
      student.fullName = fullName.trim();
      syncStudents();
    }
  }

  return {
    classes,
    students,
    allClasses,
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
