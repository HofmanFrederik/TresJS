<script setup lang="ts">
import Dak from './Dak.vue'
import Gevel from './Gevel.vue'
import Muur from './Muur.vue'
import Raam from './Raam.vue'

// Dakkapel: lokale z = naar buiten, y = 0 op de voet van de voorwand
withDefaults(
  defineProps<{
    position?: [number, number, number]
    rotation?: [number, number, number]
  }>(),
  {
    position: () => [0, 0, 0],
    rotation: () => [0, 0, 0],
  },
)

const halfWidth = 1.2
const wallHeight = 1.4
const roofRise = 0.8
const length = 3.3
const overhang = 0.25
const thickness = 0.12

const angle = Math.atan2(roofRise, halfWidth)
const roofWidth = Math.hypot(halfWidth, roofRise) + overhang + 0.1
const roofCenterX = (halfWidth + overhang * Math.cos(angle)) / 2 + (thickness / 2) * Math.sin(angle)
const roofCenterY = (wallHeight - overhang * Math.sin(angle) + wallHeight + roofRise) / 2 + (thickness / 2) * Math.cos(angle)
const roofLength = length + 0.4
const roofCenterZ = -(roofLength / 2 - 0.4)
</script>

<template>
  <TresGroup :position="position" :rotation="rotation">
    <!-- Voorwand met raam en topgevel -->
    <Muur
      :position="[0, wallHeight / 2, 0]"
      :rotation="[0, Math.PI / 2, 0]"
      :length="halfWidth * 2"
      :height="wallHeight"
      :thickness="thickness"
      :openings="[{ u: 0, y: 0.35, width: 0.9, height: 0.8 }]"
    />
    <Raam :position="[0, 0.75, 0]" :rotation="[0, Math.PI / 2, 0]" :width="0.9" :height="0.8" :rows="2" />
    <Gevel :position="[0, wallHeight, 0]" :width="halfWidth * 2" :height="roofRise" />

    <!-- Zijwangen -->
    <TresMesh v-for="x in [-halfWidth, halfWidth]" :key="x" :position="[x, wallHeight / 2, -length / 2]" cast-shadow>
      <TresBoxGeometry :args="[thickness, wallHeight, length]" />
      <TresMeshStandardMaterial color="#F6F3EC" />
    </TresMesh>

    <!-- Dakvlakken -->
    <Dak :position="[roofCenterX, roofCenterY, roofCenterZ]" :rotation="[0, 0, -angle]" :args="[roofWidth, thickness, roofLength]" />
    <Dak :position="[-roofCenterX, roofCenterY, roofCenterZ]" :rotation="[0, 0, angle]" :args="[roofWidth, thickness, roofLength]" />
  </TresGroup>
</template>
