<script setup lang="ts">
import { ref } from 'vue'
import { BufferAttribute, BufferGeometry, Color } from 'three'
import { useLoop } from '@tresjs/core'
import { roofHeight, wallTop } from '../composables/huis'
import { beatPuls, feest } from '../composables/useFeest'

// Discolichten die om het huis draaien, lichtbundels, een discobal op de nok en confetti.
// Alles pulseert mee met de beat uit useFeest.
const t = ref(0)
const puls = ref(0)

const hsl = (h: number) => `#${new Color().setHSL(((h % 1) + 1) % 1, 1, 0.55).getHexString()}`

const lampen = [0, 1, 2]
const bundels = [0, 1, 2, 3, 4]
const nokY = wallTop + roofHeight + 1.1

// --- confetti ---
const N = 700
const X = 14
const Z = 12
const TOP = 14
const BODEM = -1
const pos = new Float32Array(N * 3)
const snelheid = new Float32Array(N)
const kleuren = new Float32Array(N * 3)
const palet = ['#ff3d81', '#ffd23f', '#3dd9ff', '#7cff6b', '#b36bff', '#ff8a3d'].map((c) => new Color(c))
for (let i = 0; i < N; i++) {
  pos[i * 3] = (Math.random() - 0.5) * 2 * X
  pos[i * 3 + 1] = BODEM + Math.random() * (TOP - BODEM)
  pos[i * 3 + 2] = (Math.random() - 0.5) * 2 * Z
  snelheid[i] = 1.2 + Math.random() * 1.8
  const c = palet[i % palet.length]
  kleuren.set([c.r, c.g, c.b], i * 3)
}
const confettiGeo = new BufferGeometry()
confettiGeo.setAttribute('position', new BufferAttribute(pos, 3))
confettiGeo.setAttribute('color', new BufferAttribute(kleuren, 3))

const { onBeforeRender } = useLoop()

onBeforeRender(({ delta, elapsed }) => {
  if (!feest.aan) return
  t.value = elapsed
  puls.value = beatPuls()

  const dt = Math.min(delta, 0.05)
  for (let i = 0; i < N; i++) {
    const k = i * 3
    pos[k] += Math.sin(elapsed * 1.5 + i) * 0.6 * dt
    pos[k + 1] -= snelheid[i] * dt
    pos[k + 2] += Math.cos(elapsed * 1.2 + i * 1.3) * 0.6 * dt
    if (pos[k + 1] < BODEM) pos[k + 1] = TOP
  }
  confettiGeo.attributes.position.needsUpdate = true
})
</script>

<template>
  <template v-if="feest.aan">
    <!-- Draaiende gekleurde lampen rond het huis -->
    <TresPointLight
      v-for="k in lampen"
      :key="`l${k}`"
      :position="[
        Math.cos(t * 0.8 + (k * Math.PI * 2) / 3) * 9,
        4 + Math.sin(t * 2 + k) * 1.5,
        Math.sin(t * 0.8 + (k * Math.PI * 2) / 3) * 9,
      ]"
      :color="hsl(t * 0.15 + k / 3)"
      :intensity="150 + puls * 250"
      :distance="45"
      :decay="2"
    />

    <!-- Lichtbundels die de lucht in zwaaien -->
    <TresGroup
      v-for="k in bundels"
      :key="`b${k}`"
      :position="[Math.cos(k * 1.2566) * 11, -1, Math.sin(k * 1.2566) * 11]"
      :rotation="[0.45 * Math.sin(t * 1.3 + k), 0, 0.45 * Math.cos(t * 1.1 + k * 2)]"
    >
      <TresMesh :position="[0, 7, 0]" :rotation="[Math.PI, 0, 0]">
        <TresConeGeometry :args="[1.8, 14, 20, 1, true]" />
        <TresMeshBasicMaterial
          :color="hsl(t * 0.1 + k / 5)"
          transparent
          :opacity="0.12 + puls * 0.14"
          :side="2"
          :depth-write="false"
          :blending="2"
        />
      </TresMesh>
    </TresGroup>

    <!-- Discobal op de nok -->
    <TresGroup :position="[0, nokY, 3.5]" :scale="1 + puls * 0.12">
      <TresMesh :rotation="[0, t * 1.2, 0]" cast-shadow>
        <TresIcosahedronGeometry :args="[0.9, 1]" />
        <TresMeshStandardMaterial color="#E8E8EE" :metalness="1" :roughness="0.15" flat-shading emissive="#9aa0ff" :emissive-intensity="0.25 + puls * 0.6" />
      </TresMesh>
      <TresPointLight :intensity="30 + puls * 80" :distance="14" color="#ffffff" />
    </TresGroup>

    <!-- Confetti -->
    <TresPoints :geometry="confettiGeo" :frustum-culled="false">
      <TresPointsMaterial :size="0.28" size-attenuation vertex-colors />
    </TresPoints>
  </template>
</template>
