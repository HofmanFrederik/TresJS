import { reactive } from 'vue'
import { feest, startFeest, stopFeest } from './useFeest'
import {
  MAX_PANELEN,
  type Weerbron,
  dagTotaal,
  formatUur,
  nu,
  staat,
  weerLabel,
  windTekst,
  totNu,
  zetSeizoen,
  zetVandaag,
  zonnetijden,
} from './useEnergie'

// Web Speech API: werkt in Chrome en Edge, niet in Firefox. Daarom hebben alle commando's ook een knop.
const Herkenner =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

export const spraak = reactive({
  ondersteund: Boolean(Herkenner),
  luistert: false,
  tussentijds: '', // wat er nu verstaan wordt
  verstaan: '', // laatste volledige zin
  gevolg: '', // wat er daarna gebeurde
  fout: '',
})

export const commandoKnoppen = [
  { label: '🎉 Party', zin: 'party' },
  { label: 'Zon op 15 uur', zin: 'zet de zon op 15 uur' },
  { label: 'Hoeveel energie?', zin: 'hoeveel energie produceren we' },
  { label: 'Meer panelen', zin: 'meer panelen' },
  { label: 'Minder panelen', zin: 'minder panelen' },
  { label: 'Bewolkt', zin: 'maak het bewolkt' },
  { label: 'Zonnig', zin: 'maak het zonnig' },
  { label: 'Regen', zin: 'laat het regenen' },
  { label: 'Sneeuw', zin: 'laat het sneeuwen' },
  { label: 'Meer wind', zin: 'meer wind' },
  { label: 'Hoe is het weer?', zin: 'hoe is het weer' },
  { label: 'Zomer', zin: 'zet het op zomer' },
  { label: 'Winter', zin: 'zet het op winter' },
]

const getalWoorden: [string, number][] = [
  ['vierentwintig', 24],
  ['drieentwintig', 23],
  ['tweeentwintig', 22],
  ['eenentwintig', 21],
  ['negentien', 19],
  ['zeventien', 17],
  ['veertien', 14],
  ['dertien', 13],
  ['vijftien', 15],
  ['zestien', 16],
  ['achttien', 18],
  ['twintig', 20],
  ['twaalf', 12],
  ['negen', 9],
  ['zeven', 7],
  ['twee', 2],
  ['drie', 3],
  ['vier', 4],
  ['vijf', 5],
  ['acht', 8],
  ['zes', 6],
  ['tien', 10],
  ['elf', 11],
  ['een', 1],
  ['nul', 0],
]

// kleine letters, geen accenten, getalwoorden naar cijfers
function normaliseer(zin: string) {
  let t = zin
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[,!?]/g, ' ')
  for (const [woord, getal] of getalWoorden)
    t = t.replace(new RegExp(`\\b${woord}\\b`, 'g'), String(getal))
  return t.replace(/\s+/g, ' ').trim()
}

const afronden = (n: number, d = 1) => n.toFixed(d).replace('.', ',')
const kw = (w: number) =>
  w >= 1000 ? `${afronden(w / 1000)} kilowatt` : `${Math.round(w)} watt`

function productieAntwoord() {
  if (staat.panelen === 0)
    return 'Er zijn geen panelen ingeschakeld, dus er wordt niets geproduceerd.'
  return `Om ${formatUur(staat.uur)} produceren we ${kw(nu.value.vermogen)}. Tot nu toe ${afronden(totNu.value)} kilowattuur, en vandaag in totaal ${afronden(dagTotaal.value)} kilowattuur.`
}

interface Resultaat {
  tekst: string
  antwoord?: boolean // wordt hardop voorgelezen als de zin gesproken was
}

// Zin omzetten naar een actie. De volgorde bepaalt welk commando voorrang krijgt.
function interpreteer(invoer: string): Resultaat | null {
  const t = normaliseer(invoer)
  const getal = t.match(/\d+/)

  // 0. Feest: moet vóór de rest komen, want "stop het feest" bevat ook "stop"
  if (/\b(stop|einde|geen|uit|genoeg)\b.*\b(party|partij|feest|feestje|disco|muziek)\b/.test(t)) {
    stopFeest()
    return { tekst: 'Het feest is voorbij. Tijd en weer staan weer zoals ervoor.' }
  }
  if (/\b(party|partie|partij|parti|feest|feestje|disco)\b/.test(t)) {
    if (feest.aan) return { tekst: 'Het feest is al bezig!' }
    startFeest()
    return { tekst: 'Party! Het is 22:00, de discolichten draaien en de Beatles dansen. Zeg "stop het feest" om te stoppen.' }
  }

  // 1. Panelen: "meer panelen", "zet 8 panelen aan", "alle panelen uit"
  if (/paneel|panelen/.test(t)) {
    if (/\b(alle|maximum|max|vol)\b/.test(t)) staat.panelen = MAX_PANELEN
    else if (/\b(geen|nul|uit)\b/.test(t)) staat.panelen = 0
    else if (getal) staat.panelen = Math.min(MAX_PANELEN, Number(getal[0]))
    else if (/\b(meer|extra|erbij|bij)\b/.test(t))
      staat.panelen = Math.min(MAX_PANELEN, staat.panelen + 2)
    else if (/\b(minder|weg|eraf)\b/.test(t))
      staat.panelen = Math.max(0, staat.panelen - 2)
    else return null
    return { tekst: `Aantal panelen: ${staat.panelen} van ${MAX_PANELEN}.` }
  }

  // 2. Vraag naar de productie
  if (
    /hoeveel|productie|produceren|opbrengst|opgewekt|kwh|vermogen|energie/.test(
      t,
    )
  ) {
    return { tekst: productieAntwoord(), antwoord: true }
  }

  // 3. Seizoen
  const seizoen = t.match(/\b(winter|lente|voorjaar|zomer|herfst|najaar)\b/)
  if (seizoen) {
    const naam =
      { voorjaar: 'lente', najaar: 'herfst' }[seizoen[1]] ?? seizoen[1]
    zetSeizoen(naam as 'winter' | 'lente' | 'zomer' | 'herfst')
    return { tekst: `Datum gezet op ${staat.datum} (${naam}).` }
  }
  if (/\b(vandaag|nu)\b/.test(t) && !getal) {
    zetVandaag()
    return { tekst: `Datum gezet op vandaag (${staat.datum}).` }
  }

  // 4. Weer: eerst de vraag, dan wind en de weertypes
  if (/(hoe|wat).*\bweer\b/.test(t)) {
    const w = nu.value.weer
    return {
      tekst: `${weerLabel.value}, ${Math.round(w.temp)} graden, ${afronden(w.bewolking, 0)} procent bewolking en wind van ${afronden(w.wind)} meter per seconde uit het ${windTekst(w.windrichting)}.`,
      antwoord: true,
    }
  }
  if (/\bwind\b/.test(t) && /\b(meer|harder|sterker|extra)\b/.test(t)) {
    staat.windExtra = Math.min(12, staat.windExtra + 3)
    return {
      tekst: `Extra wind: ${afronden(staat.windExtra)} meter per seconde (nu ${afronden(nu.value.weer.wind)}).`,
    }
  }
  if (/\bwind\b/.test(t) && /\b(minder|zachter|rustiger|zwakker)\b/.test(t)) {
    staat.windExtra = Math.max(-6, staat.windExtra - 3)
    return {
      tekst: `Extra wind: ${afronden(staat.windExtra)} meter per seconde (nu ${afronden(nu.value.weer.wind)}).`,
    }
  }
  const weertypes: [RegExp, Weerbron, string][] = [
    [/onweer|storm|bliksem|donder/, 'storm', 'onweer met bliksem'],
    [/sneeuw|sneeuwt|sneeuwen|winters/, 'sneeuw', 'sneeuw (panelen bedekt)'],
    [/regen|regent|regenen|\bnat\b/, 'regen', 'regen'],
    [/mist|mistig|nevel/, 'mist', 'mist'],
    [/windig|waait|blaast/, 'windig', 'veel wind'],
    [/bewolkt|grijs|somber/, 'bewolkt', 'bewolkt'],
    [/zonnig|helder|zonneschijn|mooi weer/, 'helder', 'heldere hemel'],
    [/\b(echt|echte|live|data)\b/, 'echt', 'echte data van Open-Meteo'],
  ]
  for (const [patroon, bron, naam] of weertypes) {
    if (patroon.test(t)) {
      staat.weerbron = bron
      return { tekst: `Weer: ${naam}.` }
    }
  }

  // 5. Afspelen / pauzeren
  if (/\b(stop|pauze|pauzeer|houd|hou)\b/.test(t)) {
    staat.speelt = false
    return { tekst: 'Simulatie gepauzeerd.' }
  }
  if (/\b(start|speel|afspelen|hervat|verder)\b/.test(t)) {
    staat.speelt = true
    return { tekst: 'Simulatie speelt de dag af.' }
  }
  if (/sneller|versnel/.test(t)) {
    staat.snelheid = Math.min(4, staat.snelheid * 2)
    return { tekst: `Snelheid: ${staat.snelheid} uur per seconde.` }
  }
  if (/trager|vertraag/.test(t)) {
    staat.snelheid = Math.max(0.25, staat.snelheid / 2)
    return { tekst: `Snelheid: ${staat.snelheid} uur per seconde.` }
  }

  // 6. Tijdstip: "zet de zon op 15 uur", "om 9:30", "zonsopgang", "middag"
  const tijden = zonnetijden(staat.datum)
  const benoemd = [
    {
      woord: /zonsopgang|zonsopkomst/,
      uur: tijden.opkomst,
      naam: 'zonsopgang',
    },
    { woord: /zonsondergang/, uur: tijden.ondergang, naam: 'zonsondergang' },
    {
      woord: /middag|zenit/,
      uur: tijden.middag,
      naam: 'de middag (hoogste zonnestand)',
    },
    { woord: /middernacht/, uur: 0, naam: 'middernacht' },
  ].find((b) => b.woord.test(t))
  if (benoemd && benoemd.uur !== null) {
    staat.uur = benoemd.uur
    staat.speelt = false
    return {
      tekst: `Tijd gezet op ${formatUur(staat.uur)}, ${benoemd.naam}. Afspelen gepauzeerd.`,
    }
  }
  const tijd = t.match(/(\d{1,2})\s*(?:uur|u|h|:|\.)?\s*(\d{2})?/)
  if (tijd && /\b(zon|tijd|klok|uur|u|om|zet|stel)\b/.test(t)) {
    const uren = Number(tijd[1])
    const minuten = tijd[2] ? Number(tijd[2]) : 0
    if (uren > 24 || minuten > 59)
      return { tekst: `${tijd[0]} is geen geldig uur.` }
    staat.uur = uren === 24 ? 0 : uren + minuten / 60
    staat.speelt = false
    return {
      tekst: `Tijd gezet op ${formatUur(staat.uur)}. Afspelen gepauzeerd.`,
    }
  }

  return null
}

function spreekUit(tekst: string) {
  try {
    if (!('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(tekst)
    u.lang = 'nl-BE'
    window.speechSynthesis.speak(u)
  } catch {
    // voorlezen is optioneel
  }
}

// Eén ingang voor spraak én knoppen
export function voerUit(zin: string, gesproken = false) {
  spraak.verstaan = zin
  spraak.tussentijds = ''
  spraak.fout = ''
  const resultaat = interpreteer(zin)
  if (resultaat) {
    spraak.gevolg = resultaat.tekst
    if (gesproken && resultaat.antwoord) spreekUit(resultaat.tekst)
  } else {
    spraak.gevolg =
      'Dat commando ken ik niet. Probeer bijvoorbeeld: "zet de zon op 15 uur" of "meer panelen".'
  }
}

const foutTeksten: Record<string, string> = {
  'not-allowed': 'Microfoon geweigerd. Gebruik de knoppen hieronder.',
  'service-not-allowed':
    'Spraakherkenning is geblokkeerd. Gebruik de knoppen hieronder.',
  'no-speech': 'Ik heb niets gehoord, probeer opnieuw.',
  'audio-capture': 'Geen microfoon gevonden. Gebruik de knoppen hieronder.',
  network: 'Spraakherkenning heeft internet nodig.',
}

let herkenner: any
export function startLuisteren() {
  if (!Herkenner || spraak.luistert) return
  herkenner = new Herkenner()
  herkenner.lang = 'nl-BE'
  herkenner.interimResults = true
  herkenner.continuous = false
  herkenner.onstart = () => {
    spraak.luistert = true
    spraak.fout = ''
    spraak.tussentijds = ''
  }
  herkenner.onresult = (e: any) => {
    let tekst = ''
    let klaar = false
    for (let i = e.resultIndex; i < e.results.length; i++) {
      tekst += e.results[i][0].transcript
      if (e.results[i].isFinal) klaar = true
    }
    spraak.tussentijds = tekst
    if (klaar) voerUit(tekst, true)
  }
  herkenner.onerror = (e: any) => {
    spraak.fout = foutTeksten[e.error] ?? `Spraakfout: ${e.error}`
  }
  herkenner.onend = () => {
    spraak.luistert = false
  }
  try {
    herkenner.start()
  } catch {
    spraak.luistert = false
  }
}

export function stopLuisteren() {
  herkenner?.stop()
}
