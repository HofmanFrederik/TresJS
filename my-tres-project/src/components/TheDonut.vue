<script setup lang="ts">
import { ref } from 'vue'
import { useLoop } from '@tresjs/core'

// Reference to our donut mesh for animation
const donutRef = ref()

// Animation loop
const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed }) => {
  if (donutRef.value) {
    // Rotate the donut on both X and Y axes
    donutRef.value.rotation.x = elapsed * 0.5
    donutRef.value.rotation.y = elapsed * 0.3
  }
})
</script>

<template>
  <TresMesh ref="donutRef" :position="[0, 2, 0]">
    <TresTorusGeometry :args="[1, 0.4, 16, 32]" />
    <TresMeshBasicMaterial color="#ff6b35" />
  </TresMesh>
</template>
