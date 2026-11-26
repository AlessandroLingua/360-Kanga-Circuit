import type { L10n, Lang } from './types';

export const tr = (s: L10n | undefined, lang: Lang): string => (s ? (s[lang] ?? s.en) : '');
export const hasLang = (s: L10n | undefined, lang: Lang) => !!s && !!s[lang];

const P = {
  welcome: { en: 'Welcome to your practice.', it: 'Benvenuto nella tua pratica.', es: 'Bienvenido a tu práctica.', fr: 'Bienvenue dans ta pratique.', de: 'Willkommen zu deiner Praxis.', pt: 'Bem-vindo à sua prática.' },
  welcomeWorkout: { en: 'Welcome. Let\'s get moving.', it: 'Benvenuto. Iniziamo a muoverci.', es: 'Bienvenido. Empecemos a movernos.', fr: 'Bienvenue. Bougeons ensemble.', de: 'Willkommen. Los geht\'s.', pt: 'Bem-vindo. Vamos nos mexer.' },
  arrive: { en: 'Take a moment to arrive. Notice your breath without changing it.', it: 'Prenditi un momento per arrivare. Osserva il respiro senza cambiarlo.', es: 'Tómate un momento para llegar. Observa tu respiración sin cambiarla.', fr: 'Prends un moment pour arriver. Observe ta respiration sans la changer.', de: 'Nimm dir einen Moment, um anzukommen. Beobachte deinen Atem, ohne ihn zu verändern.', pt: 'Reserve um momento para chegar. Observe a respiração sem mudá-la.' },
  comeInto: { en: 'Come into', it: 'Vieni in', es: 'Ven a', fr: 'Viens en', de: 'Komm in', pt: 'Venha para' },
  next: { en: 'Next', it: 'Ora', es: 'Ahora', fr: 'Maintenant', de: 'Jetzt', pt: 'Agora' },
  nextUp: { en: 'Next up', it: 'Prossimo', es: 'A continuación', fr: 'Ensuite', de: 'Als Nächstes', pt: 'A seguir' },
  rightSide: { en: 'right side', it: 'lato destro', es: 'lado derecho', fr: 'côté droit', de: 'rechte Seite', pt: 'lado direito' },
  leftSide: { en: 'left side', it: 'lato sinistro', es: 'lado izquierdo', fr: 'côté gauche', de: 'linke Seite', pt: 'lado esquerdo' },
  inhale: { en: 'Inhale', it: 'Inspira', es: 'Inhala', fr: 'Inspire', de: 'Einatmen', pt: 'Inspire' },
  exhale: { en: 'Exhale', it: 'Espira', es: 'Exhala', fr: 'Expire', de: 'Ausatmen', pt: 'Expire' },
  hold: { en: 'Hold', it: 'Mantieni', es: 'Mantén', fr: 'Tiens', de: 'Halten', pt: 'Mantenha' },
  breatheDeep: { en: 'Breathe deeply and steadily.', it: 'Respira in modo profondo e regolare.', es: 'Respira profunda y regularmente.', fr: 'Respire profondément et régulièrement.', de: 'Atme tief und gleichmäßig.', pt: 'Respire de forma profunda e regular.' },
  stayHere: { en: 'Stay here, find stillness.', it: 'Resta qui, trova la quiete.', es: 'Quédate aquí, encuentra la quietud.', fr: 'Reste ici, trouve l\'immobilité.', de: 'Bleib hier, finde Stille.', pt: 'Fique aqui, encontre a quietude.' },
  soften: { en: 'Soften anything you don\'t need.', it: 'Ammorbidisci tutto ciò che non serve.', es: 'Suelta todo lo que no necesitas.', fr: 'Relâche tout ce qui n\'est pas utile.', de: 'Lass alles los, was du nicht brauchst.', pt: 'Solte tudo o que não for necessário.' },
  release: { en: 'And release.', it: 'E rilascia.', es: 'Y suelta.', fr: 'Et relâche.', de: 'Und lösen.', pt: 'E solte.' },
  flow: { en: 'Flow through your vinyasa.', it: 'Fluisci nel tuo vinyasa.', es: 'Fluye con tu vinyasa.', fr: 'Enchaîne ton vinyasa.', de: 'Flow durch dein Vinyasa.', pt: 'Flua pelo seu vinyasa.' },
  sunSal: { en: 'Sun Salutation', it: 'Saluto al Sole', es: 'Saludo al Sol', fr: 'Salutation au Soleil', de: 'Sonnengruß', pt: 'Saudação ao Sol' },
  savasanaIntro: { en: 'Final relaxation. Lie down and let the body become heavy. Let go of any control over the breath.', it: 'Rilassamento finale. Sdraiati e lascia il corpo diventare pesante. Lascia andare ogni controllo sul respiro.', es: 'Relajación final. Túmbate y deja que el cuerpo se vuelva pesado. Suelta el control de la respiración.', fr: 'Relaxation finale. Allonge-toi et laisse le corps devenir lourd. Lâche tout contrôle sur la respiration.', de: 'Endentspannung. Leg dich hin und lass den Körper schwer werden. Lass jede Kontrolle über den Atem los.', pt: 'Relaxamento final. Deite-se e deixe o corpo pesar. Solte qualquer controle sobre a respiração.' },
  wakeUp: { en: 'Slowly begin to deepen the breath. Wiggle the fingers and toes, and when you are ready, roll to one side.', it: 'Lentamente approfondisci il respiro. Muovi dita delle mani e dei piedi e, quando sei pronto, rotola su un fianco.', es: 'Poco a poco profundiza la respiración. Mueve los dedos y, cuando estés listo, gira hacia un lado.', fr: 'Approfondis lentement la respiration. Bouge les doigts et les orteils et, quand tu es prêt, roule sur le côté.', de: 'Vertiefe langsam den Atem. Bewege Finger und Zehen und rolle dich, wenn du bereit bist, zur Seite.', pt: 'Aprofunde lentamente a respiração. Mexa os dedos e, quando estiver pronto, role para um lado.' },
  namaste: { en: 'Thank you for practising. Namaste.', it: 'Grazie per aver praticato. Namaste.', es: 'Gracias por practicar. Namaste.', fr: 'Merci d\'avoir pratiqué. Namaste.', de: 'Danke fürs Üben. Namaste.', pt: 'Obrigado por praticar. Namaste.' },
  wellDone: { en: 'Great work. Session complete.', it: 'Ottimo lavoro. Sessione completata.', es: 'Buen trabajo. Sesión completada.', fr: 'Bon travail. Séance terminée.', de: 'Super gemacht. Einheit beendet.', pt: 'Ótimo trabalho. Sessão concluída.' },
  rest: { en: 'Rest', it: 'Recupero', es: 'Descanso', fr: 'Repos', de: 'Pause', pt: 'Descanso' },
  go: { en: 'Go!', it: 'Via!', es: '¡Ya!', fr: 'Go !', de: 'Los!', pt: 'Vai!' },
  halfway: { en: 'Halfway there, keep going.', it: 'Sei a metà, continua.', es: 'A mitad, sigue.', fr: 'À mi-chemin, continue.', de: 'Halbzeit, weiter so.', pt: 'Metade, continue.' },
  round: { en: 'Round', it: 'Round', es: 'Ronda', fr: 'Tour', de: 'Runde', pt: 'Rodada' },
  warmup: { en: 'Warm-up', it: 'Riscaldamento', es: 'Calentamiento', fr: 'Échauffement', de: 'Aufwärmen', pt: 'Aquecimento' },
  cooldown: { en: 'Cool-down', it: 'Defaticamento', es: 'Vuelta a la calma', fr: 'Retour au calme', de: 'Cool-down', pt: 'Desaquecimento' },
  repeatOther: { en: 'Now the other side.', it: 'Ora dall\'altro lato.', es: 'Ahora el otro lado.', fr: 'Maintenant l\'autre côté.', de: 'Jetzt die andere Seite.', pt: 'Agora o outro lado.' },
  keepMoving: { en: 'Keep the movement smooth and controlled.', it: 'Mantieni il movimento fluido e controllato.', es: 'Mantén el movimiento fluido y controlado.', fr: 'Garde un mouvement fluide et contrôlé.', de: 'Halte die Bewegung fließend und kontrolliert.', pt: 'Mantenha o movimento suave e controlado.' },
  three: { en: 'Three, two, one.', it: 'Tre, due, uno.', es: 'Tres, dos, uno.', fr: 'Trois, deux, un.', de: 'Drei, zwei, eins.', pt: 'Três, dois, um.' },
} satisfies Record<string, Required<L10n>>;

export type PhraseKey = keyof typeof P;
export const ph = (k: PhraseKey, lang: Lang) => P[k][lang] ?? P[k].en;
