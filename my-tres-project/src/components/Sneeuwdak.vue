<script setup lang="ts">
import { angle, roofCenterX, roofCenterY, roofLength, roofWidth } from '../composables/huis'
import { sneeuwdek } from '../composables/useEnergie'

// Een dikke laag sneeuw op beide dakvlakken (ook over de zonnepanelen heen)
</script>

<template>
  <template v-if="sneeuwdek">
    <TresGroup
      v-for="kant in [1, -1]"
      :key="kant"
      :position="[kant * roofCenterX, roofCenterY, 0]"
      :rotation="[0, 0, -kant * angle]"
    >
      <TresMesh :position="[0, 0.19, 0]" receive-shadow>
        <TresBoxGeometry :args="[roofWidth - 0.15, 0.2, roofLength - 0.15]" />
        <TresMeshStandardMaterial color="#F6FAFF" :roughness="1" />
      </TresMesh>
    </TresGroup>
  </template>
</template>
