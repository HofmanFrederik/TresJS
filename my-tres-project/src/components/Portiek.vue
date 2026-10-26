<script setup lang="ts">
// Twee pilaren naast de deur en een trap van drie treden (lokale x = naar buiten)
withDefaults(
  defineProps<{
    position?: [number, number, number]
    rotation?: [number, number, number]
    hoogte?: number
  }>(),
  {
    position: () => [0, 0, 0],
    rotation: () => [0, 0, 0],
    hoogte: 4.65,
  },
)

const treden = [
  { x: 0.45, hoogte: 1.25, midden: -0.375 },
  { x: 1.25, hoogte: 0.833, midden: -0.583 },
  { x: 2.05, hoogte: 0.417, midden: -0.79 },
]
</script>

<template>
  <TresGroup :position="position" :rotation="rotation">
    <TresGroup v-for="z in [-2, 2]" :key="z" :position="[0, 0, z]">
      <TresMesh :position="[0.3, 0.25 + hoogte / 2, 0]" cast-shadow receive-shadow>
        <TresBoxGeometry :args="[0.5, hoogte, 0.7]" />
        <TresMeshStandardMaterial color="#F6F3EC" />
      </TresMesh>
      <TresMesh :position="[0.45, 0.5, 0]" cast-shadow receive-shadow>
        <TresBoxGeometry :args="[0.8, 0.5, 0.9]" />
        <TresMeshStandardMaterial color="#E4E0D6" />
      </TresMesh>
    </TresGroup>

    <TresMesh v-for="trede in treden" :key="trede.x" :position="[trede.x, trede.midden, 0]" cast-shadow receive-shadow>
      <TresBoxGeometry :args="[0.8, trede.hoogte, 3]" />
      <TresMeshStandardMaterial color="#8F949A" />
    </TresMesh>
  </TresGroup>
</template>
