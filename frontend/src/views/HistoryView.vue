<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useClassesStore } from '../stores/classes';
import { useMockTestsStore } from '../stores/mockTests';
import { useResultsStore } from '../stores/results';
import type { Student } from '../types';
import {
  History,
  Users,
  UserCheck,
  Calendar,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet
} from 'lucide-vue-next';

const classesStore = useClassesStore();
const mockTestsStore = useMockTestsStore();
const resultsStore = useResultsStore();

type ViewMode = 'classes' | 'students';
const currentTab = ref<ViewMode>('classes');

// Выбранный класс
const selectedClassId = ref<string>('');
// Выбранный ученик (для режима 'students')
const selectedStudentId = ref<string>('');
// Развернутые детали заданий по тестам
const expandedTestIds = ref<Record<string, boolean>>({});

onMounted(() => {
  if (classesStore.classes.length > 0 && classesStore.classes[0]) {
    selectedClassId.value = classesStore.classes[0].id;
  }
});

// Ученики выбранного класса
const classStudents = computed<Student[]>(() => {
  if (!selectedClassId.value) return [];
  return classesStore.getStudentsByClass(selectedClassId.value);
});

// При изменении класса сбрасываем / выбираем первого ученика
watch(
  () => selectedClassId.value,
  () => {
    if (classStudents.value.length > 0 && classStudents.value[0]) {
      selectedStudentId.value = classStudents.value[0].id;
    } else {
      selectedStudentId.value = '';
    }
  },
  { immediate: true }
);

// Текущий выбранный класс
const currentClass = computed(() => classesStore.getClassById(selectedClassId.value));

// История по классу (список всех пробников с аналитикой)
const classHistoryRows = computed(() => {
  if (!selectedClassId.value) return [];
  const tests = mockTestsStore.getTestsByClass(selectedClassId.value);

  return tests.map((t) => {
    const analytics = resultsStore.getClassAnalytics(selectedClassId.value, t.id, t.passingScoreSecondary);
    return {
      test: t,
      attendedCount: analytics?.attendedStudents || 0,
      totalCount: analytics?.totalStudents || 0,
      avgPrimary: analytics?.avgPrimary || 0,
      avgSecondary: analytics?.avgSecondary || 0,
      maxSecondary: analytics?.maxSecondary || 0,
      minSecondary: analytics?.minSecondary || 0,
      passedPercent: analytics?.passedPercent || 0,
    };
  });
});

// История конкретного выбранного ученика
const studentHistory = computed(() => {
  if (!selectedStudentId.value) return [];
  return resultsStore.getStudentHistory(selectedStudentId.value);
});

// Выбранный ученик
const currentStudent = computed(() => {
  return classesStore.students.find((s) => s.id === selectedStudentId.value);
});

// Метрики ученика
const studentMetrics = computed(() => {
  if (studentHistory.value.length === 0) {
    return { count: 0, avgSecondary: 0, maxSecondary: 0, diffWithClass: 0 };
  }
  const count = studentHistory.value.length;
  const sum = studentHistory.value.reduce((acc, h) => acc + h.secondaryScore, 0);
  const avgSecondary = Math.round((sum / count) * 10) / 10;
  const maxSecondary = Math.max(...studentHistory.value.map((h) => h.secondaryScore));

  // Сравнение со средним баллом класса
  let classSum = 0;
  let classCount = 0;
  for (const h of classHistoryRows.value) {
    if (h.avgSecondary > 0) {
      classSum += h.avgSecondary;
      classCount++;
    }
  }
  const classAvg = classCount > 0 ? classSum / classCount : 0;
  const diffWithClass = Math.round((avgSecondary - classAvg) * 10) / 10;

  return { count, avgSecondary, maxSecondary, diffWithClass };
});

function toggleExpand(testId: string) {
  expandedTestIds.value[testId] = !expandedTestIds.value[testId];
}
</script>

<template>
  <div class="history-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">История пробников</h1>
        <p class="page-subtitle">Хронология диагностик по классам и подробный прогресс каждого ученика</p>
      </div>

      <!-- Переключатель режима -->
      <div class="tab-pill-group">
        <button
          class="tab-pill"
          :class="{ active: currentTab === 'classes' }"
          @click="currentTab = 'classes'"
        >
          <Users :size="16" />
          <span>По классам</span>
        </button>
        <button
          class="tab-pill"
          :class="{ active: currentTab === 'students' }"
          @click="currentTab = 'students'"
        >
          <UserCheck :size="16" />
          <span>По ученикам</span>
        </button>
      </div>
    </div>

    <!-- Селектор класса -->
    <div class="toolbar card">
      <div class="filters-row">
        <div class="filter-item">
          <label class="filter-label">Выберите класс:</label>
          <select v-model="selectedClassId" class="form-select select-field">
            <option v-for="cls in classesStore.classes" :key="cls.id" :value="cls.id">
              {{ cls.number }} «{{ cls.letter }}» ({{ cls.subject }})
            </option>
          </select>
        </div>

        <div v-if="currentTab === 'students'" class="filter-item">
          <label class="filter-label">Ученик:</label>
          <select v-model="selectedStudentId" class="form-select select-field">
            <option v-if="classStudents.length === 0" value="">Нет учеников</option>
            <option v-for="std in classStudents" :key="std.id" :value="std.id">
              {{ std.fullName }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Вкладка 1: История по классам -->
    <div v-if="currentTab === 'classes'" class="tab-content">
      <div v-if="classHistoryRows.length === 0" class="empty-placeholder card">
        <History :size="48" class="empty-icon" />
        <h3>Пробники для данного класса не найдены</h3>
        <p>Создайте первый пробник в разделе «Пробники»</p>
      </div>

      <div v-else class="card history-table-card">
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Название пробника</th>
                <th>Участники</th>
                <th>Ср. первичный</th>
                <th>Ср. вторичный</th>
                <th>Разброс (мин/макс)</th>
                <th>Сдали (%)</th>
                <th style="text-align: right;">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in classHistoryRows" :key="row.test.id">
                <td style="white-space: nowrap;">
                  <span class="date-badge"><Calendar :size="13" /> {{ row.test.date }}</span>
                </td>
                <td>
                  <strong>{{ row.test.title }}</strong>
                  <div class="sub-info">{{ row.test.subject }} · {{ row.test.tasks.length }} заданий</div>
                </td>
                <td>
                  <span class="badge badge-gray">{{ row.attendedCount }} из {{ row.totalCount }}</span>
                </td>
                <td>
                  <strong>{{ row.avgPrimary }}</strong>
                  <span class="sub-max">/ {{ row.test.maxPrimaryScore }}</span>
                </td>
                <td>
                  <span class="score-pill-lg">{{ row.avgSecondary }}</span>
                  <span class="sub-max">/ 100</span>
                </td>
                <td>
                  <span class="text-danger">{{ row.minSecondary }}</span> —
                  <span class="text-success">{{ row.maxSecondary }} б.</span>
                </td>
                <td>
                  <span class="badge badge-success">{{ row.passedPercent }}%</span>
                </td>
                <td style="text-align: right;">
                  <div class="table-actions">
                    <router-link :to="`/mock-tests/${row.test.id}/results`" class="btn btn-secondary btn-sm" title="Ведомость">
                      <FileSpreadsheet :size="14" />
                      <span>Ведомость</span>
                    </router-link>
                    <router-link :to="`/analytics?classId=${row.test.classId}&testId=${row.test.id}`" class="btn btn-primary btn-sm" title="Аналитика">
                      <span>Аналитика</span>
                    </router-link>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Вкладка 2: История конкретного ученика -->
    <div v-else class="tab-content">
      <div v-if="!currentStudent" class="empty-placeholder card">
        <UserCheck :size="48" class="empty-icon" />
        <h3>Ученик не выбран</h3>
        <p>Выберите класс и ученика из списков выше</p>
      </div>

      <div v-else class="student-profile-wrapper">
        <!-- Карточка профиля ученика -->
        <div class="card student-summary-card">
          <div class="student-profile-header">
            <div class="student-avatar-big">
              {{ currentStudent.fullName.substring(0, 1) }}
            </div>
            <div class="student-header-info">
              <h2 class="student-name">{{ currentStudent.fullName }}</h2>
              <div class="student-tags">
                <span class="badge badge-primary">{{ currentClass?.number }} «{{ currentClass?.letter }}»</span>
                <span class="badge badge-gray">{{ currentClass?.subject }}</span>
              </div>
            </div>
          </div>

          <!-- Метрики ученика -->
          <div class="student-kpi-row">
            <div class="student-kpi-box">
              <span class="kpi-label">Написано пробников</span>
              <span class="kpi-val">{{ studentMetrics.count }}</span>
            </div>
            <div class="student-kpi-box">
              <span class="kpi-label">Средний вторичный балл</span>
              <span class="kpi-val text-primary">{{ studentMetrics.avgSecondary }}</span>
            </div>
            <div class="student-kpi-box">
              <span class="kpi-label">Лучший результат</span>
              <span class="kpi-val text-success">{{ studentMetrics.maxSecondary }} б.</span>
            </div>
            <div class="student-kpi-box">
              <span class="kpi-label">Динамика относительно класса</span>
              <span
                class="kpi-val"
                :class="studentMetrics.diffWithClass >= 0 ? 'text-success' : 'text-danger'"
              >
                {{ studentMetrics.diffWithClass >= 0 ? '+' : '' }}{{ studentMetrics.diffWithClass }} б.
              </span>
            </div>
          </div>
        </div>

        <!-- Список пробников ученика -->
        <div class="card attempts-card">
          <h3 class="section-title" style="margin-bottom: 1rem;">Результаты пробных экзаменов</h3>

          <div v-if="studentHistory.length === 0" class="empty-attempts">
            У данного ученика пока нет внесенных результатов в ведомостях.
          </div>

          <div v-else class="attempts-list">
            <div v-for="att in studentHistory" :key="att.testId" class="attempt-card">
              <div class="attempt-header" @click="toggleExpand(att.testId)">
                <div class="attempt-title-box">
                  <span class="attempt-date"><Calendar :size="13" /> {{ att.date }}</span>
                  <h4 class="attempt-title">{{ att.title }}</h4>
                </div>

                <div class="attempt-scores-box">
                  <div class="score-block">
                    <span class="score-label">Первичный</span>
                    <span class="score-val">{{ att.primaryScore }} <span class="score-sub">/ {{ att.maxPrimaryScore }}</span></span>
                  </div>

                  <div class="score-block">
                    <span class="score-label">Вторичный</span>
                    <span
                      class="score-pill-lg"
                      :class="{
                        'pill-gold': att.secondaryScore >= 80,
                        'pill-green': att.secondaryScore >= 36 && att.secondaryScore < 80,
                        'pill-red': att.secondaryScore < 36
                      }"
                    >
                      {{ att.secondaryScore }}
                    </span>
                  </div>

                  <button class="btn btn-secondary btn-icon btn-sm">
                    <component :is="expandedTestIds[att.testId] ? ChevronUp : ChevronDown" :size="16" />
                  </button>
                </div>
              </div>

              <!-- Детализация баллов за каждое задание -->
              <div v-if="expandedTestIds[att.testId]" class="attempt-details-breakdown">
                <span class="breakdown-title">Баллы по номерам заданий:</span>
                <div class="tasks-points-grid">
                  <div
                    v-for="(scoreVal, taskNum) in att.scores"
                    :key="taskNum"
                    class="task-point-badge"
                    :class="{ 'zero-pt': scoreVal === 0, 'has-pt': scoreVal > 0 }"
                  >
                    <span class="tp-num">№{{ taskNum }}:</span>
                    <span class="tp-val">{{ scoreVal }} б.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.history-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.tab-pill-group {
  display: flex;
  background: var(--gray-200);
  padding: 0.25rem;
  border-radius: var(--radius-md);
  gap: 0.25rem;
}

.tab-pill {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.95rem;
  border: none;
  background: transparent;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--gray-600);
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-pill.active {
  background: white;
  color: var(--primary);
  box-shadow: var(--shadow-sm);
}

.toolbar {
  padding: 0.85rem 1.25rem;
}

.filters-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.filter-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--gray-700);
  white-space: nowrap;
}

.select-field {
  min-width: 220px;
}

.history-table-card {
  padding: 0;
  overflow: hidden;
}

.date-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8rem;
  color: var(--gray-600);
}

.sub-info {
  font-size: 0.75rem;
  color: var(--gray-400);
  margin-top: 0.15rem;
}

.sub-max {
  font-size: 0.75rem;
  color: var(--gray-400);
}

.score-pill-lg {
  font-weight: 700;
  font-size: 1rem;
}

.table-actions {
  display: flex;
  gap: 0.4rem;
  justify-content: flex-end;
}

/* Student Profile */
.student-profile-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.student-summary-card {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.student-profile-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.student-avatar-big {
  width: 52px;
  height: 52px;
  border-radius: var(--radius-full);
  background: var(--primary-light);
  color: var(--primary);
  font-size: 1.4rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #c7d2fe;
}

.student-name {
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--gray-900);
}

.student-tags {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.25rem;
}

.student-kpi-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  padding: 1rem;
}

.student-kpi-box {
  display: flex;
  flex-direction: column;
}

.kpi-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--gray-500);
  text-transform: uppercase;
}

.kpi-val {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--gray-900);
  margin-top: 0.25rem;
}

.attempts-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.attempt-card {
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: white;
  transition: border-color 0.15s;
}

.attempt-card:hover {
  border-color: var(--primary);
}

.attempt-header {
  padding: 1rem 1.25rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  gap: 1rem;
  flex-wrap: wrap;
}

.attempt-date {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: var(--gray-400);
  margin-bottom: 0.2rem;
}

.attempt-title {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--gray-900);
}

.attempt-scores-box {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.score-block {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.score-label {
  font-size: 0.72rem;
  color: var(--gray-500);
  text-transform: uppercase;
  font-weight: 600;
}

.score-val {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--gray-800);
}

.score-sub {
  font-size: 0.78rem;
  color: var(--gray-400);
}

.pill-gold {
  color: #92400e;
  background: #fef3c7;
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-sm);
}

.pill-green {
  color: #065f46;
  background: var(--success-bg);
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-sm);
}

.pill-red {
  color: #991b1b;
  background: var(--danger-bg);
  padding: 0.15rem 0.5rem;
  border-radius: var(--radius-sm);
}

.attempt-details-breakdown {
  padding: 1rem 1.25rem;
  background: var(--gray-50);
  border-top: 1px solid var(--gray-200);
}

.breakdown-title {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--gray-600);
  margin-bottom: 0.5rem;
}

.tasks-points-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.task-point-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.78rem;
  border: 1px solid var(--gray-200);
  background: white;
}

.tp-num {
  font-weight: 600;
  color: var(--gray-500);
}

.tp-val {
  font-weight: 700;
}

.has-pt .tp-val {
  color: var(--success);
}

.zero-pt {
  background: #fff5f5;
  border-color: #fecaca;
}

.zero-pt .tp-val {
  color: var(--danger);
}

.empty-placeholder,
.empty-attempts {
  text-align: center;
  padding: 2.5rem 1.5rem;
  color: var(--gray-500);
}

.empty-icon {
  color: var(--gray-300);
  margin-bottom: 0.75rem;
}
</style>
