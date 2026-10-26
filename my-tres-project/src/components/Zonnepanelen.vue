<script setup lang="ts">
import { computed } from 'vue'
import { CanvasTexture, SRGBColorSpace } from 'three'
import { angle, roofCenterX, roofCenterY, roofWidth } from '../composables/huis'
import { nu, staat } from '../composables/useEnergie'

// Panelen liggen op de zuidelijke dakhelling (+x): 4 kolommen x 4 rijen, de dakkapel blijft vrij.
const kolommen = [-1.5, -3.2, -4.9, 4.3] // z-posities langs de nok
const rijen = 4
const paneelLengte = 1.1 // langs de helling
const paneelBreedte = 1.6 // langs de nok

const posities = Array.from({ length: kolommen.length * rijen }, (_, i) => {
  const kolom = Math.floor(i / rijen)
  const rij = i % rijen
  return { x: roofWidth / 2 - 1.15 - rij * 1.2, z: kolommen[kolom] }
})

// Zichtbare panelen volgens de regelaar
const zichtbaar = computed(() => posities.slice(0, staat.panelen))

// Zonnecellen als textuur
const textuur = (() => {
  const canvas = document.createElement('canvas')
  canvas.width = 110
  canvas.height = 160
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = '#1c2f6b'
  ctx.fillRect(0, 0, 110, 160)
  ctx.strokeStyle = '#4a6fc4'
  ctx.lineWidth = 1
  for (let x = 0; x <= 110; x += 110 / 6) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, 160)
    ctx.stroke()
  }
  for (let y = 0; y <= 160; y += 16) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(110, y)
    ctx.stroke()
  }
  ctx.strokeStyle = '#d3d8de'
  ctx.lineWidth = 6
  ctx.strokeRect(0, 0, 110, 160)
  const map = new CanvasTexture(canvas)
  map.colorSpace = SRGBColorSpace
  return map
})()

// Het paneel gloeit zachtjes blauw naarmate het meer produceert
const gloed = computed(() => (staat.panelen > 0 ? Math.min(1, nu.value.vermogen / (staat.panelen * 280)) : 0))
</script>

<template>
  <!-- Zelfde positie en helling als de zuidelijke dakplaat -->
  <TresGroup :position="[roofCenterX, roofCenterY, 0]" :rotation="[0, 0, -angle]">
    <TresMesh v-for="(p, i) in zichtbaar" :key="i" :position="[p.x, 0.13, p.z]" cast-shadow receive-shadow>
      <TresBoxGeometry :args="[paneelLengte, 0.06, paneelBreedte]" />
      <TresMeshStandardMaterial
        :map="textuur"
        :metalness="0.5"
        :roughness="0.3"
        emissive="#3d8bff"
        :emissive-intensity="gloed * 0.22"
      />
    </TresMesh>
  </TresGroup>
</template>
