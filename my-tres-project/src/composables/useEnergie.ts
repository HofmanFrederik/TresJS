import { computed, reactive, ref, watchEffect } from 'vue'
import { getPosition, getTimes } from 'suncalc'
import { angle as DAK_HOEK } from './huis'

// ---------------------------------------------------------------------------
// Instellingen van de installatie
// ---------------------------------------------------------------------------
export const LOCATIE = { naam: 'Kortrijk', lat: 50.83, lon: 3.26 }
export const MAX_PANELEN = 16
export const METER_MAX_KWH = 30 // volle dagmeter in de scène
export const PRIJS_PER_KWH = 0.3 // euro

const PANEEL_OPPERVLAK = 1.76 // m² per paneel (1,6 x 1,1 m)
const RENDEMENT = 0.2 // ±20% van de instraling wordt elektriciteit
const SYSTEEMFACTOR = 0.9 // verlies in omvormer en kabels
const TEMP_COEFFICIENT = 0.004 // -0,4% rendement per graad boven 25 °C
const SNEEUW_DREMPEL = 0.05 // cm/u: daarboven ligt er sneeuw op dak en panelen

export type Weerbron = 'echt' | 'helder' | 'bewolkt' | 'regen' | 'sneeuw' | 'mist' | 'storm' | 'windig'

export const weerNamen: Record<Weerbron, string> = {
  echt: 'echte data',
  helder: 'heldere hemel',
  bewolkt: 'bewolkte dag',
  regen: 'regenachtige dag',
  sneeuw: 'sneeuwdag',
  mist: 'mistige dag',
  storm: 'onweer',
  windig: 'winderige dag',
}

// ---------------------------------------------------------------------------
// Toestand die door sliders, knoppen en spraak wordt aangepast
// ---------------------------------------------------------------------------
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const staat = reactive({
  datum: iso(new Date()),
  uur: 9, // 0 - 24
  speelt: true,
  snelheid: 1, // gesimuleerde uren per echte seconde
  panelen: 12,
  weerbron: 'echt' as Weerbron,
  windExtra: 0, // m/s erbij of eraf, bovenop het gekozen weer
})

// ---------------------------------------------------------------------------
// Echte data: Open-Meteo (uurwaarden voor één dag)
// ---------------------------------------------------------------------------
interface DagData {
  dni: number[] // directe straling loodrecht op de zon (W/m²)
  diffuus: number[] // diffuse straling op een horizontaal vlak (W/m²)
  bewolking: number[] // %
  temp: number[] // °C
  neerslag: number[] // mm/u
  sneeuw: number[] // cm/u
  wind: number[] // m/s op 10 m
  windrichting: number[] // graden waaruit de wind komt (0 = noord)
  code: number[] // WMO-weercode (45/48 = mist, 95-99 = onweer)
}

const cache = reactive<Record<string, DagData>>({})
const mislukt = reactive<Record<string, boolean>>({})
const bronDatum = reactive<Record<string, string>>({})
const lopend = new Set<string>()

function bronUrl(datum: string) {
  const dagenGeleden = (Date.now() - new Date(`${datum}T12:00:00`).getTime()) / 864e5
  const forecast = 'https://api.open-meteo.com/v1/forecast'
  const archief = 'https://archive-api.open-meteo.com/v1/archive'

  let basis = forecast
  let dag = datum
  if (dagenGeleden > 85) {
    basis = archief
  } else if (dagenGeleden < -15) {
    // te ver in de toekomst: neem dezelfde dag vorig jaar uit het archief
    const vorigJaar = new Date(`${datum}T12:00:00`)
    vorigJaar.setFullYear(vorigJaar.getFullYear() - 1)
    dag = iso(vorigJaar)
    basis = archief
  }
  bronDatum[datum] = dag

  const q = new URLSearchParams({
    latitude: String(LOCATIE.lat),
    longitude: String(LOCATIE.lon),
    hourly:
      'direct_normal_irradiance,diffuse_radiation,cloud_cover,temperature_2m,precipitation,snowfall,wind_speed_10m,wind_direction_10m,weather_code',
    wind_speed_unit: 'ms',
    timezone: 'Europe/Brussels',
    start_date: dag,
    end_date: dag,
  })
  return `${basis}?${q}`
}

async function laadDag(datum: string) {
  if (cache[datum] || lopend.has(datum)) return
  lopend.add(datum)
  try {
    const res = await fetch(bronUrl(datum))
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const { hourly } = await res.json()
    const uren = (reeks: (number | null)[]) => reeks.slice(0, 24).map((v) => v ?? 0)
    cache[datum] = {
      dni: uren(hourly.direct_normal_irradiance),
      diffuus: uren(hourly.diffuse_radiation),
      bewolking: uren(hourly.cloud_cover),
      temp: uren(hourly.temperature_2m),
      neerslag: uren(hourly.precipitation),
      sneeuw: uren(hourly.snowfall),
      wind: uren(hourly.wind_speed_10m),
      windrichting: uren(hourly.wind_direction_10m),
      code: uren(hourly.weather_code),
    }
    delete mislukt[datum]
  } catch {
    mislukt[datum] = true
  } finally {
    lopend.delete(datum)
  }
}

watchEffect(() => {
  laadDag(staat.datum)
})

export const bronStatus = computed(() => {
  if (staat.weerbron !== 'echt') return 'model' as const
  if (cache[staat.datum]) return 'live' as const
  return mislukt[staat.datum] ? ('offline' as const) : ('laden' as const)
})

export const bronTekst = computed(() => {
  switch (bronStatus.value) {
    case 'live': {
      const dag = bronDatum[staat.datum]
      return dag && dag !== staat.datum
        ? `Open-Meteo, ${dag} (zelfde dag vorig jaar)`
        : `Open-Meteo, ${LOCATIE.naam}`
    }
    case 'laden':
      return 'Weerdata laden…'
    case 'offline':
      return 'Open-Meteo niet bereikbaar, heldere-hemelmodel'
    default:
      return `Model: ${weerNamen[staat.weerbron]}`
  }
})

// ---------------------------------------------------------------------------
// Zonnestand (SunCalc) en weer op een bepaald moment
// ---------------------------------------------------------------------------
const rad = Math.PI / 180
const klem = (x: number, min = 0, max = 1) => Math.min(max, Math.max(min, x))

function tijdstip(datum: string, uur: number) {
  const [j, m, d] = datum.split('-').map(Number)
  return new Date(j, m - 1, d, 0, Math.round(uur * 60))
}

export function zonStand(datum: string, uur: number) {
  const { azimuth, altitude } = getPosition(tijdstip(datum, uur), LOCATIE.lat, LOCATIE.lon)
  // SunCalc 2: azimut vanaf het noorden, kloksgewijs. In de scène is +x zuid en +z west.
  const a = (azimuth - 180) * rad
  const h = altitude * rad
  return {
    hoogte: h,
    richting: { x: Math.cos(a) * Math.cos(h), y: Math.sin(h), z: Math.sin(a) * Math.cos(h) },
  }
}

export function zonnetijden(datum: string) {
  const t = getTimes(tijdstip(datum, 12), LOCATIE.lat, LOCATIE.lon)
  const naarUur = (d: Date | null | undefined) => (d ? d.getHours() + d.getMinutes() / 60 : null)
  return { opkomst: naarUur(t.sunrise), middag: naarUur(t.solarNoon), ondergang: naarUur(t.sunset) }
}

// Zonnestraling bij een onbewolkte hemel (eenvoudig model met luchtmassa)
function helderHemel(hoogte: number) {
  if (hoogte <= 0) return { dni: 0, diffuus: 0 }
  const deg = hoogte / rad
  const luchtmassa = 1 / (Math.sin(hoogte) + 0.50572 * Math.pow(deg + 6.07995, -1.6364))
  const dni = 1100 * Math.pow(0.7, Math.pow(luchtmassa, 0.678))
  return { dni, diffuus: 0.15 * dni * Math.sin(hoogte) + 20 * Math.sin(hoogte) }
}

function tussen(reeks: number[], uur: number) {
  const i0 = Math.min(23, Math.floor(uur))
  const i1 = Math.min(23, i0 + 1)
  return reeks[i0] + (reeks[i1] - reeks[i0]) * (uur - Math.floor(uur))
}

export interface Weer {
  dni: number
  diffuus: number
  bewolking: number // %
  temp: number // °C
  neerslag: number // mm/u
  sneeuw: number // cm/u
  wind: number // m/s
  windrichting: number // graden waaruit de wind komt
  onweer: boolean
  mist: number // 0 - 1
}

const droog = { neerslag: 0, sneeuw: 0, wind: 2, windrichting: 225, onweer: false, mist: 0 }

// Voorinstellingen: hoeveel zon er nog doorkomt en wat er uit de lucht valt
function voorinstelling(bron: Weerbron, hemel: { dni: number; diffuus: number }, hoogte: number): Weer {
  const ghi = hemel.dni * Math.sin(Math.max(hoogte, 0)) + hemel.diffuus
  switch (bron) {
    case 'bewolkt':
      return { ...droog, dni: hemel.dni * 0.05, diffuus: 0.25 * ghi, bewolking: 90, temp: 12, wind: 4 }
    case 'regen':
      return { ...droog, dni: hemel.dni * 0.02, diffuus: 0.15 * ghi, bewolking: 100, temp: 9, neerslag: 4, wind: 6 }
    case 'storm':
      return {
        ...droog,
        dni: hemel.dni * 0.01,
        diffuus: 0.1 * ghi,
        bewolking: 100,
        temp: 8,
        neerslag: 10,
        wind: 16,
        onweer: true,
      }
    case 'sneeuw':
      return { ...droog, dni: hemel.dni * 0.03, diffuus: 0.2 * ghi, bewolking: 95, temp: -2, neerslag: 1.5, sneeuw: 2, wind: 3 }
    case 'mist':
      return { ...droog, dni: hemel.dni * 0.1, diffuus: 0.5 * ghi, bewolking: 60, temp: 5, mist: 0.85, wind: 0.5 }
    case 'windig':
      return { ...droog, dni: hemel.dni * 0.9, diffuus: hemel.diffuus, bewolking: 25, temp: 14, wind: 13 }
    default:
      return { ...droog, ...hemel, bewolking: 0, temp: 18 }
  }
}

function weerOp(datum: string, uur: number, hoogte: number): Weer {
  let weer: Weer | undefined
  if (staat.weerbron === 'echt') {
    const dag = cache[datum]
    if (dag) {
      const dichtst = Math.min(23, Math.round(uur))
      const code = dag.code[dichtst]
      weer = {
        dni: tussen(dag.dni, uur),
        diffuus: tussen(dag.diffuus, uur),
        bewolking: tussen(dag.bewolking, uur),
        temp: tussen(dag.temp, uur),
        neerslag: tussen(dag.neerslag, uur),
        sneeuw: tussen(dag.sneeuw, uur),
        wind: tussen(dag.wind, uur),
        windrichting: dag.windrichting[dichtst], // niet interpoleren: 359° en 1° liggen dicht bij elkaar
        onweer: code >= 95,
        mist: code === 45 || code === 48 ? 0.8 : 0,
      }
    }
  }
  weer ??= voorinstelling(staat.weerbron === 'echt' ? 'helder' : staat.weerbron, helderHemel(hoogte), hoogte)
  return { ...weer, wind: Math.max(0, weer.wind + staat.windExtra) }
}

// ---------------------------------------------------------------------------
// Productiemodel
//   P = aantal × oppervlak × rendement × straling op het paneelvlak × temperatuurfactor
//   straling = DNI × cos(hoek tussen zon en paneel) + diffuus × (1 + cos(helling)) / 2
// ---------------------------------------------------------------------------
const paneelNormaal = { x: Math.sin(DAK_HOEK), y: Math.cos(DAK_HOEK), z: 0 } // zuidelijke dakhelling

export function vermogen(weer: Weer, r: { x: number; y: number; z: number }, aantal: number) {
  if (aantal <= 0 || r.y <= 0) return 0
  const cosHoek = Math.max(0, r.x * paneelNormaal.x + r.y * paneelNormaal.y + r.z * paneelNormaal.z)
  const kaal = weer.dni * cosHoek + weer.diffuus * ((1 + Math.cos(DAK_HOEK)) / 2)
  // sneeuw op de panelen houdt bijna alle licht tegen
  const instraling = weer.sneeuw > SNEEUW_DREMPEL ? kaal * 0.1 : kaal
  // wind koelt de panelen: lagere celtemperatuur = hoger rendement
  const celTemp = weer.temp + (0.025 * instraling) / (1 + 0.15 * weer.wind)
  const tempFactor = 1 - TEMP_COEFFICIENT * Math.max(0, celTemp - 25)
  return aantal * PANEEL_OPPERVLAK * RENDEMENT * SYSTEEMFACTOR * instraling * tempFactor
}

function momentopname(datum: string, uur: number) {
  const zon = zonStand(datum, uur)
  const weer = weerOp(datum, uur, zon.hoogte)
  return { uur, ...zon, weer, vermogen: vermogen(weer, zon.richting, staat.panelen) }
}

export const nu = computed(() => momentopname(staat.datum, staat.uur))

// Vermogenscurve van de hele dag (elk kwartier), W
export const kromme = computed(() =>
  Array.from({ length: 97 }, (_, i) => momentopname(staat.datum, i / 4).vermogen),
)

export const dagTotaal = computed(() => kromme.value.reduce((som, p, i, a) => (i ? som + ((p + a[i - 1]) / 2) * 0.25 : som), 0) / 1000)

// Energie van middernacht tot het huidige moment, kWh
export const totNu = computed(() => {
  const p = kromme.value
  let wh = 0
  for (let i = 0; i < 96; i++) {
    const t0 = i / 4
    if (staat.uur >= t0 + 0.25) {
      wh += ((p[i] + p[i + 1]) / 2) * 0.25
    } else if (staat.uur > t0) {
      const pMidden = p[i] + (p[i + 1] - p[i]) * ((staat.uur - t0) / 0.25)
      wh += ((p[i] + pMidden) / 2) * (staat.uur - t0)
      break
    }
  }
  return wh / 1000
})

export const besparing = computed(() => totNu.value * PRIJS_PER_KWH)

// ---------------------------------------------------------------------------
// Weer afgeleid: wind in de scène, sneeuwdek, labels
// ---------------------------------------------------------------------------
// De wind blaast naar de richting tegenover waar hij vandaan komt. In de scène is noord -x en oost -z.
export const windScene = computed(() => {
  const { wind, windrichting } = nu.value.weer
  const naar = ((windrichting + 180) % 360) * rad
  return { x: -Math.cos(naar) * wind, z: -Math.sin(naar) * wind }
})

export const sneeuwdek = computed(() => nu.value.weer.sneeuw > SNEEUW_DREMPEL)

const windStreken = ['N', 'NO', 'O', 'ZO', 'Z', 'ZW', 'W', 'NW']
export const windTekst = (graden: number) => windStreken[Math.round((((graden % 360) + 360) % 360) / 45) % 8]

export const weerLabel = computed(() => {
  const w = nu.value.weer
  if (w.onweer) return 'Onweer'
  if (w.sneeuw > SNEEUW_DREMPEL) return 'Sneeuw'
  if (w.neerslag > 0.1) return w.neerslag > 4 ? 'Zware regen' : 'Regen'
  if (w.mist > 0.5) return 'Mist'
  if (w.wind > 10) return 'Winderig'
  if (w.bewolking > 70) return 'Bewolkt'
  if (w.bewolking > 30) return 'Half bewolkt'
  return 'Zonnig'
})

// Bliksemflits: 1 = net geflitst, zakt snel naar 0
export const flits = ref(0)

// Mist in de scène: kleur en afstanden voor de fog
export const luchtOnder = ref('#e6f6fd')
export const mistInstelling = computed(() => {
  const m = nu.value.weer.mist
  return { kleur: luchtOnder.value, near: 60 - 54 * m, far: 220 - 175 * m }
})

// ---------------------------------------------------------------------------
// Licht en sfeer afgeleid van de zonnestand
// ---------------------------------------------------------------------------
const mixGetal = (a: number, b: number, t: number) => a + (b - a) * t
const hexNaarRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
export const mixKleur = (a: string, b: string, t: number) => {
  const [r1, g1, b1] = hexNaarRgb(a)
  const [r2, g2, b2] = hexNaarRgb(b)
  const c = [mixGetal(r1, r2, t), mixGetal(g1, g2, t), mixGetal(b1, b2, t)].map((v) => Math.round(v))
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

export const licht = computed(() => {
  const graden = nu.value.hoogte / rad
  const bewolking = nu.value.weer.bewolking / 100
  const dag = klem((graden + 6) / 30)
  const zon = graden > -1 ? (0.25 + 1.5 * klem(Math.sin(nu.value.hoogte) / 0.45)) * (1 - 0.7 * bewolking) : 0
  return {
    dag, // 0 = nacht, 1 = volle dag
    ambient: 0.22 + 0.7 * dag,
    zon,
    zonKleur: mixKleur('#FFFFFF', '#FFA860', klem(1 - graden / 20)),
  }
})

// Kleuren van de lucht per zonshoogte (graden): [hoogte, boven, onder]
const luchtSleutels: [number, string, string][] = [
  [-18, '#0a1128', '#1c2b52'],
  [-4, '#26305e', '#f2845c'],
  [6, '#5fa8dc', '#f9c58b'],
  [25, '#6cc3ec', '#e6f6fd'],
]

function luchtKleuren(graden: number, bewolking: number) {
  const eerste = luchtSleutels[0]
  const laatste = luchtSleutels[luchtSleutels.length - 1]
  let boven = graden <= eerste[0] ? eerste[1] : laatste[1]
  let onder = graden <= eerste[0] ? eerste[2] : laatste[2]
  for (let i = 0; i < luchtSleutels.length - 1; i++) {
    const [h0, b0, o0] = luchtSleutels[i]
    const [h1, b1, o1] = luchtSleutels[i + 1]
    if (graden > h0 && graden < h1) {
      const t = (graden - h0) / (h1 - h0)
      boven = mixKleur(b0, b1, t)
      onder = mixKleur(o0, o1, t)
    }
  }
  // bewolking maakt de lucht grijzer
  const grijs = klem(graden / 25) * 0.5 + 0.2
  return [mixKleur(boven, '#8d96a0', bewolking * grijs), mixKleur(onder, '#c7ccd1', bewolking * grijs)]
}

watchEffect(() => {
  const w = nu.value.weer
  let [boven, onder] = luchtKleuren(nu.value.hoogte / rad, w.bewolking / 100)
  // regen en onweer maken de lucht donker, mist en sneeuw maken hem melkwit
  const donker = klem(w.neerslag / 10) * 0.45 + (w.onweer ? 0.25 : 0)
  boven = mixKleur(boven, '#39414b', donker)
  onder = mixKleur(onder, '#59616b', donker)
  boven = mixKleur(boven, '#cfd4d9', w.mist * 0.75 + (sneeuwdek.value ? 0.25 : 0))
  onder = mixKleur(onder, '#d9dde1', w.mist * 0.85 + (sneeuwdek.value ? 0.25 : 0))
  boven = mixKleur(boven, '#ffffff', flits.value * 0.6)
  onder = mixKleur(onder, '#ffffff', flits.value * 0.6)
  luchtOnder.value = onder
  document.documentElement.style.setProperty('--lucht-boven', boven)
  document.documentElement.style.setProperty('--lucht-onder', onder)
})

// ---------------------------------------------------------------------------
// Acties (gebruikt door de sliders, de knoppen en de spraakcommando's)
// ---------------------------------------------------------------------------
export const formatUur = (uur: number) => {
  const totaal = Math.round(uur * 60) % 1440
  return `${String(Math.floor(totaal / 60)).padStart(2, '0')}:${String(totaal % 60).padStart(2, '0')}`
}

export function zetSeizoen(naam: 'winter' | 'lente' | 'zomer' | 'herfst') {
  const [maand, dag] = { winter: [12, 21], lente: [3, 20], zomer: [6, 21], herfst: [9, 22] }[naam]
  const vandaag = new Date()
  let datum = new Date(vandaag.getFullYear(), maand - 1, dag)
  if (datum > vandaag) datum = new Date(vandaag.getFullYear() - 1, maand - 1, dag)
  staat.datum = iso(datum)
}

export function zetVandaag() {
  staat.datum = iso(new Date())
}

let tikGestart = false
export function startTikken() {
  if (tikGestart) return
  tikGestart = true
  let laatste = 0
  const tik = (t: number) => {
    const dt = laatste ? (t - laatste) / 1000 : 0
    if (laatste && staat.speelt) {
      staat.uur = (staat.uur + dt * staat.snelheid) % 24
    }
    // onweer: af en toe een flits die snel uitdooft
    if (nu.value.weer.onweer && Math.random() < dt * 0.3) flits.value = 1
    flits.value = flits.value > 0.01 ? flits.value * Math.exp(-dt * 10) : 0
    laatste = t
    requestAnimationFrame(tik)
  }
  requestAnimationFrame(tik)
}
