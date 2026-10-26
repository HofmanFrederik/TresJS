<script setup lang="ts">
import { reactive } from 'vue'
import { useLoop } from '@tresjs/core'
import { doorZ } from '../composables/huis'
import Mens from './Mens.vue'

// Abbey Road: vier Beatles steken in een rij het zebrapad over, van links naar rechts
// John, Ringo, Paul en George. Aan het einde draaien ze zich om en lopen terug.
const begin = 9.7 // stoeprand
const einde = 13.3 // overkant
const wandelTijd = 5
const wachtTijd = 1.5
const vertraging = 1.3 // seconden tussen twee Beatles in de rij
const y = -0.99 // bovenkant van het zebrapad

const beatles = [
  { naam: 'John', shirt: '#F4F4F0', broek: '#F4F4F0', haar: '#5A4030', haarLang: true, baard: true, bril: true },
  { naam: 'Ringo', shirt: '#2E3340', broek: '#2E3340', haar: '#3B2A20' },
  { naam: 'Paul', shirt: '#38405A', broek: '#38405A', haar: '#2B1E16', schoenen: '#F1C9A5' },
  { naam: 'George', shirt: '#4F6F9A', broek: '#3F5E88', haar: '#2B1E16', haarLang: true },
]

const groepen: any[] = []
const loopt = reactive(beatles.map(() => true))
const { onBeforeRender } = useLoop()

const klem = (x: number) => Math.min(1, Math.max(0, x))

onBeforeRender(({ elapsed }) => {
  const cyclus = (wandelTijd + wachtTijd) * 2
  beatles.forEach((_, i) => {
    const g = groepen[i]
    if (!g) return
    const t = (((elapsed - i * vertraging) % cyclus) + cyclus) % cyclus

    let voortgang: number // 0 = stoep, 1 = overkant
    let draai: number // y-rotatie: π/2 kijkt naar +x (overkant), -π/2 naar -x (stoep)
    if (t < wandelTijd) {
      voortgang = t / wandelTijd
      draai = Math.PI / 2
    } else if (t < wandelTijd + wachtTijd) {
      voortgang = 1
      draai = Math.PI / 2 - Math.PI * klem((t - wandelTijd - wachtTijd / 2) / (wachtTijd / 2))
    } else if (t < wandelTijd * 2 + wachtTijd) {
      voortgang = 1 - (t - wandelTijd - wachtTijd) / wandelTijd
      draai = -Math.PI / 2
    } else {
      voortgang = 0
      draai = -Math.PI / 2 + Math.PI * klem((t - wandelTijd * 2 - wachtTijd - wachtTijd / 2) / (wachtTijd / 2))
    }

    g.position.set(begin + voortgang * (einde - begin), y, doorZ)
    g.rotation.y = draai
    loopt[i] = voortgang > 0 && voortgang < 1
  })
})
</script>

<template>
  <TresGroup v-for="(b, i) in beatles" :key="b.naam" :ref="(el: any) => (groepen[i] = el)">
    <Mens
      :loopt="loopt[i]"
      :shirt="b.shirt"
      :broek="b.broek"
      :haar="b.haar"
      :schoenen="b.schoenen"
      :haar-lang="b.haarLang"
      :baard="b.baard"
      :bril="b.bril"
    />
  </TresGroup>
</template>
