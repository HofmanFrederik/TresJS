<script setup lang="ts">
withDefaults(
  defineProps<{
    position?: [number, number, number]
    height?: number
  }>(),
  {
    position: () => [0, 0, 0],
    height: 3.2,
  },
)
</script>

<template>
  <TresGroup :position="position">
    <TresMesh cast-shadow receive-shadow>
      <TresBoxGeometry :args="[1.2, height, 1.2]" />
      <TresMeshStandardMaterial color="#F6F3EC" />
    </TresMesh>
    <TresMesh :position="[0, height / 2 + 0.15, 0]" cast-shadow>
      <TresBoxGeometry :args="[1.5, 0.3, 1.5]" />
      <TresMeshStandardMaterial color="#4D4A47" />
    </TresMesh>
  </TresGroup>
</template>
