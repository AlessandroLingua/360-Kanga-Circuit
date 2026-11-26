# Kanga Circuit 360

App di yoga, pilates, HIIT e meditazione che **genera una sessione nuova ogni volta che premi "Inizia"**. Non ci sono video preregistrati: un motore algoritmico assembla al momento sequenza, animazione, guida vocale, sottotitoli e colonna sonora adattiva.

Un solo codice (React + TypeScript) gira su:

| Piattaforma | Tecnologia | Comando |
|---|---|---|
| Web / PWA installabile | Vite + Service Worker | `npm run dev` · `npm run build` |
| Android | Capacitor 8 | `npm run android` (apre Android Studio) |
| iOS / iPadOS | Capacitor 8 | `npm run ios` (apre Xcode) |
| macOS | Electron | `npm run desktop` · `npm run dist:mac` |
| Windows | Electron | `npm run dist:win` (installer NSIS) |

## Funzioni

**Motore generativo** (`src/engine/`)
- Libreria di ~55 asana, 18 esercizi pilates e 19 esercizi HIIT, ciascuno con livello, intensità, aree di focus, nomi in 6 lingue + sanscrito.
- Il generatore costruisce fasi (centratura, riscaldamento, saluti al sole, in piedi, a terra, defaticamento, savasana) con selezione pesata casuale: stile, livello, focus primario/secondario, like/dislike e anti-ripetizione. Le durate vengono poi scalate per arrivare esattamente al tempo scelto.
- Ogni sessione ha un *seed*: lo stesso seed riproduce la stessa sessione (usato per l'offline); seed diversi producono sequenze diverse. La schermata d'anteprima mostra una stima delle combinazioni possibili (ordini di grandezza ben oltre il milione).
- Le animazioni sono figure vettoriali generate da angoli articolari, interpolate in modo fluido tra una posizione e l'altra (vinyasa, cat-cow, burpee… sono animati).

**Stili yoga**: Vinyasa, Hatha, Gentle, Restorative, Yin, Ashtanga, Saluto al Sole/Risveglio, Yoga Nidra (solo audio, con modalità sonno).

**Personalizzazione**: durata 5–90 min, savasana 0–15 min, riscaldamento/defaticamento nessuno/standard/esteso, 5 livelli, 5 ritmi, Boost con 19 aree (primario + secondario o rotazione automatica), like (più frequente) / dislike (esclusa) durante e dopo la sessione.

**Voce e audio**: fino a 6 insegnanti in inglese e 4 nelle altre lingue (voci di sistema del dispositivo, funzionano offline), 4 livelli di spiegazione, nomi in lingua o in sanscrito, sottotitoli sincronizzati, musica generativa adattiva all'intensità (Ambient, Piano & Archi, Acustica, Alt Beats, Onde cerebrali/binaurali, Natura), opzione silenziosa per Spotify ecc., oppure libreria musicale locale (salvata in IndexedDB).

**Lingue**: italiano, inglese, spagnolo, francese, tedesco, portoghese (interfaccia, nomi e istruzioni brevi). Le guide lunghe (spiegazioni complete di allineamento, Yoga Nidra, meditazioni guidate) sono scritte in italiano e inglese; per le altre lingue usano frasi generiche localizzate o l'inglese.

**Altre discipline**: Meditazione (sonno, stress, concentrazione, respirazione con 4 tecniche, timer con campana a intervalli, silenzi personalizzabili), Pilates, HIIT (lavoro/recupero configurabili, circuiti e round).

**Tracciamento**: obiettivi giornalieri/settimanali/mensili, serie (streak) attuale e migliore, diario con note, stima calorie (MET × peso).

**Offline**: la PWA mette in cache l'app; "Scarica per offline" salva la sessione generata (e gli eventuali clip video). Voce, musica e animazione sono generate sul dispositivo, quindi non serve rete.

**Salute**: su Android scrive durata/calorie in **Health Connect** (il successore di Google Fit) e su iOS in **Apple Salute**, tramite `@capgo/capacitor-health`. Non disponibile su web/desktop.

**Multi-dispositivo**: sincronizzazione account tramite un piccolo server REST self-hosted (`npm run sync-server`, poi inserisci URL e codice account in Impostazioni su ogni dispositivo) oppure esporta/importa JSON. Merge: impostazioni → ultima modifica vince; diario, download, like/dislike → unione.

**TV**: Chrome/Edge trasmettono a Chromecast tramite Presentation API (pagina ricevitore `#tv`); su Safari/iOS/macOS si usa Duplica schermo AirPlay; in alternativa si apre una finestra TV per schermi esterni.

## Clip video HD (opzionale)

Il motore supporta clip reali al posto delle figure animate. Metti i file in `public/clips/` e crea `public/clips/manifest.json`:

```json
{ "downDog": "clips/downDog.mp4", "warrior2@left": "clips/warrior2-left.mp4" }
```

Gli id delle mosse sono in `src/engine/library/`. Apri `#gallery` per vedere tutte le posizioni.

## Sviluppo

```bash
npm install
```

```bash
npm run dev
```

```bash
npm test
```

`npm test` verifica che ogni stile/durata/livello generi una sessione della durata richiesta, che lo stesso seed sia deterministico e che i "non mi piace" vengano esclusi.

### Note sulle build native

- **Android**: minSdk 26 (richiesto da Health Connect). Serve un JDK 17–21 per Gradle 8.14. La privacy policy richiesta da Health Connect è in `public/privacypolicy.html`.
- **iOS**: in Xcode abilita la capability **HealthKit** sul target App. Le stringhe d'uso salute e l'audio in background sono già in `Info.plist`.
- **Windows** da macOS: `electron-builder --win` può richiedere Wine; in alternativa esegui `npm run dist:win` su Windows.
- Le build distribuibili per gli store richiedono i tuoi certificati di firma (Apple Developer, Google Play, code signing Windows).
