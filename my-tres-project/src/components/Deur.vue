<script setup lang="ts">
// Lange zijde = lokale z-as, zelfde oriëntatie als Muur
withDefaults(
  defineProps<{
    position?: [number, number, number]
    rotation?: [number, number, number]
    width?: number
    height?: number
  }>(),
  {
    position: () => [0, 0, 0],
    rotation: () => [0, 0, 0],
    width: 2,
    height: 3.5,
  },
)

const frame = 0.12
const depth = 0.2
</script>

<template>
  <TresGroup :position="position" :rotation="rotation">
    <!-- Deurblad -->
    <TresMesh cast-shadow>
      <TresBoxGeometry :args="[0.08, height - frame, width - frame * 2]" />
      <TresMeshStandardMaterial color="#A5432B" />
    </TresMesh>

    <!-- Kader -->
    <TresMesh :position="[0, height / 2 - frame / 2, 0]" cast-shadow>
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

    <!-- Paneel -->
    <TresMesh :position="[0.05, 0.6, 0]">
      <TresBoxGeometry :args="[0.04, height * 0.35, width * 0.6]" />
      <TresMeshStandardMaterial color="#8F3823" />
    </TresMesh>
    <TresMesh :position="[0.05, -0.9, 0]">
      <TresBoxGeometry :args="[0.04, height * 0.25, width * 0.6]" />
      <TresMeshStandardMaterial color="#8F3823" />
    </TresMesh>

    <!-- Deurklink -->
    <TresMesh :position="[0.12, -0.1, width / 2 - 0.35]" cast-shadow>
      <TresSphereGeometry :args="[0.08, 16, 16]" />
      <TresMeshStandardMaterial color="#D4AF37" :metalness="0.8" :roughness="0.3" />
    </TresMesh>
  </TresGroup>
</template>
