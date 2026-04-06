import React, { createContext, useState, useContext, useEffect } from 'react';
import { translations } from '../i18n/translations';

const LanguageContext = createContext();

const SUPPORTED = new Set(['en', 'es']);

const resolveBrowserLanguage = () => {
  if (typeof navigator === 'undefined') return 'en';
  const raw = navigator.language || (navigator.languages && navigator.languages[0]) || 'en';
  const primary = String(raw).toLowerCase().split('-')[0].split('_')[0];
  return primary === 'es' ? 'es' : 'en';
};

const getInitialLanguage = () => {
  try {
    const saved = localStorage.getItem('superfoot_lang');
    if (saved && SUPPORTED.has(saved)) return saved;
  } catch {
    /* storage no disponible */
  }
  return resolveBrowserLanguage();
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    localStorage.setItem('superfoot_lang', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === 'en' ? 'es' : 'en'));
  };

  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
