<script setup lang="ts">
import { ref } from 'vue';
import { useClassesStore } from '../stores/classes';
import { AVAILABLE_SUBJECTS } from '../utils/scales';
import type { SchoolClass, Student } from '../types';
import Modal from '../components/Modal.vue';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  UserPlus,
  ClipboardList,
  AlertTriangle,
  Search
} from 'lucide-vue-next';

const classesStore = useClassesStore();

// Поиск / фильтр
const searchQuery = ref('');

// Модальное окно создания / редактирования класса
const isClassModalOpen = ref(false);
const isEditing = ref(false);
const editingClassId = ref<string | null>(null);

const defaultSubject = AVAILABLE_SUBJECTS[0] ?? 'Математика (профиль)';

const classForm = ref<{
  number: number;
  letter: string;
  subject: string;
  description: string;
}>({
  number: 11,
  letter: 'А',
  subject: defaultSubject,
  description: '',
});

// Модальное окно управления учениками
const isRosterModalOpen = ref(false);
const activeClass = ref<SchoolClass | null>(null);
const singleStudentName = ref('');
const batchStudentsText = ref('');
const showBatchInput = ref(false);

// Модальное окно подтверждения удаления
const isDeleteModalOpen = ref(false);
const classToDelete = ref<SchoolClass | null>(null);

function openCreateModal() {
  isEditing.value = false;
  editingClassId.value = null;
  classForm.value = {
    number: 11,
    letter: 'А',
    subject: defaultSubject,
    description: '',
  };
  isClassModalOpen.value = true;
}

function openEditModal(cls: SchoolClass) {
  isEditing.value = true;
  editingClassId.value = cls.id;
  classForm.value = {
    number: cls.number,
    letter: cls.letter,
    subject: cls.subject,
    description: cls.description || '',
  };
  isClassModalOpen.value = true;
}

function saveClass() {
  const letter = classForm.value.letter.trim();
  const subject = classForm.value.subject.trim();

  if (!letter) {
    alert('Пожалуйста, укажите букву класса');
    return;
  }
  if (!subject) {
    alert('Пожалуйста, выберите предмет');
    return;
  }

  if (isEditing.value && editingClassId.value) {
    classesStore.updateClass(editingClassId.value, {
      number: Number(classForm.value.number),
      letter,
      subject,
      description: classForm.value.description,
    });
  } else {
    classesStore.addClass({
      number: Number(classForm.value.number),
      letter,
      subject,
      description: classForm.value.description,
    });
  }

  isClassModalOpen.value = false;
}

function confirmDeleteClass(cls: SchoolClass) {
  classToDelete.value = cls;
  isDeleteModalOpen.value = true;
}

function executeDeleteClass() {
  if (classToDelete.value) {
    classesStore.deleteClass(classToDelete.value.id);
    classToDelete.value = null;
    isDeleteModalOpen.value = false;
  }
}

// Управление учениками
function openRosterModal(cls: SchoolClass) {
  activeClass.value = cls;
  singleStudentName.value = '';
  batchStudentsText.value = '';
  showBatchInput.value = false;
  isRosterModalOpen.value = true;
}

function handleAddSingleStudent() {
  if (!activeClass.value) return;
  if (!singleStudentName.value.trim()) return;
  try {
    classesStore.addStudent(activeClass.value.id, singleStudentName.value);
    singleStudentName.value = '';
  } catch (err: any) {
    alert(err.message);
  }
}

function handleBatchAddStudents() {
  if (!activeClass.value) return;
  if (!batchStudentsText.value.trim()) return;
  const count = classesStore.addStudentsBatch(activeClass.value.id, batchStudentsText.value);
  batchStudentsText.value = '';
  showBatchInput.value = false;
  alert(`Успешно добавлено ${count} учеников!`);
}

function handleRemoveStudent(studentId: string) {
  if (confirm('Удалить ученика из класса?')) {
    classesStore.removeStudent(studentId);
  }
}

function getStudents(classId: string): Student[] {
  return classesStore.getStudentsByClass(classId);
}

const filteredClasses = () => {
  const query = searchQuery.value.toLowerCase().trim();
  if (!query) return classesStore.classes;
  return classesStore.classes.filter(
    (c) =>
      `${c.number}${c.letter}`.toLowerCase().includes(query) ||
      c.subject.toLowerCase().includes(query) ||
      (c.description && c.description.toLowerCase().includes(query))
  );
};
</script>

<template>
  <div class="classes-view">
    <div class="page-header">
      <div>
        <h1 class="page-title">Управление классами</h1>
        <p class="page-subtitle">Создание учебных групп, выбор предмета и ведение состава учеников</p>
      </div>
      <button class="btn btn-primary" @click="openCreateModal">
        <Plus :size="18" />
        <span>Создать класс</span>
      </button>
    </div>

    <!-- Панель поиска и сводка -->
    <div class="toolbar card">
      <div class="search-input-box">
        <Search :size="18" class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Поиск по номеру, букве или предмету..."
          class="form-input search-field"
        />
      </div>
      <div class="toolbar-stats">
        <span>Всего классов: <strong>{{ classesStore.classes.length }}</strong></span>
      </div>
    </div>

    <!-- Сетка классов -->
    <div v-if="filteredClasses().length === 0" class="empty-placeholder card">
      <Users :size="48" class="empty-icon" />
      <h3>Классы не найдены</h3>
      <p>Создайте новый класс или измените параметры поиска</p>
      <button class="btn btn-primary btn-sm" @click="openCreateModal" style="margin-top: 1rem;">
        <Plus :size="16" /> Создать класс
      </button>
    </div>

    <div v-else class="grid-cards">
      <div v-for="cls in filteredClasses()" :key="cls.id" class="card card-hover class-card">
        <div class="class-card-top">
          <div class="class-badge-num">
            {{ cls.number }} «{{ cls.letter }}»
          </div>
          <span class="badge badge-primary">{{ cls.subject }}</span>
        </div>

        <p v-if="cls.description" class="class-desc">{{ cls.description }}</p>
        <p v-else class="class-desc text-muted">Описание не указано</p>

        <div class="class-stats-box">
          <div class="students-count-badge">
            <Users :size="16" />
            <span><strong>{{ getStudents(cls.id).length }}</strong> учеников в классе</span>
          </div>
        </div>

        <div class="class-card-actions">
          <button class="btn btn-secondary btn-sm" @click="openRosterModal(cls)">
            <UserPlus :size="16" />
            <span>Ученики</span>
          </button>
          <div class="actions-group-right">
            <button class="btn btn-secondary btn-icon" @click="openEditModal(cls)" title="Редактировать класс">
              <Edit2 :size="16" />
            </button>
            <button class="btn btn-danger btn-icon" @click="confirmDeleteClass(cls)" title="Удалить класс">
              <Trash2 :size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно Создания / Редактирования Класса -->
    <Modal
      :isOpen="isClassModalOpen"
      :title="isEditing ? 'Редактировать информацию о классе' : 'Создать новый класс'"
      @close="isClassModalOpen = false"
    >
      <form @submit.prevent="saveClass">
        <div class="form-row">
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Номер класса</label>
            <select v-model.number="classForm.number" class="form-select">
              <option v-for="n in [5, 6, 7, 8, 9, 10, 11]" :key="n" :value="n">{{ n }} класс</option>
            </select>
          </div>
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Буква класса</label>
            <input
              v-model="classForm.letter"
              type="text"
              maxlength="2"
              class="form-input"
              placeholder="А, Б, В..."
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Предмет подготовки</label>
          <select v-model="classForm.subject" class="form-select">
            <option v-for="sub in AVAILABLE_SUBJECTS" :key="sub" :value="sub">
              {{ sub }}
            </option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">Примечание / Профиль (необязательно)</label>
          <textarea
            v-model="classForm.description"
            class="form-textarea"
            rows="2"
            placeholder="Например: Профильная группа углубленной подготовки к ЕГЭ"
          ></textarea>
        </div>
      </form>

      <template #footer>
        <button class="btn btn-secondary" @click="isClassModalOpen = false">Отмена</button>
        <button class="btn btn-primary" @click="saveClass">
          {{ isEditing ? 'Сохранить изменения' : 'Создать класс' }}
        </button>
      </template>
    </Modal>

    <!-- Модальное окно управления учениками -->
    <Modal
      :isOpen="isRosterModalOpen"
      :title="activeClass ? `Список учеников: ${activeClass.number} «${activeClass.letter}» (${activeClass.subject})` : 'Список учеников'"
      maxWidth="680px"
      @close="isRosterModalOpen = false"
    >
      <div v-if="activeClass" class="roster-container">
        <!-- Блок добавления одиночного ученика -->
        <div class="add-student-box">
          <div class="form-row" style="align-items: flex-end;">
            <div class="form-group" style="flex: 1; margin-bottom: 0;">
              <label class="form-label">Добавить ученика (ФИО)</label>
              <input
                v-model="singleStudentName"
                type="text"
                class="form-input"
                placeholder="Иванов Иван Иванович"
                @keyup.enter="handleAddSingleStudent"
              />
            </div>
            <button class="btn btn-primary" @click="handleAddSingleStudent">
              <Plus :size="16" /> Добавить
            </button>
          </div>

          <div style="margin-top: 0.65rem;">
            <button
              class="btn-text-link"
              type="button"
              @click="showBatchInput = !showBatchInput"
            >
              <ClipboardList :size="14" />
              <span>{{ showBatchInput ? 'Скрыть массовый ввод' : 'Добавить списком (из журнала или Excel)' }}</span>
            </button>
          </div>
        </div>

        <!-- Массовое добавление списком -->
        <div v-if="showBatchInput" class="batch-import-box">
          <label class="form-label">Вставьте список ФИО (каждый ученик с новой строки):</label>
          <textarea
            v-model="batchStudentsText"
            class="form-textarea"
            rows="5"
            placeholder="Иванов Иван Иванович&#10;Петров Петр Сергеевич&#10;Сидорова Анна Николаевна"
          ></textarea>
          <div style="margin-top: 0.5rem; display: flex; justify-content: flex-end; gap: 0.5rem;">
            <button class="btn btn-secondary btn-sm" @click="showBatchInput = false">Свернуть</button>
            <button class="btn btn-primary btn-sm" @click="handleBatchAddStudents">Импортировать список</button>
          </div>
        </div>

        <!-- Таблица учеников -->
        <div class="roster-table-wrapper">
          <div class="roster-header-row">
            <span class="roster-count">Всего учеников: <strong>{{ getStudents(activeClass.id).length }}</strong></span>
          </div>

          <div v-if="getStudents(activeClass.id).length === 0" class="empty-roster">
            В этом классе пока нет учеников. Добавьте первого ученика или вставьте список выше.
          </div>

          <div v-else class="table-container" style="max-height: 320px; overflow-y: auto;">
            <table class="table">
              <thead>
                <tr>
                  <th style="width: 45px;">№</th>
                  <th>ФИО Ученика</th>
                  <th style="width: 70px; text-align: right;">Действие</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(student, idx) in getStudents(activeClass.id)" :key="student.id">
                  <td>{{ idx + 1 }}</td>
                  <td style="font-weight: 500;">{{ student.fullName }}</td>
                  <td style="text-align: right;">
                    <button
                      class="btn btn-danger btn-icon btn-sm"
                      @click="handleRemoveStudent(student.id)"
                      title="Удалить ученика"
                    >
                      <Trash2 :size="14" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="btn btn-primary" @click="isRosterModalOpen = false">Готово</button>
      </template>
    </Modal>

    <!-- Модальное окно подтверждения удаления класса -->
    <Modal
      :isOpen="isDeleteModalOpen"
      title="Удаление класса"
      maxWidth="460px"
      @close="isDeleteModalOpen = false"
    >
      <div v-if="classToDelete" class="delete-confirmation">
        <div class="delete-icon-box">
          <AlertTriangle :size="32" />
        </div>
        <p class="delete-msg">
          Вы уверены, что хотите удалить класс
          <strong>{{ classToDelete.number }} «{{ classToDelete.letter }}»</strong>?
        </p>
        <p class="delete-sub">
          Все привязанные ученики ({{ getStudents(classToDelete.id).length }} чел.) также будут удалены из системы.
        </p>
      </div>

      <template #footer>
        <button class="btn btn-secondary" @click="isDeleteModalOpen = false">Отмена</button>
        <button class="btn btn-danger" @click="executeDeleteClass">Да, удалить класс</button>
      </template>
    </Modal>
  </div>
</template>

<style scoped>
.classes-view {
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

.search-input-box {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gray-400);
}

.search-field {
  padding-left: 2.35rem;
}

.toolbar-stats {
  font-size: 0.875rem;
  color: var(--gray-600);
}

.class-card {
  display: flex;
  flex-direction: column;
}

.class-card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.class-badge-num {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--gray-900);
  line-height: 1.2;
}

.class-desc {
  font-size: 0.875rem;
  color: var(--gray-600);
  min-height: 40px;
  line-height: 1.4;
  margin-bottom: 1rem;
}

.text-muted {
  color: var(--gray-400);
  font-style: italic;
}

.class-stats-box {
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-md);
  padding: 0.75rem;
  margin-bottom: 1.25rem;
}

.students-count-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--gray-700);
}

.class-card-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid var(--gray-100);
}

.actions-group-right {
  display: flex;
  gap: 0.4rem;
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

/* Roster Modal */
.roster-container {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.add-student-box {
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  padding: 1rem;
  border-radius: var(--radius-md);
}

.btn-text-link {
  background: none;
  border: none;
  color: var(--primary);
  font-size: 0.825rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0;
}

.btn-text-link:hover {
  text-decoration: underline;
}

.batch-import-box {
  background: white;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-md);
  padding: 1rem;
  box-shadow: var(--shadow-sm);
}

.roster-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.roster-count {
  font-size: 0.85rem;
  color: var(--gray-600);
}

.empty-roster {
  text-align: center;
  padding: 1.75rem;
  background: var(--gray-50);
  border: 1px dashed var(--gray-300);
  border-radius: var(--radius-md);
  color: var(--gray-500);
  font-size: 0.875rem;
}

/* Delete confirmation */
.delete-confirmation {
  text-align: center;
  padding: 0.5rem 0;
}

.delete-icon-box {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
  background: var(--danger-bg);
  color: var(--danger);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.delete-msg {
  font-size: 1rem;
  color: var(--gray-900);
  margin-bottom: 0.5rem;
}

.delete-sub {
  font-size: 0.85rem;
  color: var(--gray-500);
}
</style>
