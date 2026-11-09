import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { MockTest, TaskSpec } from '../types';
import { StorageService } from '../utils/storage';
import { calculateMaxPrimary, SUBJECT_PRESETS, getDefaultTasksForSubject } from '../utils/scales';

export const useMockTestsStore = defineStore('mockTests', () => {
  const mockTests = ref<MockTest[]>(StorageService.getMockTests());

  function syncTests() {
    StorageService.saveMockTests(mockTests.value);
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

    mockTests.value.unshift(newTest);
    syncTests();
    return newTest;
  }

  function updateMockTest(id: string, data: Partial<Omit<MockTest, 'id' | 'createdAt'>>) {
    const idx = mockTests.value.findIndex((t) => t.id === id);
    const current = mockTests.value[idx];
    if (idx !== -1 && current) {
      const tasks = data.tasks ?? current.tasks;
      const maxPrimary = calculateMaxPrimary(tasks);

      mockTests.value[idx] = {
        ...current,
        ...data,
        tasks,
        maxPrimaryScore: maxPrimary,
      };
      syncTests();
    }
  }

  function deleteMockTest(id: string) {
    mockTests.value = mockTests.value.filter((t) => t.id !== id);
    syncTests();
  }

  function getMockTestById(id: string): MockTest | undefined {
    return mockTests.value.find((t) => t.id === id);
  }

  function getTestsByClass(classId: string): MockTest[] {
    return mockTests.value
      .filter((t) => t.classId === classId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  return {
    mockTests,
    addMockTest,
    updateMockTest,
    deleteMockTest,
    getMockTestById,
    getTestsByClass,
  };
});
