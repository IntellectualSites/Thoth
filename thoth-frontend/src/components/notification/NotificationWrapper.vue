<script setup lang="ts">
import {emitter, NotificationType} from "../../plugins/notifications.plugin.ts";
import Notification from "./Notification.vue";
import {ref} from "vue";

type NotificationStruct = { id: number, type: NotificationType, text: string }

let id = 0;
const notifications = ref<NotificationStruct[]>([])
const timers: { [id: number]: number } = []

const close = (id: number) => {
  notifications.value = notifications.value.filter(shown => shown.id !== id)
  if (!!timers[id]) {
    delete timers[id]
  }
}

emitter.on('add', event => {
  const currentId = id++
  timers[currentId] = setTimeout(() => {
    close(currentId)
  }, 1000 * 10)
  notifications.value.push({
    id: currentId,
    text: event.text,
    type: event.type
  })
})
</script>

<template>
  <div class="absolute top-0 right-0 w-full lg:w-4/12 md:w-6/12">
    <div class="grid grid-cols-1 gap-y-2 m-4">
      <Notification v-for="notification in notifications"
                    :text="notification.text"
                    :type="notification.type"
                    @close="() => close(notification.id)"/>
    </div>
  </div>
</template>