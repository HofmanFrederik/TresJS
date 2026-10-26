<script setup lang="ts">
import { computed } from 'vue'
import { ExtrudeGeometry, Path, Shape } from 'three'

const props = withDefaults(
  defineProps<{
    position?: [number, number, number]
    rotation?: [number, number, number]
    width?: number
    height?: number
    color?: string
    // u = midden langs de basis, y = onderkant vanaf de basis
    openings?: { u: number; y: number; width: number; height: number }[]
  }>(),
  {
    position: () => [0, 0, 0],
    rotation: () => [0, 0, 0],
    width: 15,
    height: 4,
    color: '#F6F3EC',
    openings: () => [],
  },
)

// Driehoekige topgevel onder het dak
const geometry = computed(() => {
  const shape = new Shape()
  shape.moveTo(-props.width / 2, 0)
  shape.lineTo(props.width / 2, 0)
  shape.lineTo(0, props.height)
  shape.closePath()

  for (const { u, y, width, height } of props.openings) {
    const hole = new Path()
    hole.moveTo(u - width / 2, y)
    hole.lineTo(u + width / 2, y)
    hole.lineTo(u + width / 2, y + height)
    hole.lineTo(u - width / 2, y + height)
    hole.closePath()
    shape.holes.push(hole)
  }

  const geo = new ExtrudeGeometry(shape, { depth: 0.1, bevelEnabled: false })
  geo.translate(0, 0, -0.05)
  return geo
})
</script>

<template>
  <TresMesh :position="position" :rotation="rotation" :geometry="geometry" cast-shadow receive-shadow>
    <TresMeshStandardMaterial :color="color" />
  </TresMesh>
</template>
