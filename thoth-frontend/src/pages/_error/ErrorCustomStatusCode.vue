<script setup lang="ts">
const props = defineProps({
  statusCode: {
    type: Number,
    required: true
  },
  text: {
    type: String,
    default: "Page not found"
  },
  details: {
    type: String,
    required: false
  }
})
</script>

<template>
  <div class="grid h-screen w-screen bg-gray-800 place-content-center">
    <div class="text-center">
      <h1 class="font-black text-gray-200 text-9xl">{{ props.statusCode }}</h1>
      <p class="mt-4 text-gray-400">{{ props.text }}</p>
      <p v-if="!!details" class=" text-gray-500">
        {{ props.details }}
      </p>
      <router-link
          to="/"
          class="inline-block px-5 py-3 mt-10 text-sm font-medium text-white bg-is-red rounded hover:bg-is-red-darker focus:outline-none focus:ring"
      >
        Go Back Home
      </router-link>
    </div>
  </div>
</template>