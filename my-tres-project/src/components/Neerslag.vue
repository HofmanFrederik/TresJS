<script setup lang="ts">
import { BufferAttribute, BufferGeometry } from 'three'
import { useLoop } from '@tresjs/core'
import { halfLength, halfWidth, roofHeight, wallTop } from '../composables/huis'
import { nu, windScene } from '../composables/useEnergie'

// Regen (streepjes) en sneeuw (vlokken) vallen in een blok rond het huis.
// De hoeveelheid volgt de neerslag uit het weer, de wind duwt alles opzij.
const MAX = 3000
const X = 16
const Z = 14
const TOP = 16
const BODEM = -1

const rand = (breedte: number) => (Math.random() - 0.5) * 2 * breedte

// koppen van de druppels en vlokken: x, y, z
const regenKop = new Float32Array(MAX * 3)
const sneeuwKop = new Float32Array(MAX * 3)
const sneeuwSnelheid = new Float32Array(MAX)
const regenPunten = new Float32Array(MAX * 6) // elke druppel = 2 punten (kop en staart)
const sneeuwPunten = new Float32Array(MAX * 3)

function nieuw(kop: Float32Array, i: number, hoog = false) {
  kop[i * 3] = rand(X)
  kop[i * 3 + 1] = hoog ? TOP + Math.random() * 2 : BODEM + Math.random() * (TOP - BODEM)
  kop[i * 3 + 2] = rand(Z)
}
for (let i = 0; i < MAX; i++) {
  nieuw(regenKop, i)
  nieuw(sneeuwKop, i)
  sneeuwSnelheid[i] = 0.6 + Math.random() * 0.9
}

// Raakt het het dak of de grond? Dan begint de druppel weer bovenaan.
function geraakt(x: number, y: number, z: number) {
  if (y < BODEM) return true
  if (Math.abs(x) <= halfWidth + 0.5 && Math.abs(z) <= halfLength + 0.5) {
    const dak = wallTop + (halfWidth - Math.min(Math.abs(x), halfWidth)) * (roofHeight / halfWidth)
    return y < dak
  }
  return false
}

const regenGeo = new BufferGeometry()
regenGeo.setAttribute('position', new BufferAttribute(regenPunten, 3))
regenGeo.setDrawRange(0, 0)
const sneeuwGeo = new BufferGeometry()
sneeuwGeo.setAttribute('position', new BufferAttribute(sneeuwPunten, 3))
sneeuwGeo.setDrawRange(0, 0)

const { onBeforeRender } = useLoop()

onBeforeRender(({ delta, elapsed }) => {
  const dt = Math.min(delta, 0.05)
  const { neerslag, sneeuw } = nu.value.weer
  const wind = windScene.value

  // sneeuw telt niet mee als regen
  const regenMm = sneeuw > 0.05 ? 0 : neerslag
  const nRegen = regenMm > 0.05 ? Math.min(MAX, Math.round(100 + regenMm * 300)) : 0
  const nSneeuw = sneeuw > 0.05 ? Math.min(MAX, Math.round(200 + sneeuw * 1100)) : 0

  regenGeo.setDrawRange(0, nRegen * 2)
  sneeuwGeo.setDrawRange(0, nSneeuw)

  for (let i = 0; i < nRegen; i++) {
    const k = i * 3
    const vx = wind.x * 0.8
    const vz = wind.z * 0.8
    const vy = -24
    regenKop[k] += vx * dt
    regenKop[k + 1] += vy * dt
    regenKop[k + 2] += vz * dt
    if (geraakt(regenKop[k], regenKop[k + 1], regenKop[k + 2])) nieuw(regenKop, i, true)
    const p = i * 6
    regenPunten[p] = regenKop[k]
    regenPunten[p + 1] = regenKop[k + 1]
    regenPunten[p + 2] = regenKop[k + 2]
    regenPunten[p + 3] = regenKop[k] - vx * 0.025
    regenPunten[p + 4] = regenKop[k + 1] - vy * 0.025
    regenPunten[p + 5] = regenKop[k + 2] - vz * 0.025
  }
  regenGeo.attributes.position.needsUpdate = true

  for (let i = 0; i < nSneeuw; i++) {
    const k = i * 3
    sneeuwKop[k] += (wind.x * 0.6 + Math.sin(elapsed * 1.3 + i) * 0.4) * dt
    sneeuwKop[k + 1] -= sneeuwSnelheid[i] * dt
    sneeuwKop[k + 2] += (wind.z * 0.6 + Math.cos(elapsed * 1.1 + i * 1.7) * 0.4) * dt
    if (geraakt(sneeuwKop[k], sneeuwKop[k + 1], sneeuwKop[k + 2])) nieuw(sneeuwKop, i, true)
    sneeuwPunten[k] = sneeuwKop[k]
    sneeuwPunten[k + 1] = sneeuwKop[k + 1]
    sneeuwPunten[k + 2] = sneeuwKop[k + 2]
  }
  sneeuwGeo.attributes.position.needsUpdate = true
})
</script>

<template>
  <TresLineSegments :geometry="regenGeo" :frustum-culled="false">
    <TresLineBasicMaterial color="#BFD9F5" transparent :opacity="0.55" />
  </TresLineSegments>
  <TresPoints :geometry="sneeuwGeo" :frustum-culled="false">
    <TresPointsMaterial color="#FFFFFF" :size="0.2" size-attenuation transparent :opacity="0.95" :depth-write="false" />
  </TresPoints>
</template>
