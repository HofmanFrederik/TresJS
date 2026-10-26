<script setup lang="ts">
import { onUnmounted } from 'vue'
import { Fog } from 'three'
import { useLoop, useTres } from '@tresjs/core'
import { mistInstelling } from '../composables/useEnergie'

// Eén Fog-object op de scène dat per frame meebeweegt met de mist in het weer.
const { scene } = useTres()
const fog = new Fog('#e6f6fd', 60, 220)
scene.value.fog = fog

const { onBeforeRender } = useLoop()
onBeforeRender(() => {
  const m = mistInstelling.value
  fog.color.set(m.kleur)
  fog.near = m.near
  fog.far = m.far
})

onUnmounted(() => {
  scene.value.fog = null
})
</script>

<template />
