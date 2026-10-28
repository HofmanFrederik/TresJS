# Energy Twin – zonne-energie in 3D

Een digitale tweeling van een huis met zonnepanelen in Kortrijk (50,83° N, 3,26° O). Je ziet in 3D hoeveel stroom de panelen op elk moment van de dag leveren, op basis van de echte stand van de zon en het echte weer. Je kunt de simulatie sturen met je stem of met knoppen.

Gemaakt met [TresJS](https://tresjs.org) (Vue 3 + Three.js) voor Future Tech, MCT.

## Thema

**Zonne-energie.** Het huis heeft 0 tot 16 panelen op het zuidelijke dak. De zon beweegt over de lucht, de panelen lichten op naargelang hun opbrengst, en een meter naast het huis vult zich met de opgewekte kWh.

## Starten

Vereist [Node.js](https://nodejs.org) 20 of hoger.

```bash
cd my-tres-project
npm install
npm run dev
```

Open daarna <http://localhost:5173>.

Een productiebuild maak je met `npx vite build` (output in `my-tres-project/dist`). Test hem met `npx vite preview`.

> `npm run build` voert eerst `vue-tsc` uit en dat faalt op twee bestaande configuratiefouten in `tsconfig.json`. Daarom gebruiken we rechtstreeks `vite build`.

**Live versie:** de workflow `.github/workflows/pages.yml` publiceert de site naar GitHub Pages bij elke push naar `main`. Zet daarvoor in de repo *Settings → Pages → Source* op **GitHub Actions**. De link wordt dan `https://hofmanfrederik.github.io/TresJS/`.

## Bediening

| Wat | Hoe |
| --- | --- |
| Camera | Slepen = draaien, scrollen = zoomen |
| Tijd van de dag | Schuifregelaar, of klik/sleep in de grafiek |
| Datum / seizoen | Datumveld, of de seizoenknoppen |
| Aantal panelen | Schuifregelaar 0–16 |
| Weer | Keuzelijst: echt weer, helder, bewolkt, regen, sneeuw, mist, storm, windig |
| Extra wind | Schuifregelaar |
| Party | Knop **🎉 Party!** |

### Spraakcommando's

Druk op de microfoonknop en spreek in het Nederlands. Elk commando heeft ook een knop, zodat het zonder microfoon werkt.

| Zeg bijvoorbeeld | Effect |
| --- | --- |
| "zet 8 panelen" / "meer panelen" | Aantal panelen aanpassen |
| "hoeveel stroom" / "wat is de productie" | Het antwoord wordt hardop voorgelezen |
| "zet de zon op 15 uur" / "zonsopgang" | Tijd van de dag instellen |
| "zomer" / "winter" / "vandaag" | Datum instellen |
| "regen" / "sneeuw" / "mist" / "storm" / "helder" | Weer instellen |
| "meer wind" / "minder wind" | Windkracht aanpassen |
| "hoe is het weer" | Het weer wordt voorgelezen |
| "afspelen" / "pauze" / "sneller" / "trager" | De tijd laten lopen of stoppen |
| "party" / "stop het feest" | Party mode aan of uit |

Spraakherkenning werkt in Chrome en Edge, met internet en microfoontoestemming. In andere browsers staat de microfoonknop uit ("Spraak niet ondersteund in deze browser") en blijven de commandoknoppen werken.

## Bronnen van data

| Data | Bron |
| --- | --- |
| Weer per uur: directe zonnestraling (DNI), diffuse straling, bewolking, temperatuur, neerslag, sneeuw, wind (snelheid en richting), weercode | [Open-Meteo](https://open-meteo.com) (gratis, geen sleutel nodig) |
| Stand van de zon (hoogte en azimut) en zonsopgang/-ondergang | [SunCalc](https://github.com/mourner/suncalc) |
| Spraakherkenning en spraaksynthese | [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) |
| Muziek in party mode | Zelf gesynthetiseerd met de [Web Audio API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) |

Welke Open-Meteo-API wordt gebruikt hangt af van de gekozen datum:

- Tot 85 dagen geleden en tot 15 dagen vooruit: `api.open-meteo.com/v1/forecast`.
- Ouder dan 85 dagen: `archive-api.open-meteo.com/v1/archive`.
- Verder dan 15 dagen in de toekomst: dezelfde dag een jaar eerder uit het archief.

Als de data niet geladen kan worden, rekent de app met een helderehemelmodel en toont het dashboard dat.

## Model en formules

**Zonnepositie.** SunCalc geeft hoogte `h` en azimut (vanaf het noorden, kloksgewijs). De app zet dat om naar een richtingsvector naar de zon in de scène (+x = zuid, +z = west):

```
a = azimut − 180°
zon = ( cos a · cos h,  sin h,  sin a · cos h )
```

**Straling op het paneel.** De panelen liggen op het zuidelijke dakvlak, met een helling `β = atan(dakhoogte / halve breedte) = atan(3 / 4,2) ≈ 35,5°`. Het paneel heeft normaalvector `n = (sin β, cos β, 0)`.

```
cos θ = max(0, zon · n)
G = DNI · cos θ + diffuus · (1 + cos β) / 2
```

Eerste term: directe straling onder de invalshoek `θ`. Tweede term: diffuse straling op een hellend vlak (isotroop hemelmodel).

**Sneeuw.** Bij meer dan 0,05 cm/u sneeuw ligt er sneeuw op de panelen en blijft 10 % van `G` over.

**Celtemperatuur en rendement.** Wind koelt de panelen.

```
T_cel = T_lucht + 0,025 · G / (1 + 0,15 · windsnelheid)
f_temp = 1 − 0,004 · max(0, T_cel − 25)
```

**Vermogen.**

```
P = aantal · 1,76 m² · 0,20 · 0,90 · G · f_temp
```

| Constante | Waarde | Betekenis |
| --- | --- | --- |
| 1,76 m² | oppervlak per paneel | 1,6 × 1,1 m |
| 0,20 | rendement | 20 % van de straling wordt elektriciteit |
| 0,90 | systeemfactor | verliezen in omvormer en kabels |
| 0,004 | temperatuurcoëfficiënt | −0,4 % per °C boven 25 °C |

**Energie en besparing.** De dagkromme wordt op 97 punten berekend (elke 15 minuten). De energie is de oppervlakte onder die kromme (kWh). De besparing is `kWh × €0,30`.

**Weer in de scène.** Bewolking bepaalt het aantal, de kleur en de snelheid van de wolken. Regen en sneeuw zijn deeltjes die op daken en grond verdwijnen. Mist stelt de `scene.fog` in. Wind laat de vlag en de wolken waaien. Onweer geeft lichtflitsen. De kleur van de lucht volgt de zonhoogte en het weer.

## Beperkingen

- Schaduw in de 3D-scène heeft geen invloed op de berekende opbrengst.
- Sneeuw hoopt zich niet op in de tijd: er ligt sneeuw of er ligt geen sneeuw.
- Open-Meteo geeft uurgemiddelden. Bij gebroken bewolking kan de directe straling daardoor hoog lijken terwijl de bewolking ook hoog is.
- De Beatles blijven 's nachts oversteken, los van de simulatietijd.

## AI-verantwoording

**Tool:** Claude Code (Claude Sonnet 5.5) in de Claude desktop-app.

**Fase 1 (zelf, zonder AI):** de setup van het project, de tutorial op de TresJS-site gevolgd en zelf een huis gebouwd. Daarbij heb ik geëxperimenteerd met de camera, de verlichting en eigen componenten.

**Fase 2 en 3 (met AI):** ik gaf opdrachten in gewone taal en Claude schreef en testte de code. Mijn prompts, in volgorde:

1. Mijn huisje verder afwerken.
2. Het huisje laten lijken op een referentiefoto, en kleiner maken.
3. Een mooiere achtergrond dan enkel wit.
4. De opdracht Energy Twin uitwerken (echte data, spraakcommando's, simulatie met grafiek en parameters).
5. Mensen toevoegen, en ze The Beatles maken (Abbey Road).
6. Controleren of de spraakcommando's werken, en uitleg over hoe de spraak werkt.
7. Meer weer toevoegen: wind, regen, sneeuw, enzovoort.
8. Een party mode die start als ik "party" zeg.
9. Deze README, de deploy naar GitHub Pages en de AI-verantwoording.

**Wat Claude deed:** het huis herwerken naar de referentie, het energiemodel met Open-Meteo en SunCalc, het dashboard met grafiek, de spraakcommando's (Web Speech API), het weer, de Beatles, de party mode met zelfgemaakte muziek, en de README en de deploy-workflow. Claude testte dit in de browser en loste fouten op die daarbij opdoken.

**Wat ik zelf deed:** de opdrachten bepalen, de resultaten bekijken en bijsturen, en de commits en de publicatie op GitHub Pages laten uitvoeren.

**Let op:** een groot deel van de code in fase 2 en 3 is door Claude geschreven. Het eerste huis dat ik zelf maakte is daarbij herwerkt en niet apart bewaard.

## Reflectie: met en zonder AI

Zonder AI was dit project een traag maar wel leerzaam, bij het starten krijg je verschillende errors waardoor je diep moet zoeken in je code wat er fout is waardoor je wel goed leert welke delen wat doen en wat er mis kan gaan, werken met 3d om bv een huis te maken kan heel lang duren en op het einde heb je een heel simpel huisje maar verder nog niks. Eens je AI gebruikt is het maken van een huis of een gebouw veel sneller en gedetailleerder, changes zijn snel gemaakt en je kan leuke dingen toevoegen die zonder AI te veel werk zouden zijn voor zo iets kleins. Ai is natuurlijk een heel handige tool, maar eens je begint met het prompten van changes dan ben je al snel kwijt wat je effectief maakt en moet je achteraf leren wat je gemaakt hebt. Met nieuwe dingen zoals Tres.js vind ik het dan wel leuk en handig om eens van scratch te beginnen zonder een tool die het voor jou doet. Maar als je snel resultaten wilt en wil zien wat er mogelijk is dan is AI heel handig om te gebruiken en mee te testen waar de limieten liggen van een tool zoals TresJS.

## Structuur

```
my-tres-project/src
├─ composables/
│  ├─ useEnergie.ts   data ophalen, zonpositie, productiemodel, weer
│  ├─ useSpraak.ts    spraakherkenning, commando-parser, knoppen
│  ├─ useFeest.ts     party mode en de gesynthetiseerde beat
│  └─ huis.ts         afmetingen van het huis
└─ components/        3D-onderdelen (Muur, Dak, Zon, Zonnepanelen, Neerslag, Mens, Beatles, …) en Dashboard.vue
```
