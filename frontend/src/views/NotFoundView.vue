<script setup lang="ts">
import { useRouter } from 'vue-router';
import { FileQuestion, Home, Users, ArrowLeft } from 'lucide-vue-next';

const router = useRouter();

function goBack() {
  if (window.history.length > 1) {
    router.back();
  } else {
    router.push('/');
  }
}
</script>

<template>
  <div class="not-found-wrapper">
    <div class="not-found-card card">
      <div class="code-badge">
        <FileQuestion :size="32" class="code-icon" />
        <span class="code-number">404</span>
      </div>

      <h1 class="error-title">Страница не найдена</h1>
      <p class="error-description">
        К сожалению, запрашиваемая страница не существует, была удалена или перемещена по другому адресу в системе EduMetric.
      </p>

      <div class="actions-group">
        <router-link to="/" class="btn btn-primary">
          <Home :size="18" />
          <span>На главную</span>
        </router-link>

        <router-link to="/classes" class="btn btn-secondary">
          <Users :size="18" />
          <span>Мои классы</span>
        </router-link>

        <button type="button" class="btn btn-secondary" @click="goBack">
          <ArrowLeft :size="18" />
          <span>Вернуться назад</span>
        </button>
      </div>

      <div class="help-box">
        <span>Если вы считаете, что это ошибка в системе, пожалуйста, перейдите в панель управления и повторите действие.</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found-wrapper {
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.not-found-card {
  max-width: 560px;
  width: 100%;
  text-align: center;
  padding: 3rem 2rem;
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.code-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--primary-light);
  color: var(--primary);
  padding: 0.75rem 1.75rem;
  border-radius: var(--radius-full);
  margin-bottom: 1.5rem;
}

.code-number {
  font-size: 2.25rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
}

.error-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--gray-900);
  margin-bottom: 0.75rem;
}

.error-description {
  font-size: 0.95rem;
  color: var(--gray-600);
  line-height: 1.5;
  max-width: 440px;
  margin-bottom: 2rem;
}

.actions-group {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}

.help-box {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px dashed var(--gray-200);
  font-size: 0.78rem;
  color: var(--gray-400);
}
</style>
