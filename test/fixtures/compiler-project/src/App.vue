<script setup lang="ts">
import { computed } from "vue";

const message = computed(() => "hi");
</script>

<template>
  <div>{{ message }}</div>
</template>
