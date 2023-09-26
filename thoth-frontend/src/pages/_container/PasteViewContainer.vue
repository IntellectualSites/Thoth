<script setup lang="ts">
import {useRoute, useRouter} from "vue-router";
import ApiResponseWrapper from "../../components/ApiResponseWrapper.vue";
import Error404 from "../_error/Error404.vue";
import ErrorCustomStatusCode from "../_error/ErrorCustomStatusCode.vue";
import {Paste, PasteFile} from "../../api/paste";
import {getPaste, getPasteFiles} from "../../api/paster.ts";
import FeatherIcon from "../../components/FeatherIcon.vue";
import {ref} from "vue";

const pasteId = useRoute().params.id as string

const sidebar = ref<boolean>(false)
const toggleSidebar = () => (sidebar.value = !sidebar.value);


useRouter().afterEach(() => sidebar.value = false)
</script>

<template>
  <ApiResponseWrapper :promise="getPaste(pasteId)">
    <template v-slot:success="{ response }: { response: Paste | null }">
      <Error404 v-if="!response" text="Paste not found"></Error404>

      <div class="w-full h-screen grid grid-rows-[max-content_1fr]" v-else>
        <!-- Top-Nav -->
        <nav class="h-20 bg-gray-900 flex justify-between items-center px-5">
          <a href="javascript:void(0)" class="block p-3 rounded-lg hover:bg-gray-700 lg:hidden"
             @click.prevent="toggleSidebar">
            <FeatherIcon v-if="sidebar" icon="x"></FeatherIcon>
            <FeatherIcon v-else icon="menu"></FeatherIcon>
          </a>
          <!-- Logo on >= medium device size -> Left - otherwise center -->
          <span class="flex items-center space-x-3">
            <img src="/assets/logo.svg" alt="Logo">
            <b class="text-gray-200">Thoth</b>
          </span>
          <!-- Right -->
          <a class="p-3 rounded-lg hover:bg-gray-700">
            <FeatherIcon icon="share"></FeatherIcon>
          </a>
        </nav>
        <!-- Main Content cointainer -->
        <section class="grid md:grid-cols-12 gap-5">
          <!-- Sidenav -->
          <aside
              class="col-span-3 px-4 bg-gray-900 fixed h-full lg:block lg:relative lg:w-auto lg:translate-x-0 w-6/12 transition-transform"
              :class="{'-translate-x-full': !sidebar}">
            <ul class="space-y-2 font-normal mt-4">
              <li>
                <router-link :to="`/view/${pasteId}`"
                             exact-active-class="bg-is-red hover:bg-is-red-darker"
                             class="flex items-center p-2 gap-x-5 text-gray-200 rounded-lg hover:bg-gray-700">
                  <FeatherIcon icon="home"></FeatherIcon>
                  General Information
                </router-link>
              </li>
              <ApiResponseWrapper :promise="getPasteFiles(pasteId)">
                <template v-slot:loading></template>
                <template v-slot:error></template>
                <template v-slot:success="{ response }: { response: PasteFile[] }">
                  <li>
                    <span class="text-gray-400 text-sm">Attached Files</span>
                  </li>
                  <li v-for="file in response">
                    <router-link :to="`/view/${pasteId}/${file.filename}`"
                                 exact-active-class="bg-is-red hover:bg-is-red-darker"
                                 class="flex items-center p-2 gap-x-5 text-gray-200 rounded-lg hover:bg-gray-700">
                      <FeatherIcon icon="image"></FeatherIcon>
                      {{ file.filename }}
                    </router-link>
                  </li>
                </template>
              </ApiResponseWrapper>
            </ul>
          </aside>
          <!-- Content box -->
          <main class="lg:col-span-9 col-span-full p-4 h-full">
            <router-view></router-view>
          </main>
        </section>
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
    <template v-slot:error="{ error }">
      <ErrorCustomStatusCode :status-code="500" text="Failed to fetch paste" :details="String(error)"/>
    </template>
  </ApiResponseWrapper>
</template>