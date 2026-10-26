<script setup lang="ts">
import { ref } from 'vue'

withDefaults(
  defineProps<{
    position?: [number, number, number]
    rotation?: [number, number, number]
    args?: [number, number, number]
    color?: string
  }>(),
  {
    position: () => [0, 0, 0],
    rotation: () => [0, 0, 0],
    args: () => [15, 0.1, 15],
    color: () => '#ff6b35',
  },
)
</script>

<template>
  <TresMesh :position="position" :rotation="rotation" cast-shadow receive-shadow>
    <TresBoxGeometry :args="args" />
    <TresMeshStandardMaterial :color="color" />
  </TresMesh>
</template>
