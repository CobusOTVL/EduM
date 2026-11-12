import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, RegisterData } from '../types';
import { StorageService, defaultUser, adminUser } from '../utils/storage';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(StorageService.getUser());
  const token = ref<string | null>(StorageService.getToken());

  const isAuthenticated = computed(() => !!token.value && !!user.value);

  const userFullName = computed(() => {
    if (!user.value) return '';
    if (user.value.lastName || user.value.firstName) {
      return [user.value.lastName, user.value.firstName, user.value.middleName]
        .filter(Boolean)
        .join(' ');
    }
    return user.value.name || 'Пользователь';
  });

  async function login(emailOrLogin: string, password: string): Promise<boolean> {
    const cleanLogin = emailOrLogin.trim();
    const cleanPass = password.trim();

    if (!cleanLogin || !cleanPass) {
      throw new Error('Укажите email/логин и пароль');
    }

    const registeredUsers = StorageService.getRegisteredUsers();
    let found: User | undefined = registeredUsers.find(
      (u) =>
        u.email.toLowerCase() === cleanLogin.toLowerCase() ||
        (u.username && u.username.toLowerCase() === cleanLogin.toLowerCase())
    );

    if (!found) {
      if (cleanLogin.toLowerCase() === 'teacher' || cleanLogin.toLowerCase() === 'teacher@edumetric.ru') {
        found = defaultUser;
      } else if (cleanLogin.toLowerCase() === 'admin' || cleanLogin.toLowerCase() === 'admin@edumetric.ru') {
        found = adminUser;
      } else {
        throw new Error('Пользователь с указанным email/логином не найден. Пожалуйста, зарегистрируйтесь');
      }
    }

    // Проверка пароля
    const expectedPassword = found.password || (found.username === 'admin' ? 'admin123' : 'teacher123');
    if (expectedPassword !== cleanPass) {
      throw new Error('Неверный пароль. Пожалуйста, проверьте ввод');
    }

    const mockJwt = 'mock-jwt-token-' + Date.now();
    user.value = found;
    token.value = mockJwt;

    StorageService.saveUser(found);
    StorageService.saveToken(mockJwt);

    return true;
  }

  async function register(data: RegisterData): Promise<boolean> {
    const email = data.email.trim();
    const password = data.password.trim();
    const passwordConfirm = data.password_confirm.trim();
    const firstName = data.first_name.trim();
    const lastName = data.last_name.trim();
    const middleName = data.middle_name?.trim() || '';

    // Валидация
    if (!email) throw new Error('Пожалуйста, укажите Email');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Введите корректный адрес электронной почты');
    }
    if (!lastName) throw new Error('Пожалуйста, укажите фамилию');
    if (!firstName) throw new Error('Пожалуйста, укажите имя');
    if (!password) throw new Error('Пожалуйста, задайте пароль');
    if (password.length < 6) {
      throw new Error('Пароль должен содержать не менее 6 символов');
    }
    if (password !== passwordConfirm) {
      throw new Error('Пароли не совпадают. Проверьте подтверждение пароля');
    }

    const registeredUsers = StorageService.getRegisteredUsers();
    const existing = registeredUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('Пользователь с таким Email уже зарегистрирован. Пожалуйста, выполните вход');
    }

    const fullName = [lastName, firstName, middleName].filter(Boolean).join(' ');
    const usernamePart = email.split('@')[0] || 'user';

    const newUser: User = {
      id: 'usr-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      username: usernamePart,
      email,
      firstName,
      lastName,
      middleName,
      name: fullName,
      role: 'Учитель',
      password,
    };

    registeredUsers.push(newUser);
    StorageService.saveRegisteredUsers(registeredUsers);

    const mockJwt = 'mock-jwt-token-' + Date.now();
    user.value = newUser;
    token.value = mockJwt;

    StorageService.saveUser(newUser);
    StorageService.saveToken(mockJwt);

    return true;
  }

  function updateProfile(data: Partial<User>) {
    if (!user.value) return;

    const firstName = data.firstName !== undefined ? data.firstName.trim() : user.value.firstName;
    const lastName = data.lastName !== undefined ? data.lastName.trim() : user.value.lastName;
    const middleName = data.middleName !== undefined ? data.middleName.trim() : (user.value.middleName || '');
    const email = data.email ? data.email.trim() : user.value.email;
    const role = data.role !== undefined ? data.role : user.value.role;
    const subject = data.subject !== undefined ? data.subject : user.value.subject;
    const school = data.school !== undefined ? data.school : user.value.school;
    const phone = data.phone !== undefined ? data.phone : user.value.phone;
    const bio = data.bio !== undefined ? data.bio : user.value.bio;
    const password = data.password !== undefined ? data.password : user.value.password;

    if (!lastName || !firstName) {
      throw new Error('Имя и фамилия обязательны для заполнения');
    }

    const fullName = [lastName, firstName, middleName].filter(Boolean).join(' ');

    const updatedUser: User = {
      ...user.value,
      firstName,
      lastName,
      middleName,
      email,
      role,
      subject,
      school,
      phone,
      bio,
      password,
      name: fullName,
    };

    user.value = updatedUser;
    StorageService.saveUser(updatedUser);

    // Обновляем также в списке зарегистрированных пользователей
    const registeredUsers = StorageService.getRegisteredUsers();
    const idx = registeredUsers.findIndex((u) => u.id === updatedUser.id);
    if (idx !== -1) {
      registeredUsers[idx] = updatedUser;
      StorageService.saveRegisteredUsers(registeredUsers);
    }
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
    userFullName,
    login,
    register,
    updateProfile,
    logout,
  };
});
