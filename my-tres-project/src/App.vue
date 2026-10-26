<script setup lang="ts">
import { TresCanvas } from '@tresjs/core'

import TheExperience from './components/FirstExperience.vue'
import Dashboard from './components/Dashboard.vue'
</script>

<template>
  <Dashboard />
  <TresCanvas alpha :clear-alpha="0" window-size shadows>
    <TheExperience />
  </TresCanvas>
</template>
