import type { TaskSpec } from '../types';

export interface SubjectPreset {
  name: string;
  defaultTasks: TaskSpec[];
  defaultPassingSecondary: number;
  conversionTable: Record<number, number>;
}

// Таблица перевода ЕГЭ Профильная математика (шкала ФИПИ)
const mathProfConversion: Record<number, number> = {
  0: 0, 1: 6, 2: 11, 3: 17, 4: 22, 5: 27, 6: 34, 7: 40, 8: 46, 9: 52,
  10: 58, 11: 64, 12: 70, 13: 72, 14: 74, 15: 76, 16: 78, 17: 80, 18: 82, 19: 84,
  20: 86, 21: 88, 22: 90, 23: 92, 24: 94, 25: 95, 26: 96, 27: 97, 28: 98, 29: 99,
  30: 100, 31: 100, 32: 100,
};

// Задания профильной математики (19 заданий, сумма = 32)
const mathProfTasks: TaskSpec[] = [
  { taskNumber: 1, maxScore: 1 },
  { taskNumber: 2, maxScore: 1 },
  { taskNumber: 3, maxScore: 1 },
  { taskNumber: 4, maxScore: 1 },
  { taskNumber: 5, maxScore: 1 },
  { taskNumber: 6, maxScore: 1 },
  { taskNumber: 7, maxScore: 1 },
  { taskNumber: 8, maxScore: 1 },
  { taskNumber: 9, maxScore: 1 },
  { taskNumber: 10, maxScore: 1 },
  { taskNumber: 11, maxScore: 1 },
  { taskNumber: 12, maxScore: 1 },
  { taskNumber: 13, maxScore: 2 },
  { taskNumber: 14, maxScore: 3 },
  { taskNumber: 15, maxScore: 2 },
  { taskNumber: 16, maxScore: 3 },
  { taskNumber: 17, maxScore: 4 },
  { taskNumber: 18, maxScore: 4 },
  { taskNumber: 19, maxScore: 4 },
];

// Таблица перевода ЕГЭ Русский язык (шкала ФИПИ, макс 50 перв.)
const russianConversion: Record<number, number> = {
  0: 0, 1: 3, 2: 5, 3: 8, 4: 10, 5: 13, 6: 15, 7: 18, 8: 20, 9: 23,
  10: 25, 11: 28, 12: 30, 13: 33, 14: 35, 15: 38, 16: 40, 17: 42, 18: 44, 19: 46,
  20: 48, 21: 50, 22: 52, 23: 54, 24: 56, 25: 58, 26: 60, 27: 61, 28: 63, 29: 64,
  30: 66, 31: 67, 32: 69, 33: 70, 34: 72, 35: 73, 36: 75, 37: 77, 38: 79, 39: 81,
  40: 83, 41: 85, 42: 87, 43: 89, 44: 91, 45: 94, 46: 97, 47: 100, 48: 100, 49: 100, 50: 100,
};

// Задания русского языка (27 заданий, макс 50)
const russianTasks: TaskSpec[] = [
  ...Array.from({ length: 7 }, (_, i) => ({ taskNumber: i + 1, maxScore: 1 })),
  { taskNumber: 8, maxScore: 2 },
  ...Array.from({ length: 17 }, (_, i) => ({ taskNumber: i + 9, maxScore: 1 })),
  { taskNumber: 26, maxScore: 3 },
  { taskNumber: 27, maxScore: 21 }, // сочинение
];

// Таблица перевода Информатика (29 перв. -> 100)
const informaticsConversion: Record<number, number> = {
  0: 0, 1: 6, 2: 12, 3: 17, 4: 23, 5: 28, 6: 34, 7: 40, 8: 44, 9: 48,
  10: 52, 11: 55, 12: 59, 13: 63, 14: 67, 15: 70, 16: 74, 17: 78, 18: 80, 19: 83,
  20: 85, 21: 88, 22: 90, 23: 93, 24: 95, 25: 98, 26: 100, 27: 100, 28: 100, 29: 100,
};

// Задания по информатике (27 заданий)
const informaticsTasks: TaskSpec[] = [
  ...Array.from({ length: 25 }, (_, i) => ({ taskNumber: i + 1, maxScore: 1 })),
  { taskNumber: 26, maxScore: 2 },
  { taskNumber: 27, maxScore: 2 },
];

// Таблица перевода Физика (45 перв. -> 100)
const physicsConversion: Record<number, number> = {
  0: 0, 1: 4, 2: 8, 3: 11, 4: 15, 5: 19, 6: 22, 7: 26, 8: 30, 9: 33,
  10: 36, 11: 38, 12: 40, 13: 42, 14: 44, 15: 46, 16: 48, 17: 50, 18: 52, 19: 54,
  20: 56, 21: 58, 22: 60, 23: 62, 24: 64, 25: 66, 26: 68, 27: 70, 28: 72, 29: 74,
  30: 76, 31: 78, 32: 80, 33: 82, 34: 84, 35: 86, 36: 88, 37: 90, 38: 92, 39: 94,
  40: 96, 41: 98, 42: 100, 43: 100, 44: 100, 45: 100,
};

// Задания по физике (26 заданий)
const physicsTasks: TaskSpec[] = [
  ...Array.from({ length: 20 }, (_, i) => ({ taskNumber: i + 1, maxScore: (i === 1 || i === 5 || i === 11 || i === 16 ? 2 : 1) })),
  { taskNumber: 21, maxScore: 3 },
  { taskNumber: 22, maxScore: 2 },
  { taskNumber: 23, maxScore: 3 },
  { taskNumber: 24, maxScore: 3 },
  { taskNumber: 25, maxScore: 3 },
  { taskNumber: 26, maxScore: 4 },
];

// Таблица перевода Обществознание (58 перв. -> 100)
const socialConversion: Record<number, number> = {
  0: 0, 1: 3, 2: 5, 3: 8, 4: 10, 5: 13, 6: 15, 7: 18, 8: 20, 9: 22,
  10: 25, 11: 27, 12: 30, 13: 32, 14: 34, 15: 37, 16: 39, 17: 42, 18: 44, 19: 46,
  20: 48, 21: 50, 22: 52, 23: 54, 24: 55, 25: 57, 26: 58, 27: 60, 28: 61, 29: 63,
  30: 64, 31: 66, 32: 67, 33: 69, 34: 70, 35: 72, 36: 73, 37: 75, 38: 77, 39: 79,
  40: 81, 41: 83, 42: 85, 43: 88, 44: 90, 45: 92, 46: 94, 47: 96, 48: 98, 49: 100,
  50: 100, 51: 100, 52: 100, 53: 100, 54: 100, 55: 100, 56: 100, 57: 100, 58: 100,
};

const socialTasks: TaskSpec[] = [
  ...Array.from({ length: 16 }, (_, i) => ({ taskNumber: i + 1, maxScore: 2 })),
  { taskNumber: 17, maxScore: 2 },
  { taskNumber: 18, maxScore: 2 },
  { taskNumber: 19, maxScore: 3 },
  { taskNumber: 20, maxScore: 3 },
  { taskNumber: 21, maxScore: 3 },
  { taskNumber: 22, maxScore: 4 },
  { taskNumber: 23, maxScore: 3 },
  { taskNumber: 24, maxScore: 4 },
  { taskNumber: 25, maxScore: 6 },
];

export const SUBJECT_PRESETS: Record<string, SubjectPreset> = {
  'Математика (профиль)': {
    name: 'Математика (профиль)',
    defaultTasks: mathProfTasks,
    defaultPassingSecondary: 27,
    conversionTable: mathProfConversion,
  },
  'Русский язык': {
    name: 'Русский язык',
    defaultTasks: russianTasks,
    defaultPassingSecondary: 36,
    conversionTable: russianConversion,
  },
  'Информатика': {
    name: 'Информатика',
    defaultTasks: informaticsTasks,
    defaultPassingSecondary: 40,
    conversionTable: informaticsConversion,
  },
  'Физика': {
    name: 'Физика',
    defaultTasks: physicsTasks,
    defaultPassingSecondary: 36,
    conversionTable: physicsConversion,
  },
  'Обществознание': {
    name: 'Обществознание',
    defaultTasks: socialTasks,
    defaultPassingSecondary: 42,
    conversionTable: socialConversion,
  },
  'Биология': {
    name: 'Биология',
    defaultTasks: Array.from({ length: 28 }, (_, i) => ({ taskNumber: i + 1, maxScore: i < 21 ? 1 : 3 })),
    defaultPassingSecondary: 36,
    conversionTable: {},
  },
  'Химия': {
    name: 'Химия',
    defaultTasks: Array.from({ length: 34 }, (_, i) => ({ taskNumber: i + 1, maxScore: i < 28 ? 1 : 3 })),
    defaultPassingSecondary: 36,
    conversionTable: {},
  },
  'История': {
    name: 'История',
    defaultTasks: Array.from({ length: 21 }, (_, i) => ({ taskNumber: i + 1, maxScore: i < 12 ? 1 : 3 })),
    defaultPassingSecondary: 32,
    conversionTable: {},
  },
  'Английский язык': {
    name: 'Английский язык',
    defaultTasks: Array.from({ length: 38 }, (_, i) => ({ taskNumber: i + 1, maxScore: 1 })),
    defaultPassingSecondary: 22,
    conversionTable: {},
  },
};

export const AVAILABLE_SUBJECTS = Object.keys(SUBJECT_PRESETS);

/**
 * Переводит первичный балл во вторичный для заданного предмета.
 * Если таблица перевода задана, берется из нее.
 * В противном случае используется пропорциональный пересчет в 100-балльную шкалу.
 */
export function convertPrimaryToSecondary(
  primaryScore: number,
  maxPrimaryScore: number,
  subjectName: string
): number {
  if (primaryScore <= 0) return 0;
  if (primaryScore >= maxPrimaryScore && maxPrimaryScore > 0) return 100;

  const preset = SUBJECT_PRESETS[subjectName];
  if (preset && preset.conversionTable && Object.keys(preset.conversionTable).length > 0) {
    if (preset.conversionTable[primaryScore] !== undefined) {
      return preset.conversionTable[primaryScore];
    }
  }

  // Пропорциональный расчет по умолчанию
  if (maxPrimaryScore <= 0) return 0;
  const ratio = Math.min(1, Math.max(0, primaryScore / maxPrimaryScore));
  return Math.round(ratio * 100);
}

export function getDefaultTasksForSubject(subjectName: string): TaskSpec[] {
  const preset = SUBJECT_PRESETS[subjectName];
  if (preset) {
    return JSON.parse(JSON.stringify(preset.defaultTasks));
  }
  // По умолчанию 10 заданий по 1 баллу
  return Array.from({ length: 10 }, (_, i) => ({ taskNumber: i + 1, maxScore: 1 }));
}

export function calculateMaxPrimary(tasks: TaskSpec[]): number {
  return tasks.reduce((sum, t) => sum + (Number(t.maxScore) || 0), 0);
}
