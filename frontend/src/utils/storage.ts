import type { SchoolClass, Student, MockTest, MockTestResultSheet, User } from '../types';
import { getDefaultTasksForSubject, calculateMaxPrimary, convertPrimaryToSecondary } from './scales';

const STORAGE_KEYS = {
  USER: 'mock_app_user',
  TOKEN: 'mock_app_token',
  CLASSES: 'mock_app_classes',
  STUDENTS: 'mock_app_students',
  MOCK_TESTS: 'mock_app_tests',
  RESULTS: 'mock_app_results',
  INITIALIZED: 'mock_app_init_v1',
};

export const defaultUser: User = {
  id: 'usr-1',
  username: 'teacher',
  name: 'Анна Павловна Смирнова',
  email: 'smirnova@school.edu',
};

const defaultClasses: SchoolClass[] = [
  {
    id: 'cls-11a',
    number: 11,
    letter: 'А',
    subject: 'Математика (профиль)',
    description: 'Профильная группа углубленной подготовки к ЕГЭ',
    createdAt: '2026-09-01T09:00:00.000Z',
  },
  {
    id: 'cls-11b',
    number: 11,
    letter: 'Б',
    subject: 'Информатика',
    description: 'ИТ-класс КЕГЭ',
    createdAt: '2026-09-01T09:00:00.000Z',
  },
  {
    id: 'cls-10a',
    number: 10,
    letter: 'А',
    subject: 'Физика',
    description: 'Инженерный профиль',
    createdAt: '2026-09-02T10:00:00.000Z',
  },
];

const defaultStudents: Student[] = [
  { id: 'std-1', classId: 'cls-11a', fullName: 'Алексеев Максим Дмитриевич', createdAt: '2026-09-01' },
  { id: 'std-2', classId: 'cls-11a', fullName: 'Богданова Дарья Сергеевна', createdAt: '2026-09-01' },
  { id: 'std-3', classId: 'cls-11a', fullName: 'Васильев Артем Игоревич', createdAt: '2026-09-01' },
  { id: 'std-4', classId: 'cls-11a', fullName: 'Григорьева Екатерина Павловна', createdAt: '2026-09-01' },
  { id: 'std-5', classId: 'cls-11a', fullName: 'Дмитриев Роман Олегович', createdAt: '2026-09-01' },
  { id: 'std-6', classId: 'cls-11a', fullName: 'Егорова София Александровна', createdAt: '2026-09-01' },
  { id: 'std-7', classId: 'cls-11a', fullName: 'Жуков Кирилл Андреевич', createdAt: '2026-09-01' },
  { id: 'std-8', classId: 'cls-11a', fullName: 'Иванова Полина Денисовна', createdAt: '2026-09-01' },

  { id: 'std-9', classId: 'cls-11b', fullName: 'Ковалев Даниил Романович', createdAt: '2026-09-01' },
  { id: 'std-10', classId: 'cls-11b', fullName: 'Морозов Никита Евгеньевич', createdAt: '2026-09-01' },
  { id: 'std-11', classId: 'cls-11b', fullName: 'Новикова Алина Максимовна', createdAt: '2026-09-01' },
  { id: 'std-12', classId: 'cls-11b', fullName: 'Павлов Владислав Викторович', createdAt: '2026-09-01' },

  { id: 'std-13', classId: 'cls-10a', fullName: 'Семенов Илья Владимирович', createdAt: '2026-09-02' },
  { id: 'std-14', classId: 'cls-10a', fullName: 'Федорова Мария Артемовна', createdAt: '2026-09-02' },
];

const mathTasks = getDefaultTasksForSubject('Математика (профиль)');
const mathMax = calculateMaxPrimary(mathTasks);

const defaultMockTests: MockTest[] = [
  {
    id: 'test-1',
    title: 'СтатГрад №1 (Входной срез)',
    date: '2026-09-24',
    classId: 'cls-11a',
    subject: 'Математика (профиль)',
    academicYear: '2025/2026',
    tasks: mathTasks,
    maxPrimaryScore: mathMax,
    passingScoreSecondary: 27,
    createdAt: '2026-09-20T10:00:00.000Z',
  },
  {
    id: 'test-2',
    title: 'Тренировочный пробник №2 (Октябрь)',
    date: '2026-10-22',
    classId: 'cls-11a',
    subject: 'Математика (профиль)',
    academicYear: '2025/2026',
    tasks: mathTasks,
    maxPrimaryScore: mathMax,
    passingScoreSecondary: 27,
    createdAt: '2026-10-18T10:00:00.000Z',
  },
  {
    id: 'test-3',
    title: 'КЕГЭ Диагностика №1',
    date: '2026-10-15',
    classId: 'cls-11b',
    subject: 'Информатика',
    academicYear: '2025/2026',
    tasks: getDefaultTasksForSubject('Информатика'),
    maxPrimaryScore: calculateMaxPrimary(getDefaultTasksForSubject('Информатика')),
    passingScoreSecondary: 40,
    createdAt: '2026-10-10T10:00:00.000Z',
  },
];

// Генерация начальных результатов для первых двух пробников
function generateSeedResults(): MockTestResultSheet[] {
  // Test 1 results
  const test1Scores: Record<string, any> = {};
  const studentPoints1: Record<string, number[]> = {
    'std-1': [1,1,1,1,1,1,1,1,1,1,1,1, 2, 1, 2, 0, 0, 0, 0], // 17 перв -> 80 вт
    'std-2': [1,1,1,1,1,0,1,1,1,1,1,1, 1, 0, 1, 0, 0, 0, 0], // 13 перв -> 72 вт
    'std-3': [1,1,1,1,1,1,1,1,1,1,1,1, 2, 2, 2, 2, 3, 2, 0], // 24 перв -> 94 вт
    'std-4': [1,1,1,1,0,0,1,1,1,0,1,0, 0, 0, 0, 0, 0, 0, 0], // 8 перв -> 46 вт
    'std-5': [1,1,1,1,1,1,1,1,1,1,1,1, 2, 1, 2, 1, 1, 0, 0], // 18 перв -> 82 вт
    'std-6': [1,1,1,0,1,0,1,1,0,0,0,0, 0, 0, 0, 0, 0, 0, 0], // 6 перв -> 34 вт
    'std-7': [1,1,1,1,1,1,1,1,1,1,1,1, 2, 2, 2, 1, 2, 1, 0], // 21 перв -> 88 вт
    'std-8': [1,1,1,1,1,1,1,1,1,1,0,1, 1, 0, 1, 0, 0, 0, 0], // 12 перв -> 70 вт
  };

  for (const [sId, arr] of Object.entries(studentPoints1)) {
    const scoresMap: Record<number, number> = {};
    let prim = 0;
    arr.forEach((pt, idx) => {
      scoresMap[idx + 1] = pt;
      prim += pt;
    });
    const sec = convertPrimaryToSecondary(prim, mathMax, 'Математика (профиль)');
    test1Scores[sId] = {
      studentId: sId,
      scores: scoresMap,
      primaryScore: prim,
      secondaryScore: sec,
    };
  }

  // Test 2 results (ученики улучшили результаты)
  const test2Scores: Record<string, any> = {};
  const studentPoints2: Record<string, number[]> = {
    'std-1': [1,1,1,1,1,1,1,1,1,1,1,1, 2, 2, 2, 1, 1, 0, 0], // 19 перв -> 84 вт
    'std-2': [1,1,1,1,1,1,1,1,1,1,1,1, 2, 1, 2, 0, 0, 0, 0], // 17 перв -> 80 вт
    'std-3': [1,1,1,1,1,1,1,1,1,1,1,1, 2, 3, 2, 3, 3, 3, 1], // 28 перв -> 98 вт
    'std-4': [1,1,1,1,1,0,1,1,1,1,1,0, 1, 0, 1, 0, 0, 0, 0], // 11 перв -> 64 вт
    'std-5': [1,1,1,1,1,1,1,1,1,1,1,1, 2, 2, 2, 2, 2, 0, 0], // 21 перв -> 88 вт
    'std-6': [1,1,1,1,1,0,1,1,1,0,1,0, 1, 0, 0, 0, 0, 0, 0], // 9 перв -> 52 вт
    'std-7': [1,1,1,1,1,1,1,1,1,1,1,1, 2, 2, 2, 2, 3, 2, 0], // 24 перв -> 94 вт
    'std-8': [1,1,1,1,1,1,1,1,1,1,1,1, 2, 1, 2, 0, 0, 0, 0], // 17 перв -> 80 вт
  };

  for (const [sId, arr] of Object.entries(studentPoints2)) {
    const scoresMap: Record<number, number> = {};
    let prim = 0;
    arr.forEach((pt, idx) => {
      scoresMap[idx + 1] = pt;
      prim += pt;
    });
    const sec = convertPrimaryToSecondary(prim, mathMax, 'Математика (профиль)');
    test2Scores[sId] = {
      studentId: sId,
      scores: scoresMap,
      primaryScore: prim,
      secondaryScore: sec,
    };
  }

  return [
    {
      id: 'res-sheet-1',
      mockTestId: 'test-1',
      studentScores: test1Scores,
      updatedAt: '2026-09-25T14:30:00.000Z',
    },
    {
      id: 'res-sheet-2',
      mockTestId: 'test-2',
      studentScores: test2Scores,
      updatedAt: '2026-10-23T15:10:00.000Z',
    },
  ];
}

export function initLocalStorage(): void {
  if (typeof window === 'undefined') return;

  const initialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (!initialized) {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(defaultClasses));
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(defaultStudents));
    localStorage.setItem(STORAGE_KEYS.MOCK_TESTS, JSON.stringify(defaultMockTests));
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(generateSeedResults()));
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(defaultUser));
    localStorage.setItem(STORAGE_KEYS.TOKEN, 'mock-jwt-token-ey123456');
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }
}

export const StorageService = {
  getClasses(): SchoolClass[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CLASSES);
    return raw ? JSON.parse(raw) : [];
  },
  saveClasses(classes: SchoolClass[]): void {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  },

  getStudents(): Student[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    return raw ? JSON.parse(raw) : [];
  },
  saveStudents(students: Student[]): void {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  },

  getMockTests(): MockTest[] {
    const raw = localStorage.getItem(STORAGE_KEYS.MOCK_TESTS);
    return raw ? JSON.parse(raw) : [];
  },
  saveMockTests(tests: MockTest[]): void {
    localStorage.setItem(STORAGE_KEYS.MOCK_TESTS, JSON.stringify(tests));
  },

  getResults(): MockTestResultSheet[] {
    const raw = localStorage.getItem(STORAGE_KEYS.RESULTS);
    return raw ? JSON.parse(raw) : [];
  },
  saveResults(results: MockTestResultSheet[]): void {
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
  },

  getUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  },
  saveUser(user: User | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  },

  getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  },
  saveToken(token: string | null): void {
    if (token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    } else {
      localStorage.removeItem(STORAGE_KEYS.TOKEN);
    }
  },
};
