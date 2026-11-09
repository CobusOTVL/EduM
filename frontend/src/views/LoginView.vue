<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { GraduationCap, LogIn, AlertCircle, Sparkles } from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

const username = ref('teacher');
const password = ref('teacher123');
const errorMessage = ref('');
const isLoading = ref(false);

async function handleLogin() {
  errorMessage.value = '';
  if (!username.value || !password.value) {
    errorMessage.value = 'Пожалуйста, заполните логин и пароль';
    return;
  }

  isLoading.value = true;
  try {
    await authStore.login(username.value, password.value);
    router.push('/');
  } catch (err: any) {
    errorMessage.value = err.message || 'Ошибка авторизации';
  } finally {
    isLoading.value = false;
  }
}

function fillDemo(type: 'teacher' | 'admin') {
  if (type === 'teacher') {
    username.value = 'teacher';
    password.value = 'teacher123';
  } else {
    username.value = 'admin';
    password.value = 'admin123';
  }
}
</script>

<template>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="login-header">
        <div class="logo-box">
          <GraduationCap :size="32" />
        </div>
        <h1 class="title">Вход в систему</h1>
        <p class="subtitle">Учет пробных экзаменов и аналитика результатов</p>
      </div>

      <div v-if="errorMessage" class="error-banner">
        <AlertCircle :size="18" />
        <span>{{ errorMessage }}</span>
      </div>

      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label class="form-label" for="login-username">Логин / Email</label>
          <input
            id="login-username"
            v-model="username"
            type="text"
            class="form-input"
            placeholder="Введите логин учителя"
            required
          />
        </div>

        <div class="form-group">
          <label class="form-label" for="login-password">Пароль</label>
          <input
            id="login-password"
            v-model="password"
            type="password"
            class="form-input"
            placeholder="Введите пароль"
            required
          />
        </div>

        <button type="submit" class="btn btn-primary btn-submit" :disabled="isLoading">
          <LogIn :size="18" />
          <span>{{ isLoading ? 'Вход...' : 'Войти в личный кабинет' }}</span>
        </button>
      </form>

      <div class="demo-hints">
        <div class="hint-header">
          <Sparkles :size="15" />
          <span>Быстрый демо-вход:</span>
        </div>
        <div class="hint-buttons">
          <button type="button" class="btn btn-secondary btn-sm" @click="fillDemo('teacher')">
            Учитель (teacher)
          </button>
          <button type="button" class="btn btn-secondary btn-sm" @click="fillDemo('admin')">
            Методист (admin)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  background: radial-gradient(circle at top, #eef2ff 0%, #f8fafc 100%);
}

.login-card {
  width: 100%;
  max-width: 440px;
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--gray-200);
  box-shadow: var(--shadow-lg);
  padding: 2.25rem 2rem;
}

.login-header {
  text-align: center;
  margin-bottom: 1.75rem;
}

.logo-box {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  background: var(--primary);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--gray-900);
}

.subtitle {
  font-size: 0.875rem;
  color: var(--gray-500);
  margin-top: 0.35rem;
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--danger-bg);
  border: 1px solid #fecaca;
  color: var(--danger);
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.25rem;
  font-size: 0.85rem;
}

.btn-submit {
  width: 100%;
  padding: 0.75rem;
  margin-top: 0.5rem;
}

.demo-hints {
  margin-top: 1.75rem;
  padding-top: 1.25rem;
  border-top: 1px dashed var(--gray-200);
}

.hint-header {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--gray-500);
  margin-bottom: 0.65rem;
}

.hint-buttons {
  display: flex;
  gap: 0.5rem;
}
</style>
