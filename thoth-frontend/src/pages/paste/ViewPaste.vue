<script setup lang="ts">
import {getPaste, getPasteMetadata} from "../../api/paster.ts";
import {
  CustomEnvironmentMetadata,
  CustomMetadataValueType,
  Paste,
  PredefinedEnvironmentMetadata
} from "../../api/paste";
import ApiResponseWrapper from "../../components/ApiResponseWrapper.vue";
import {useRoute} from "vue-router";

const pasteId = useRoute().params.id as string

const indexPromise = Promise.all([getPaste(pasteId), getPasteMetadata(pasteId)])

const getCustomMetadata = (all: PredefinedEnvironmentMetadata & CustomEnvironmentMetadata): CustomEnvironmentMetadata => {
  return Object.entries(all).filter(entry => entry[0] !== "operatingSystem" && entry[0] !== "javaVirtualMachine")
      .map(entry => ({[entry[0]]: entry[1] as CustomMetadataValueType}))
      .reduce((left, right) => ({...left, ...right}), {})
}

</script>

<template>
  <ApiResponseWrapper :promise="indexPromise">
    <template
        v-slot:success="{ response }: { response: [Paste | null, (PredefinedEnvironmentMetadata & CustomEnvironmentMetadata)] }">
      <ul class="list-disc list-inside">
        <li><b>Application:</b> {{ response[0]?.application.name }} ({{ response[0]?.application.version }})</li>
        <li v-for="meta in Object.entries(getCustomMetadata(response[1]))">
          <b>{{ meta[0] }}:</b>
          <ul class="list-disc list-inside pl-3" v-if="Array.isArray(meta[1])">
            <li v-for="entry in (meta[1] as [])">
              {{ entry }}
            </li>
          </ul>
          <template v-else>{{ meta[1] }}</template>
        </li>
      </ul>
    </template>
  </ApiResponseWrapper>
</template>