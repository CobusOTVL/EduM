import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { MockTest, TaskSpec } from '../types';
import { StorageService } from '../utils/storage';
import { calculateMaxPrimary, SUBJECT_PRESETS, getDefaultTasksForSubject } from '../utils/scales';
import { useAuthStore } from './auth';

export const useMockTestsStore = defineStore('mockTests', () => {
  const authStore = useAuthStore();
  const allMockTests = ref<MockTest[]>(StorageService.getMockTests());

  // Пробники текущего авторизованного пользователя
  const mockTests = computed(() => {
    const currentUserId = authStore.user?.id;
    if (!currentUserId) return [];
    return allMockTests.value.filter(
      (t) => t.userId === currentUserId || (!t.userId && currentUserId === 'usr-1')
    );
  });

  function syncTests() {
    StorageService.saveMockTests(allMockTests.value);
  }

  function addMockTest(data: {
    title: string;
    date: string;
    classId: string;
    subject: string;
    academicYear?: string;
    tasks?: TaskSpec[];
    passingScoreSecondary?: number;
  }): MockTest {
    const tasks = data.tasks && data.tasks.length > 0 ? data.tasks : getDefaultTasksForSubject(data.subject);
    const maxPrimary = calculateMaxPrimary(tasks);
    const defaultPassing = SUBJECT_PRESETS[data.subject]?.defaultPassingSecondary || 36;

    const newTest: MockTest = {
      id: 'test-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      userId: authStore.user?.id || 'usr-1',
      title: data.title.trim(),
      date: data.date,
      classId: data.classId,
      subject: data.subject,
      academicYear: data.academicYear || '2025/2026',
      tasks,
      maxPrimaryScore: maxPrimary,
      passingScoreSecondary: data.passingScoreSecondary ?? defaultPassing,
      createdAt: new Date().toISOString(),
    };

    allMockTests.value.unshift(newTest);
    syncTests();
    return newTest;
  }

  function updateMockTest(id: string, data: Partial<Omit<MockTest, 'id' | 'createdAt'>>) {
    const idx = allMockTests.value.findIndex((t) => t.id === id);
    const current = allMockTests.value[idx];
    if (idx !== -1 && current) {
      const tasks = data.tasks ?? current.tasks;
      const maxPrimary = calculateMaxPrimary(tasks);

      allMockTests.value[idx] = {
        ...current,
        ...data,
        tasks,
        maxPrimaryScore: maxPrimary,
      };
      syncTests();
    }
  }

  function deleteMockTest(id: string) {
    allMockTests.value = allMockTests.value.filter((t) => t.id !== id);
    syncTests();
  }

  function getMockTestById(id: string): MockTest | undefined {
    return allMockTests.value.find((t) => t.id === id);
  }

  function getTestsByClass(classId: string): MockTest[] {
    return mockTests.value
      .filter((t) => t.classId === classId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  return {
    mockTests,
    allMockTests,
    addMockTest,
    updateMockTest,
    deleteMockTest,
    getMockTestById,
    getTestsByClass,
  };
});
