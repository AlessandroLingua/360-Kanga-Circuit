// Labels for practice types, Mix presets and Mix groups: [it, en, es, fr, de, pt]
import type { MixGroup, PracticeType } from '../engine/practice';
import type { MedThemeChoice } from '../engine/themes';

type Row = [string, string, string, string, string, string];

export const PRACTICE_LABEL: Record<PracticeType, { name: Row; desc: Row; more: Row }> = {
  circuits: {
    name: ['Circuiti', 'Circuits', 'Circuitos', 'Circuits', 'Zirkel', 'Circuitos'],
    desc: ['Esercizi alternati e diretti a diversi gruppi muscolari', 'Alternating exercises targeting different muscle groups', 'Ejercicios alternados para distintos grupos musculares', 'Exercices alternés ciblant différents groupes musculaires', 'Abwechselnde Übungen für verschiedene Muskelgruppen', 'Exercícios alternados para diferentes grupos musculares'],
    more: ['Ogni esercizio colpisce un gruppo muscolare diverso del tuo Mix, così un muscolo recupera mentre lavori il successivo.', 'Each exercise hits a different muscle group from your Mix, so one recovers while you work the next.', 'Cada ejercicio trabaja un grupo distinto de tu Mix: uno descansa mientras trabajas el siguiente.', 'Chaque exercice cible un groupe différent de ton Mix : l\'un récupère pendant que tu travailles le suivant.', 'Jede Übung trifft eine andere Muskelgruppe deines Mix – eine erholt sich, während du die nächste trainierst.', 'Cada exercício trabalha um grupo diferente do seu Mix: um recupera enquanto você treina o próximo.'],
  },
  progression: {
    name: ['Progressione', 'Progression', 'Progresión', 'Progression', 'Progression', 'Progressão'],
    desc: ['Stanca un\'area del corpo alla volta: cardio, gambe, braccia e core', 'Tires one area at a time: cardio, legs, arms and core', 'Trabaja un área a la vez: cardio, piernas, brazos y core', 'Fatigue une zone à la fois : cardio, jambes, bras et abdos', 'Eine Zone nach der anderen: Cardio, Beine, Arme, Core', 'Uma área por vez: cardio, pernas, braços e core'],
    more: ['Ogni round è dedicato a un gruppo del tuo Mix e l\'intensità cresce round dopo round.', 'Each round is devoted to one group of your Mix, and intensity builds round after round.', 'Cada ronda se dedica a un grupo de tu Mix y la intensidad crece ronda tras ronda.', 'Chaque round est consacré à un groupe de ton Mix et l\'intensité monte au fil des rounds.', 'Jede Runde gehört einer Gruppe deines Mix, die Intensität steigt von Runde zu Runde.', 'Cada rodada é dedicada a um grupo do seu Mix e a intensidade cresce a cada rodada.'],
  },
  cycles: {
    name: ['Cicli', 'Cycles', 'Ciclos', 'Cycles', 'Zyklen', 'Ciclos'],
    desc: ['Cicli di esercizi che allenano forza e bruciano calorie', 'Exercise cycles that build strength and burn calories', 'Ciclos que desarrollan fuerza y queman calorías', 'Des cycles qui renforcent et brûlent des calories', 'Übungszyklen für Kraft und Kalorienverbrauch', 'Ciclos que fortalecem e queimam calorias'],
    more: ['Ogni serie di esercizi si ripete due volte: la seconda volta sai cosa ti aspetta e puoi spingere di più.', 'Each set of exercises repeats twice: the second time you know what\'s coming and can push harder.', 'Cada serie se repite dos veces: la segunda ya sabes lo que viene y puedes apretar más.', 'Chaque série se répète deux fois : la seconde, tu sais ce qui arrive et tu peux pousser plus fort.', 'Jede Übungsfolge kommt zweimal: Beim zweiten Mal weißt du, was kommt, und kannst mehr geben.', 'Cada série se repete duas vezes: na segunda você já sabe o que vem e pode dar mais.'],
  },
  hiitAny: {
    name: ['HIIT – Qualsiasi genere', 'HIIT – Any kind', 'HIIT – Cualquier tipo', 'HIIT – Tous genres', 'HIIT – Beliebig', 'HIIT – Qualquer tipo'],
    desc: ['Ogni giorno una sorpresa: tabata, circuiti, cicli… sempre diverso', 'A surprise every day: tabata, circuits, cycles… always different', 'Cada día una sorpresa: tabata, circuitos, ciclos… siempre distinto', 'Une surprise chaque jour : tabata, circuits, cycles… toujours différent', 'Jeden Tag eine Überraschung: Tabata, Zirkel, Zyklen… immer anders', 'Uma surpresa por dia: tabata, circuitos, ciclos… sempre diferente'],
    more: ['La struttura cambia ogni giorno e resta la stessa per tutta la giornata.', 'The structure changes every day and stays the same for the whole day.', 'La estructura cambia cada día y se mantiene durante toda la jornada.', 'La structure change chaque jour et reste la même toute la journée.', 'Die Struktur wechselt täglich und bleibt den ganzen Tag gleich.', 'A estrutura muda todo dia e permanece a mesma durante o dia inteiro.'],
  },
  tabata: {
    name: ['Tabata', 'Tabata', 'Tabata', 'Tabata', 'Tabata', 'Tabata'],
    desc: ['Intervalli veloci: 20 secondi di lavoro e 10 di pausa', 'Fast intervals: 20 seconds on, 10 off', 'Intervalos rápidos: 20 segundos de trabajo y 10 de pausa', 'Intervalles rapides : 20 s d\'effort, 10 s de pause', 'Schnelle Intervalle: 20 Sekunden Arbeit, 10 Pause', 'Intervalos rápidos: 20 s de trabalho e 10 de pausa'],
    more: ['Round da 4 minuti: due esercizi alternati per 8 intervalli, poi un minuto di recupero.', '4-minute rounds: two exercises alternated over 8 intervals, then one minute of rest.', 'Rondas de 4 minutos: dos ejercicios alternados en 8 intervalos y un minuto de descanso.', 'Rounds de 4 minutes : deux exercices alternés sur 8 intervalles, puis une minute de repos.', '4-Minuten-Runden: zwei Übungen im Wechsel über 8 Intervalle, dann eine Minute Pause.', 'Rodadas de 4 minutos: dois exercícios alternados em 8 intervalos e um minuto de descanso.'],
  },
  hiitYoga: {
    name: ['Fusione HIIT e Yoga', 'HIIT & Yoga fusion', 'Fusión HIIT y Yoga', 'Fusion HIIT & Yoga', 'HIIT-Yoga-Fusion', 'Fusão HIIT e Yoga'],
    desc: ['Riscaldamento yoga, sessione HIIT, defaticamento', 'Yoga warm-up, HIIT session, cool-down', 'Calentamiento de yoga, sesión HIIT, vuelta a la calma', 'Échauffement yoga, séance HIIT, retour au calme', 'Yoga-Aufwärmen, HIIT, Cool-down', 'Aquecimento de yoga, sessão HIIT, desaquecimento'],
    more: ['Circa un quinto della pratica è un flusso yoga di apertura, poi intervalli HIIT e allungamenti finali.', 'About a fifth of the practice is an opening yoga flow, then HIIT intervals and final stretches.', 'Una quinta parte es un flujo de yoga inicial, luego intervalos HIIT y estiramientos finales.', 'Environ un cinquième est un flow de yoga d\'ouverture, puis des intervalles HIIT et des étirements.', 'Etwa ein Fünftel ist ein Yoga-Flow zum Einstieg, dann HIIT-Intervalle und Dehnungen.', 'Cerca de um quinto é um fluxo de yoga inicial, depois intervalos HIIT e alongamentos finais.'],
  },
  stretch: {
    name: ['Allungamenti post-allenamento', 'Post-workout stretches', 'Estiramientos post-entreno', 'Étirements après l\'effort', 'Dehnen nach dem Training', 'Alongamentos pós-treino'],
    desc: ['Allungamenti defaticanti', 'Relaxing cool-down stretches', 'Estiramientos relajantes', 'Étirements de récupération', 'Entspannende Dehnungen', 'Alongamentos relaxantes'],
    more: ['Solo posizioni di allungamento tenute a lungo, ideali dopo una corsa o un altro allenamento.', 'Only long-held stretches, ideal after a run or another workout.', 'Solo estiramientos mantenidos, ideales tras correr u otro entrenamiento.', 'Uniquement des étirements tenus longtemps, parfaits après une course ou un autre entraînement.', 'Nur lang gehaltene Dehnungen, ideal nach dem Laufen oder einem anderen Training.', 'Só alongamentos longos, ideais depois de uma corrida ou outro treino.'],
  },
  pilates: {
    name: ['Pilates', 'Pilates', 'Pilates', 'Pilates', 'Pilates', 'Pilates'],
    desc: ['Core, postura e stabilità', 'Core, posture and stability', 'Core, postura y estabilidad', 'Centre, posture et stabilité', 'Core, Haltung und Stabilität', 'Core, postura e estabilidade'],
    more: ['Esercizi a corpo libero lenti e controllati; il Mix decide quali zone privilegiare.', 'Slow, controlled mat exercises; your Mix decides which areas to favour.', 'Ejercicios lentos y controlados; tu Mix decide qué zonas priorizar.', 'Exercices au sol lents et contrôlés ; ton Mix choisit les zones à privilégier.', 'Langsame, kontrollierte Mattenübungen; dein Mix bestimmt die Schwerpunkte.', 'Exercícios lentos e controlados; seu Mix decide quais áreas priorizar.'],
  },
  pilatesCore: {
    name: ['Pilates per il Core', 'Pilates for Core', 'Pilates para el core', 'Pilates pour les abdos', 'Pilates für den Core', 'Pilates para o core'],
    desc: ['Rinforza gli addominali e gli obliqui', 'Strengthens the abs and obliques', 'Fortalece abdominales y oblicuos', 'Renforce les abdos et les obliques', 'Stärkt gerade und schräge Bauchmuskeln', 'Fortalece abdômen e oblíquos'],
    more: ['Esercizi a terra scelti quasi solo per il centro del corpo: roll up, criss-cross, plank e torsioni.', 'Mat work chosen almost entirely for the centre: roll ups, criss-cross, planks and twists.', 'Trabajo en esterilla casi solo para el centro: roll up, criss-cross, planchas y giros.', 'Travail au sol presque uniquement pour le centre : enroulés, criss-cross, gainage et rotations.', 'Mattenübungen fast nur für die Körpermitte: Roll-ups, Criss-Cross, Planks und Drehungen.', 'Exercícios no tapete quase só para o centro: roll up, criss-cross, pranchas e torções.'],
  },
  pilatesGlutes: {
    name: ['Pilates per i Glutei', 'Pilates for Glutes', 'Pilates para glúteos', 'Pilates pour les fessiers', 'Pilates für den Po', 'Pilates para glúteos'],
    desc: ['Rafforza e scolpisci glutei e anche', 'Strengthen and sculpt glutes and hips', 'Fortalece y define glúteos y caderas', 'Renforce et sculpte fessiers et hanches', 'Kräftigt und formt Po und Hüften', 'Fortalece e define glúteos e quadris'],
    more: ['Ponti, slanci e lavoro su un fianco per glutei e stabilità del bacino.', 'Bridges, kicks and side-lying work for glutes and pelvic stability.', 'Puentes, patadas y trabajo lateral para glúteos y estabilidad pélvica.', 'Ponts, battements et travail sur le côté pour fessiers et bassin.', 'Brücken, Kicks und Seitlage für Po und Beckenstabilität.', 'Pontes, chutes e trabalho de lado para glúteos e estabilidade pélvica.'],
  },
  yogaPilates: {
    name: ['Yoga + Pilates', 'Yoga + Pilates', 'Yoga + Pilates', 'Yoga + Pilates', 'Yoga + Pilates', 'Yoga + Pilates'],
    desc: ['Flusso Yoga concentrato sul Core', 'Yoga flow focused on the core', 'Flujo de yoga centrado en el core', 'Flow de yoga centré sur les abdos', 'Yoga-Flow mit Core-Fokus', 'Fluxo de yoga focado no core'],
    more: ['Apertura e chiusura con posizioni yoga, al centro esercizi di Pilates.', 'Yoga poses to open and close, Pilates exercises in the middle.', 'Posturas de yoga al inicio y al final, Pilates en el centro.', 'Postures de yoga au début et à la fin, Pilates au milieu.', 'Yoga-Haltungen zu Beginn und Ende, Pilates dazwischen.', 'Posturas de yoga no início e no fim, Pilates no meio.'],
  },
  vinyasa: {
    name: ['Vinyasa', 'Vinyasa', 'Vinyasa', 'Vinyasa', 'Vinyasa', 'Vinyasa'],
    desc: ['Flusso che equilibra forza e allungamenti', 'A flow balancing strength and stretching', 'Flujo que equilibra fuerza y estiramiento', 'Un flow qui équilibre force et étirements', 'Flow mit Balance aus Kraft und Dehnung', 'Fluxo que equilibra força e alongamento'],
    more: ['Movimento sincronizzato con il respiro, saluti al sole e chaturanga tra le posizioni.', 'Breath-led movement with sun salutations and chaturanga between poses.', 'Movimiento guiado por la respiración, saludos al sol y chaturanga.', 'Mouvement guidé par le souffle, salutations au soleil et chaturanga.', 'Atemgeführte Bewegung mit Sonnengrüßen und Chaturanga.', 'Movimento guiado pela respiração, saudações ao sol e chaturanga.'],
  },
  hatha: {
    name: ['Hatha', 'Hatha', 'Hatha', 'Hatha', 'Hatha', 'Hatha'],
    desc: ['Posizioni mantenute per forza e stabilità', 'Longer holds for strength and stability', 'Posturas mantenidas para fuerza y estabilidad', 'Postures tenues pour force et stabilité', 'Längere Haltezeiten für Kraft und Stabilität', 'Posturas mantidas para força e estabilidade'],
    more: ['Ritmo cadenzato: entri in ogni posizione e ci resti qualche respiro.', 'Steady pace: you settle into each pose and stay for a few breaths.', 'Ritmo pausado: entras en cada postura y te quedas unas respiraciones.', 'Rythme posé : tu t\'installes dans chaque posture quelques respirations.', 'Ruhiges Tempo: jede Haltung für einige Atemzüge.', 'Ritmo cadenciado: você entra em cada postura e fica algumas respirações.'],
  },
  gentle: {
    name: ['Yoga dolce', 'Gentle yoga', 'Yoga suave', 'Yoga doux', 'Sanftes Yoga', 'Yoga suave'],
    desc: ['Transizioni delicate tra piedi e terra', 'Soft transitions between standing and floor', 'Transiciones suaves entre de pie y suelo', 'Transitions douces debout et au sol', 'Sanfte Übergänge im Stehen und am Boden', 'Transições suaves em pé e no chão'],
    more: ['Adatto a tutti i giorni e ai principianti, senza posizioni impegnative.', 'Good for any day and for beginners, with no demanding poses.', 'Para cualquier día y principiantes, sin posturas exigentes.', 'Pour tous les jours et les débutants, sans postures exigeantes.', 'Für jeden Tag und Einsteiger, ohne fordernde Haltungen.', 'Para qualquer dia e iniciantes, sem posturas exigentes.'],
  },
  restorative: {
    name: ['Rigenerante', 'Restorative', 'Restaurativo', 'Restauratif', 'Regenerativ', 'Restaurativo'],
    desc: ['Pratica delicata a terra', 'Gentle practice on the floor', 'Práctica suave en el suelo', 'Pratique douce au sol', 'Sanfte Praxis am Boden', 'Prática suave no chão'],
    more: ['Poche posizioni comode tenute a lungo per rilassare il sistema nervoso.', 'A few comfortable poses held for a long time to calm the nervous system.', 'Pocas posturas cómodas mantenidas para calmar el sistema nervioso.', 'Quelques postures confortables tenues longtemps pour apaiser.', 'Wenige bequeme, lang gehaltene Haltungen zur Beruhigung.', 'Poucas posturas confortáveis mantidas para acalmar.'],
  },
  yin: {
    name: ['Yin', 'Yin', 'Yin', 'Yin', 'Yin', 'Yin'],
    desc: ['Stretching profondo e tenuto a lungo', 'Deep, long-held stretching', 'Estiramiento profundo y prolongado', 'Étirements profonds et tenus', 'Tiefe, lang gehaltene Dehnung', 'Alongamento profundo e prolongado'],
    more: ['Posizioni a terra tenute per minuti per lavorare su articolazioni e tessuti connettivi.', 'Floor poses held for minutes to work joints and connective tissue.', 'Posturas en el suelo mantenidas minutos para articulaciones y tejido conectivo.', 'Postures au sol tenues plusieurs minutes pour articulations et fascias.', 'Bodenhaltungen über Minuten für Gelenke und Bindegewebe.', 'Posturas no chão mantidas por minutos para articulações e tecido conjuntivo.'],
  },
  ashtanga: {
    name: ['Ashtanga', 'Ashtanga', 'Ashtanga', 'Ashtanga', 'Ashtanga', 'Ashtanga'],
    desc: ['Sequenza intensa e dinamica', 'Intense, dynamic sequence', 'Secuencia intensa y dinámica', 'Séquence intense et dynamique', 'Intensive, dynamische Abfolge', 'Sequência intensa e dinâmica'],
    more: ['Ritmo sostenuto e molte transizioni: per chi ha già esperienza.', 'Sustained pace and many transitions: for experienced practitioners.', 'Ritmo sostenido y muchas transiciones: para practicantes con experiencia.', 'Rythme soutenu et nombreuses transitions : pour pratiquants confirmés.', 'Zügiges Tempo, viele Übergänge: für Geübte.', 'Ritmo intenso e muitas transições: para quem tem experiência.'],
  },
  sunSalutation: {
    name: ['Saluti al sole', 'Sun salutations', 'Saludos al sol', 'Salutations au soleil', 'Sonnengrüße', 'Saudações ao sol'],
    desc: ['Cicli di saluti al sole', 'Rounds of sun salutations', 'Rondas de saludos al sol', 'Séries de salutations au soleil', 'Runden von Sonnengrüßen', 'Rodadas de saudações ao sol'],
    more: ['Un ciclo che scalda tutto il corpo, ripetuto con varianti.', 'A sequence that warms the whole body, repeated with variations.', 'Una secuencia que calienta todo el cuerpo, con variantes.', 'Une séquence qui réchauffe tout le corps, avec variantes.', 'Eine Abfolge, die den ganzen Körper wärmt, mit Varianten.', 'Uma sequência que aquece o corpo todo, com variações.'],
  },
  wakeUp: {
    name: ['Yoga per il risveglio', 'Wake-up yoga', 'Yoga para despertar', 'Yoga du réveil', 'Yoga zum Aufwachen', 'Yoga para despertar'],
    desc: ['Flusso vinyasa con inizio lento', 'Vinyasa flow with a slow start', 'Flujo vinyasa con inicio lento', 'Flow vinyasa avec un début lent', 'Vinyasa-Flow mit langsamem Start', 'Fluxo vinyasa com início lento'],
    more: ['Riscaldamento lungo e ritmo morbido, per svegliare il corpo con calma.', 'A long warm-up and a soft pace, to wake the body up gently.', 'Calentamiento largo y ritmo suave para despertar con calma.', 'Long échauffement et rythme doux pour réveiller le corps.', 'Langes Aufwärmen und sanftes Tempo zum ruhigen Wachwerden.', 'Aquecimento longo e ritmo suave para acordar com calma.'],
  },
  nidra: {
    name: ['Yoga Nidra', 'Yoga Nidra', 'Yoga Nidra', 'Yoga Nidra', 'Yoga Nidra', 'Yoga Nidra'],
    desc: ['Rilassamento profondo guidato, sdraiati', 'Deep guided relaxation, lying down', 'Relajación profunda guiada, tumbado', 'Relaxation profonde guidée, allongé', 'Tiefe geführte Entspannung im Liegen', 'Relaxamento profundo guiado, deitado'],
    more: ['Scansione del corpo e visualizzazioni; puoi scegliere di finire addormentandoti.', 'Body scan and visualisations; you can choose to end asleep.', 'Escaneo corporal y visualizaciones; puedes terminar dormido.', 'Scan corporel et visualisations ; tu peux finir endormi.', 'Bodyscan und Visualisierungen; du kannst einschlafend enden.', 'Escaneamento corporal e visualizações; pode terminar dormindo.'],
  },
  medGuided: {
    name: ['Meditazione guidata', 'Guided meditation', 'Meditación guiada', 'Méditation guidée', 'Geführte Meditation', 'Meditação guiada'],
    desc: ['Mindfulness per calmare la mente', 'Mindfulness to calm the mind', 'Mindfulness para calmar la mente', 'Pleine conscience pour apaiser l\'esprit', 'Achtsamkeit, um den Geist zu beruhigen', 'Mindfulness para acalmar a mente'],
    more: ['Brevi indicazioni separate da silenzi: respiro, corpo, tensioni da lasciare andare.', 'Short prompts between silences: breath, body, tension to let go.', 'Indicaciones breves entre silencios: respiración, cuerpo, tensión.', 'Courtes indications entre les silences : souffle, corps, tensions.', 'Kurze Impulse zwischen Stille: Atem, Körper, Anspannung lösen.', 'Instruções curtas entre silêncios: respiração, corpo, tensões.'],
  },
  medSleep: {
    name: ['Meditazione per dormire', 'Sleep meditation', 'Meditación para dormir', 'Méditation pour dormir', 'Einschlafmeditation', 'Meditação para dormir'],
    desc: ['Rilassamento guidato per condurti al riposo', 'Guided relaxation to lead you to rest', 'Relajación guiada para llevarte al descanso', 'Relaxation guidée vers le repos', 'Geführte Entspannung in die Ruhe', 'Relaxamento guiado para descansar'],
    more: ['Da fare a letto: la voce si fa sempre più rada fino al silenzio.', 'Do it in bed: the voice grows sparser until silence.', 'En la cama: la voz se espacia hasta el silencio.', 'Au lit : la voix se fait rare jusqu\'au silence.', 'Im Bett: die Stimme wird seltener bis zur Stille.', 'Na cama: a voz fica mais rara até o silêncio.'],
  },
  medBreathRest: {
    name: ['Meditazione guidata con pratica di respirazione', 'Guided meditation with breathwork', 'Meditación guiada con respiración', 'Méditation guidée avec respiration', 'Geführte Meditation mit Atemübung', 'Meditação guiada com respiração'],
    desc: ['Respirazione con musica, poi riposo', 'Breathing with music, then rest', 'Respiración con música, luego descanso', 'Respiration en musique, puis repos', 'Atmen mit Musik, dann Ruhe', 'Respiração com música, depois descanso'],
    more: ['Prima un ritmo di respiro da seguire, poi una meditazione guidata per rilassarti.', 'First a breathing rhythm to follow, then a guided meditation to relax.', 'Primero un ritmo de respiración, luego una meditación guiada.', 'D\'abord un rythme respiratoire, puis une méditation guidée.', 'Erst ein Atemrhythmus, dann eine geführte Meditation.', 'Primeiro um ritmo de respiração, depois uma meditação guiada.'],
  },
  medSleepBreath: {
    name: ['Meditazione per dormire con esercizi di respirazione', 'Sleep meditation with breathing', 'Meditación para dormir con respiración', 'Méditation du sommeil avec respiration', 'Einschlafmeditation mit Atemübung', 'Meditação para dormir com respiração'],
    desc: ['Respira con la musica, e infine riposa', 'Breathe with the music, then rest', 'Respira con la música y descansa', 'Respire avec la musique, puis repose-toi', 'Atme mit der Musik, dann ruhe', 'Respire com a música e descanse'],
    more: ['Un ritmo di respiro rallentato e poi la meditazione per il sonno, senza risveglio.', 'A slowing breath rhythm, then the sleep meditation, with no wake-up.', 'Un ritmo respiratorio lento y luego la meditación para dormir.', 'Un rythme respiratoire ralenti puis la méditation du sommeil.', 'Ein verlangsamter Atemrhythmus, dann die Einschlafmeditation.', 'Um ritmo de respiração lento e depois a meditação do sono.'],
  },
  breathwork: {
    name: ['Respirazione guidata', 'Guided breathing', 'Respiración guiada', 'Respiration guidée', 'Geführte Atmung', 'Respiração guiada'],
    desc: ['Lavoro di centratura con respirazione guidata', 'Centring work with guided breathing', 'Trabajo de centrado con respiración guiada', 'Recentrage par la respiration guidée', 'Zentrierung mit geführter Atmung', 'Centramento com respiração guiada'],
    more: ['Scegli lo schema (box, 4-7-8, coerenza…) e segui il ritmo sullo schermo.', 'Pick a pattern (box, 4-7-8, coherent…) and follow the rhythm on screen.', 'Elige un patrón (cuadrada, 4-7-8, coherencia…) y sigue el ritmo.', 'Choisis un schéma (carré, 4-7-8, cohérence…) et suis le rythme.', 'Wähle ein Muster (Box, 4-7-8, Kohärenz…) und folge dem Rhythmus.', 'Escolha um padrão (quadrada, 4-7-8, coerência…) e siga o ritmo.'],
  },
  medFocus: {
    name: ['Concentrazione', 'Focus', 'Concentración', 'Concentration', 'Konzentration', 'Concentração'],
    desc: ['Allena l\'attenzione sul respiro', 'Train attention on the breath', 'Entrena la atención en la respiración', 'Entraîne l\'attention sur le souffle', 'Trainiere die Aufmerksamkeit am Atem', 'Treine a atenção na respiração'],
    more: ['Conteggio dei respiri e ritorno al punto di attenzione ogni volta che la mente si distrae.', 'Counting breaths and returning to the anchor each time the mind wanders.', 'Contar respiraciones y volver al ancla cuando la mente se distrae.', 'Compter les respirations et revenir à l\'ancrage quand l\'esprit s\'égare.', 'Atemzüge zählen und zurückkehren, wenn der Geist abschweift.', 'Contar respirações e voltar à âncora quando a mente se distrai.'],
  },
  medTimer: {
    name: ['Timer libero', 'Unguided timer', 'Temporizador libre', 'Minuteur libre', 'Freier Timer', 'Timer livre'],
    desc: ['Silenzio con campana iniziale e finale', 'Silence with a bell at start and end', 'Silencio con campana al inicio y al final', 'Silence avec cloche au début et à la fin', 'Stille mit Glocke zu Beginn und Ende', 'Silêncio com sino no início e no fim'],
    more: ['Nessuna voce: puoi aggiungere una campana a intervalli regolari.', 'No voice: you can add a bell at regular intervals.', 'Sin voz: puedes añadir una campana a intervalos.', 'Sans voix : tu peux ajouter une cloche à intervalles.', 'Ohne Stimme: optional eine Intervallglocke.', 'Sem voz: você pode adicionar um sino em intervalos.'],
  },
};

export const MIX_LABEL: Record<string, Row> = {
  fullBody: ['Tutto il corpo', 'Full body', 'Cuerpo completo', 'Corps entier', 'Ganzkörper', 'Corpo inteiro'],
  noJumps: ['Niente salti', 'No jumping', 'Sin saltos', 'Sans sauts', 'Ohne Sprünge', 'Sem saltos'],
  fatBurn: ['Bruciare grassi', 'Fat burn', 'Quema grasa', 'Brûle-graisse', 'Fettverbrennung', 'Queima de gordura'],
  coreDay: ['Giorno core', 'Core day', 'Día de core', 'Journée abdos', 'Core-Tag', 'Dia de core'],
  sculptedAbs: ['Addominali scolpiti', 'Sculpted abs', 'Abdominales marcados', 'Abdos sculptés', 'Definierte Bauchmuskeln', 'Abdômen definido'],
  armDay: ['Giornata braccia', 'Arm day', 'Día de brazos', 'Journée bras', 'Arm-Tag', 'Dia de braços'],
  legDay: ['Giornata gambe', 'Leg day', 'Día de piernas', 'Journée jambes', 'Bein-Tag', 'Dia de pernas'],
  backDay: ['Giornata schiena', 'Back day', 'Día de espalda', 'Journée dos', 'Rücken-Tag', 'Dia de costas'],
  upperBody: ['Metà superiore del corpo', 'Upper body', 'Tren superior', 'Haut du corps', 'Oberkörper', 'Parte superior'],
  noCardio: ['Niente cardio', 'No cardio', 'Sin cardio', 'Sans cardio', 'Ohne Cardio', 'Sem cardio'],
  noKnee: ['No esercizi di ginocchia', 'Knee-friendly', 'Sin rodillas', 'Sans genoux', 'Kniefreundlich', 'Sem joelhos'],
  noWrist: ['No esercizi per polsi', 'Wrist-friendly', 'Sin muñecas', 'Sans poignets', 'Handgelenkfreundlich', 'Sem punhos'],
  perfectGlutes: ['Glutei perfetti', 'Perfect glutes', 'Glúteos perfectos', 'Fessiers parfaits', 'Perfekter Po', 'Glúteos perfeitos'],
  hourglass: ['Figura a clessidra', 'Hourglass', 'Reloj de arena', 'Sablier', 'Sanduhr-Figur', 'Ampulheta'],
  beachBody: ['Corpo da spiaggia', 'Beach body', 'Cuerpo de playa', 'Corps de plage', 'Strandfigur', 'Corpo de praia'],
  cardioKiller: ['Cardio killer', 'Cardio killer', 'Cardio killer', 'Cardio killer', 'Cardio-Killer', 'Cardio killer'],
  allStanding: ['Tutto in piedi', 'All standing', 'Todo de pie', 'Tout debout', 'Nur im Stehen', 'Tudo em pé'],
  noStanding: ['Nessuna posizione in piedi', 'No standing', 'Nada de pie', 'Rien debout', 'Nichts im Stehen', 'Nada em pé'],
  sculptedBack: ['Schiena scolpita', 'Sculpted back', 'Espalda definida', 'Dos sculpté', 'Definierter Rücken', 'Costas definidas'],
  hopping: ['Salterellando', 'Hop to it', 'A saltitos', 'Sautillements', 'Hüpf-Mix', 'Saltitando'],
  plankHell: ['Plank infernali', 'Plank inferno', 'Planchas infernales', 'Gainage infernal', 'Plank-Hölle', 'Pranchas infernais'],
  dancerLegs: ['Gambe da ballerina/o', 'Dancer legs', 'Piernas de bailarín/a', 'Jambes de danseur·se', 'Tänzerbeine', 'Pernas de bailarino/a'],
  cardioAbs: ['Cardio addominali', 'Cardio abs', 'Cardio abdominales', 'Cardio abdos', 'Cardio & Bauch', 'Cardio abdômen'],
};

export const BOOST_LABEL: Record<string, Row> = {
  aerobic: ['Aerobico', 'Aerobic', 'Aeróbico', 'Aérobie', 'Aerob', 'Aeróbico'],
  core: ['Core', 'Core', 'Core', 'Abdos', 'Core', 'Core'],
  standingBalance: ['Equilibrio in piedi', 'Standing balance', 'Equilibrio de pie', 'Équilibre debout', 'Gleichgewicht im Stand', 'Equilíbrio em pé'],
  glutes: ['Glutei', 'Glutes', 'Glúteos', 'Fessiers', 'Po', 'Glúteos'],
  backStrength: ['Schiena', 'Back', 'Espalda', 'Dos', 'Rücken', 'Costas'],
  hips: ['Anche', 'Hips', 'Caderas', 'Hanches', 'Hüften', 'Quadris'],
  neck: ['Collo', 'Neck', 'Cuello', 'Cou', 'Nacken', 'Pescoço'],
  flexibility: ['Flessibilità', 'Flexibility', 'Flexibilidad', 'Souplesse', 'Beweglichkeit', 'Flexibilidade'],
  hipFlexors: ['Flessori dell\'anca', 'Hip flexors', 'Flexores de cadera', 'Fléchisseurs de hanche', 'Hüftbeuger', 'Flexores do quadril'],
  innerThighs: ['Interni coscia', 'Inner thighs', 'Aductores', 'Intérieur des cuisses', 'Innenschenkel', 'Parte interna da coxa'],
  hamstrings: ['Ischiocrurali', 'Hamstrings', 'Isquiotibiales', 'Ischio-jambiers', 'Beinrückseite', 'Isquiotibiais'],
  sideBody: ['Lati del corpo', 'Side body', 'Laterales del cuerpo', 'Côtés du corps', 'Körperseiten', 'Laterais do corpo'],
  handsWristsArms: ['Mani, polsi e braccia', 'Hands, wrists & arms', 'Manos, muñecas y brazos', 'Mains, poignets et bras', 'Hände, Handgelenke & Arme', 'Mãos, punhos e braços'],
  chestShoulders: ['Petto e spalle', 'Chest & shoulders', 'Pecho y hombros', 'Poitrine et épaules', 'Brust & Schultern', 'Peito e ombros'],
  feetAnkles: ['Piedi e caviglie', 'Feet & ankles', 'Pies y tobillos', 'Pieds et chevilles', 'Füße & Knöchel', 'Pés e tornozelos'],
  backbends: ['Piegamenti della schiena', 'Backbends', 'Extensiones de espalda', 'Flexions arrière', 'Rückbeugen', 'Extensões da coluna'],
  lowerBack: ['Schiena bassa', 'Lower back', 'Zona lumbar', 'Bas du dos', 'Unterer Rücken', 'Lombar'],
  twists: ['Torsioni', 'Twists', 'Torsiones', 'Torsions', 'Drehungen', 'Torções'],
  upperAbs: ['Addominali alti', 'Upper abs', 'Abdominales superiores', 'Abdos hauts', 'Obere Bauchmuskeln', 'Abdômen superior'],
  lowerAbs: ['Addominali bassi', 'Lower abs', 'Abdominales inferiores', 'Abdos bas', 'Untere Bauchmuskeln', 'Abdômen inferior'],
  upperBody: ['Metà superiore del corpo', 'Upper body', 'Tren superior', 'Haut du corps', 'Oberkörper', 'Parte superior do corpo'],
  obliques: ['Obliqui', 'Obliques', 'Oblicuos', 'Obliques', 'Schräge Bauchmuskeln', 'Oblíquos'],
};

export const THEME_LABEL: Record<MedThemeChoice, Row> = {
  any: ['Qualsiasi', 'Any', 'Cualquiera', 'Au choix', 'Beliebig', 'Qualquer'],
  beginners: ['Per principianti', 'For beginners', 'Para principiantes', 'Pour débutants', 'Für Einsteiger', 'Para iniciantes'],
  selfCompassion: ['Amore verso se stessi e compassione', 'Self-love & compassion', 'Amor propio y compasión', 'Amour de soi et compassion', 'Selbstliebe & Mitgefühl', 'Amor-próprio e compaixão'],
  selfEsteem: ['Autostima e sicurezza in se stessi', 'Self-esteem & confidence', 'Autoestima y confianza', 'Estime et confiance en soi', 'Selbstwert & Selbstvertrauen', 'Autoestima e confiança'],
  selfCare: ['Cura di sé', 'Self-care', 'Autocuidado', 'Prendre soin de soi', 'Selbstfürsorge', 'Autocuidado'],
  stressRelax: ['Molla lo stress e rilassati', 'Release stress & relax', 'Suelta el estrés y relájate', 'Lâche le stress et détends-toi', 'Stress loslassen & entspannen', 'Solte o estresse e relaxe'],
  anxiety: ['Allevia la tua ansia', 'Ease your anxiety', 'Alivia tu ansiedad', 'Apaise ton anxiété', 'Ängste lindern', 'Alivie sua ansiedade'],
  difficultEmotions: ['Lavorare con emozioni difficili', 'Working with difficult emotions', 'Trabajar con emociones difíciles', 'Accueillir les émotions difficiles', 'Mit schwierigen Gefühlen umgehen', 'Lidar com emoções difíceis'],
  growth: ['Crescita personale', 'Personal growth', 'Crecimiento personal', 'Développement personnel', 'Persönliches Wachstum', 'Crescimento pessoal'],
  innerPeace: ['Pace interiore', 'Inner peace', 'Paz interior', 'Paix intérieure', 'Innerer Frieden', 'Paz interior'],
  lettingGo: ['Lasciare andare', 'Letting go', 'Soltar', 'Lâcher prise', 'Loslassen', 'Deixar ir'],
  presence: ['Essere più presenti', 'Being more present', 'Estar más presente', 'Être plus présent', 'Präsenter sein', 'Estar mais presente'],
  buddhism: ['Buddhismo', 'Buddhism', 'Budismo', 'Bouddhisme', 'Buddhismus', 'Budismo'],
  positiveVoice: ['Voce interiore positiva', 'Positive inner voice', 'Voz interior positiva', 'Voix intérieure positive', 'Positive innere Stimme', 'Voz interior positiva'],
  none: ['Nessun tema', 'No theme', 'Sin tema', 'Sans thème', 'Kein Thema', 'Sem tema'],
};

export const MIX_GROUP_LABEL: Record<MixGroup, Row> = {
  aerobic: ['Aerobico', 'Aerobic', 'Aeróbico', 'Aérobie', 'Aerob', 'Aeróbico'],
  legs: ['Gambe', 'Legs', 'Piernas', 'Jambes', 'Beine', 'Pernas'],
  upper: ['Corpo superiore', 'Upper body', 'Tren superior', 'Haut du corps', 'Oberkörper', 'Parte superior'],
  core: ['Core addominale', 'Core & abs', 'Core y abdomen', 'Abdos & gainage', 'Core & Bauch', 'Core e abdômen'],
  glutes: ['Glutei', 'Glutes', 'Glúteos', 'Fessiers', 'Po', 'Glúteos'],
};
