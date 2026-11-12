<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import type { RegisterData } from '../types';
import {
  GraduationCap,
  LogIn,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Mail,
  Lock,
  User
} from 'lucide-vue-next';

const router = useRouter();
const authStore = useAuthStore();

// Режим экрана: 'login' | 'register'
const activeTab = ref<'login' | 'register'>('login');

// Поля входа (пустые по умолчанию)
const loginEmail = ref('');
const loginPassword = ref('');

// Поля регистрации
const regForm = ref<RegisterData>({
  email: '',
  password: '',
  password_confirm: '',
  first_name: '',
  last_name: '',
  middle_name: '',
});

const errorMessage = ref('');
const successMessage = ref('');
const isLoading = ref(false);

async function handleLogin() {
  errorMessage.value = '';
  successMessage.value = '';

  if (!loginEmail.value.trim() || !loginPassword.value.trim()) {
    errorMessage.value = 'Пожалуйста, заполните Email/логин и пароль';
    return;
  }

  isLoading.value = true;
  try {
    await authStore.login(loginEmail.value, loginPassword.value);
    router.push('/');
  } catch (err: any) {
    errorMessage.value = err.message || 'Неверный логин или пароль';
  } finally {
    isLoading.value = false;
  }
}

async function handleRegister() {
  errorMessage.value = '';
  successMessage.value = '';

  isLoading.value = true;
  try {
    await authStore.register({ ...regForm.value });
    successMessage.value = 'Регистрация прошла успешно! Выполняется вход в личный кабинет...';
    setTimeout(() => {
      router.push('/');
    }, 600);
  } catch (err: any) {
    errorMessage.value = err.message || 'Ошибка регистрации';
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="auth-wrapper">
    <div class="auth-card">
      <!-- Логотип EduMetric -->
      <div class="auth-header">
        <div class="logo-box">
          <GraduationCap :size="32" />
        </div>
        <h1 class="brand-title">EduMetric</h1>
        <p class="brand-subtitle">Единая система учета диагностик и пробных экзаменов</p>
      </div>

      <!-- Вкладки: Вход / Регистрация -->
      <div class="tab-switcher">
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'login' }"
          @click="activeTab = 'login'; errorMessage = ''; successMessage = ''"
        >
          <LogIn :size="16" />
          <span>Вход</span>
        </button>
        <button
          type="button"
          class="tab-btn"
          :class="{ active: activeTab === 'register' }"
          @click="activeTab = 'register'; errorMessage = ''; successMessage = ''"
        >
          <UserPlus :size="16" />
          <span>Регистрация</span>
        </button>
      </div>

      <!-- Баннер ошибок -->
      <div v-if="errorMessage" class="error-banner">
        <AlertCircle :size="18" class="banner-icon" />
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Баннер успеха -->
      <div v-if="successMessage" class="success-banner">
        <CheckCircle2 :size="18" class="banner-icon" />
        <span>{{ successMessage }}</span>
      </div>

      <!-- Форма Входа -->
      <form v-if="activeTab === 'login'" @submit.prevent="handleLogin" class="auth-form">
        <div class="form-group">
          <label class="form-label" for="login-email">Email или Логин</label>
          <div class="input-with-icon">
            <Mail :size="16" class="field-icon" />
            <input
              id="login-email"
              v-model="loginEmail"
              type="text"
              class="form-input with-icon"
              placeholder="Введите ваш email или логин"
              required
              autocomplete="username"
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="login-pass">Пароль</label>
          <div class="input-with-icon">
            <Lock :size="16" class="field-icon" />
            <input
              id="login-pass"
              v-model="loginPassword"
              type="password"
              class="form-input with-icon"
              placeholder="Введите пароль"
              required
              autocomplete="current-password"
            />
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-submit" :disabled="isLoading">
          <LogIn :size="18" />
          <span>{{ isLoading ? 'Проверка данных...' : 'Войти в EduMetric' }}</span>
        </button>
      </form>

      <!-- Форма Регистрации -->
      <form v-else @submit.prevent="handleRegister" class="auth-form">
        <div class="form-row">
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Фамилия <span class="required">*</span></label>
            <input
              v-model="regForm.last_name"
              type="text"
              class="form-input"
              placeholder="Иванов"
              required
            />
          </div>
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Имя <span class="required">*</span></label>
            <input
              v-model="regForm.first_name"
              type="text"
              class="form-input"
              placeholder="Иван"
              required
            />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Отчество</label>
          <input
            v-model="regForm.middle_name"
            type="text"
            class="form-input"
            placeholder="Иванович (при наличии)"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Email <span class="required">*</span></label>
          <div class="input-with-icon">
            <Mail :size="16" class="field-icon" />
            <input
              v-model="regForm.email"
              type="email"
              class="form-input with-icon"
              placeholder="ivanov@school.ru"
              required
              autocomplete="email"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Пароль <span class="required">*</span></label>
            <div class="input-with-icon">
              <Lock :size="16" class="field-icon" />
              <input
                v-model="regForm.password"
                type="password"
                class="form-input with-icon"
                placeholder="Мин. 6 символов"
                required
                minlength="6"
                autocomplete="new-password"
              />
            </div>
          </div>

          <div class="form-group" style="flex: 1;">
            <label class="form-label">Повтор пароля <span class="required">*</span></label>
            <div class="input-with-icon">
              <Lock :size="16" class="field-icon" />
              <input
                v-model="regForm.password_confirm"
                type="password"
                class="form-input with-icon"
                placeholder="Повтор пароля"
                required
                minlength="6"
                autocomplete="new-password"
              />
            </div>
          </div>
        </div>

        <button type="submit" class="btn btn-primary btn-submit" :disabled="isLoading">
          <UserPlus :size="18" />
          <span>{{ isLoading ? 'Создание учетной записи...' : 'Зарегистрироваться' }}</span>
        </button>

        <p class="terms-note">
          При регистрации для вас будет создан персональный чистый кабинет учителя.
        </p>
      </form>
    </div>
  </div>
</template>

<style scoped>
.auth-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  background: radial-gradient(circle at top, #eef2ff 0%, #f8fafc 100%);
}

.auth-card {
  width: 100%;
  max-width: 480px;
  background: white;
  border-radius: var(--radius-lg);
  border: 1px solid var(--gray-200);
  box-shadow: var(--shadow-lg);
  padding: 2.25rem 2rem;
}

.auth-header {
  text-align: center;
  margin-bottom: 1.5rem;
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
  margin-bottom: 0.85rem;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.35);
}

.brand-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: var(--gray-900);
  letter-spacing: -0.02em;
}

.brand-subtitle {
  font-size: 0.85rem;
  color: var(--gray-500);
  margin-top: 0.25rem;
}

.tab-switcher {
  display: flex;
  background: var(--gray-100);
  border-radius: var(--radius-md);
  padding: 0.3rem;
  margin-bottom: 1.5rem;
  gap: 0.35rem;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.55rem;
  border: none;
  background: transparent;
  color: var(--gray-600);
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn.active {
  background: white;
  color: var(--primary);
  box-shadow: var(--shadow-sm);
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  background: var(--danger-bg);
  border: 1px solid #fecaca;
  color: var(--danger);
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.25rem;
  font-size: 0.85rem;
}

.success-banner {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  background: var(--success-bg);
  border: 1px solid #a7f3d0;
  color: #065f46;
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-md);
  margin-bottom: 1.25rem;
  font-size: 0.85rem;
}

.banner-icon {
  flex-shrink: 0;
}

.input-with-icon {
  position: relative;
  display: flex;
  align-items: center;
}

.field-icon {
  position: absolute;
  left: 0.75rem;
  color: var(--gray-400);
  pointer-events: none;
}

.with-icon {
  padding-left: 2.35rem;
}

.required {
  color: var(--danger);
}

.btn-submit {
  width: 100%;
  padding: 0.75rem;
  margin-top: 0.5rem;
}

.terms-note {
  font-size: 0.75rem;
  color: var(--gray-400);
  text-align: center;
  margin-top: 1rem;
  line-height: 1.4;
}
</style>
