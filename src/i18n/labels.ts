import type { FocusArea, Lang, YogaStyle } from '../engine/types';

type Row = [string, string, string, string, string, string];
const idx: Record<Lang, number> = { it: 0, en: 1, es: 2, fr: 3, de: 4, pt: 5 };

export const STYLE_LABEL: Record<YogaStyle, { name: Row; desc: Row }> = {
  vinyasa: {
    name: ['Vinyasa (Full Practice)', 'Vinyasa (Full Practice)', 'Vinyasa (Práctica completa)', 'Vinyasa (Pratique complète)', 'Vinyasa (Volle Praxis)', 'Vinyasa (Prática completa)'],
    desc: ['Flusso dinamico sincronizzato col respiro, con chaturanga.', 'Dynamic breath-led flow with transitions and chaturanga.', 'Flujo dinámico con la respiración y chaturanga.', 'Flow dynamique guidé par le souffle, avec chaturanga.', 'Dynamischer, atemgeführter Flow mit Chaturanga.', 'Fluxo dinâmico guiado pela respiração, com chaturanga.'],
  },
  hatha: {
    name: ['Hatha', 'Hatha', 'Hatha', 'Hatha', 'Hatha', 'Hatha'],
    desc: ['Ritmo cadenzato, posizioni mantenute per forza e stabilità.', 'Steady pace, longer holds for strength and stability.', 'Ritmo pausado, posturas mantenidas para fuerza y estabilidad.', 'Rythme posé, postures tenues pour force et stabilité.', 'Ruhiges Tempo, längere Haltezeiten für Kraft und Stabilität.', 'Ritmo cadenciado, posturas mantidas para força e estabilidade.'],
  },
  gentle: {
    name: ['Gentle (Yoga dolce)', 'Gentle', 'Gentle (Yoga suave)', 'Gentle (Yoga doux)', 'Gentle (Sanftes Yoga)', 'Gentle (Yoga suave)'],
    desc: ['Pratica morbida tra piedi e terra, transizioni delicate.', 'Soft practice mixing standing and floor, gentle transitions.', 'Práctica suave entre de pie y suelo.', 'Pratique douce debout et au sol.', 'Sanfte Praxis im Stehen und am Boden.', 'Prática suave em pé e no chão.'],
  },
  restorative: {
    name: ['Restorative (Rigenerante)', 'Restorative', 'Restaurativo', 'Restauratif', 'Restorative', 'Restaurativo'],
    desc: ['Interamente a terra, posizioni passive e supportate.', 'Fully on the floor, passive supported poses.', 'Todo en el suelo, posturas pasivas con apoyo.', 'Entièrement au sol, postures passives soutenues.', 'Komplett am Boden, passive gestützte Haltungen.', 'Totalmente no chão, posturas passivas apoiadas.'],
  },
  yin: {
    name: ['Yin', 'Yin', 'Yin', 'Yin', 'Yin', 'Yin'],
    desc: ['Allungamento profondo dei tessuti connettivi, tenute lunghe.', 'Deep connective-tissue stretch with long holds.', 'Estiramiento profundo del tejido conectivo.', 'Étirement profond des tissus conjonctifs.', 'Tiefe Dehnung des Bindegewebes, lange Haltezeiten.', 'Alongamento profundo dos tecidos conjuntivos.'],
  },
  ashtanga: {
    name: ['Ashtanga', 'Ashtanga', 'Ashtanga', 'Ashtanga', 'Ashtanga', 'Ashtanga'],
    desc: ['Ispirato alla serie tradizionale, alta intensità.', 'Inspired by the traditional series, high intensity.', 'Inspirado en la serie tradicional, alta intensidad.', 'Inspiré de la série traditionnelle, haute intensité.', 'Inspiriert von der traditionellen Serie, intensiv.', 'Inspirado na série tradicional, alta intensidade.'],
  },
  sunSalutation: {
    name: ['Saluto al Sole & Risveglio', 'Sun Salutation & Wake-Up', 'Saludo al Sol y Despertar', 'Salutation au Soleil & Réveil', 'Sonnengruß & Wake-Up', 'Saudação ao Sol e Despertar'],
    desc: ['Sessioni brevi ed energizzanti per il mattino.', 'Short energising sessions for the morning.', 'Sesiones cortas y energizantes.', 'Séances courtes et énergisantes.', 'Kurze, belebende Einheiten.', 'Sessões curtas e energizantes.'],
  },
  nidra: {
    name: ['Yoga Nidra', 'Yoga Nidra', 'Yoga Nidra', 'Yoga Nidra', 'Yoga Nidra', 'Yoga Nidra'],
    desc: ['Solo audio: rilassamento guidato profondo.', 'Audio only: deep guided relaxation.', 'Solo audio: relajación guiada profunda.', 'Audio seul : relaxation guidée profonde.', 'Nur Audio: tiefe geführte Entspannung.', 'Só áudio: relaxamento guiado profundo.'],
  },
};

export const FOCUS_LABEL: Record<FocusArea, Row> = {
  hipOpeners: ['Apertura anche', 'Hip openers', 'Apertura de caderas', 'Ouverture des hanches', 'Hüftöffner', 'Abertura de quadril'],
  hipFlexors: ['Flessori dell\'anca', 'Hip flexors', 'Flexores de cadera', 'Fléchisseurs de hanche', 'Hüftbeuger', 'Flexores do quadril'],
  hamstrings: ['Ischiocrurali', 'Hamstrings', 'Isquiotibiales', 'Ischio-jambiers', 'Beinrückseite', 'Isquiotibiais'],
  core: ['Forza del core', 'Core strength', 'Fuerza del core', 'Gainage', 'Rumpfkraft', 'Força do core'],
  lowerBack: ['Zona lombare', 'Lower back', 'Zona lumbar', 'Bas du dos', 'Unterer Rücken', 'Lombar'],
  backbends: ['Piegamenti indietro', 'Backbends', 'Extensiones', 'Flexions arrière', 'Rückbeugen', 'Extensões'],
  shoulders: ['Spalle', 'Shoulders', 'Hombros', 'Épaules', 'Schultern', 'Ombros'],
  twists: ['Torsioni', 'Twists', 'Torsiones', 'Torsions', 'Drehungen', 'Torções'],
  flexibility: ['Flessibilità generale', 'Overall flexibility', 'Flexibilidad general', 'Souplesse générale', 'Allgemeine Beweglichkeit', 'Flexibilidade geral'],
  balance: ['Equilibrio', 'Balance', 'Equilibrio', 'Équilibre', 'Gleichgewicht', 'Equilíbrio'],
  armStrength: ['Forza braccia', 'Arm strength', 'Fuerza de brazos', 'Force des bras', 'Armkraft', 'Força dos braços'],
  legStrength: ['Forza gambe', 'Leg strength', 'Fuerza de piernas', 'Force des jambes', 'Beinkraft', 'Força das pernas'],
  quads: ['Quadricipiti', 'Quads', 'Cuádriceps', 'Quadriceps', 'Quadrizeps', 'Quadríceps'],
  chestOpening: ['Apertura del petto', 'Chest opening', 'Apertura de pecho', 'Ouverture de la poitrine', 'Brustöffnung', 'Abertura do peito'],
  neckUpperBack: ['Collo e dorsale', 'Neck & upper back', 'Cuello y espalda alta', 'Nuque et haut du dos', 'Nacken & oberer Rücken', 'Pescoço e costas superiores'],
  glutes: ['Glutei', 'Glutes', 'Glúteos', 'Fessiers', 'Gesäß', 'Glúteos'],
  spineMobility: ['Mobilità della colonna', 'Spine mobility', 'Movilidad de columna', 'Mobilité de la colonne', 'Wirbelsäulenmobilität', 'Mobilidade da coluna'],
  inversions: ['Inversioni', 'Inversions', 'Inversiones', 'Inversions', 'Umkehrhaltungen', 'Inversões'],
  armBalances: ['Equilibri sulle braccia', 'Arm balances', 'Equilibrios de brazos', 'Équilibres sur les bras', 'Armbalancen', 'Equilíbrios de braço'],
};

export const pickRow = (r: Row, lang: Lang) => r[idx[lang]];
