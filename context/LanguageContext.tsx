'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type Language = 'FR' | 'EN';

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Helper to safely access localStorage
const getStoredLanguage = (): Language => {
  if (typeof window === 'undefined') return 'FR';
  try {
    const stored = localStorage.getItem('language');
    if (stored === 'EN' || stored === 'FR') return stored;
  } catch (e) {
    console.warn('❌ localStorage access failed:', e);
  }
  return 'FR';
};

const saveLanguage = (lang: Language): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('language', lang);
    console.log('✅ Language saved to localStorage:', lang);
  } catch (e) {
    console.warn('❌ Failed to save language to localStorage:', e);
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('FR');
  const [isHydrated, setIsHydrated] = useState(false);

  // Initialize on client side only - runs once after hydration
  useEffect(() => {
    const savedLang = getStoredLanguage();
    console.log('📍 Initializing language:', savedLang);
    setLangState(savedLang);
    if (savedLang !== 'FR') {
      document.documentElement.lang = savedLang.toLowerCase();
    }
    setIsHydrated(true);
  }, []);

  const setLang = useCallback((newLang: Language) => {
    console.log('🔄 Setting language to:', newLang);
    
    // Update state
    setLangState(newLang);
    
    // Update localStorage
    saveLanguage(newLang);
    
    // Update document attribute
    if (typeof window !== 'undefined') {
      document.documentElement.lang = newLang.toLowerCase();
    }
  }, []);

  // Avoid rendering children before hydration is complete to prevent mismatch
  if (!isHydrated) {
    return (
      <LanguageContext.Provider value={{ lang: 'FR', setLang }}>
        {children}
      </LanguageContext.Provider>
    );
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
