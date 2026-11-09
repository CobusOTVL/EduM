import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '../types';
import { StorageService, defaultUser } from '../utils/storage';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(StorageService.getUser());
  const token = ref<string | null>(StorageService.getToken());

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  async function login(username: string, password: string): Promise<boolean> {
    // Демонстрационная авторизация, совместимая с будущим JWT-эндпоинтом
    if (!username.trim() || !password.trim()) {
      throw new Error('Укажите логин и пароль');
    }

    // Сохраняем пользователя и токен
    const loggedUser: User = {
      ...defaultUser,
      username: username.trim(),
    };
    const mockJwt = 'mock-jwt-token-' + Date.now();

    user.value = loggedUser;
    token.value = mockJwt;

    StorageService.saveUser(loggedUser);
    StorageService.saveToken(mockJwt);

    return true;
  }

  function logout() {
    user.value = null;
    token.value = null;
    StorageService.saveUser(null);
    StorageService.saveToken(null);
  }

  return {
    user,
    token,
    isAuthenticated,
    login,
    logout,
  };
});
