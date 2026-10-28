<script setup lang="ts">
import { useLoop } from '@tresjs/core'
import { ref } from 'vue'
import TheDonut from './TheDonut.vue'
import { OrbitControls } from '@tresjs/cientos'
import Vloer from './Vloer.vue'
import Muur from './Muur.vue'
import Dak from './Dak.vue'
import Gevel from './Gevel.vue'
import Raam from './Raam.vue'
import Deur from './Deur.vue'
import Luifel from './Luifel.vue'
import Portiek from './Portiek.vue'
import Dakkapel from './Dakkapel.vue'
import Schoorsteen from './Schoorsteen.vue'
import Omgeving from './Omgeving.vue'
import Straat from './Straat.vue'
import Beatles from './Beatles.vue'
import Neerslag from './Neerslag.vue'
import Vlag from './Vlag.vue'
import Sneeuwdak from './Sneeuwdak.vue'
import Mist from './Mist.vue'
import Party from './Party.vue'
import Wolken from './Wolken.vue'
import Zon from './Zon.vue'
import Zonnepanelen from './Zonnepanelen.vue'
import Dagmeter from './Dagmeter.vue'

import {
  angle,
  doorZ,
  halfLength,
  halfWidth,
  roofCenterX,
  roofCenterY,
  roofHeight,
  roofLength,
  roofWidth,
  thickness,
  wallTop,
} from '../composables/huis'

// Dakkapel staat op de voorste dakhelling, op de hoogte van het dakvlak
const dormerX = halfWidth - 0.8
const dormerY = wallTop + (halfWidth - dormerX) * (roofHeight / halfWidth)

// Ramen en deur: u loopt langs de muur, y is de onderkant vanaf de muurvoet
const windowWidth = 1.8
const windowHeight = 2.2
const windowBottom = 1.6
const windowY = windowBottom + windowHeight / 2
const awningY = windowBottom + windowHeight + 0.4
const doorWidth = 2
const doorHeight = 3.3
const frontWindowZ = -3.2

const raamGat = (u: number) => ({ u, y: windowBottom, width: windowWidth, height: windowHeight })

const frontOpenings = [{ u: doorZ, y: 0.25, width: doorWidth, height: doorHeight }, raamGat(frontWindowZ)]
const sideOpenings = [raamGat(-3.2), raamGat(3.2)]
const gableOpenings = [raamGat(-2.1), raamGat(2.1)]
const atticOpenings = [{ u: 0, y: 1, width: 0.9, height: 1.2 }]
const atticY = wallTop + 1 + 0.6
</script>

<template>
  <!-- Camera Setup -->
  <TresPerspectiveCamera :position="[22, 13, 20]" :look-at="[1, 2.5, 0]" />
  <OrbitControls :target="[-2.5, 2.5, 2.5]" />

  <!-- Zon, licht, schaduw en stralen (volgen de simulatie) -->
  <Zon />
  <Mist />
  <Neerslag />
  <Party />

  <!-- <TheDonut /> -->

  <Wolken />
  <Dagmeter :position="[7.3, -1, -5.5]" />

  <Omgeving :size="[18, 17]" :pad-z="doorZ" :pad-start="halfWidth + 2.5" />

  <!-- Sokkel en plafond -->
  <Vloer :position="[0, -0.5, 0]" :args="[halfWidth * 2 + 0.2, 1.5, halfLength * 2 + 0.2]" color="#A9A59A" />
  <Vloer :position="[0, wallTop, 0]" :args="[halfWidth * 2, 0.1, halfLength * 2]" color="#EDE8D8" />

  <!-- Muren: de voorkant (met deur) kijkt naar +x, de topgevel naar +z -->
  <Muur :position="[halfWidth, wallTop / 2, 0]" :length="halfLength * 2" :height="wallTop" :openings="frontOpenings" />
  <Muur :position="[-halfWidth, wallTop / 2, 0]" :length="halfLength * 2" :height="wallTop" :openings="sideOpenings" />
  <Muur
    :position="[0, wallTop / 2, halfLength]"
    :rotation="[0, Math.PI / 2, 0]"
    :length="halfWidth * 2"
    :height="wallTop"
    :openings="gableOpenings"
  />
  <Muur
    :position="[0, wallTop / 2, -halfLength]"
    :rotation="[0, Math.PI / 2, 0]"
    :length="halfWidth * 2"
    :height="wallTop"
    :openings="gableOpenings"
  />

  <!-- Voorkant: deur, portiek en raam -->
  <Deur :position="[halfWidth, 0.25 + doorHeight / 2, doorZ]" :width="doorWidth" :height="doorHeight" />
  <Portiek :position="[halfWidth, 0, doorZ]" :hoogte="wallTop - 0.35" />
  <Raam :position="[halfWidth, windowY, frontWindowZ]" />
  <Luifel :position="[halfWidth + 0.05, awningY, frontWindowZ]" />

  <!-- Achterkant -->
  <Raam :position="[-halfWidth, windowY, -3.2]" />
  <Raam :position="[-halfWidth, windowY, 3.2]" />

  <!-- Topgevel met luifels (+z) en achtergevel (-z) -->
  <Raam :position="[-2.1, windowY, halfLength]" :rotation="[0, Math.PI / 2, 0]" />
  <Raam :position="[2.1, windowY, halfLength]" :rotation="[0, Math.PI / 2, 0]" />
  <Luifel :position="[-2.1, awningY, halfLength + 0.05]" :rotation="[0, -Math.PI / 2, 0]" />
  <Luifel :position="[2.1, awningY, halfLength + 0.05]" :rotation="[0, -Math.PI / 2, 0]" />
  <Raam :position="[-2.1, windowY, -halfLength]" :rotation="[0, Math.PI / 2, 0]" />
  <Raam :position="[2.1, windowY, -halfLength]" :rotation="[0, Math.PI / 2, 0]" />

  <Gevel :position="[0, wallTop, halfLength]" :width="halfWidth * 2" :height="roofHeight" :openings="atticOpenings" />
  <Gevel :position="[0, wallTop, -halfLength]" :width="halfWidth * 2" :height="roofHeight" :openings="atticOpenings" />
  <Raam :position="[0, atticY, halfLength]" :rotation="[0, Math.PI / 2, 0]" :width="0.9" :height="1.2" :rows="2" />
  <Raam :position="[0, atticY, -halfLength]" :rotation="[0, Math.PI / 2, 0]" :width="0.9" :height="1.2" :rows="2" />

  <!-- Dak, nok, dakkapel en schoorsteen -->
  <Dak :position="[roofCenterX, roofCenterY, 0]" :rotation="[0, 0, -angle]" :args="[roofWidth, thickness, roofLength]" />
  <Dak :position="[-roofCenterX, roofCenterY, 0]" :rotation="[0, 0, angle]" :args="[roofWidth, thickness, roofLength]" />
  <Dak :position="[0, wallTop + roofHeight + 0.1, 0]" :args="[0.6, 0.3, roofLength]" color="#E08F28" line-color="#E08F28" />

  <!-- Abbey Road: de Beatles steken het zebrapad voor het huis over -->
  <Straat />
  <Beatles />

  <Zonnepanelen />
  <Sneeuwdak />
  <Vlag :position="[5.8, -1, -7.4]" />
  <Dakkapel :position="[dormerX, dormerY, doorZ]" :rotation="[0, Math.PI / 2, 0]" />
  <Schoorsteen :position="[-1.4, 7.35, -2.5]" :height="2.7" />
</template>
