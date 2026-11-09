<script setup lang="ts">
import { computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import {
  GraduationCap,
  Users,
  FileCheck2,
  BarChart3,
  History,
  LayoutDashboard,
  LogOut,
  UserCheck
} from 'lucide-vue-next';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const navItems = [
  { path: '/', label: 'Главная', icon: LayoutDashboard },
  { path: '/classes', label: 'Классы', icon: Users },
  { path: '/mock-tests', label: 'Пробники', icon: FileCheck2 },
  { path: '/analytics', label: 'Аналитика', icon: BarChart3 },
  { path: '/history', label: 'История', icon: History },
];

const currentPath = computed(() => route.path);

function handleLogout() {
  authStore.logout();
  router.push('/login');
}
</script>

<template>
  <header class="navbar">
    <div class="nav-container">
      <div class="nav-left">
        <router-link to="/" class="logo">
          <div class="logo-icon">
            <GraduationCap :size="24" />
          </div>
          <div class="logo-text">
            <span class="logo-title">ЕГЭ-Пробники</span>
            <span class="logo-subtitle">Учет и аналитика</span>
          </div>
        </router-link>

        <nav class="nav-links">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="nav-link"
            :class="{ active: currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path)) }"
          >
            <component :is="item.icon" :size="18" />
            <span>{{ item.label }}</span>
          </router-link>
        </nav>
      </div>

      <div class="nav-right">
        <div v-if="authStore.user" class="user-info">
          <div class="user-avatar">
            <UserCheck :size="18" />
          </div>
          <div class="user-details">
            <span class="user-name">{{ authStore.user.name }}</span>
            <span class="user-role">Учитель</span>
          </div>
          <button class="btn btn-secondary btn-sm logout-btn" @click="handleLogout" title="Выйти из аккаунта">
            <LogOut :size="16" />
            <span>Выйти</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.navbar {
  background: white;
  border-bottom: 1px solid var(--gray-200);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  z-index: 50;
}

.nav-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 2.5rem;
}

.logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
}

.logo-icon {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-md);
  background: var(--primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(79, 70, 229, 0.35);
}

.logo-text {
  display: flex;
  flex-direction: column;
}

.logo-title {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--gray-900);
  line-height: 1.2;
}

.logo-subtitle {
  font-size: 0.72rem;
  color: var(--gray-400);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.85rem;
  border-radius: var(--radius-md);
  color: var(--gray-600);
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: all 0.15s ease;
}

.nav-link:hover {
  background: var(--gray-100);
  color: var(--gray-900);
  text-decoration: none;
}

.nav-link.active {
  background: var(--primary-light);
  color: var(--primary-dark);
  font-weight: 600;
}

.nav-right {
  display: flex;
  align-items: center;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: var(--radius-full);
  background: var(--gray-100);
  color: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-details {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.user-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--gray-800);
}

.user-role {
  font-size: 0.75rem;
  color: var(--gray-400);
}

.logout-btn {
  margin-left: 0.5rem;
}

@media (max-width: 900px) {
  .logo-text,
  .user-details {
    display: none;
  }
  .nav-left {
    gap: 1rem;
  }
  .nav-link span {
    display: none;
  }
}
</style>
