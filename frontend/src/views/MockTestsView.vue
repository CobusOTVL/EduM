<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useMockTestsStore } from '../stores/mockTests';
import { useClassesStore } from '../stores/classes';
import { useResultsStore } from '../stores/results';
import { AVAILABLE_SUBJECTS, getDefaultTasksForSubject, calculateMaxPrimary, SUBJECT_PRESETS } from '../utils/scales';
import type { MockTest, TaskSpec } from '../types';
import Modal from '../components/Modal.vue';
import {
  FileCheck2,
  Plus,
  Calendar,
  Layers,
  Edit2,
  Trash2,
  BarChart3,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sliders
} from 'lucide-vue-next';

const router = useRouter();
const mockTestsStore = useMockTestsStore();
const classesStore = useClassesStore();
const resultsStore = useResultsStore();

const defaultSubject = AVAILABLE_SUBJECTS[0] ?? 'Математика (профиль)';

// Фильтры
const filterClassId = ref('');
const filterSubject = ref('');

// Модальное окно создания / редактирования пробника
const isModalOpen = ref(false);
const isEditing = ref(false);
const editingTestId = ref<string | null>(null);

const testForm = ref<{
  title: string;
  date: string;
  classId: string;
  subject: string;
  academicYear: string;
  passingScoreSecondary: number;
  tasks: TaskSpec[];
}>({
  title: '',
  date: new Date().toISOString().substring(0, 10),
  classId: '',
  subject: defaultSubject,
  academicYear: '2025/2026',
  passingScoreSecondary: 27,
  tasks: getDefaultTasksForSubject(defaultSubject),
});

const showTaskCustomizer = ref(false);

// Автоподстановка предмета при выборе класса
watch(
  () => testForm.value.classId,
  (newClassId) => {
    if (!isEditing.value && newClassId) {
      const cls = classesStore.getClassById(newClassId);
      if (cls) {
        testForm.value.subject = cls.subject;
        loadSubjectDefaults(cls.subject);
      }
    }
  }
);

function loadSubjectDefaults(subjectName: string) {
  testForm.value.tasks = getDefaultTasksForSubject(subjectName);
  testForm.value.passingScoreSecondary = SUBJECT_PRESETS[subjectName]?.defaultPassingSecondary || 36;
}

const currentFormMaxPrimary = computed(() => {
  return calculateMaxPrimary(testForm.value.tasks);
});

function openCreateModal() {
  if (classesStore.classes.length === 0) {
    if (confirm('У вас пока нет созданных классов. Чтобы назначить пробник, сначала добавьте класс. Перейти в раздел «Классы»?')) {
      router.push('/classes');
    }
    return;
  }

  isEditing.value = false;
  editingTestId.value = null;

  const firstClass = classesStore.classes[0];
  const initialClassId = firstClass ? firstClass.id : '';
  const initialSubject = firstClass ? firstClass.subject : defaultSubject;

  testForm.value = {
    title: '',
    date: new Date().toISOString().substring(0, 10),
    classId: initialClassId,
    subject: initialSubject,
    academicYear: '2025/2026',
    passingScoreSecondary: SUBJECT_PRESETS[initialSubject]?.defaultPassingSecondary || 36,
    tasks: getDefaultTasksForSubject(initialSubject),
  };
  showTaskCustomizer.value = false;
  isModalOpen.value = true;
}

function openEditModal(test: MockTest) {
  isEditing.value = true;
  editingTestId.value = test.id;
  testForm.value = {
    title: test.title,
    date: test.date,
    classId: test.classId,
    subject: test.subject,
    academicYear: test.academicYear,
    passingScoreSecondary: test.passingScoreSecondary,
    tasks: JSON.parse(JSON.stringify(test.tasks)),
  };
  showTaskCustomizer.value = false;
  isModalOpen.value = true;
}

function addTask() {
  const nextNum = testForm.value.tasks.length + 1;
  testForm.value.tasks.push({ taskNumber: nextNum, maxScore: 1 });
}

function removeTask(index: number) {
  if (testForm.value.tasks.length <= 1) return;
  testForm.value.tasks.splice(index, 1);
  testForm.value.tasks.forEach((t, i) => {
    t.taskNumber = i + 1;
  });
}

function saveTest() {
  if (!testForm.value.title.trim()) {
    alert('Пожалуйста, введите название пробника');
    return;
  }
  if (!testForm.value.classId) {
    alert('Пожалуйста, выберите класс');
    return;
  }
  if (!testForm.value.date) {
    alert('Пожалуйста, укажите дату проведения');
    return;
  }

  if (isEditing.value && editingTestId.value) {
    mockTestsStore.updateMockTest(editingTestId.value, {
      title: testForm.value.title,
      date: testForm.value.date,
      classId: testForm.value.classId,
      subject: testForm.value.subject,
      academicYear: testForm.value.academicYear,
      passingScoreSecondary: testForm.value.passingScoreSecondary,
      tasks: testForm.value.tasks,
    });
  } else {
    mockTestsStore.addMockTest({
      title: testForm.value.title,
      date: testForm.value.date,
      classId: testForm.value.classId,
      subject: testForm.value.subject,
      academicYear: testForm.value.academicYear,
      passingScoreSecondary: testForm.value.passingScoreSecondary,
      tasks: testForm.value.tasks,
    });
  }

  isModalOpen.value = false;
}

function deleteTest(test: MockTest) {
  if (confirm(`Удалить пробник «${test.title}»?`)) {
    mockTestsStore.deleteMockTest(test.id);
  }
}

function getClassName(classId: string) {
  const cls = classesStore.getClassById(classId);
  return cls ? `${cls.number} «${cls.letter}»` : 'Класс удален';
}

function hasResults(testId: string) {
  const sheet = resultsStore.resultSheets.find((s) => s.mockTestId === testId);
  return sheet && Object.keys(sheet.studentScores).length > 0;
}

function getFilledCount(test: MockTest) {
  const sheet = resultsStore.resultSheets.find((s) => s.mockTestId === test.id);
  const students = classesStore.getStudentsByClass(test.classId);
  const count = sheet ? Object.keys(sheet.studentScores).length : 0;
  return `${count} из ${students.length}`;
}

const filteredTests = computed(() => {
  return mockTestsStore.mockTests.filter((t) => {
    if (filterClassId.value && t.classId !== filterClassId.value) return false;
    if (filterSubject.value && t.subject !== filterSubject.value) return false;
    return true;
  });
});
</script>

<template>
  <div class="mock-tests-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">Раздел «Пробники»</h1>
        <p class="page-subtitle">Создание диагностических срезов, назначение дат и спецификации заданий</p>
      </div>
      <button class="btn btn-primary" @click="openCreateModal">
        <Plus :size="18" />
        <span>Создать пробник</span>
      </button>
    </div>

    <!-- Фильтры -->
    <div class="toolbar card">
      <div class="filters-row">
        <div class="filter-item">
          <label class="filter-label">Класс:</label>
          <select v-model="filterClassId" class="form-select select-sm">
            <option value="">Все классы</option>
            <option v-for="cls in classesStore.classes" :key="cls.id" :value="cls.id">
              {{ cls.number }} «{{ cls.letter }}» ({{ cls.subject }})
            </option>
          </select>
        </div>

        <div class="filter-item">
          <label class="filter-label">Предмет:</label>
          <select v-model="filterSubject" class="form-select select-sm">
            <option value="">Все предметы</option>
            <option v-for="sub in AVAILABLE_SUBJECTS" :key="sub" :value="sub">
              {{ sub }}
            </option>
          </select>
        </div>
      </div>

      <div class="toolbar-stats">
        <span>Найдено пробников: <strong>{{ filteredTests.length }}</strong></span>
      </div>
    </div>

    <!-- Список пробников -->
    <div v-if="filteredTests.length === 0" class="empty-placeholder card">
      <FileCheck2 :size="48" class="empty-icon" />
      <h3>Пробников не найдено</h3>
      <p>Создайте новый пробник для вашего класса</p>
      <button class="btn btn-primary btn-sm" @click="openCreateModal" style="margin-top: 1rem;">
        <Plus :size="16" /> Создать пробник
      </button>
    </div>

    <div v-else class="tests-grid">
      <div v-for="test in filteredTests" :key="test.id" class="card card-hover test-card">
        <div class="test-card-top">
          <div class="badges-row">
            <span class="badge badge-primary">{{ getClassName(test.classId) }}</span>
            <span class="badge badge-gray">{{ test.subject }}</span>
            <span v-if="hasResults(test.id)" class="badge badge-success">
              <CheckCircle2 :size="13" /> Заполнен ({{ getFilledCount(test) }})
            </span>
            <span v-else class="badge badge-warning">
              <Clock :size="13" /> Не заполнен
            </span>
          </div>

          <div class="test-header-actions">
            <button class="btn btn-secondary btn-icon" @click="openEditModal(test)" title="Редактировать">
              <Edit2 :size="15" />
            </button>
            <button class="btn btn-danger btn-icon" @click="deleteTest(test)" title="Удалить">
              <Trash2 :size="15" />
            </button>
          </div>
        </div>

        <h3 class="test-title">{{ test.title }}</h3>

        <div class="test-info-box">
          <div class="info-line">
            <Calendar :size="15" class="info-icon" />
            <span>Дата проведения: <strong>{{ test.date }}</strong></span>
          </div>
          <div class="info-line">
            <Layers :size="15" class="info-icon" />
            <span>Заданий: <strong>{{ test.tasks.length }}</strong> (макс. перв. балл: <strong>{{ test.maxPrimaryScore }}</strong>)</span>
          </div>
          <div class="info-line">
            <span class="info-icon" style="font-weight: 700; font-size: 0.75rem;">%</span>
            <span>Порог сдачи: <strong>{{ test.passingScoreSecondary }}</strong> вторичных баллов</span>
          </div>
        </div>

        <div class="test-card-footer">
          <router-link :to="`/mock-tests/${test.id}/results`" class="btn btn-primary" style="flex: 1;">
            <span>{{ hasResults(test.id) ? 'Редактировать ведомость' : 'Ввести баллы' }}</span>
            <ArrowRight :size="16" />
          </router-link>
          <router-link
            :to="`/analytics?classId=${test.classId}&testId=${test.id}`"
            class="btn btn-secondary"
            title="Открыть аналитику пробника"
          >
            <BarChart3 :size="16" />
          </router-link>
        </div>
      </div>
    </div>

    <!-- Модальное окно создания / редактирования пробника -->
    <Modal
      :isOpen="isModalOpen"
      :title="isEditing ? 'Редактировать параметры пробника' : 'Создать новый пробник'"
      maxWidth="680px"
      @close="isModalOpen = false"
    >
      <form @submit.prevent="saveTest">
        <div class="form-group">
          <label class="form-label">Название пробной работы</label>
          <input
            v-model="testForm.title"
            type="text"
            class="form-input"
            placeholder="Например: СтатГрад №1 (Ноябрь) или Тренировочный вариант №4"
            required
          />
        </div>

        <div class="form-row">
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Класс</label>
            <select v-model="testForm.classId" class="form-select" required>
              <option disabled value="">Выберите класс</option>
              <option v-for="cls in classesStore.classes" :key="cls.id" :value="cls.id">
                {{ cls.number }} «{{ cls.letter }}» — {{ cls.subject }}
              </option>
            </select>
          </div>

          <div class="form-group" style="flex: 1;">
            <label class="form-label">Предмет</label>
            <select
              v-model="testForm.subject"
              class="form-select"
              @change="loadSubjectDefaults(testForm.subject)"
            >
              <option v-for="sub in AVAILABLE_SUBJECTS" :key="sub" :value="sub">{{ sub }}</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Дата проведения</label>
            <input v-model="testForm.date" type="date" class="form-input" required />
          </div>

          <div class="form-group" style="flex: 1;">
            <label class="form-label">Порог сдачи (вторичный балл)</label>
            <input
              v-model.number="testForm.passingScoreSecondary"
              type="number"
              min="1"
              max="100"
              class="form-input"
            />
          </div>
        </div>

        <!-- Спецификация заданий -->
        <div class="spec-section">
          <div class="spec-header">
            <div>
              <span class="spec-title">Спецификация заданий</span>
              <span class="spec-sub">
                Всего заданий: <strong>{{ testForm.tasks.length }}</strong>, максимальный первичный балл: <strong>{{ currentFormMaxPrimary }}</strong>
              </span>
            </div>
            <button
              type="button"
              class="btn btn-secondary btn-sm"
              @click="showTaskCustomizer = !showTaskCustomizer"
            >
              <Sliders :size="14" />
              <span>{{ showTaskCustomizer ? 'Скрыть настройку' : 'Настроить задания' }}</span>
            </button>
          </div>

          <!-- Редактор заданий -->
          <div v-if="showTaskCustomizer" class="tasks-customizer">
            <p class="customizer-hint">
              Вы можете изменить максимальный балл за каждое задание или добавить дополнительные номера:
            </p>
            <div class="tasks-chips-grid">
              <div v-for="(task, idx) in testForm.tasks" :key="task.taskNumber" class="task-chip">
                <span class="chip-num">№{{ task.taskNumber }}</span>
                <input
                  v-model.number="task.maxScore"
                  type="number"
                  min="1"
                  max="50"
                  class="chip-input"
                  title="Макс. балл за задание"
                />
                <span class="chip-unit">б.</span>
                <button
                  type="button"
                  class="chip-del"
                  @click="removeTask(idx)"
                  title="Удалить номер"
                >
                  &times;
                </button>
              </div>
            </div>

            <div class="customizer-actions">
              <button type="button" class="btn btn-secondary btn-sm" @click="addTask">
                <Plus :size="14" /> Добавить задание
              </button>
              <button
                type="button"
                class="btn btn-secondary btn-sm"
                @click="loadSubjectDefaults(testForm.subject)"
              >
                Сбросить к стандарту ФИПИ
              </button>
            </div>
          </div>
        </div>
      </form>

      <template #footer>
        <button class="btn btn-secondary" @click="isModalOpen = false">Отмена</button>
        <button class="btn btn-primary" @click="saveTest">
          {{ isEditing ? 'Сохранить изменения' : 'Создать пробник' }}
        </button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.mock-tests-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.85rem 1.25rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.filters-row {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--gray-600);
}

.select-sm {
  padding: 0.4rem 0.65rem;
  font-size: 0.85rem;
  min-width: 170px;
}

.toolbar-stats {
  font-size: 0.875rem;
  color: var(--gray-600);
}

.tests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 1.25rem;
}

.test-card {
  display: flex;
  flex-direction: column;
}

.test-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.badges-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.test-header-actions {
  display: flex;
  gap: 0.35rem;
}

.test-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--gray-900);
  line-height: 1.3;
  margin-bottom: 0.85rem;
}

.test-info-box {
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.info-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.825rem;
  color: var(--gray-600);
}

.info-icon {
  color: var(--primary);
  flex-shrink: 0;
}

.test-card-footer {
  display: flex;
  gap: 0.65rem;
  margin-top: auto;
  padding-top: 0.85rem;
  border-top: 1px solid var(--gray-100);
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

/* Spec Section */
.spec-section {
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  padding: 1rem;
  margin-top: 0.5rem;
}

.spec-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.spec-title {
  display: block;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--gray-800);
}

.spec-sub {
  font-size: 0.78rem;
  color: var(--gray-500);
}

.tasks-customizer {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--gray-200);
}

.customizer-hint {
  font-size: 0.8rem;
  color: var(--gray-600);
  margin-bottom: 0.65rem;
}

.tasks-chips-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
  gap: 0.5rem;
  max-height: 180px;
  overflow-y: auto;
  padding-right: 0.35rem;
}

.task-chip {
  background: white;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-sm);
  padding: 0.25rem 0.4rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.78rem;
}

.chip-num {
  font-weight: 700;
  color: var(--gray-700);
}

.chip-input {
  width: 32px;
  text-align: center;
  border: 1px solid var(--gray-200);
  border-radius: 4px;
  padding: 0.15rem 0;
  font-size: 0.78rem;
  font-weight: 600;
}

.chip-unit {
  color: var(--gray-400);
}

.chip-del {
  background: none;
  border: none;
  color: var(--danger);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0 0.15rem;
  margin-left: auto;
}

.customizer-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.85rem;
}
</style>
