import { createContext, useContext } from 'react';
import type { Lang } from '../engine/types';
import { STRINGS, type StrKey } from './strings';

const idx: Record<Lang, number> = { it: 0, en: 1, es: 2, fr: 3, de: 4, pt: 5 };

export const LANG_NAMES: Record<Lang, string> = {
  it: 'Italiano',
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  pt: 'Português',
};

export const detectLang = (): Lang => {
  const l = (navigator.language || 'it').slice(0, 2) as Lang;
  return l in idx ? l : 'en';
};

export const translate = (lang: Lang, k: StrKey) => STRINGS[k][idx[lang]] ?? STRINGS[k][1];

/** Fill `{name}` placeholders in a translated string. */
export const fill = (s: string, vars: Record<string, string | number>) => s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ''));

export const LangCtx = createContext<Lang>('it');
export const useT = () => {
  const lang = useContext(LangCtx);
  return (k: StrKey) => translate(lang, k);
};
export const useLang = () => useContext(LangCtx);
