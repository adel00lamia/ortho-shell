import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { en } from '@/locales/en';
import { fr } from '@/locales/fr';
import { ar } from '@/locales/ar';
import type { Translations } from '@/locales/en';

type Language = 'en' | 'fr' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  dir: 'ltr' | 'rtl';
}

const translations: Record<Language, Translations> = { en, fr, ar };
const VALID_LANGUAGES: Language[] = ['en', 'fr', 'ar'];

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language') as Language;
    return VALID_LANGUAGES.includes(saved) ? saved : 'en';
  });

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [language, dir]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app-language', lang);
  }, []);

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

const defaultContext: LanguageContextType = {
  language: 'en',
  setLanguage: () => {},
  t: translations.en,
  dir: 'ltr',
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  return context ?? defaultContext;
};
