<script setup lang="ts">
import { computed } from 'vue'
import { Euler, Quaternion, Vector3 } from 'three'
import { flits, licht, nu } from '../composables/useEnergie'

// Punt op het dak waar de stralen naartoe wijzen
const doel = new Vector3(2.2, 6, -2.5)
const afstand = 28

type Vec3 = [number, number, number]

const richting = computed(() => nu.value.richting)
const overdag = computed(() => nu.value.hoogte > 0.02)

const lichtPositie = computed<Vec3>(() => [richting.value.x * 25, richting.value.y * 25, richting.value.z * 25])
const zonPositie = computed<Vec3>(() => [
  doel.x + richting.value.x * 34,
  doel.y + richting.value.y * 34,
  doel.z + richting.value.z * 34,
])

// Bundel stralen: de groep staat bij de zon en wijst met +z naar het dak
const bundelPositie = computed<Vec3>(() => [
  doel.x + richting.value.x * afstand,
  doel.y + richting.value.y * afstand,
  doel.z + richting.value.z * afstand,
])
const bundelRotatie = computed<Vec3>(() => {
  const r = richting.value
  const q = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), new Vector3(-r.x, -r.y, -r.z))
  const e = new Euler().setFromQuaternion(q)
  return [e.x, e.y, e.z]
})
const stralen: [number, number][] = [
  [-2, -1],
  [0, -1],
  [2, -1],
  [-1, 0.6],
  [1, 0.6],
  [0, 0.6],
  [-2, 2.2],
  [0, 2.2],
  [2, 2.2],
]
// sterkere straling = zichtbaardere stralen
const straalOpacity = computed(() => Math.min(0.5, 0.01 + (nu.value.weer.dni / 1000) * 0.5))
</script>

<template>
  <TresAmbientLight :intensity="licht.ambient + flits * 3" :color="licht.dag < 0.4 ? '#9fb4ff' : '#ffffff'" />

  <TresDirectionalLight
    :position="lichtPositie"
    :intensity="licht.zon"
    :color="licht.zonKleur"
    cast-shadow
    :shadow-camera-left="-15"
    :shadow-camera-right="15"
    :shadow-camera-top="15"
    :shadow-camera-bottom="-15"
    :shadow-mapSize-width="2048"
    :shadow-mapSize-height="2048"
  />

  <!-- De zon zelf -->
  <TresGroup v-if="nu.hoogte > -0.05" :position="zonPositie">
    <TresMesh>
      <TresSphereGeometry :args="[1.4, 24, 16]" />
      <TresMeshBasicMaterial color="#FFD54A" />
    </TresMesh>
    <TresMesh>
      <TresSphereGeometry :args="[2.4, 24, 16]" />
      <TresMeshBasicMaterial color="#FFE9A0" transparent :opacity="0.25" :depth-write="false" />
    </TresMesh>
  </TresGroup>

  <!-- Zonnestralen naar de panelen -->
  <TresGroup v-if="overdag" :position="bundelPositie" :rotation="bundelRotatie">
    <TresMesh v-for="(s, i) in stralen" :key="i" :position="[s[0], s[1], afstand / 2]" :rotation="[Math.PI / 2, 0, 0]">
      <TresCylinderGeometry :args="[0.045, 0.045, afstand, 6]" />
      <TresMeshBasicMaterial color="#FFE27A" transparent :opacity="straalOpacity" :depth-write="false" />
    </TresMesh>
  </TresGroup>
</template>
