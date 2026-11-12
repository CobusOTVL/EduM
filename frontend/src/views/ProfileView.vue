<script setup lang="ts">
import { ref, computed } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useClassesStore } from '../stores/classes';
import { useMockTestsStore } from '../stores/mockTests';
import {
  User,
  Mail,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Users,
  FileCheck2,
  GraduationCap,
  Calendar,
  Building,
  BookOpen,
  Phone,
  FileText,
  Lock,
  Edit3
} from 'lucide-vue-next';

const authStore = useAuthStore();
const classesStore = useClassesStore();
const mockTestsStore = useMockTestsStore();

const isEditing = ref(false);
const saveSuccess = ref(false);
const errorMessage = ref('');

// Форма редактирования личных данных
const form = ref({
  lastName: authStore.user?.lastName || '',
  firstName: authStore.user?.firstName || '',
  middleName: authStore.user?.middleName || '',
  email: authStore.user?.email || '',
  role: authStore.user?.role || 'Учитель',
  subject: authStore.user?.subject || '',
  school: authStore.user?.school || '',
  phone: authStore.user?.phone || '',
  bio: authStore.user?.bio || '',
});

// Блок смены пароля
const showPasswordChange = ref(false);
const passForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});
const passSuccess = ref(false);
const passError = ref('');

// Инициалы для аватара
const initials = computed(() => {
  const last = form.value.lastName?.[0] || authStore.user?.lastName?.[0] || 'E';
  const first = form.value.firstName?.[0] || authStore.user?.firstName?.[0] || 'M';
  return (last + first).toUpperCase();
});

// Полное ФИО
const displayFullName = computed(() => {
  return [form.value.lastName, form.value.firstName, form.value.middleName]
    .filter(Boolean)
    .join(' ') || authStore.userFullName || 'Преподаватель';
});

// Статистика преподавателя
const totalClasses = computed(() => classesStore.classes.length);
const totalStudents = computed(() => classesStore.students.length);
const totalTests = computed(() => mockTestsStore.mockTests.length);

function startEditing() {
  form.value = {
    lastName: authStore.user?.lastName || '',
    firstName: authStore.user?.firstName || '',
    middleName: authStore.user?.middleName || '',
    email: authStore.user?.email || '',
    role: authStore.user?.role || 'Учитель',
    subject: authStore.user?.subject || '',
    school: authStore.user?.school || '',
    phone: authStore.user?.phone || '',
    bio: authStore.user?.bio || '',
  };
  isEditing.value = true;
  saveSuccess.value = false;
  errorMessage.value = '';
}

function handleSaveProfile() {
  errorMessage.value = '';
  try {
    authStore.updateProfile({
      lastName: form.value.lastName,
      firstName: form.value.firstName,
      middleName: form.value.middleName,
      email: form.value.email,
      role: form.value.role,
      subject: form.value.subject,
      school: form.value.school,
      phone: form.value.phone,
      bio: form.value.bio,
    });
    isEditing.value = false;
    saveSuccess.value = true;
    setTimeout(() => {
      saveSuccess.value = false;
    }, 3500);
  } catch (err: any) {
    errorMessage.value = err.message || 'Ошибка сохранения профиля';
  }
}

function handleChangePassword() {
  passError.value = '';
  passSuccess.value = false;

  if (!passForm.value.newPassword) {
    passError.value = 'Пожалуйста, введите новый пароль';
    return;
  }
  if (passForm.value.newPassword.length < 6) {
    passError.value = 'Новый пароль должен содержать минимум 6 символов';
    return;
  }
  if (passForm.value.newPassword !== passForm.value.confirmPassword) {
    passError.value = 'Подтверждение пароля не совпадает';
    return;
  }

  // Обновляем пароль в хранилище пользователя
  if (authStore.user) {
    authStore.updateProfile({
      ...authStore.user,
      password: passForm.value.newPassword,
    });
  }

  passSuccess.value = true;
  passForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' };
  setTimeout(() => {
    passSuccess.value = false;
    showPasswordChange.value = false;
  }, 2500);
}
</script>

<template>
  <div class="profile-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">Мой профиль</h1>
        <p class="page-subtitle">Просмотр и редактирование личных данных преподавателя в EduMetric</p>
      </div>

      <div class="header-actions">
        <button v-if="!isEditing" class="btn btn-primary" @click="startEditing">
          <Edit3 :size="16" />
          <span>Редактировать профиль</span>
        </button>
        <button v-else class="btn btn-secondary" @click="isEditing = false">
          Отменить редактирование
        </button>
      </div>
    </div>

    <!-- Баннер успешного сохранения -->
    <div v-if="saveSuccess" class="alert-success-banner">
      <CheckCircle2 :size="20" />
      <div>
        <strong>Данные обновлены!</strong>
        <span> Изменения профиля успешно сохранены в системе.</span>
      </div>
    </div>

    <!-- Баннер ошибки -->
    <div v-if="errorMessage" class="error-banner">
      <AlertCircle :size="18" />
      <span>{{ errorMessage }}</span>
    </div>

    <div class="profile-layout">
      <!-- Левая колонка: Визитка преподавателя -->
      <div class="card profile-card">
        <div class="avatar-large">
          <span>{{ initials }}</span>
        </div>

        <h2 class="profile-fullname">{{ displayFullName }}</h2>
        <span class="badge badge-primary profile-role-badge">
          <ShieldCheck :size="14" /> {{ authStore.user?.role || 'Учитель' }}
        </span>

        <div class="profile-meta-list">
          <div class="meta-item">
            <Mail :size="16" class="meta-icon" />
            <span class="meta-text">{{ authStore.user?.email || 'Не указан' }}</span>
          </div>

          <div v-if="authStore.user?.subject" class="meta-item">
            <BookOpen :size="16" class="meta-icon" />
            <span class="meta-text">{{ authStore.user.subject }}</span>
          </div>

          <div v-if="authStore.user?.school" class="meta-item">
            <Building :size="16" class="meta-icon" />
            <span class="meta-text">{{ authStore.user.school }}</span>
          </div>

          <div v-if="authStore.user?.phone" class="meta-item">
            <Phone :size="16" class="meta-icon" />
            <span class="meta-text">{{ authStore.user.phone }}</span>
          </div>

          <div class="meta-item">
            <GraduationCap :size="16" class="meta-icon" />
            <span class="meta-text">EduMetric Преподаватель</span>
          </div>
        </div>

        <div class="profile-card-actions">
          <button v-if="!isEditing" class="btn btn-secondary btn-block" @click="startEditing">
            <Edit3 :size="16" /> Редактировать инфо
          </button>
          <button
            class="btn btn-secondary btn-block"
            style="margin-top: 0.5rem;"
            @click="showPasswordChange = !showPasswordChange"
          >
            <Lock :size="16" />
            <span>{{ showPasswordChange ? 'Скрыть смену пароля' : 'Изменить пароль' }}</span>
          </button>
        </div>
      </div>

      <!-- Правая колонка: Форма редактирования личных данных и сводка -->
      <div class="profile-details-column">
        <!-- Блок: Личные данные (ФИО и контакты) -->
        <div class="card details-card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Информация о преподавателе</h3>
              <p class="card-subtitle">ФИО, специализация, контакты и учебное заведение</p>
            </div>
            <span v-if="!isEditing" class="badge badge-gray">Режим просмотра</span>
            <span v-else class="badge badge-warning">Редактирование</span>
          </div>

          <form @submit.prevent="handleSaveProfile" class="profile-form">
            <!-- ФИО -->
            <div class="form-row">
              <div class="form-group" style="flex: 1;">
                <label class="form-label">Фамилия <span class="text-danger">*</span></label>
                <input
                  v-model="form.lastName"
                  type="text"
                  class="form-input"
                  :disabled="!isEditing"
                  placeholder="Фамилия"
                  required
                />
              </div>

              <div class="form-group" style="flex: 1;">
                <label class="form-label">Имя <span class="text-danger">*</span></label>
                <input
                  v-model="form.firstName"
                  type="text"
                  class="form-input"
                  :disabled="!isEditing"
                  placeholder="Имя"
                  required
                />
              </div>

              <div class="form-group" style="flex: 1;">
                <label class="form-label">Отчество</label>
                <input
                  v-model="form.middleName"
                  type="text"
                  class="form-input"
                  :disabled="!isEditing"
                  placeholder="Отчество"
                />
              </div>
            </div>

            <!-- Email и Телефон -->
            <div class="form-row">
              <div class="form-group" style="flex: 1;">
                <label class="form-label">Email <span class="text-danger">*</span></label>
                <input
                  v-model="form.email"
                  type="email"
                  class="form-input"
                  :disabled="!isEditing"
                  placeholder="name@school.ru"
                  required
                />
              </div>

              <div class="form-group" style="flex: 1;">
                <label class="form-label">Контактный телефон</label>
                <input
                  v-model="form.phone"
                  type="text"
                  class="form-input"
                  :disabled="!isEditing"
                  placeholder="+7 (999) 000-00-00"
                />
              </div>
            </div>

            <!-- Должность и Предмет -->
            <div class="form-row">
              <div class="form-group" style="flex: 1;">
                <label class="form-label">Должность / Квалификация</label>
                <input
                  v-model="form.role"
                  type="text"
                  class="form-input"
                  :disabled="!isEditing"
                  placeholder="Учитель математики высшей категории"
                />
              </div>

              <div class="form-group" style="flex: 1;">
                <label class="form-label">Основной предмет</label>
                <input
                  v-model="form.subject"
                  type="text"
                  class="form-input"
                  :disabled="!isEditing"
                  placeholder="Математика (профиль), Информатика"
                />
              </div>
            </div>

            <!-- Школа -->
            <div class="form-group">
              <label class="form-label">Образовательное учреждение</label>
              <input
                v-model="form.school"
                type="text"
                class="form-input"
                :disabled="!isEditing"
                placeholder="МБОУ Никифоровская СОШ №1 имени Героя Российской Федерации А.С.Досягаева"
              />
            </div>

            <!-- О себе -->
            <div class="form-group">
              <label class="form-label">О себе / Педагогический профиль</label>
              <textarea
                v-model="form.bio"
                class="form-textarea"
                rows="3"
                :disabled="!isEditing"
                placeholder="Расскажите о своем опыте подготовки к экзаменам, олимпиадам и методиках работы"
              ></textarea>
            </div>

            <div v-if="isEditing" class="form-actions-bar">
              <button type="button" class="btn btn-secondary" @click="isEditing = false">
                Отмена
              </button>
              <button type="submit" class="btn btn-primary">
                <Save :size="16" />
                <span>Сохранить изменения</span>
              </button>
            </div>
          </form>
        </div>

        <!-- Форма смены пароля (раскрывающаяся) -->
        <div v-if="showPasswordChange" class="card password-card">
          <div class="card-header">
            <div>
              <h3 class="card-title">Смена пароля учетной записи</h3>
              <p class="card-subtitle">Задайте новый пароль для входа в систему EduMetric</p>
            </div>
            <Lock :size="20" class="text-primary" />
          </div>

          <div v-if="passSuccess" class="alert-success-banner" style="margin-bottom: 1rem;">
            <CheckCircle2 :size="18" />
            <span>Пароль успешно изменен!</span>
          </div>

          <div v-if="passError" class="error-banner" style="margin-bottom: 1rem;">
            <AlertCircle :size="18" />
            <span>{{ passError }}</span>
          </div>

          <form @submit.prevent="handleChangePassword">
            <div class="form-row">
              <div class="form-group" style="flex: 1;">
                <label class="form-label">Новый пароль</label>
                <input
                  v-model="passForm.newPassword"
                  type="password"
                  class="form-input"
                  placeholder="Мин. 6 символов"
                  required
                  minlength="6"
                />
              </div>

              <div class="form-group" style="flex: 1;">
                <label class="form-label">Подтверждение пароля</label>
                <input
                  v-model="passForm.confirmPassword"
                  type="password"
                  class="form-input"
                  placeholder="Повторите новый пароль"
                  required
                  minlength="6"
                />
              </div>
            </div>

            <div class="form-actions-bar">
              <button type="button" class="btn btn-secondary btn-sm" @click="showPasswordChange = false">
                Скрыть
              </button>
              <button type="submit" class="btn btn-primary btn-sm">
                Обновить пароль
              </button>
            </div>
          </form>
        </div>

        <!-- Карточка: Сводка куратора -->
        <div class="card summary-card">
          <div class="card-header">
            <h3 class="card-title">Сводка по учебному процессу</h3>
          </div>

          <div class="stats-row">
            <div class="stat-box">
              <div class="stat-header">
                <span class="stat-title">Классов</span>
                <Users :size="18" class="stat-icon" />
              </div>
              <span class="stat-value text-primary">{{ totalClasses }}</span>
              <span class="stat-hint">Под кураторством</span>
            </div>

            <div class="stat-box">
              <div class="stat-header">
                <span class="stat-title">Учеников</span>
                <User :size="18" class="stat-icon" />
              </div>
              <span class="stat-value">{{ totalStudents }}</span>
              <span class="stat-hint">В списках классов</span>
            </div>

            <div class="stat-box">
              <div class="stat-header">
                <span class="stat-title">Пробников</span>
                <FileCheck2 :size="18" class="stat-icon" />
              </div>
              <span class="stat-value">{{ totalTests }}</span>
              <span class="stat-hint">Проведено срезов</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
}

.error-banner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--danger-bg);
  border: 1px solid #fecaca;
  color: var(--danger);
  padding: 0.75rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.85rem;
}

.profile-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 1.5rem;
  align-items: flex-start;
}

@media (max-width: 900px) {
  .profile-layout {
    grid-template-columns: 1fr;
  }
}

.profile-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem 1.5rem;
}

.avatar-large {
  width: 88px;
  height: 88px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  font-size: 2rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);
  margin-bottom: 1rem;
}

.profile-fullname {
  font-size: 1.35rem;
  font-weight: 800;
  color: var(--gray-900);
  line-height: 1.3;
}

.profile-role-badge {
  margin-top: 0.5rem;
  margin-bottom: 1.5rem;
  padding: 0.35rem 0.75rem;
}

.profile-meta-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--gray-100);
  text-align: left;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  font-size: 0.85rem;
  color: var(--gray-600);
}

.meta-icon {
  color: var(--primary);
  flex-shrink: 0;
}

.profile-card-actions {
  width: 100%;
  margin-top: 1.5rem;
}

.btn-block {
  width: 100%;
}

.profile-details-column {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--gray-100);
}

.card-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--gray-900);
}

.card-subtitle {
  font-size: 0.8rem;
  color: var(--gray-500);
  margin-top: 0.2rem;
}

.profile-form {
  display: flex;
  flex-direction: column;
}

.form-actions-bar {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--gray-100);
}

.password-card {
  border-color: #c7d2fe;
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
</style>
