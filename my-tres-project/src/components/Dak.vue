<script setup lang="ts">
import { computed } from 'vue'
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'

const props = withDefaults(
  defineProps<{
    position?: [number, number, number]
    rotation?: [number, number, number]
    args?: [number, number, number]
    color?: string
    lineColor?: string
  }>(),
  {
    position: () => [0, 0, 0],
    rotation: () => [0, 0, 0],
    args: () => [9, 0.2, 16],
    color: '#F5A83B',
    lineColor: '#C97A1E',
  },
)

// Dakplanken: smalle donkere lijnen die evenwijdig aan de nok lopen
const texture = computed(() => {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 4
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = props.color
  ctx.fillRect(0, 0, 64, 4)
  ctx.fillStyle = props.lineColor
  ctx.fillRect(0, 0, 5, 4)

  const map = new CanvasTexture(canvas)
  map.wrapS = RepeatWrapping
  map.wrapT = RepeatWrapping
  map.colorSpace = SRGBColorSpace
  map.repeat.set(Math.max(1, Math.round(props.args[0] / 0.8)), 1)
  return map
})
</script>

<template>
  <TresMesh :position="position" :rotation="rotation" cast-shadow receive-shadow>
    <TresBoxGeometry :args="args" />
    <TresMeshStandardMaterial :map="texture" />
  </TresMesh>
</template>
