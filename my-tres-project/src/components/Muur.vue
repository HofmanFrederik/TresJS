<script setup lang="ts">
import { computed } from 'vue'
import { ExtrudeGeometry, Path, Shape } from 'three'

const props = withDefaults(
  defineProps<{
    position?: [number, number, number]
    rotation?: [number, number, number]
    color?: string
    length?: number
    height?: number
    thickness?: number
    // u = midden langs de muur, y = onderkant vanaf de muurvoet
    openings?: { u: number; y: number; width: number; height: number }[]
  }>(),
  {
    position: () => [0, 0, 0],
    rotation: () => [0, 0, 0],
    color: '#F6F3EC',
    length: 15,
    height: 5,
    thickness: 0.1,
    openings: () => [],
  },
)

// Muur met uitgesneden gaten voor deuren en ramen (lange zijde = lokale z-as)
const geometry = computed(() => {
  const halfLength = props.length / 2
  const shape = new Shape()
  shape.moveTo(-halfLength, 0)
  shape.lineTo(halfLength, 0)
  shape.lineTo(halfLength, props.height)
  shape.lineTo(-halfLength, props.height)
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

  const geo = new ExtrudeGeometry(shape, { depth: props.thickness, bevelEnabled: false })
  geo.translate(0, -props.height / 2, -props.thickness / 2)
  geo.rotateY(-Math.PI / 2)
  return geo
})
</script>

<template>
  <TresMesh :position="position" :rotation="rotation" :geometry="geometry" cast-shadow receive-shadow>
    <TresMeshStandardMaterial :color="color" />
  </TresMesh>
</template>
