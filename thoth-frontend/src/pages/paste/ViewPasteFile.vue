<script setup lang="ts">

import {useRoute} from "vue-router";
import ApiResponseWrapper from "../../components/ApiResponseWrapper.vue";
import {getFile} from "../../api/paster.ts";

const pasteId = useRoute().params.id as string
const filename = useRoute().params.file as string
console.log(pasteId, filename)
</script>

<template>
  <ApiResponseWrapper :promise="getFile(pasteId, filename).then((blob: Blob) => blob.text())">
    <template v-slot:success="{response}: {response: string}">
      {{ response }}
    </template>
  </ApiResponseWrapper>
</template>

<style scoped>

</style>