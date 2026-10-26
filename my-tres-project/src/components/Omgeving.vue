<script setup lang="ts">
import { computed } from 'vue'
import { sneeuwdek } from '../composables/useEnergie'

withDefaults(
  defineProps<{
    position?: [number, number, number]
    size?: [number, number]
    // z-positie van de voordeur en x waar het pad begint
    padZ?: number
    padStart?: number
  }>(),
  {
    position: () => [0, 0, 0],
    size: () => [14, 17],
    padZ: 0,
    padStart: 7,
  },
)

// Sneeuw maakt het gras wit
const gras = computed(() => (sneeuwdek.value ? '#EEF3F8' : '#A8C440'))
</script>

<template>
  <TresGroup :position="position">
    <!-- Grondvlak (bovenkant op y = -1), het huis staat op het midden van de x/z-as -->
    <TresMesh :position="[0, -1.3, 0]" receive-shadow>
      <TresBoxGeometry :args="[size[0], 0.3, size[1]]" />
      <TresMeshStandardMaterial color="#9C9A92" />
    </TresMesh>
    <TresMesh :position="[0, -1.075, 0]" receive-shadow>
      <TresBoxGeometry :args="[size[0], 0.15, size[1]]" />
      <TresMeshStandardMaterial :color="gras" />
    </TresMesh>

    <!-- Tuinpad vanaf de trap tot de rand -->
    <TresMesh :position="[(padStart + size[0] / 2) / 2, -0.97, padZ]" receive-shadow>
      <TresBoxGeometry :args="[size[0] / 2 - padStart, 0.06, 3]" />
      <TresMeshStandardMaterial color="#BFC3C7" />
    </TresMesh>
  </TresGroup>
</template>
