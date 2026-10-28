<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  LOCATIE,
  MAX_PANELEN,
  METER_MAX_KWH,
  PRIJS_PER_KWH,
  besparing,
  bronStatus,
  bronTekst,
  dagTotaal,
  formatUur,
  kromme,
  nu,
  staat,
  startTikken,
  totNu,
  weerLabel,
  windTekst,
  zetSeizoen,
  zetVandaag,
} from '../composables/useEnergie'
import { feest, wisselFeest } from '../composables/useFeest'
import { commandoKnoppen, spraak, startLuisteren, stopLuisteren, voerUit } from '../composables/useSpraak'

onMounted(startTikken)

const klein = ref(false)

// --- weergave van getallen ---
const nl = (n: number, d = 1) => n.toFixed(d).replace('.', ',')
const vermogenTekst = computed(() => (nu.value.vermogen >= 1000 ? `${nl(nu.value.vermogen / 1000, 2)} kW` : `${Math.round(nu.value.vermogen)} W`))
const zonHoogte = computed(() => `${Math.round((nu.value.hoogte * 180) / Math.PI)}°`)
const windKpi = computed(() => `${nl(nu.value.weer.wind)} m/s ${windTekst(nu.value.weer.windrichting)}`)
const neerslagKpi = computed(() => {
  const w = nu.value.weer
  if (w.sneeuw > 0.05) return `${nl(w.sneeuw)} cm/u`
  return w.neerslag > 0.05 ? `${nl(w.neerslag)} mm/u` : 'droog'
})

// --- grafiek: vermogen over de dag ---
const W = 320
const H = 130
const links = 34
const rechts = 8
const boven = 10
const onder = 22
const maxW = computed(() => Math.max(1000, Math.ceil(Math.max(...kromme.value) / 1000) * 1000))
const x = (uur: number) => links + (uur / 24) * (W - links - rechts)
const y = (p: number) => boven + (1 - p / maxW.value) * (H - boven - onder)
const lijn = computed(() => kromme.value.map((p, i) => `${i ? 'L' : 'M'}${x(i / 4).toFixed(1)},${y(p).toFixed(1)}`).join(' '))
const vlak = computed(() => `${lijn.value} L${x(24)},${y(0)} L${x(0)},${y(0)} Z`)
const yLijnen = computed(() => [0, 0.5, 1].map((f) => ({ y: y(maxW.value * f), label: nl((maxW.value * f) / 1000, f === 0.5 ? 1 : 0) })))

// klikken of slepen in de grafiek zet de tijd
const grafiek = ref<SVGSVGElement>()
function zetTijdUitGrafiek(e: PointerEvent) {
  const rect = grafiek.value!.getBoundingClientRect()
  const px = ((e.clientX - rect.left) / rect.width) * W
  staat.uur = Math.min(24, Math.max(0, ((px - links) / (W - links - rechts)) * 24)) % 24
}
function grafiekDown(e: PointerEvent) {
  staat.speelt = false
  ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
  zetTijdUitGrafiek(e)
}
function grafiekMove(e: PointerEvent) {
  if ((e.currentTarget as Element).hasPointerCapture(e.pointerId)) zetTijdUitGrafiek(e)
}

const weerOpties = [
  { waarde: 'echt', label: 'Echte data' },
  { waarde: 'helder', label: '☀ Helder' },
  { waarde: 'bewolkt', label: '☁ Bewolkt' },
  { waarde: 'regen', label: '🌧 Regen' },
  { waarde: 'sneeuw', label: '❄ Sneeuw' },
  { waarde: 'mist', label: '🌫 Mist' },
  { waarde: 'storm', label: '⛈ Onweer' },
  { waarde: 'windig', label: '💨 Windig' },
] as const

const seizoenen = ['winter', 'lente', 'zomer', 'herfst'] as const

// Terugval-voorbeelden bij de spraakknop
const luisterTekst = computed(() => (spraak.luistert ? 'Ik luister…' : 'Praat tegen het huis'))
</script>

<template>
  <aside class="dash" :class="{ klein }" aria-label="Energy Twin dashboard">
    <header class="kop">
      <div>
        <h1>Energy Twin</h1>
        <p class="sub">Zonne-energie · {{ LOCATIE.naam }}</p>
      </div>
      <button class="icoon" :aria-label="klein ? 'Dashboard openen' : 'Dashboard verkleinen'" @click="klein = !klein">
        {{ klein ? '▢' : '–' }}
      </button>
    </header>

    <div v-show="!klein" class="inhoud">
      <p class="bron" :data-status="bronStatus">
        <span class="punt" />{{ bronTekst }}
      </p>

      <button class="party" :class="{ aan: feest.aan }" :aria-pressed="feest.aan" @click="wisselFeest">
        {{ feest.aan ? '🛑 Stop het feest' : '🎉 Party!' }}
      </button>
      <p v-if="feest.aan && feest.stil" class="stil">Klik ergens op de pagina om de muziek te starten.</p>

      <!-- Live waarden -->
      <section class="kpis" aria-label="Live waarden">
        <div class="kpi groot">
          <span class="label">Vermogen nu</span>
          <span class="waarde">{{ vermogenTekst }}</span>
        </div>
        <div class="kpi">
          <span class="label">Vandaag tot nu</span>
          <span class="waarde">{{ nl(totNu) }} <small>kWh</small></span>
        </div>
        <div class="kpi">
          <span class="label">Dagtotaal</span>
          <span class="waarde">{{ nl(dagTotaal) }} <small>kWh</small></span>
        </div>
        <div class="kpi">
          <span class="label">Besparing</span>
          <span class="waarde">€ {{ nl(besparing, 2) }}</span>
        </div>
        <div class="kpi">
          <span class="label">Weer</span>
          <span class="waarde klein-tekst">{{ weerLabel }} · {{ Math.round(nu.weer.temp) }}°C</span>
          <span class="onder">zon {{ zonHoogte }} · {{ Math.round(nu.weer.bewolking) }}% wolken</span>
        </div>
        <div class="kpi">
          <span class="label">Wind</span>
          <span class="waarde klein-tekst">{{ windKpi }}</span>
        </div>
        <div class="kpi">
          <span class="label">Neerslag</span>
          <span class="waarde klein-tekst">{{ neerslagKpi }}</span>
        </div>
      </section>

      <!-- Grafiek -->
      <section aria-label="Vermogen over de dag">
        <svg
          ref="grafiek"
          class="grafiek"
          :viewBox="`0 0 ${W} ${H}`"
          role="img"
          aria-label="Grafiek van het vermogen in kilowatt over de dag. Klik om de tijd te kiezen."
          @pointerdown="grafiekDown"
          @pointermove="grafiekMove"
        >
          <defs>
            <clipPath id="tot-nu"><rect :x="0" :y="0" :width="x(staat.uur)" :height="H" /></clipPath>
          </defs>
          <g v-for="l in yLijnen" :key="l.label + l.y">
            <line :x1="links" :x2="W - rechts" :y1="l.y" :y2="l.y" class="raster" />
            <text :x="links - 5" :y="l.y + 3" class="as" text-anchor="end">{{ l.label }}</text>
          </g>
          <text v-for="u in [0, 6, 12, 18, 24]" :key="u" :x="x(u)" :y="H - 6" class="as" text-anchor="middle">{{ u }}u</text>
          <text :x="links" :y="8" class="as">kW</text>
          <path :d="vlak" class="vlak" />
          <path :d="vlak" class="vlak nu" clip-path="url(#tot-nu)" />
          <path :d="lijn" class="curve" />
          <line :x1="x(staat.uur)" :x2="x(staat.uur)" :y1="boven" :y2="H - onder" class="marker" />
          <circle :cx="x(staat.uur)" :cy="y(nu.vermogen)" r="4.5" class="bol" />
        </svg>
      </section>

      <!-- Regelaars -->
      <section class="regelaars" aria-label="Regelaars">
        <label class="regel">
          <span class="rij"><span>Tijd</span><output>{{ formatUur(staat.uur) }}</output></span>
          <input v-model.number="staat.uur" type="range" min="0" max="24" step="0.05" @input="staat.speelt = false" />
        </label>

        <div class="rij knoppen">
          <button class="knop" :class="{ aan: staat.speelt }" @click="staat.speelt = !staat.speelt">
            {{ staat.speelt ? '❚❚ Pauze' : '▶ Dag afspelen' }}
          </button>
          <label class="select">
            <span class="verborgen">Snelheid</span>
            <select v-model.number="staat.snelheid">
              <option :value="0.25">0,25 u/s</option>
              <option :value="0.5">0,5 u/s</option>
              <option :value="1">1 u/s</option>
              <option :value="2">2 u/s</option>
              <option :value="4">4 u/s</option>
            </select>
          </label>
        </div>

        <label class="regel">
          <span class="rij"><span>Zonnepanelen</span><output>{{ staat.panelen }} / {{ MAX_PANELEN }}</output></span>
          <input v-model.number="staat.panelen" type="range" min="0" :max="MAX_PANELEN" step="1" />
        </label>

        <div class="regel">
          <span class="rij"><span>Datum</span></span>
          <div class="rij knoppen">
            <input v-model="staat.datum" class="datum" type="date" aria-label="Datum" />
            <button class="knop" @click="zetVandaag">Vandaag</button>
          </div>
          <div class="chips">
            <button v-for="s in seizoenen" :key="s" class="chip seizoen" @click="zetSeizoen(s)">{{ s }}</button>
          </div>
        </div>

        <div class="regel">
          <span class="rij"><span>Weer</span></span>
          <div class="chips">
            <button
              v-for="o in weerOpties"
              :key="o.waarde"
              class="chip"
              :class="{ aan: staat.weerbron === o.waarde }"
              :aria-pressed="staat.weerbron === o.waarde"
              @click="staat.weerbron = o.waarde"
            >
              {{ o.label }}
            </button>
          </div>
          <label class="regel">
            <span class="rij"><span>Extra wind</span><output>{{ staat.windExtra > 0 ? '+' : '' }}{{ nl(staat.windExtra) }} m/s</output></span>
            <input v-model.number="staat.windExtra" type="range" min="-6" max="12" step="0.5" />
          </label>
        </div>
      </section>

      <!-- Spraak -->
      <section class="spraak" aria-label="Spraakbediening">
        <button
          class="mic"
          :class="{ luistert: spraak.luistert }"
          :disabled="!spraak.ondersteund"
          :aria-pressed="spraak.luistert"
          @click="spraak.luistert ? stopLuisteren() : startLuisteren()"
        >
          <span class="mic-icoon">🎙</span>{{ spraak.ondersteund ? luisterTekst : 'Spraak niet ondersteund in deze browser' }}
        </button>

        <p v-if="spraak.tussentijds" class="verstaan"><em>Verstaan:</em> “{{ spraak.tussentijds }}”</p>
        <p v-else-if="spraak.verstaan" class="verstaan"><em>Verstaan:</em> “{{ spraak.verstaan }}”</p>
        <p v-if="spraak.gevolg" class="gevolg"><em>Gevolg:</em> {{ spraak.gevolg }}</p>
        <p v-if="spraak.fout" class="fout" role="alert">{{ spraak.fout }}</p>

        <div class="chips">
          <button v-for="k in commandoKnoppen" :key="k.zin" class="chip" @click="voerUit(k.zin)">{{ k.label }}</button>
        </div>
      </section>

      <p class="voet">
        Model: {{ MAX_PANELEN }} panelen × 1,76 m² × 20% rendement · tube in de tuin = {{ METER_MAX_KWH }} kWh ·
        € {{ nl(PRIJS_PER_KWH, 2) }}/kWh
      </p>
    </div>
  </aside>
</template>

<style scoped>
.dash {
  --tekst: #17283a;
  --zacht: #5b6b7b;
  --lijn: rgba(23, 40, 58, 0.12);
  --accent: #e08f28;
  --accent-donker: #b8701a;
  --groen: #1f9d62;
  --vlak: rgba(255, 255, 255, 0.9);
  position: fixed;
  top: 16px;
  left: 16px;
  z-index: 10;
  width: min(360px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  padding: 14px 16px 16px;
  box-sizing: border-box;
  color: var(--tekst);
  background: var(--vlak);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(10, 30, 60, 0.18);
  font: 13px/1.4 system-ui, -apple-system, 'Segoe UI', sans-serif;
}

.kop {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}
h1 {
  margin: 0;
  font-size: 18px;
  letter-spacing: -0.01em;
}
.sub {
  margin: 0;
  color: var(--zacht);
}
.icoon {
  width: 30px;
  height: 30px;
  border: 1px solid var(--lijn);
  border-radius: 8px;
  background: transparent;
  color: var(--tekst);
  cursor: pointer;
}
.inhoud {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
}

.bron {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  color: var(--zacht);
  font-size: 12px;
}
.punt {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #aab4be;
}
[data-status='live'] .punt {
  background: var(--groen);
}
[data-status='laden'] .punt {
  background: var(--accent);
}
[data-status='offline'] .punt {
  background: #d04a4a;
}

.kpis {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.kpi {
  padding: 8px 10px;
  background: rgba(23, 40, 58, 0.05);
  border-radius: 10px;
}
.kpi.groot {
  grid-column: 1 / -1;
  background: linear-gradient(135deg, #ffe7b3, #ffd27a);
}
.label {
  display: block;
  color: var(--zacht);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.groot .label {
  color: #7a5412;
}
.waarde {
  font-size: 18px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
}
.groot .waarde {
  font-size: 28px;
}
.waarde small {
  font-size: 12px;
  font-weight: 500;
  color: var(--zacht);
}
.klein-tekst {
  font-size: 13px;
  font-weight: 600;
}
.party {
  padding: 10px 12px;
  font: inherit;
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #ff3d81, #ff8a3d 50%, #ffd23f);
  border: 0;
  border-radius: 10px;
  cursor: pointer;
}
.party.aan {
  background: var(--tekst);
}
.stil {
  margin: 0;
  color: #b02a2a;
  font-size: 12px;
}
.onder {
  display: block;
  margin-top: 2px;
  color: var(--zacht);
  font-size: 11px;
}

.grafiek {
  display: block;
  width: 100%;
  height: auto;
  touch-action: none;
  cursor: ew-resize;
  background: rgba(23, 40, 58, 0.04);
  border-radius: 10px;
}
.raster {
  stroke: var(--lijn);
  stroke-width: 1;
}
.as {
  fill: var(--zacht);
  font-size: 9px;
}
.vlak {
  fill: rgba(224, 143, 40, 0.18);
}
.vlak.nu {
  fill: rgba(224, 143, 40, 0.5);
}
.curve {
  fill: none;
  stroke: var(--accent-donker);
  stroke-width: 1.8;
}
.marker {
  stroke: var(--tekst);
  stroke-width: 1;
  stroke-dasharray: 3 3;
}
.bol {
  fill: #fff;
  stroke: var(--accent-donker);
  stroke-width: 2.5;
}

.regelaars {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.regel {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.rij {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
output {
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}
input[type='range'] {
  width: 100%;
  accent-color: var(--accent);
}
.knoppen {
  justify-content: flex-start;
}
.knop,
.chip,
select,
.datum {
  font: inherit;
  color: var(--tekst);
  background: #fff;
  border: 1px solid var(--lijn);
  border-radius: 8px;
  padding: 6px 10px;
}
.knop,
.chip {
  cursor: pointer;
}
.knop:hover,
.chip:hover {
  border-color: var(--accent);
}
.knop.aan,
.chip.aan {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}
.datum {
  flex: 1;
  min-width: 0;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.chip {
  padding: 4px 10px;
  font-size: 12px;
}
.chip.seizoen {
  text-transform: capitalize;
}

.spraak {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 10px;
  border-top: 1px solid var(--lijn);
}
.mic {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 9px 12px;
  font: inherit;
  font-weight: 600;
  color: #fff;
  background: var(--tekst);
  border: 0;
  border-radius: 10px;
  cursor: pointer;
}
.mic:disabled {
  background: #aab4be;
  cursor: not-allowed;
}
.mic.luistert {
  background: #d04a4a;
  animation: puls 1.2s ease-in-out infinite;
}
@keyframes puls {
  50% {
    box-shadow: 0 0 0 6px rgba(208, 74, 74, 0.25);
  }
}
.verstaan,
.gevolg,
.fout {
  margin: 0;
}
.verstaan em,
.gevolg em {
  color: var(--zacht);
  font-style: normal;
  font-weight: 600;
}
.gevolg {
  color: #14633f;
}
.fout {
  color: #b02a2a;
}
.voet {
  margin: 0;
  color: var(--zacht);
  font-size: 11px;
}
.verborgen {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}

button:focus-visible,
input:focus-visible,
select:focus-visible {
  outline: 2px solid #1b6fd1;
  outline-offset: 2px;
}

.dash.klein {
  width: auto;
  padding: 10px 12px;
}

@media (max-width: 640px) {
  .dash {
    top: auto;
    bottom: 8px;
    left: 8px;
    width: calc(100vw - 16px);
    max-height: 62vh;
  }
}

@media (prefers-reduced-motion: reduce) {
  .mic.luistert {
    animation: none;
  }
}
</style>
