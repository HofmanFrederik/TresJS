<script setup lang="ts">
import { computed } from 'vue'
import { METER_MAX_KWH, nu, totNu } from '../composables/useEnergie'

// Glazen buis die zich vult met de energie van vandaag (vol = METER_MAX_KWH), met een lampje bovenop
withDefaults(
  defineProps<{
    position?: [number, number, number]
  }>(),
  {
    position: () => [0, 0, 0],
  },
)

const buisHoogte = 4
const vulHoogte = 3.8

const vulling = computed(() => Math.max(0.001, Math.min(1, totNu.value / METER_MAX_KWH)))
const produceert = computed(() => nu.value.vermogen > 50)
</script>

<template>
  <TresGroup :position="position">
    <!-- Voetstuk -->
    <TresMesh :position="[0, 0.1, 0]" cast-shadow receive-shadow>
      <TresCylinderGeometry :args="[0.7, 0.8, 0.2, 24]" />
      <TresMeshStandardMaterial color="#8F949A" />
    </TresMesh>

    <!-- Glazen buis -->
    <TresMesh :position="[0, 0.2 + buisHoogte / 2, 0]">
      <TresCylinderGeometry :args="[0.5, 0.5, buisHoogte, 24, 1, true]" />
      <TresMeshStandardMaterial color="#BFE9FF" transparent :opacity="0.25" :side="2" :depth-write="false" />
    </TresMesh>

    <!-- Vulling -->
    <TresMesh :position="[0, 0.3 + (vulHoogte * vulling) / 2, 0]" :scale="[1, vulling, 1]">
      <TresCylinderGeometry :args="[0.4, 0.4, vulHoogte, 24]" />
      <TresMeshStandardMaterial color="#FFB300" emissive="#FF8F00" :emissive-intensity="0.6" />
    </TresMesh>

    <!-- Lampje: groen als er energie wordt opgewekt -->
    <TresMesh :position="[0, buisHoogte + 0.65, 0]">
      <TresSphereGeometry :args="[0.28, 16, 12]" />
      <TresMeshStandardMaterial
        :color="produceert ? '#38E07B' : '#7C3B3B'"
        :emissive="produceert ? '#38E07B' : '#000000'"
        :emissive-intensity="produceert ? 1.2 : 0"
      />
    </TresMesh>
  </TresGroup>
</template>
