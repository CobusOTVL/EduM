<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { X } from 'lucide-vue-next';

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    title: string;
    maxWidth?: string;
  }>(),
  {
    maxWidth: '550px',
  }
);

const emit = defineEmits<{
  (e: 'close'): void;
}>();

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close');
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="emit('close')">
    <div class="modal-card" :style="{ maxWidth }">
      <div class="modal-header">
        <h3 class="modal-title">{{ title }}</h3>
        <button class="btn-close" @click="emit('close')" aria-label="Закрыть">
          <X :size="20" />
        </button>
      </div>
      <div class="modal-body">
        <slot></slot>
      </div>
      <div v-if="$slots.footer" class="modal-footer">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}

.modal-card {
  width: 100%;
  background: white;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  animation: modal-pop 0.18s ease-out;
}

@keyframes modal-pop {
  from {
    transform: scale(0.96);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.modal-header {
  padding: 1.15rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--gray-200);
}

.modal-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--gray-900);
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--gray-400);
  border-radius: var(--radius-sm);
  display: flex;
  padding: 0.25rem;
  transition: all 0.15s;
}

.btn-close:hover {
  background: var(--gray-100);
  color: var(--gray-700);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--gray-200);
  background: var(--gray-50);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}
</style>
