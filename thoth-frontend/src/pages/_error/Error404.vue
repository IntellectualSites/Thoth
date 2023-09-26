<script setup lang="ts">
import ErrorCustomStatusCode from "./ErrorCustomStatusCode.vue";

const props = defineProps({
  text: {
    type: String,
    default: "Page not found"
  }
})
</script>

<template>
  <ErrorCustomStatusCode :status-code="400" :text="props.text"/>
</template>