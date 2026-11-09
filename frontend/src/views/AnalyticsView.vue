<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useClassesStore } from '../stores/classes';
import { useMockTestsStore } from '../stores/mockTests';
import { useResultsStore } from '../stores/results';
import type { ClassAnalyticsSummary, MockTest } from '../types';
import {
  BarChart3,
  TrendingUp,
  Target,
  Layers,
  Sliders,
  Calendar
} from 'lucide-vue-next';

const route = useRoute();
const classesStore = useClassesStore();
const mockTestsStore = useMockTestsStore();
const resultsStore = useResultsStore();

const selectedClassId = ref<string>('');
const selectedTestId = ref<string>('');
const threshold = ref<number>(36);

onMounted(() => {
  if (route.query.classId) {
    selectedClassId.value = String(route.query.classId);
  } else if (classesStore.classes.length > 0 && classesStore.classes[0]) {
    selectedClassId.value = classesStore.classes[0].id;
  }

  if (route.query.testId) {
    selectedTestId.value = String(route.query.testId);
  }
});

// Доступные пробники выбранного класса
const classTests = computed<MockTest[]>(() => {
  if (!selectedClassId.value) return [];
  return mockTestsStore.getTestsByClass(selectedClassId.value);
});

// При смене класса выбираем последний пробник
watch(
  () => selectedClassId.value,
  (newId) => {
    const tests = mockTestsStore.getTestsByClass(newId);
    if (tests.length > 0 && tests[0]) {
      if (!tests.some((t) => t.id === selectedTestId.value)) {
        selectedTestId.value = tests[0].id;
        threshold.value = tests[0].passingScoreSecondary || 36;
      }
    } else {
      selectedTestId.value = '';
    }
  },
  { immediate: true }
);

// При смене пробника подтягиваем его порог сдачи
watch(
  () => selectedTestId.value,
  (newTestId) => {
    if (newTestId) {
      const t = mockTestsStore.getMockTestById(newTestId);
      if (t && t.passingScoreSecondary) {
        threshold.value = t.passingScoreSecondary;
      }
    }
  }
);

const currentClass = computed(() => classesStore.getClassById(selectedClassId.value));
const currentTest = computed(() => mockTestsStore.getMockTestById(selectedTestId.value));

// Аналитический отчет по выбранному классу и пробнику
const analytics = computed<ClassAnalyticsSummary | null>(() => {
  if (!selectedClassId.value) return null;
  return resultsStore.getClassAnalytics(selectedClassId.value, selectedTestId.value, threshold.value);
});

// Динамика между всеми пробниками выбранного класса
const classDynamics = computed(() => {
  if (!selectedClassId.value) return [];
  const tests = mockTestsStore.getTestsByClass(selectedClassId.value);
  const chronoTests = [...tests].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return chronoTests.map((t) => {
    const summary = resultsStore.getClassAnalytics(selectedClassId.value, t.id, t.passingScoreSecondary);
    return {
      testId: t.id,
      title: t.title,
      date: t.date,
      avgPrimary: summary?.avgPrimary || 0,
      avgSecondary: summary?.avgSecondary || 0,
      maxSecondary: summary?.maxSecondary || 0,
      attended: summary?.attendedStudents || 0,
    };
  });
});
</script>

<template>
  <div class="analytics-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">Раздел «Аналитика»</h1>
        <p class="page-subtitle">
          Общая статистика класса, распределение вторичных баллов, достижение порогов и динамика между пробниками
        </p>
      </div>
    </div>

    <!-- Панель управления и фильтров -->
    <div class="toolbar card">
      <div class="filters-row">
        <!-- Выбор класса -->
        <div class="filter-group">
          <label class="filter-label">Класс:</label>
          <select v-model="selectedClassId" class="form-select select-field">
            <option v-for="cls in classesStore.classes" :key="cls.id" :value="cls.id">
              {{ cls.number }} «{{ cls.letter }}» ({{ cls.subject }})
            </option>
          </select>
        </div>

        <!-- Выбор конкретного пробника -->
        <div class="filter-group">
          <label class="filter-label">Пробник:</label>
          <select v-model="selectedTestId" class="form-select select-field">
            <option v-if="classTests.length === 0" value="">Нет пробников</option>
            <option v-for="t in classTests" :key="t.id" :value="t.id">
              {{ t.title }} ({{ t.date }})
            </option>
          </select>
        </div>

        <!-- Настраиваемый порог -->
        <div class="filter-group threshold-group">
          <label class="filter-label">
            <Sliders :size="14" /> Заданный порог: <strong>{{ threshold }} б.</strong>
          </label>
          <input
            v-model.number="threshold"
            type="range"
            min="10"
            max="90"
            step="1"
            class="range-slider"
          />
        </div>
      </div>
    </div>

    <div v-if="!currentClass || !currentTest || !analytics" class="empty-placeholder card">
      <BarChart3 :size="48" class="empty-icon" />
      <h3>Данные для аналитики отсутствуют</h3>
      <p>Выберите класс с назначенными пробниками и заполненными ведомостями.</p>
    </div>

    <div v-else class="analytics-content">
      <!-- 1. Основные показатели (KPI) -->
      <div class="stats-row">
        <div class="stat-box">
          <span class="stat-title">Средний первичный</span>
          <span class="stat-value">
            {{ analytics.avgPrimary }}
            <span class="stat-max">/ {{ currentTest.maxPrimaryScore }}</span>
          </span>
          <span class="stat-hint">Сумма по заданиям</span>
        </div>

        <div class="stat-box">
          <span class="stat-title">Средний вторичный балл</span>
          <span class="stat-value text-primary">
            {{ analytics.avgSecondary }}
            <span class="stat-max">/ 100</span>
          </span>
          <span class="stat-hint">Пересчет по шкале ФИПИ</span>
        </div>

        <div class="stat-box">
          <span class="stat-title">Мин. / Макс. результат</span>
          <span class="stat-value text-split">
            <span class="text-danger">{{ analytics.minSecondary }}</span>
            <span class="divider">/</span>
            <span class="text-success">{{ analytics.maxSecondary }}</span>
          </span>
          <span class="stat-hint">Разброс вторичных баллов</span>
        </div>

        <div class="stat-box">
          <span class="stat-title">Достигли порога ({{ threshold }}+)</span>
          <span class="stat-value text-success">
            {{ analytics.passedPercent }}%
          </span>
          <span class="stat-hint">{{ analytics.passedCount }} из {{ analytics.attendedStudents }} сдавших</span>
        </div>

        <div class="stat-box">
          <span class="stat-title">Высокобалльники (80+)</span>
          <span class="stat-value text-purple">
            {{ analytics.highAchieversCount }}
            <span class="stat-max">({{ analytics.highAchieversPercent }}%)</span>
          </span>
          <span class="stat-hint">Отличный результат</span>
        </div>
      </div>

      <!-- 2. Сетка: Распределение результатов и Динамика между пробниками -->
      <div class="charts-grid">
        <!-- Распределение результатов -->
        <div class="card chart-card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Распределение результатов</h3>
              <p class="card-subtitle">Количество и доля учеников по интервалам баллов</p>
            </div>
            <Target :size="20" class="card-header-icon" />
          </div>

          <div class="distribution-bars">
            <div
              v-for="item in analytics.scoreDistribution"
              :key="item.range"
              class="dist-bar-row"
            >
              <div class="dist-label-col">
                <span class="dist-range">{{ item.range }} б.</span>
              </div>
              <div class="dist-track">
                <div
                  class="dist-fill"
                  :style="{ width: `${item.percent}%` }"
                  :class="{
                    'fill-high': item.range === '80–100',
                    'fill-mid-high': item.range === '60–79',
                    'fill-mid': item.range === '40–59',
                    'fill-low': item.range === '0–39'
                  }"
                ></div>
              </div>
              <div class="dist-value-col">
                <strong>{{ item.count }} чел.</strong>
                <span class="dist-percent">({{ item.percent }}%)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Динамика результатов между пробниками -->
        <div class="card chart-card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Динамика результатов между пробниками</h3>
              <p class="card-subtitle">Прогресс среднего вторичного балла класса по датам</p>
            </div>
            <TrendingUp :size="20" class="card-header-icon" />
          </div>

          <div v-if="classDynamics.length <= 1" class="single-test-note">
            В этом классе проведен 1 пробник. Проведите повторный пробник, чтобы увидеть линию динамики роста.
          </div>

          <div class="dynamics-timeline">
            <div v-for="(dyn, idx) in classDynamics" :key="dyn.testId" class="dyn-item">
              <div class="dyn-point-col">
                <div class="dyn-dot" :class="{ active: dyn.testId === selectedTestId }"></div>
                <div v-if="idx < classDynamics.length - 1" class="dyn-line"></div>
              </div>

              <div class="dyn-info">
                <div class="dyn-header-row">
                  <span class="dyn-title">{{ dyn.title }}</span>
                  <span class="dyn-date"><Calendar :size="13" /> {{ dyn.date }}</span>
                </div>
                <div class="dyn-scores-row">
                  <span class="dyn-secondary">Средний балл: <strong>{{ dyn.avgSecondary }}</strong> / 100</span>
                  <span class="dyn-max">Лучший: {{ dyn.maxSecondary }}</span>
                  <span
                    v-if="idx > 0 && classDynamics[idx - 1] && dyn.avgSecondary > (classDynamics[idx - 1]?.avgSecondary ?? 0)"
                    class="badge badge-success badge-sm"
                  >
                    +{{ Math.round((dyn.avgSecondary - (classDynamics[idx - 1]?.avgSecondary ?? 0)) * 10) / 10 }} б.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Анализ решаемости заданий (Solvability) -->
      <div class="card solvability-card">
        <div class="card-header">
          <div>
            <h3 class="card-title">Анализ решаемости по номерам заданий</h3>
            <p class="card-subtitle">
              Процент набранных баллов от максимально возможных по каждому заданию (выявляет западающие темы)
            </p>
          </div>
          <Layers :size="20" class="card-header-icon" />
        </div>

        <div class="solvability-grid">
          <div
            v-for="task in analytics.taskSolvability"
            :key="task.taskNumber"
            class="task-stat-card"
            :class="{
              'task-critical': task.percent < 40,
              'task-warning': task.percent >= 40 && task.percent < 70,
              'task-good': task.percent >= 70
            }"
          >
            <div class="task-stat-top">
              <span class="task-stat-number">№{{ task.taskNumber }}</span>
              <span class="task-stat-max">макс. {{ task.maxScore }}б</span>
            </div>

            <div class="task-stat-pct-box">
              <span class="task-stat-pct">{{ task.percent }}%</span>
              <span class="task-stat-avg">ср. {{ task.avgScore }} б.</span>
            </div>

            <div class="task-stat-bar-track">
              <div class="task-stat-bar-fill" :style="{ width: `${task.percent}%` }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.analytics-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.toolbar {
  padding: 1rem 1.25rem;
}

.filters-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.filter-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--gray-700);
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  white-space: nowrap;
}

.select-field {
  min-width: 200px;
}

.threshold-group {
  margin-left: auto;
  background: var(--gray-50);
  padding: 0.35rem 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--gray-200);
}

.range-slider {
  accent-color: var(--primary);
  cursor: pointer;
  width: 110px;
}

.analytics-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stat-max {
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--gray-400);
}

.text-split {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.divider {
  color: var(--gray-300);
  font-weight: 400;
}

.text-purple {
  color: #7c3aed;
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 960px) {
  .charts-grid {
    grid-template-columns: 1fr;
  }
  .threshold-group {
    margin-left: 0;
  }
}

.chart-card {
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--gray-100);
}

.card-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--gray-900);
}

.card-subtitle {
  font-size: 0.8rem;
  color: var(--gray-500);
  margin-top: 0.2rem;
}

.card-header-icon {
  color: var(--primary);
}

/* Distribution Bars */
.distribution-bars {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem 0;
}

.dist-bar-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.dist-label-col {
  width: 80px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--gray-700);
}

.dist-track {
  flex: 1;
  height: 20px;
  background: var(--gray-100);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.dist-fill {
  height: 100%;
  border-radius: var(--radius-sm);
  transition: width 0.4s ease;
}

.fill-high {
  background: linear-gradient(90deg, #8b5cf6, #7c3aed);
}

.fill-mid-high {
  background: linear-gradient(90deg, #10b981, #059669);
}

.fill-mid {
  background: linear-gradient(90deg, #f59e0b, #d97706);
}

.fill-low {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.dist-value-col {
  width: 110px;
  text-align: right;
  font-size: 0.85rem;
}

.dist-percent {
  color: var(--gray-500);
  margin-left: 0.35rem;
}

/* Dynamics */
.single-test-note {
  font-size: 0.85rem;
  color: var(--gray-500);
  padding: 0.75rem;
  background: var(--gray-50);
  border-radius: var(--radius-md);
  margin-bottom: 0.75rem;
}

.dynamics-timeline {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.dyn-item {
  display: flex;
  gap: 0.85rem;
}

.dyn-point-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 20px;
}

.dyn-dot {
  width: 14px;
  height: 14px;
  border-radius: var(--radius-full);
  background: var(--gray-300);
  border: 2px solid white;
  box-shadow: 0 0 0 2px var(--gray-300);
}

.dyn-dot.active {
  background: var(--primary);
  box-shadow: 0 0 0 2px var(--primary);
}

.dyn-line {
  flex: 1;
  width: 2px;
  background: var(--gray-200);
  margin-top: 4px;
  min-height: 24px;
}

.dyn-info {
  flex: 1;
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  padding: 0.65rem 0.85rem;
}

.dyn-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.35rem;
}

.dyn-title {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--gray-900);
}

.dyn-date {
  font-size: 0.75rem;
  color: var(--gray-500);
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.dyn-scores-row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  font-size: 0.825rem;
  color: var(--gray-600);
}

/* Solvability */
.solvability-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(105px, 1fr));
  gap: 0.75rem;
}

.task-stat-card {
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  padding: 0.65rem;
  display: flex;
  flex-direction: column;
  transition: transform 0.15s;
}

.task-stat-card:hover {
  transform: translateY(-2px);
}

.task-critical {
  border-color: #fca5a5;
  background: #fff5f5;
}

.task-warning {
  border-color: #fde68a;
}

.task-good {
  border-color: #a7f3d0;
}

.task-stat-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  color: var(--gray-500);
}

.task-stat-number {
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--gray-800);
}

.task-stat-pct-box {
  margin: 0.35rem 0;
  display: flex;
  flex-direction: column;
}

.task-stat-pct {
  font-size: 1.15rem;
  font-weight: 800;
  color: var(--gray-900);
  line-height: 1.2;
}

.task-stat-avg {
  font-size: 0.7rem;
  color: var(--gray-500);
}

.task-stat-bar-track {
  height: 6px;
  background: var(--gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
  margin-top: auto;
}

.task-stat-bar-fill {
  height: 100%;
  background: var(--primary);
  border-radius: var(--radius-full);
}

.task-critical .task-stat-bar-fill {
  background: var(--danger);
}

.task-warning .task-stat-bar-fill {
  background: var(--warning);
}

.task-good .task-stat-bar-fill {
  background: var(--success);
}

.empty-placeholder {
  text-align: center;
  padding: 3rem 1.5rem;
  color: var(--gray-500);
}

.empty-icon {
  color: var(--gray-300);
  margin-bottom: 0.75rem;
}
</style>
