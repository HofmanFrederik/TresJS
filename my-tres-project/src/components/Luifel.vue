<script setup lang="ts">
import { computed } from 'vue'
import { ExtrudeGeometry, Shape } from 'three'

// Gebogen luifel boven een raam: de bovenkant zit tegen de muur (lokale x = naar buiten)
const props = withDefaults(
  defineProps<{
    position?: [number, number, number]
    rotation?: [number, number, number]
    width?: number
    depth?: number
    color?: string
  }>(),
  {
    position: () => [0, 0, 0],
    rotation: () => [0, 0, 0],
    width: 2.2,
    depth: 0.6,
    color: '#F5A83B',
  },
)

const geometry = computed(() => {
  const thickness = 0.08
  const shape = new Shape()
  shape.moveTo(props.depth, 0)
  shape.absarc(0, 0, props.depth, 0, Math.PI / 2, false)
  shape.lineTo(0, props.depth - thickness)
  shape.absarc(0, 0, props.depth - thickness, Math.PI / 2, 0, true)
  shape.closePath()

  const geo = new ExtrudeGeometry(shape, { depth: props.width, bevelEnabled: false, curveSegments: 16 })
  geo.translate(0, -props.depth, -props.width / 2)
  return geo
})
</script>

<template>
  <TresMesh :position="position" :rotation="rotation" :geometry="geometry" cast-shadow>
    <TresMeshStandardMaterial :color="color" />
  </TresMesh>
</template>
