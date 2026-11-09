import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { MockTestResultSheet, StudentTaskScore, ClassAnalyticsSummary, MockTest } from '../types';
import { StorageService } from '../utils/storage';
import { useMockTestsStore } from './mockTests';
import { useClassesStore } from './classes';
import { convertPrimaryToSecondary } from '../utils/scales';

export const useResultsStore = defineStore('results', () => {
  const resultSheets = ref<MockTestResultSheet[]>(StorageService.getResults());

  function syncResults() {
    StorageService.saveResults(resultSheets.value);
  }

  function getSheetByMockTestId(mockTestId: string): MockTestResultSheet {
    let sheet = resultSheets.value.find((r) => r.mockTestId === mockTestId);
    if (!sheet) {
      sheet = {
        id: 'sheet-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        mockTestId,
        studentScores: {},
        updatedAt: new Date().toISOString(),
      };
      resultSheets.value.push(sheet);
      syncResults();
    }
    return sheet;
  }

  function saveSheet(sheet: MockTestResultSheet) {
    sheet.updatedAt = new Date().toISOString();
    const idx = resultSheets.value.findIndex((s) => s.mockTestId === sheet.mockTestId);
    if (idx !== -1) {
      resultSheets.value[idx] = { ...sheet };
    } else {
      resultSheets.value.push({ ...sheet });
    }
    syncResults();
  }

  function saveStudentScores(
    mockTestId: string,
    studentId: string,
    scores: Record<number, number>,
    subject: string,
    maxPrimary: number
  ): StudentTaskScore {
    const sheet = getSheetByMockTestId(mockTestId);
    let primary = 0;
    for (const val of Object.values(scores)) {
      primary += Number(val) || 0;
    }
    const secondary = convertPrimaryToSecondary(primary, maxPrimary, subject);

    const record: StudentTaskScore = {
      studentId,
      scores: { ...scores },
      primaryScore: primary,
      secondaryScore: secondary,
    };

    sheet.studentScores[studentId] = record;
    saveSheet(sheet);
    return record;
  }

  function getClassAnalytics(
    classId: string,
    mockTestId?: string,
    customPassingThreshold?: number
  ): ClassAnalyticsSummary | null {
    const classesStore = useClassesStore();
    const testsStore = useMockTestsStore();

    const students = classesStore.getStudentsByClass(classId);
    if (students.length === 0) return null;

    let targetTest: MockTest | undefined = mockTestId ? testsStore.getMockTestById(mockTestId) : undefined;
    if (!targetTest) {
      const classTests = testsStore.getTestsByClass(classId);
      if (classTests.length === 0) return null;
      targetTest = classTests[0];
    }
    if (!targetTest) return null;

    const sheet = resultSheets.value.find((s) => s.mockTestId === targetTest.id);
    const passingThreshold = customPassingThreshold ?? targetTest.passingScoreSecondary ?? 36;

    const scoresList: StudentTaskScore[] = [];
    for (const std of students) {
      const scoreItem = sheet?.studentScores[std.id];
      if (scoreItem) {
        scoresList.push(scoreItem);
      }
    }

    const totalStudents = students.length;
    const attendedStudents = scoresList.length;

    if (attendedStudents === 0) {
      return {
        totalStudents,
        attendedStudents: 0,
        avgPrimary: 0,
        avgSecondary: 0,
        maxSecondary: 0,
        minSecondary: 0,
        passingThreshold,
        passedCount: 0,
        passedPercent: 0,
        highAchieversCount: 0,
        highAchieversPercent: 0,
        scoreDistribution: [
          { range: '0–39', count: 0, percent: 0 },
          { range: '40–59', count: 0, percent: 0 },
          { range: '60–79', count: 0, percent: 0 },
          { range: '80–100', count: 0, percent: 0 },
        ],
        taskSolvability: targetTest.tasks.map((t) => ({
          taskNumber: t.taskNumber,
          maxScore: t.maxScore,
          avgScore: 0,
          percent: 0,
        })),
      };
    }

    const sumPrimary = scoresList.reduce((acc, s) => acc + s.primaryScore, 0);
    const sumSecondary = scoresList.reduce((acc, s) => acc + s.secondaryScore, 0);
    const secondaryValues = scoresList.map((s) => s.secondaryScore);

    const avgPrimary = Math.round((sumPrimary / attendedStudents) * 10) / 10;
    const avgSecondary = Math.round((sumSecondary / attendedStudents) * 10) / 10;
    const maxSecondary = Math.max(...secondaryValues);
    const minSecondary = Math.min(...secondaryValues);

    const passedCount = scoresList.filter((s) => s.secondaryScore >= passingThreshold).length;
    const passedPercent = Math.round((passedCount / attendedStudents) * 100);

    const highAchieversCount = scoresList.filter((s) => s.secondaryScore >= 80).length;
    const highAchieversPercent = Math.round((highAchieversCount / attendedStudents) * 100);

    // Распределение баллов
    const distBuckets = {
      '0–39': 0,
      '40–59': 0,
      '60–79': 0,
      '80–100': 0,
    };
    for (const sc of scoresList) {
      const v = sc.secondaryScore;
      if (v < 40) distBuckets['0–39']++;
      else if (v < 60) distBuckets['40–59']++;
      else if (v < 80) distBuckets['60–79']++;
      else distBuckets['80–100']++;
    }

    const scoreDistribution = Object.entries(distBuckets).map(([range, count]) => ({
      range,
      count,
      percent: Math.round((count / attendedStudents) * 100),
    }));

    // Решаемость каждого задания
    const taskSolvability = targetTest.tasks.map((task) => {
      let sumTask = 0;
      for (const sc of scoresList) {
        sumTask += Number(sc.scores[task.taskNumber]) || 0;
      }
      const avgTask = Math.round((sumTask / attendedStudents) * 100) / 100;
      const maxPossible = task.maxScore * attendedStudents;
      const percent = maxPossible > 0 ? Math.round((sumTask / maxPossible) * 100) : 0;
      return {
        taskNumber: task.taskNumber,
        maxScore: task.maxScore,
        avgScore: avgTask,
        percent,
      };
    });

    return {
      totalStudents,
      attendedStudents,
      avgPrimary,
      avgSecondary,
      maxSecondary,
      minSecondary,
      passingThreshold,
      passedCount,
      passedPercent,
      highAchieversCount,
      highAchieversPercent,
      scoreDistribution,
      taskSolvability,
    };
  }

  function getStudentHistory(studentId: string) {
    const testsStore = useMockTestsStore();
    const history: Array<{
      testId: string;
      title: string;
      date: string;
      subject: string;
      primaryScore: number;
      secondaryScore: number;
      maxPrimaryScore: number;
      scores: Record<number, number>;
    }> = [];

    for (const sheet of resultSheets.value) {
      const studentScore = sheet.studentScores[studentId];
      if (studentScore) {
        const test = testsStore.getMockTestById(sheet.mockTestId);
        if (test) {
          history.push({
            testId: test.id,
            title: test.title,
            date: test.date,
            subject: test.subject,
            primaryScore: studentScore.primaryScore,
            secondaryScore: studentScore.secondaryScore,
            maxPrimaryScore: test.maxPrimaryScore,
            scores: studentScore.scores,
          });
        }
      }
    }

    return history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  return {
    resultSheets,
    getSheetByMockTestId,
    saveSheet,
    saveStudentScores,
    getClassAnalytics,
    getStudentHistory,
  };
});
