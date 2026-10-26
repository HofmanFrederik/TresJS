<script setup lang="ts">
import { doorZ } from '../composables/huis'

// Straat langs het grondvlak met een zebrapad ter hoogte van de voordeur.
// Het wegdek loopt in de z-richting, de strepen van het zebrapad liggen in de x-richting.
withDefaults(
  defineProps<{
    van?: number // x waar het wegdek begint
    breedte?: number
    lengte?: number
  }>(),
  {
    van: 9,
    breedte: 5,
    lengte: 17,
  },
)

const streepZs = [-2, -1, 0, 1, 2].map((k) => doorZ + k * 0.9)
const middenStrepen = Array.from({ length: 10 }, (_, i) => -7.6 + i * 1.7).filter((z) => Math.abs(z - doorZ) > 2.4)
</script>

<template>
  <TresGroup>
    <!-- Asfalt (bovenkant op y = -1, net als het gras) -->
    <TresMesh :position="[van + breedte / 2, -1.15, 0]" receive-shadow>
      <TresBoxGeometry :args="[breedte, 0.3, lengte]" />
      <TresMeshStandardMaterial color="#3D4047" />
    </TresMesh>

    <!-- Stoeprand -->
    <TresMesh :position="[van + 0.1, -0.93, 0]" receive-shadow>
      <TresBoxGeometry :args="[0.2, 0.14, lengte]" />
      <TresMeshStandardMaterial color="#B9BCC0" />
    </TresMesh>

    <!-- Zebrapad -->
    <TresMesh v-for="z in streepZs" :key="z" :position="[van + breedte / 2 + 0.1, -0.99, z]" receive-shadow>
      <TresBoxGeometry :args="[breedte - 0.2, 0.02, 0.45]" />
      <TresMeshStandardMaterial color="#F4F4F0" />
    </TresMesh>

    <!-- Onderbroken middenlijn -->
    <TresMesh v-for="z in middenStrepen" :key="`m${z}`" :position="[van + breedte / 2, -0.99, z]" receive-shadow>
      <TresBoxGeometry :args="[0.14, 0.02, 0.9]" />
      <TresMeshStandardMaterial color="#F4F4F0" />
    </TresMesh>
  </TresGroup>
</template>
