<script setup lang="ts">
import { ref } from 'vue'
import { useLoop } from '@tresjs/core'
import { windScene } from '../composables/useEnergie'

// Vlaggenmast: de vlag wijst met de wind mee, hangt slap bij weinig wind en wappert bij veel wind.
withDefaults(
  defineProps<{
    position?: [number, number, number]
  }>(),
  {
    position: () => [0, 0, 0],
  },
)

const richting = ref() // draait de vlag in de windrichting
const hangt = ref() // laat de vlag zakken bij weinig wind
const stukken = [ref(), ref(), ref()]
const kleuren = ['#1A1A1A', '#FAE042', '#ED2939'] // Belgische driekleur

const { onBeforeRender } = useLoop()
let laatsteHoek = 0

onBeforeRender(({ elapsed }) => {
  const w = windScene.value
  const snelheid = Math.hypot(w.x, w.z)
  const kracht = Math.min(1, snelheid / 8)
  if (snelheid > 0.2) laatsteHoek = Math.atan2(w.x, w.z)
  if (richting.value) richting.value.rotation.y = laatsteHoek
  if (hangt.value) hangt.value.rotation.x = (1 - kracht) * 1.35
  stukken.forEach((stuk, i) => {
    if (stuk.value) stuk.value.rotation.y = Math.sin(elapsed * (3 + snelheid * 0.6) - i * 1.2) * 0.4 * kracht
  })
})
</script>

<template>
  <TresGroup :position="position">
    <!-- Mast -->
    <TresMesh :position="[0, 2.5, 0]" cast-shadow>
      <TresCylinderGeometry :args="[0.06, 0.09, 5, 10]" />
      <TresMeshStandardMaterial color="#D9DDE1" :metalness="0.4" :roughness="0.4" />
    </TresMesh>
    <TresMesh :position="[0, 5.05, 0]">
      <TresSphereGeometry :args="[0.1, 10, 8]" />
      <TresMeshStandardMaterial color="#D4AF37" :metalness="0.8" :roughness="0.3" />
    </TresMesh>

    <!-- Vlag in drie stukken, zodat hij kan golven -->
    <TresGroup :position="[0, 4.5, 0]">
      <TresGroup ref="richting">
        <TresGroup ref="hangt">
          <TresGroup :ref="(el: any) => (stukken[0].value = el)">
            <TresMesh :position="[0, 0, 0.3]" cast-shadow>
              <TresBoxGeometry :args="[0.03, 0.8, 0.6]" />
              <TresMeshStandardMaterial :color="kleuren[0]" />
            </TresMesh>
            <TresGroup :position="[0, 0, 0.6]" :ref="(el: any) => (stukken[1].value = el)">
              <TresMesh :position="[0, 0, 0.3]" cast-shadow>
                <TresBoxGeometry :args="[0.03, 0.8, 0.6]" />
                <TresMeshStandardMaterial :color="kleuren[1]" />
              </TresMesh>
              <TresGroup :position="[0, 0, 0.6]" :ref="(el: any) => (stukken[2].value = el)">
                <TresMesh :position="[0, 0, 0.3]" cast-shadow>
                  <TresBoxGeometry :args="[0.03, 0.8, 0.6]" />
                  <TresMeshStandardMaterial :color="kleuren[2]" />
                </TresMesh>
              </TresGroup>
            </TresGroup>
          </TresGroup>
        </TresGroup>
      </TresGroup>
    </TresGroup>
  </TresGroup>
</template>
