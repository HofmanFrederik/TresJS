<script setup lang="ts">
import { ref } from 'vue'
import { useLoop } from '@tresjs/core'

// Laag-poly persoon van ±1,8 m. De voeten staan op de oorsprong, het gezicht wijst naar lokale +z.
const props = withDefaults(
  defineProps<{
    position?: [number, number, number]
    rotation?: [number, number, number]
    schaal?: number
    shirt?: string
    broek?: string
    huid?: string
    haar?: string
    schoenen?: string // kleur van de schoenen (huidskleur = blootsvoets)
    haarLang?: boolean
    baard?: boolean
    bril?: boolean
    loopt?: boolean // armen en benen zwaaien mee
    zwaait?: boolean // één arm omhoog
  }>(),
  {
    position: () => [0, 0, 0],
    rotation: () => [0, 0, 0],
    schaal: 1,
    shirt: '#3F7CAC',
    broek: '#2D3142',
    huid: '#F1C9A5',
    haar: '#4A3426',
    schoenen: '#2B2B2B',
    haarLang: false,
    baard: false,
    bril: false,
    loopt: false,
    zwaait: false,
  },
)

const beenA = ref()
const beenB = ref()
const armA = ref()
const armB = ref()
const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed }) => {
  const stap = props.loopt ? Math.sin(elapsed * 7) * 0.7 : 0
  if (beenA.value) beenA.value.rotation.x = stap
  if (beenB.value) beenB.value.rotation.x = -stap
  if (armA.value) armA.value.rotation.x = -stap * 0.8
  if (armB.value) {
    armB.value.rotation.x = stap * 0.8
    armB.value.rotation.z = props.zwaait ? 2.6 + Math.sin(elapsed * 6) * 0.3 : 0.05
  }
})
</script>

<template>
  <TresGroup :position="position" :rotation="rotation" :scale="schaal">
    <!-- Benen en schoenen -->
    <TresGroup ref="beenA" :position="[-0.11, 0.82, 0]">
      <TresMesh :position="[0, -0.41, 0]" cast-shadow>
        <TresBoxGeometry :args="[0.17, 0.82, 0.2]" />
        <TresMeshStandardMaterial :color="broek" />
      </TresMesh>
      <TresMesh :position="[0, -0.78, 0.05]" cast-shadow>
        <TresBoxGeometry :args="[0.18, 0.1, 0.3]" />
        <TresMeshStandardMaterial :color="schoenen" />
      </TresMesh>
    </TresGroup>
    <TresGroup ref="beenB" :position="[0.11, 0.82, 0]">
      <TresMesh :position="[0, -0.41, 0]" cast-shadow>
        <TresBoxGeometry :args="[0.17, 0.82, 0.2]" />
        <TresMeshStandardMaterial :color="broek" />
      </TresMesh>
      <TresMesh :position="[0, -0.78, 0.05]" cast-shadow>
        <TresBoxGeometry :args="[0.18, 0.1, 0.3]" />
        <TresMeshStandardMaterial :color="schoenen" />
      </TresMesh>
    </TresGroup>

    <!-- Romp -->
    <TresMesh :position="[0, 1.15, 0]" cast-shadow>
      <TresBoxGeometry :args="[0.5, 0.66, 0.28]" />
      <TresMeshStandardMaterial :color="shirt" />
    </TresMesh>

    <!-- Armen met handen -->
    <TresGroup ref="armA" :position="[-0.35, 1.43, 0]">
      <TresMesh :position="[0, -0.28, 0]" cast-shadow>
        <TresBoxGeometry :args="[0.12, 0.6, 0.14]" />
        <TresMeshStandardMaterial :color="shirt" />
      </TresMesh>
      <TresMesh :position="[0, -0.64, 0]" cast-shadow>
        <TresSphereGeometry :args="[0.07, 10, 8]" />
        <TresMeshStandardMaterial :color="huid" />
      </TresMesh>
    </TresGroup>
    <TresGroup ref="armB" :position="[0.35, 1.43, 0]">
      <TresMesh :position="[0, -0.28, 0]" cast-shadow>
        <TresBoxGeometry :args="[0.12, 0.6, 0.14]" />
        <TresMeshStandardMaterial :color="shirt" />
      </TresMesh>
      <TresMesh :position="[0, -0.64, 0]" cast-shadow>
        <TresSphereGeometry :args="[0.07, 10, 8]" />
        <TresMeshStandardMaterial :color="huid" />
      </TresMesh>
    </TresGroup>

    <!-- Hoofd en haar -->
    <TresMesh :position="[0, 1.68, 0]" cast-shadow>
      <TresSphereGeometry :args="[0.16, 14, 12]" />
      <TresMeshStandardMaterial :color="huid" />
    </TresMesh>
    <TresMesh :position="[0, 1.73, -0.02]" :scale="[1, 0.8, 1]" cast-shadow>
      <TresSphereGeometry :args="[0.175, 14, 12]" />
      <TresMeshStandardMaterial :color="haar" />
    </TresMesh>

    <!-- Lang haar: pluk achter en aan de zijkanten -->
    <TresGroup v-if="haarLang">
      <TresMesh :position="[0, 1.6, -0.1]" cast-shadow>
        <TresBoxGeometry :args="[0.34, 0.3, 0.1]" />
        <TresMeshStandardMaterial :color="haar" />
      </TresMesh>
      <TresMesh v-for="x in [-0.16, 0.16]" :key="x" :position="[x, 1.63, -0.03]" cast-shadow>
        <TresBoxGeometry :args="[0.05, 0.24, 0.22]" />
        <TresMeshStandardMaterial :color="haar" />
      </TresMesh>
    </TresGroup>

    <!-- Baard -->
    <TresMesh v-if="baard" :position="[0, 1.57, 0.1]" cast-shadow>
      <TresBoxGeometry :args="[0.22, 0.12, 0.1]" />
      <TresMeshStandardMaterial :color="haar" />
    </TresMesh>

    <!-- Ronde bril -->
    <TresGroup v-if="bril" :position="[0, 1.69, 0.155]">
      <TresMesh v-for="x in [-0.075, 0.075]" :key="x" :position="[x, 0, 0]">
        <TresTorusGeometry :args="[0.05, 0.012, 6, 14]" />
        <TresMeshStandardMaterial color="#1A1A1A" />
      </TresMesh>
    </TresGroup>
  </TresGroup>
</template>
