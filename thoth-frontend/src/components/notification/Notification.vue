<script setup lang="ts">
import {PropType} from "vue";
import {NotificationType} from "../../plugins/notifications.plugin.ts";

const ICON_SUCCESS = `<!-- https://feathericons.dev/?search=check-circle&iconset=feather -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" class="main-grid-item-icon" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
  <polyline points="22 4 12 14.01 9 11.01" />
</svg>`

const ICON_WARN = `<!-- https://feathericons.dev/?search=alert-circle&iconset=feather -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" class="main-grid-item-icon" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
  <circle cx="12" cy="12" r="10" />
  <line x1="12" x2="12" y1="8" y2="12" />
  <line x1="12" x2="12.01" y1="16" y2="16" />
</svg>`

const ICON_ERROR = `<!-- https://feathericons.dev/?search=xcircle&iconset=feather -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" class="main-grid-item-icon" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
  <circle cx="12" cy="12" r="10" />
  <line x1="15" x2="9" y1="9" y2="15" />
  <line x1="9" x2="15" y1="9" y2="15" />
</svg>`

const ICON_INFO = `<!-- https://feathericons.dev/?search=info&iconset=feather -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" class="main-grid-item-icon" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
  <circle cx="12" cy="12" r="10" />
  <line x1="12" x2="12" y1="16" y2="12" />
  <line x1="12" x2="12.01" y1="8" y2="8" />
</svg>`

const NOTIFICATION_TYPES: { [key in NotificationType]: { textClass: string, backgroundClass: string, icon: string } } = {
  'success': {textClass: 'text-green-500', backgroundClass: 'bg-green-500', icon: ICON_SUCCESS},
  'warn': {textClass: 'text-orange-500', backgroundClass: 'bg-orange-500', icon: ICON_WARN},
  'error': {textClass: 'text-red-500', backgroundClass: 'bg-red-500', icon: ICON_ERROR},
  'info': {textClass: 'text-blue-500', backgroundClass: 'bg-blue-500', icon: ICON_INFO},
}

const props = defineProps({
  type: {
    default: 'info',
    type: String as PropType<keyof typeof NOTIFICATION_TYPES>,
  },
  text: {
    type: String,
    required: true
  }
})

const emits = defineEmits(['close'])
</script>

<template>

  <div class="w-full rounded-lg shadow overflow-hidden">
    <div class="flex items-center text-gray-200 bg-gray-900 p-4" role="alert">
      <div
          class="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg dark:bg-blue-800 text-gray-200"
          :class="NOTIFICATION_TYPES[props.type].backgroundClass"
      >
        <div v-html="NOTIFICATION_TYPES[props.type].icon"></div>
      </div>
      <div class="ml-3 text-sm font-normal">{{ props.text }}</div>
      <button type="button" @click="emits('close')"
              class="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 inline-flex items-center justify-center h-8 w-8 text-gray-200 hover:text-white bg-gray-800 hover:bg-gray-700">
        <!-- https://feathericons.dev/?search=x&iconset=feather -->
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" class="main-grid-item-icon"
             fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
          <line x1="18" x2="6" y1="6" y2="18"/>
          <line x1="6" x2="18" y1="6" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="border-b-2 border-is-red notification-border-animation"></div>
  </div>
</template>

<style>
.notification-border-animation {
  animation: notification-border 10s linear;
}

@keyframes notification-border {
  0% {
    width: 100%
  }
  100% {
    width: 0
  }
}
</style>