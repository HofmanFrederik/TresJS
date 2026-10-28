<script setup lang="ts">
import { feest } from '../composables/useFeest'

// Lange zijde = lokale z-as, zelfde oriëntatie als Muur
withDefaults(
  defineProps<{
    position?: [number, number, number]
    rotation?: [number, number, number]
    width?: number
    height?: number
    cols?: number
    rows?: number
  }>(),
  {
    position: () => [0, 0, 0],
    rotation: () => [0, 0, 0],
    width: 1.8,
    height: 2.2,
    cols: 2,
    rows: 3,
  },
)

const frame = 0.12
const depth = 0.2
</script>

<template>
  <TresGroup :position="position" :rotation="rotation">
    <!-- Glas -->
    <TresMesh>
      <TresBoxGeometry :args="[0.04, height, width]" />
      <TresMeshStandardMaterial
        :color="feest.aan ? '#FFD98A' : '#9FC4E0'"
        transparent
        :opacity="feest.aan ? 0.9 : 0.55"
        :roughness="0.1"
        emissive="#FFB347"
        :emissive-intensity="feest.aan ? 0.9 : 0"
      />
    </TresMesh>

    <!-- Kader -->
    <TresMesh :position="[0, height / 2 - frame / 2, 0]" cast-shadow>
      <TresBoxGeometry :args="[depth, frame, width]" />
      <TresMeshStandardMaterial color="#FFFFFF" />
    </TresMesh>
    <TresMesh :position="[0, -height / 2 + frame / 2, 0]" cast-shadow>
      <TresBoxGeometry :args="[depth, frame, width]" />
      <TresMeshStandardMaterial color="#FFFFFF" />
    </TresMesh>
    <TresMesh :position="[0, 0, width / 2 - frame / 2]" cast-shadow>
      <TresBoxGeometry :args="[depth, height, frame]" />
      <TresMeshStandardMaterial color="#FFFFFF" />
    </TresMesh>
    <TresMesh :position="[0, 0, -width / 2 + frame / 2]" cast-shadow>
      <TresBoxGeometry :args="[depth, height, frame]" />
      <TresMeshStandardMaterial color="#FFFFFF" />
    </TresMesh>

    <!-- Sprossen -->
    <TresMesh v-for="i in cols - 1" :key="`c${i}`" :position="[0, 0, -width / 2 + (i * width) / cols]">
      <TresBoxGeometry :args="[depth * 0.7, height, frame * 0.5]" />
      <TresMeshStandardMaterial color="#FFFFFF" />
    </TresMesh>
    <TresMesh v-for="i in rows - 1" :key="`r${i}`" :position="[0, -height / 2 + (i * height) / rows, 0]">
      <TresBoxGeometry :args="[depth * 0.7, frame * 0.5, width]" />
      <TresMeshStandardMaterial color="#FFFFFF" />
    </TresMesh>

    <!-- Vensterbank -->
    <TresMesh :position="[0.12, -height / 2 - 0.05, 0]" cast-shadow>
      <TresBoxGeometry :args="[0.4, 0.1, width + 0.3]" />
      <TresMeshStandardMaterial color="#EDE8D8" />
    </TresMesh>
  </TresGroup>
</template>
