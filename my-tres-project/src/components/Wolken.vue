<script setup lang="ts">
import { computed, ref } from 'vue'
import { useLoop } from '@tresjs/core'
import { licht, mixKleur, nu } from '../composables/useEnergie'

const klem = (x: number) => Math.min(1, Math.max(0, x))

// Elke wolk: positie rond het huis en schaal
const wolken: { position: [number, number, number]; schaal: number }[] = [
  { position: [-14, 8, -6], schaal: 1.3 },
  { position: [-8, 10, 14], schaal: 1 },
  { position: [12, 9, -14], schaal: 1.5 },
  { position: [17, 11, 6], schaal: 0.9 },
  { position: [0, 7, -20], schaal: 1.2 },
  { position: [-19, 9, 8], schaal: 1.1 },
]

// Bolletjes waaruit één wolk bestaat: [x, y, z, straal]
const bolletjes = [
  [0, 0, 0, 1.6],
  [1.7, -0.25, 0.2, 1.2],
  [-1.7, -0.3, -0.1, 1.2],
  [0.6, 0.7, 0, 1.1],
  [-0.7, 0.4, 0.4, 0.9],
]

// Meer bewolking in de data = meer en grijzere wolken; 's nachts zijn ze donker
const aantal = computed(() =>
  nu.value.weer.neerslag > 0.1 ? wolken.length : 1 + Math.round((nu.value.weer.bewolking / 100) * (wolken.length - 1)),
)
const kleur = computed(() => {
  const w = nu.value.weer
  let grijs = mixKleur('#FFFFFF', '#9AA3AD', w.bewolking / 100)
  // regenwolken en onweerswolken zijn donkerder
  grijs = mixKleur(grijs, '#5E6671', klem(w.neerslag / 6 + (w.onweer ? 0.4 : 0)))
  return mixKleur('#2A3350', grijs, 0.25 + 0.75 * licht.value.dag)
})

const groepRef = ref()
const { onBeforeRender } = useLoop()

// Wolken draaien rond het huis
// bij meer wind drijven ze sneller
onBeforeRender(({ delta }) => {
  if (groepRef.value) groepRef.value.rotation.y += delta * (0.03 + nu.value.weer.wind * 0.006)
})
</script>

<template>
  <TresGroup ref="groepRef">
    <TresGroup
      v-for="(wolk, i) in wolken"
      :key="i"
      :visible="i < aantal"
      :position="wolk.position"
      :scale="wolk.schaal"
    >
      <TresMesh v-for="(b, j) in bolletjes" :key="j" :position="[b[0], b[1], b[2]]">
        <TresSphereGeometry :args="[b[3], 16, 12]" />
        <TresMeshStandardMaterial :color="kleur" :emissive="kleur" :emissive-intensity="0.55" :roughness="1" />
      </TresMesh>
    </TresGroup>
  </TresGroup>
</template>
