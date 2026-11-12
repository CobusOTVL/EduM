<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useClassesStore } from '../stores/classes';
import { useMockTestsStore } from '../stores/mockTests';
import { useResultsStore } from '../stores/results';
import {
  Users,
  FileCheck2,
  BarChart3,
  PlusCircle,
  ArrowRight,
  Sparkles,
  BookOpen,
  Calendar
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();
const classesStore = useClassesStore();
const mockTestsStore = useMockTestsStore();
const resultsStore = useResultsStore();

const classesCount = computed(() => classesStore.classes.length);
const studentsCount = computed(() => classesStore.students.length);
const testsCount = computed(() => mockTestsStore.mockTests.length);

const userTestIds = computed(() => new Set(mockTestsStore.mockTests.map((t) => t.id)));

const avgScoreAll = computed(() => {
  let totalSecondary = 0;
  let count = 0;
  for (const sheet of resultsStore.resultSheets) {
    if (userTestIds.value.has(sheet.mockTestId)) {
      for (const score of Object.values(sheet.studentScores)) {
        totalSecondary += score.secondaryScore;
        count++;
      }
    }
  }
  return count > 0 ? Math.round((totalSecondary / count) * 10) / 10 : 0;
});

const recentTests = computed(() => {
  return [...mockTestsStore.mockTests]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4);
});

function getClassName(classId: string) {
  const cls = classesStore.getClassById(classId);
  return cls ? `${cls.number} «${cls.letter}»` : 'Класс удален';
}

function getStudentsCountInClass(classId: string) {
  return classesStore.getStudentsByClass(classId).length;
}

function hasResults(testId: string) {
  const sheet = resultsStore.resultSheets.find((s) => s.mockTestId === testId);
  return sheet && Object.keys(sheet.studentScores).length > 0;
}
</script>

<template>
  <div class="dashboard-page">
    <div class="welcome-banner card">
      <div class="welcome-content">
        <div class="welcome-badge">
          <Sparkles :size="16" />
          <span>EduMetric · Система учета диагностик и пробников</span>
        </div>
        <h1 class="welcome-title">Здравствуйте, {{ authStore.userFullName || 'Учитель' }}!</h1>
        <p class="welcome-subtitle">
          Управляйте классами, вносите баллы за пробные экзамены ЕГЭ/ОГЭ, отслеживайте динамику и анализируйте результаты учеников.
        </p>

        <div class="quick-actions">
          <router-link to="/classes" class="btn btn-primary">
            <PlusCircle :size="18" />
            <span>Управление классами</span>
          </router-link>
          <router-link to="/mock-tests" class="btn btn-secondary">
            <FileCheck2 :size="18" />
            <span>Назначить пробник</span>
          </router-link>
          <router-link to="/analytics" class="btn btn-secondary">
            <BarChart3 :size="18" />
            <span>Сводная аналитика</span>
          </router-link>
        </div>
      </div>
    </div>

    <!-- Статистика -->
    <div class="stats-row">
      <div class="stat-box">
        <div class="stat-header">
          <span class="stat-title">Классы под кураторством</span>
          <Users class="stat-icon" :size="20" />
        </div>
        <span class="stat-value">{{ classesCount }}</span>
        <span class="stat-hint">Всего групп</span>
      </div>

      <div class="stat-box">
        <div class="stat-header">
          <span class="stat-title">Всего учеников</span>
          <BookOpen class="stat-icon" :size="20" />
        </div>
        <span class="stat-value">{{ studentsCount }}</span>
        <span class="stat-hint">В активных списках</span>
      </div>

      <div class="stat-box">
        <div class="stat-header">
          <span class="stat-title">Проведено пробников</span>
          <FileCheck2 class="stat-icon" :size="20" />
        </div>
        <span class="stat-value">{{ testsCount }}</span>
        <span class="stat-hint">За текущий учебный год</span>
      </div>

      <div class="stat-box">
        <div class="stat-header">
          <span class="stat-title">Средний вторичный балл</span>
          <BarChart3 class="stat-icon" :size="20" />
        </div>
        <span class="stat-value text-primary">{{ avgScoreAll }}</span>
        <span class="stat-hint">По 100-балльной шкале</span>
      </div>
    </div>

    <!-- Секции: Последние пробники и Классы -->
    <div class="dashboard-grid">
      <!-- Последние пробники -->
      <div class="card section-card">
        <div class="section-header">
          <div>
            <h2 class="section-title">Последние пробники</h2>
            <p class="section-subtitle">Диагностические работы и ввод ведомостей</p>
          </div>
          <router-link to="/mock-tests" class="link-more">
            Все пробники <ArrowRight :size="16" />
          </router-link>
        </div>

        <div v-if="recentTests.length === 0" class="empty-state">
          Пробников пока не назначено. Нажмите «Назначить пробник», чтобы создать первый срез.
        </div>

        <div v-else class="tests-list">
          <div v-for="test in recentTests" :key="test.id" class="test-item">
            <div class="test-item-main">
              <div class="test-badge-row">
                <span class="badge badge-primary">{{ getClassName(test.classId) }}</span>
                <span class="badge badge-gray">{{ test.subject }}</span>
                <span v-if="hasResults(test.id)" class="badge badge-success">Результаты внесены</span>
                <span v-else class="badge badge-warning">Ожидает ввода баллов</span>
              </div>
              <h3 class="test-item-title">{{ test.title }}</h3>
              <div class="test-item-meta">
                <span><Calendar :size="14" /> {{ test.date }}</span>
                <span>Заданий: {{ test.tasks.length }}</span>
                <span>Макс. перв.: {{ test.maxPrimaryScore }}</span>
              </div>
            </div>

            <div class="test-item-actions">
              <router-link :to="`/mock-tests/${test.id}/results`" class="btn btn-secondary btn-sm">
                Ввести баллы
              </router-link>
              <router-link :to="`/analytics?classId=${test.classId}&testId=${test.id}`" class="btn btn-primary btn-sm">
                Аналитика
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Классы -->
      <div class="card section-card">
        <div class="section-header">
          <div>
            <h2 class="section-title">Мои классы</h2>
            <p class="section-subtitle">Списки учащихся и предметы</p>
          </div>
          <router-link to="/classes" class="link-more">
            Все классы <ArrowRight :size="16" />
          </router-link>
        </div>

        <div v-if="classesStore.classes.length === 0" class="empty-state">
          Классы еще не добавлены.
        </div>

        <div v-else class="classes-compact-list">
          <div v-for="cls in classesStore.classes" :key="cls.id" class="class-compact-item" @click="router.push('/classes')">
            <div class="class-label-bubble">
              {{ cls.number }}{{ cls.letter }}
            </div>
            <div class="class-compact-details">
              <span class="class-compact-subject">{{ cls.subject }}</span>
              <span class="class-compact-count">
                <Users :size="13" /> {{ getStudentsCountInClass(cls.id) }} учеников
              </span>
            </div>
            <ArrowRight class="chevron" :size="18" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.welcome-banner {
  background: linear-gradient(135deg, #ffffff 0%, #f0f4ff 100%);
  border: 1px solid #e0e7ff;
  position: relative;
  overflow: hidden;
}

.welcome-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--primary);
  background: var(--primary-light);
  padding: 0.3rem 0.75rem;
  border-radius: var(--radius-full);
  margin-bottom: 0.75rem;
}

.welcome-title {
  font-size: 1.85rem;
  font-weight: 800;
  color: var(--gray-900);
  letter-spacing: -0.02em;
}

.welcome-subtitle {
  font-size: 1rem;
  color: var(--gray-600);
  max-width: 720px;
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1.25rem;
}

.stat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-icon {
  color: var(--gray-400);
}

.text-primary {
  color: var(--primary);
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

@media (max-width: 960px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--gray-100);
}

.section-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--gray-900);
}

.section-subtitle {
  font-size: 0.8rem;
  color: var(--gray-400);
}

.link-more {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 600;
}

.empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--gray-400);
  font-size: 0.9rem;
}

.tests-list {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.test-item {
  padding: 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  transition: all 0.15s ease;
}

.test-item:hover {
  border-color: var(--primary);
  background: var(--gray-50);
}

.test-badge-row {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-bottom: 0.35rem;
}

.test-item-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-900);
}

.test-item-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.78rem;
  color: var(--gray-500);
  margin-top: 0.35rem;
  align-items: center;
}

.test-item-meta span {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.test-item-actions {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
}

.classes-compact-list {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.class-compact-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.75rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--gray-200);
  cursor: pointer;
  transition: all 0.15s ease;
}

.class-compact-item:hover {
  background: var(--primary-light);
  border-color: var(--primary);
}

.class-label-bubble {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: var(--primary);
  color: white;
  font-weight: 700;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.class-compact-details {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.class-compact-subject {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--gray-900);
}

.class-compact-count {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.78rem;
  color: var(--gray-500);
  margin-top: 0.15rem;
}

.chevron {
  color: var(--gray-400);
}
</style>
