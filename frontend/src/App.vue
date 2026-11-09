<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import Navbar from './components/Navbar.vue';

const route = useRoute();
const showNavbar = computed(() => route.path !== '/login');
</script>

<template>
  <div class="app-container">
    <Navbar v-if="showNavbar" />
    <main :class="{ 'main-content': showNavbar }">
      <router-view />
    </main>
  </div>
</template>

<style>
@import './assets/main.css';
</style>
