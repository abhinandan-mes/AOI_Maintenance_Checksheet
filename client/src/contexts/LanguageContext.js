import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';
import { translations } from '../translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('aoi_language') || 'en';
  });

  const changeLanguage = useCallback((lang) => {
    localStorage.setItem('aoi_language', lang);
    setLanguage(lang);
  }, []);

  const replaceVars = useCallback((str, vars) => {
    if (typeof str !== 'string') return str;
    return str.replace(/\{(\w+)\}/g, (match, p1) => {
      return vars[p1] !== undefined ? vars[p1] : match;
    });
  }, []);

  const t = useCallback((key, variables = {}) => {
    const keys = key.split('.');
    let translation = translations[language];

    for (const k of keys) {
      if (translation && translation[k] !== undefined) {
        translation = translation[k];
      } else {
        // Fallback to English
        let enTranslation = translations['en'];
        let found = true;
        for (const enK of keys) {
          if (enTranslation && enTranslation[enK] !== undefined) {
            enTranslation = enTranslation[enK];
          } else {
            found = false;
            break;
          }
        }
        return found ? replaceVars(enTranslation, variables) : key;
      }
    }

    return replaceVars(translation, variables);
  }, [language, replaceVars]); // re-creates when language changes

  const value = useMemo(() => ({ language, changeLanguage, t }), [language, changeLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
