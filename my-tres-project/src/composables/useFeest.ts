import { reactive } from 'vue'
import { staat, type Weerbron } from './useEnergie'

// Party mode: het wordt avond, de lichten gaan aan en er klinkt een zelfgemaakte beat (Web Audio API).
export const BPM = 124
const STAP = 60 / BPM / 4 // een zestiende noot in seconden
const BEAT_MS = (60 / BPM) * 1000

export const feest = reactive({
  aan: false,
  stil: false, // true als de browser de muziek nog blokkeert (geen klik op de pagina geweest)
})

// Wat er stond voor het feest begon, zodat we dat daarna kunnen terugzetten
let bewaard: { uur: number; speelt: boolean; weerbron: Weerbron } | null = null

let ctx: AudioContext | null = null
let master: GainNode | null = null
let ruis: AudioBuffer | null = null
let timer = 0
let volgende = 0
let stap = 0
let maat = 0
let t0 = 0 // performance.now() van de eerste kick, gebruikt om de visuals mee te laten pulseren

// 1 op de tel, zakt daarna snel naar 0 (voor lichten en confetti)
export function beatPuls() {
  if (!feest.aan) return 0
  const fase = (((performance.now() - t0) % BEAT_MS) + BEAT_MS) % BEAT_MS
  return Math.pow(1 - fase / BEAT_MS, 3)
}

// --- instrumenten -------------------------------------------------------
function kick(t: number) {
  const o = ctx!.createOscillator()
  const g = ctx!.createGain()
  o.frequency.setValueAtTime(150, t)
  o.frequency.exponentialRampToValueAtTime(45, t + 0.12)
  g.gain.setValueAtTime(1, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
  o.connect(g).connect(master!)
  o.start(t)
  o.stop(t + 0.4)
}

function ruisBron(t: number, duur: number) {
  const b = ctx!.createBufferSource()
  b.buffer = ruis
  b.start(t)
  b.stop(t + duur)
  return b
}

function hihat(t: number) {
  const f = ctx!.createBiquadFilter()
  const g = ctx!.createGain()
  f.type = 'highpass'
  f.frequency.value = 7000
  g.gain.setValueAtTime(0.22, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.07)
  ruisBron(t, 0.1).connect(f).connect(g).connect(master!)
}

function klap(t: number) {
  const f = ctx!.createBiquadFilter()
  const g = ctx!.createGain()
  f.type = 'bandpass'
  f.frequency.value = 1600
  g.gain.setValueAtTime(0.5, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.16)
  ruisBron(t, 0.2).connect(f).connect(g).connect(master!)
}

function noot(t: number, freq: number, type: OscillatorType, volume: number, duur: number, filter = 0) {
  const o = ctx!.createOscillator()
  const g = ctx!.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(volume, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + duur)
  if (filter) {
    const f = ctx!.createBiquadFilter()
    f.type = 'lowpass'
    f.frequency.value = filter
    o.connect(f).connect(g)
  } else {
    o.connect(g)
  }
  g.connect(master!)
  o.start(t)
  o.stop(t + duur + 0.05)
}

// Akkoordenschema Am - F - C - G (bas en arpeggio)
const basTonen = [55, 43.65, 65.41, 49]
const akkoorden = [
  [220, 261.6, 329.6],
  [174.6, 220, 261.6],
  [261.6, 329.6, 392],
  [196, 246.9, 293.7],
]

function plan(t: number, i: number, m: number) {
  if (i % 4 === 0) kick(t)
  if (i % 4 === 2) hihat(t)
  if (i % 8 === 4) klap(t)
  if (i % 2 === 0) noot(t, basTonen[m] * (i % 8 === 6 ? 2 : 1), 'sawtooth', 0.3, 0.2, 500)
  const toon = akkoorden[m][[0, 1, 2, 1][(i / 2) % 4 | 0]]
  if (i % 2 === 1) noot(t, toon * 2, 'square', 0.06, 0.12, 2500)
}

function plannen() {
  while (ctx && volgende < ctx.currentTime + 0.12) {
    plan(volgende, stap, maat % 4)
    volgende += STAP
    stap = (stap + 1) % 16
    if (stap === 0) maat++
  }
}

function startMuziek() {
  try {
    ctx = ctx ?? new AudioContext()
    master = ctx.createGain()
    master.gain.setValueAtTime(0.0001, ctx.currentTime)
    master.gain.exponentialRampToValueAtTime(0.5, ctx.currentTime + 0.4)
    master.connect(ctx.destination)

    // een seconde witte ruis, hergebruikt voor hi-hat en klap
    ruis = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = ruis.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

    stap = 0
    maat = 0
    volgende = ctx.currentTime + 0.1
    t0 = performance.now() + 100
    ctx.resume().then(() => (feest.stil = ctx!.state !== 'running'))
    timer = window.setInterval(plannen, 25)
  } catch {
    feest.stil = true // geen audio beschikbaar: het feest gaat gewoon zonder muziek door
  }
}

function stopMuziek() {
  window.clearInterval(timer)
  if (ctx && master) {
    master.gain.cancelScheduledValues(ctx.currentTime)
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), ctx.currentTime)
    master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4)
    const oud = master
    window.setTimeout(() => oud.disconnect(), 600)
  }
  feest.stil = false
}

// Een klik op de pagina haalt de blokkade van de browser weg als de muziek nog stil was
window.addEventListener('pointerdown', () => {
  if (feest.aan && ctx && ctx.state !== 'running') ctx.resume().then(() => (feest.stil = ctx!.state !== 'running'))
})

export function startFeest() {
  if (feest.aan) return
  bewaard = { uur: staat.uur, speelt: staat.speelt, weerbron: staat.weerbron }
  // feest is 's avonds: tijd stilzetten op 22:00 met een heldere hemel
  staat.uur = 22
  staat.speelt = false
  staat.weerbron = 'helder'
  feest.aan = true
  startMuziek()
}

export function stopFeest() {
  if (!feest.aan) return
  feest.aan = false
  stopMuziek()
  if (bewaard) {
    staat.uur = bewaard.uur
    staat.speelt = bewaard.speelt
    staat.weerbron = bewaard.weerbron
    bewaard = null
  }
}

export const wisselFeest = () => (feest.aan ? stopFeest() : startFeest())
