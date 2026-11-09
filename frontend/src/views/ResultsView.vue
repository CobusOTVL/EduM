<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useMockTestsStore } from '../stores/mockTests';
import { useClassesStore } from '../stores/classes';
import { useResultsStore } from '../stores/results';
import { convertPrimaryToSecondary } from '../utils/scales';
import type { MockTest, Student, MockTestResultSheet } from '../types';
import {
  Save,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BarChart3,
  Calendar,
  Layers,
  RotateCcw
} from 'lucide-vue-next';

const route = useRoute();
const mockTestsStore = useMockTestsStore();
const classesStore = useClassesStore();
const resultsStore = useResultsStore();

const testId = computed(() => route.params.id as string);
const test = computed<MockTest | undefined>(() => mockTestsStore.getMockTestById(testId.value));
const schoolClass = computed(() => (test.value ? classesStore.getClassById(test.value.classId) : undefined));
const students = computed<Student[]>(() => (test.value ? classesStore.getStudentsByClass(test.value.classId) : []));

// studentId -> taskNumber -> score
const matrixScores = ref<Record<string, Record<number, number | ''>>>({});
const saveSuccessMessage = ref(false);

onMounted(() => {
  loadExistingResults();
});

function loadExistingResults() {
  if (!test.value) return;
  const sheet = resultsStore.getSheetByMockTestId(test.value.id);

  const initialMatrix: Record<string, Record<number, number | ''>> = {};
  for (const std of students.value) {
    const studentRow: Record<number, number | ''> = {};
    const existingStd = sheet.studentScores[std.id];

    test.value.tasks.forEach((t) => {
      if (existingStd && existingStd.scores && existingStd.scores[t.taskNumber] !== undefined) {
        studentRow[t.taskNumber] = existingStd.scores[t.taskNumber] ?? '';
      } else {
        studentRow[t.taskNumber] = '';
      }
    });
    initialMatrix[std.id] = studentRow;
  }
  matrixScores.value = initialMatrix;
}

function getCellValue(studentId: string, taskNumber: number): number | '' {
  const row = matrixScores.value[studentId];
  if (!row) return '';
  const val = row[taskNumber];
  return val !== undefined ? val : '';
}

function setCellValue(studentId: string, taskNumber: number, value: number | '') {
  if (!matrixScores.value[studentId]) {
    matrixScores.value[studentId] = {};
  }
  const row = matrixScores.value[studentId];
  if (row) {
    row[taskNumber] = value;
  }
}

// Проверка превышения максимума задания
function isScoreExceeded(taskNumber: number, val: number | '' | undefined): boolean {
  if (val === '' || val === undefined || val === null) return false;
  if (!test.value) return false;
  const task = test.value.tasks.find((t) => t.taskNumber === taskNumber);
  if (!task) return false;
  return Number(val) > task.maxScore;
}

function hasAnyErrors(): boolean {
  if (!test.value) return false;
  for (const stdId of Object.keys(matrixScores.value)) {
    const stdRow = matrixScores.value[stdId];
    if (stdRow) {
      for (const task of test.value.tasks) {
        if (isScoreExceeded(task.taskNumber, stdRow[task.taskNumber])) {
          return true;
        }
      }
    }
  }
  return false;
}

// Расчет первичного балла для ученика
function getStudentPrimary(studentId: string): number {
  const row = matrixScores.value[studentId];
  if (!row) return 0;
  let sum = 0;
  for (const val of Object.values(row)) {
    if (val !== '' && !isNaN(Number(val))) {
      sum += Number(val);
    }
  }
  return sum;
}

// Перевод первичного во вторичный балл для ученика
function getStudentSecondary(studentId: string): number {
  if (!test.value) return 0;
  const prim = getStudentPrimary(studentId);
  return convertPrimaryToSecondary(prim, test.value.maxPrimaryScore, test.value.subject);
}

// Проверка, заполнен ли хотя бы один ответ у ученика
function isStudentAttended(studentId: string): boolean {
  const row = matrixScores.value[studentId];
  if (!row) return false;
  return Object.values(row).some((v) => v !== '' && v !== null && v !== undefined);
}

// Сводные показатели ведомости
const attendedCount = computed(() => {
  return students.value.filter((s) => isStudentAttended(s.id)).length;
});

const averagePrimary = computed(() => {
  const attended = students.value.filter((s) => isStudentAttended(s.id));
  if (attended.length === 0) return 0;
  const sum = attended.reduce((acc, s) => acc + getStudentPrimary(s.id), 0);
  return Math.round((sum / attended.length) * 10) / 10;
});

const averageSecondary = computed(() => {
  const attended = students.value.filter((s) => isStudentAttended(s.id));
  if (attended.length === 0) return 0;
  const sum = attended.reduce((acc, s) => acc + getStudentSecondary(s.id), 0);
  return Math.round((sum / attended.length) * 10) / 10;
});

const maxSecondaryInSheet = computed(() => {
  const attended = students.value.filter((s) => isStudentAttended(s.id));
  if (attended.length === 0) return 0;
  return Math.max(...attended.map((s) => getStudentSecondary(s.id)));
});

// Сохранение ведомости результатов
function saveResults() {
  if (!test.value) return;

  if (hasAnyErrors()) {
    alert('Пожалуйста, исправьте баллы, превышающие максимум за задание (подсвечены красным).');
    return;
  }

  const sheet: MockTestResultSheet = {
    id: 'sheet-' + test.value.id,
    mockTestId: test.value.id,
    studentScores: {},
    updatedAt: new Date().toISOString(),
  };

  for (const std of students.value) {
    if (isStudentAttended(std.id)) {
      const row = matrixScores.value[std.id] || {};
      const cleanScores: Record<number, number> = {};
      test.value.tasks.forEach((t) => {
        cleanScores[t.taskNumber] = Number(row[t.taskNumber]) || 0;
      });

      const prim = getStudentPrimary(std.id);
      const sec = getStudentSecondary(std.id);

      sheet.studentScores[std.id] = {
        studentId: std.id,
        scores: cleanScores,
        primaryScore: prim,
        secondaryScore: sec,
      };
    }
  }

  resultsStore.saveSheet(sheet);
  saveSuccessMessage.value = true;
  setTimeout(() => {
    saveSuccessMessage.value = false;
  }, 3500);
}

// Заполнить демонстрационными данными
function fillDemoResults() {
  if (!test.value) return;
  for (const std of students.value) {
    if (!matrixScores.value[std.id]) matrixScores.value[std.id] = {};
    const row = matrixScores.value[std.id];
    if (row) {
      test.value.tasks.forEach((t) => {
        const rand = Math.random();
        let pt = 0;
        if (t.maxScore === 1) {
          pt = rand > 0.25 ? 1 : 0;
        } else {
          pt = Math.round(rand * t.maxScore);
        }
        row[t.taskNumber] = pt;
      });
    }
  }
}

function clearMatrix() {
  if (confirm('Очистить все введенные баллы в таблице?')) {
    if (!test.value) return;
    for (const std of students.value) {
      if (!matrixScores.value[std.id]) matrixScores.value[std.id] = {};
      const row = matrixScores.value[std.id];
      if (row) {
        test.value.tasks.forEach((t) => {
          row[t.taskNumber] = '';
        });
      }
    }
  }
}
</script>

<template>
  <div v-if="!test" class="card empty-placeholder">
    <AlertCircle :size="48" class="empty-icon" />
    <h2>Пробник не найден</h2>
    <p>Возможно, он был удален или перенесен.</p>
    <router-link to="/mock-tests" class="btn btn-primary" style="margin-top: 1rem;">
      <ArrowLeft :size="16" /> Вернуться к списку пробников
    </router-link>
  </div>

  <div v-else class="results-view">
    <!-- Шапка страницы ведомости -->
    <div class="results-top-nav">
      <router-link to="/mock-tests" class="btn btn-secondary btn-sm">
        <ArrowLeft :size="16" />
        <span>К пробникам</span>
      </router-link>
      <div class="badges-group">
        <span class="badge badge-primary">{{ schoolClass?.number }} «{{ schoolClass?.letter }}»</span>
        <span class="badge badge-gray">{{ test.subject }}</span>
        <span class="badge badge-gray"><Calendar :size="13" /> {{ test.date }}</span>
      </div>
    </div>

    <div class="page-header" style="margin-bottom: 1rem;">
      <div>
        <h1 class="page-title">Ведомость: {{ test.title }}</h1>
        <p class="page-subtitle">
          Ввод первичных баллов за задания, автоматическая проверка максимума и перевод во вторичные баллы (ЕГЭ/ОГЭ)
        </p>
      </div>

      <div class="header-buttons">
        <button class="btn btn-secondary btn-sm" @click="fillDemoResults" title="Быстро заполнить случайными баллами">
          <Sparkles :size="16" />
          <span>Автозаполнение</span>
        </button>
        <button class="btn btn-secondary btn-sm" @click="clearMatrix" title="Очистить введенные баллы">
          <RotateCcw :size="16" />
          <span>Очистить</span>
        </button>
        <button class="btn btn-primary" @click="saveResults">
          <Save :size="18" />
          <span>Сохранить результаты</span>
        </button>
      </div>
    </div>

    <!-- Уведомление об успешном сохранении -->
    <div v-if="saveSuccessMessage" class="alert-success-banner">
      <CheckCircle2 :size="20" />
      <div>
        <strong>Результаты успешно сохранены!</strong>
        <span> Данные обновлены в ведомости и учтены в статистике.</span>
      </div>
    </div>

    <!-- Сводная плашка ведомости -->
    <div class="stats-row" style="margin-bottom: 1rem;">
      <div class="stat-box">
        <span class="stat-title">Учеников в ведомости</span>
        <span class="stat-value">{{ attendedCount }} из {{ students.length }}</span>
        <span class="stat-hint">Заполнено оценок</span>
      </div>
      <div class="stat-box">
        <span class="stat-title">Средний первичный балл</span>
        <span class="stat-value">{{ averagePrimary }} <span class="stat-sub-max">/ {{ test.maxPrimaryScore }}</span></span>
        <span class="stat-hint">По классу</span>
      </div>
      <div class="stat-box">
        <span class="stat-title">Средний вторичный балл</span>
        <span class="stat-value text-primary">{{ averageSecondary }} <span class="stat-sub-max">/ 100</span></span>
        <span class="stat-hint">Пересчет по шкале</span>
      </div>
      <div class="stat-box">
        <span class="stat-title">Лучший результат</span>
        <span class="stat-value text-success">{{ maxSecondaryInSheet }} б.</span>
        <span class="stat-hint">Максимум в классе</span>
      </div>
    </div>

    <!-- Интерактивная матрица ввода баллов -->
    <div class="card table-card">
      <div class="table-info-bar">
        <span class="info-tag">
          <Layers :size="15" /> Всего заданий: <strong>{{ test.tasks.length }}</strong>
        </span>
        <span class="info-tag">
          Макс. первичный: <strong>{{ test.maxPrimaryScore }} б.</strong>
        </span>
        <span class="info-tag">
          Порог сдачи: <strong>{{ test.passingScoreSecondary }} вт. б.</strong>
        </span>
        <router-link
          :to="`/analytics?classId=${test.classId}&testId=${test.id}`"
          class="link-analytics ml-auto"
        >
          <BarChart3 :size="16" /> Перейти к аналитике пробника
        </router-link>
      </div>

      <div class="matrix-wrapper">
        <table class="table matrix-table">
          <thead>
            <tr>
              <th class="col-num sticky-col-1">№</th>
              <th class="col-name sticky-col-2">ФИО Ученика</th>
              <!-- Столбцы номеров заданий -->
              <th
                v-for="task in test.tasks"
                :key="task.taskNumber"
                class="col-task"
                :title="`Задание №${task.taskNumber}. Максимум: ${task.maxScore} б.`"
              >
                <div class="task-head">
                  <span class="task-num">№{{ task.taskNumber }}</span>
                  <span class="task-max">({{ task.maxScore }}б)</span>
                </div>
              </th>
              <!-- Итоги -->
              <th class="col-result col-primary-head">Первич.</th>
              <th class="col-result col-secondary-head">Вторич.</th>
              <th class="col-status">Статус</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="students.length === 0">
              <td :colspan="test.tasks.length + 5" class="empty-roster-cell">
                В этом классе пока нет учеников. Добавьте учеников в разделе «Классы».
              </td>
            </tr>

            <tr v-for="(student, idx) in students" :key="student.id" class="student-row">
              <td class="col-num sticky-col-1">{{ idx + 1 }}</td>
              <td class="col-name sticky-col-2">
                <span class="student-fullname">{{ student.fullName }}</span>
              </td>

              <!-- Поля ввода баллов за задания -->
              <td
                v-for="task in test.tasks"
                :key="task.taskNumber"
                class="col-task"
                :class="{ 'cell-error': isScoreExceeded(task.taskNumber, getCellValue(student.id, task.taskNumber)) }"
              >
                <input
                  :value="getCellValue(student.id, task.taskNumber)"
                  type="number"
                  min="0"
                  :max="task.maxScore"
                  class="score-input"
                  :class="{ 'input-error': isScoreExceeded(task.taskNumber, getCellValue(student.id, task.taskNumber)) }"
                  placeholder="—"
                  @input="setCellValue(student.id, task.taskNumber, ($event.target as HTMLInputElement).value === '' ? '' : Number(($event.target as HTMLInputElement).value))"
                  @focus="($event.target as HTMLInputElement).select()"
                />
              </td>

              <!-- Сумма первичных баллов -->
              <td class="col-result col-primary-val">
                <strong>{{ getStudentPrimary(student.id) }}</strong>
                <span class="max-light">/{{ test.maxPrimaryScore }}</span>
              </td>

              <!-- Вторичный балл по шкале -->
              <td class="col-result col-secondary-val">
                <span
                  class="secondary-score-badge"
                  :class="{
                    'badge-high': getStudentSecondary(student.id) >= 80,
                    'badge-pass': getStudentSecondary(student.id) >= test.passingScoreSecondary && getStudentSecondary(student.id) < 80,
                    'badge-fail': getStudentSecondary(student.id) < test.passingScoreSecondary && isStudentAttended(student.id),
                    'badge-empty': !isStudentAttended(student.id)
                  }"
                >
                  {{ isStudentAttended(student.id) ? getStudentSecondary(student.id) : '—' }}
                </span>
              </td>

              <!-- Статус сдачи -->
              <td class="col-status">
                <span v-if="!isStudentAttended(student.id)" class="status-pill status-gray">Не сдавал</span>
                <span v-else-if="getStudentSecondary(student.id) >= 80" class="status-pill status-gold">80+ Баллов</span>
                <span v-else-if="getStudentSecondary(student.id) >= test.passingScoreSecondary" class="status-pill status-green">Сдал</span>
                <span v-else class="status-pill status-red">Ниже порога</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="matrix-bottom-actions">
        <button class="btn btn-primary" @click="saveResults">
          <Save :size="18" />
          <span>Сохранить результаты</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.results-view {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.results-top-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.badges-group {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}

.header-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.alert-success-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--success-bg);
  border: 1px solid #a7f3d0;
  color: #065f46;
  padding: 0.85rem 1.25rem;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  animation: slide-in 0.2s ease-out;
}

@keyframes slide-in {
  from { opacity: 0; transform: translateY(-6px); }
  to { opacity: 1; transform: translateY(0); }
}

.stat-sub-max {
  font-size: 1rem;
  font-weight: 500;
  color: var(--gray-400);
}

.text-success {
  color: var(--success);
}

.table-card {
  padding: 0;
  overflow: hidden;
}

.table-info-bar {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 0.85rem 1.25rem;
  background: var(--gray-50);
  border-bottom: 1px solid var(--gray-200);
  font-size: 0.85rem;
  color: var(--gray-600);
  flex-wrap: wrap;
}

.info-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.ml-auto {
  margin-left: auto;
}

.link-analytics {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 600;
  color: var(--primary);
}

.matrix-wrapper {
  overflow-x: auto;
  max-height: 65vh;
}

.matrix-table {
  border-collapse: separate;
  border-spacing: 0;
}

.matrix-table th {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--gray-100);
  padding: 0.5rem 0.4rem;
  text-align: center;
}

.sticky-col-1 {
  position: sticky;
  left: 0;
  z-index: 22;
  background: white;
  width: 40px;
  text-align: center;
  border-right: 1px solid var(--gray-200);
}

.sticky-col-2 {
  position: sticky;
  left: 40px;
  z-index: 22;
  background: white;
  width: 220px;
  min-width: 200px;
  border-right: 2px solid var(--gray-300);
  text-align: left !important;
  padding-left: 0.85rem !important;
}

thead th.sticky-col-1,
thead th.sticky-col-2 {
  background: var(--gray-100);
  z-index: 25;
}

.task-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.task-num {
  font-weight: 700;
  font-size: 0.8rem;
  color: var(--gray-800);
}

.task-max {
  font-size: 0.7rem;
  color: var(--gray-500);
  font-weight: 500;
}

.col-task {
  width: 48px;
  min-width: 46px;
  max-width: 52px;
  padding: 0.35rem 0.2rem !important;
  text-align: center;
}

.score-input {
  width: 100%;
  max-width: 42px;
  height: 32px;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--gray-900);
  background: white;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-sm);
  outline: none;
  transition: all 0.15s;
  -moz-appearance: textfield;
}

.score-input::-webkit-outer-spin-button,
.score-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.score-input:focus {
  border-color: var(--primary);
  background: var(--primary-light);
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.2);
}

.cell-error {
  background-color: #fee2e2 !important;
}

.input-error {
  border-color: var(--danger) !important;
  background-color: #fff1f2 !important;
  color: var(--danger) !important;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3) !important;
}

.col-primary-head,
.col-secondary-head {
  width: 80px;
  min-width: 80px;
}

.col-primary-val {
  text-align: center;
  font-size: 0.9rem;
  background: var(--gray-50);
  border-left: 2px solid var(--gray-300);
}

.max-light {
  font-size: 0.75rem;
  color: var(--gray-400);
  font-weight: normal;
}

.col-secondary-val {
  text-align: center;
  background: var(--gray-50);
}

.secondary-score-badge {
  display: inline-block;
  min-width: 38px;
  padding: 0.2rem 0.45rem;
  border-radius: var(--radius-sm);
  font-weight: 700;
  font-size: 0.95rem;
}

.badge-high {
  background: #ede9fe;
  color: #6d28d9;
}

.badge-pass {
  background: var(--success-bg);
  color: #065f46;
}

.badge-fail {
  background: var(--danger-bg);
  color: #b91c1c;
}

.badge-empty {
  color: var(--gray-400);
}

.col-status {
  width: 120px;
  min-width: 110px;
  text-align: center;
}

.status-pill {
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.status-green {
  background: var(--success-bg);
  color: #065f46;
}

.status-red {
  background: var(--danger-bg);
  color: #991b1b;
}

.status-gold {
  background: #fef3c7;
  color: #92400e;
}

.status-gray {
  background: var(--gray-100);
  color: var(--gray-500);
}

.empty-roster-cell {
  text-align: center;
  padding: 3rem;
  color: var(--gray-500);
}

.matrix-bottom-actions {
  display: flex;
  justify-content: flex-end;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--gray-200);
  background: var(--gray-50);
}

.student-fullname {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}
</style>
