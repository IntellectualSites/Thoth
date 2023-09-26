<script setup lang="ts">

import {ref} from "vue";
import {existsPaste} from "../api/paster.ts";
import {useRouter} from "vue-router";
import {useNotifications} from "../plugins/notifications.plugin.ts";

const pasteId = ref<string>("")
const router = useRouter()
const notifications = useNotifications()

const submitSearchForm = async () => {
  if (!await existsPaste(pasteId.value)) {
    notifications.show("error", "Paste not found")
    return;
  }
  await router.push(`/view/${pasteId.value}`)
}

</script>

<template>

  <div class="flex flex-col h-screen justify-between">
    <main class="mb-auto h-full flex flex-col items-center">
      <div class="flex-[1_1_30%]"></div>
      <div class="w-1/3 flex-[1_1_70%]">
        <div class="text-xl mb-4 flex flex-row gap-2 place-items-center place-content-center m-auto">
          <img class="block" src="/assets/logo.svg">
          <h2 class="text-xl font-bold">IntellectualSites</h2>
        </div>
        <form class="flex items-center" v-on:submit.prevent="submitSearchForm">
          <label for="simple-search" class="sr-only">Search</label>
          <div class="relative w-full">
            <input type="text" v-model="pasteId"
                   class="pr-5 h-12 border border-gray-600 text-sm rounded-l-lg block w-full p-2.5 bg-gray-700 placeholder-gray-400 text-gray-200"
                   placeholder="Enter Paste-ID" required>
          </div>
          <button type="submit"
                  class="h-12 w-12 p-3.5 text-sm font-medium text-white bg-is-red rounded-r-lg border border-is-red-darker hover:bg-is-red-darker">
            <svg class="w-4 h-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
            </svg>
            <span class="sr-only">Search</span>
          </button>
        </form>
      </div>
    </main>
    <footer
        class="text-sm h-14 bg-gray-900 text-gray-400 rounded-t-lg px-10 flex flex-row place-content-between place-items-center">
      <span>&copy; 2023 IntellectualSites</span>
      <div class="flex flex-row gap-5">
        <a>GitHub</a>
        <span>&bullet;</span>
        <a>Third-Party Licenses</a>
      </div>
    </footer>
  </div>

</template>