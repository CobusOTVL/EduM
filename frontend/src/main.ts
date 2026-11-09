import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { initLocalStorage } from './utils/storage';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);

// Инициализируем хранилище демо-данными при первом запуске
initLocalStorage();

app.use(router);

app.mount('#app');
