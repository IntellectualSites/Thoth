<script setup lang="ts">
import {PropType} from "vue";
import {FeatherIconNames, icons} from "feather-icons";

const props = defineProps({
  icon: {
    type: String as PropType<FeatherIconNames>,
    required: true
  }
})

const icon = icons[props.icon].toSvg()
</script>

<template>
  <span v-html="icon"></span>
</template>