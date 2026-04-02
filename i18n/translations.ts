export type Language = 'FR' | 'EN';

export const translations: Record<Language, Record<string, string>> = {
  FR: {
    'header.home': 'Accueil',
    'header.activities': 'Nos pôles d\'activités',
    'header.resources': 'Ressources',
    'header.services': 'Services',
    'header.news': 'Actualités',
    'header.training': 'Formation',
    'header.sessions': 'Sessions',
    'header.contact': 'Contact',
    'header.login': 'Connexion',
    'header.search': 'Rechercher...',
    'header.language': 'Langue',
    'lang.french': '🇫🇷 Français',
    'lang.english': '🇬🇧 English',
  },
  EN: {
    'header.home': 'Home',
    'header.activities': 'Our activity areas',
    'header.resources': 'Resources',
    'header.services': 'Services',
    'header.news': 'News',
    'header.training': 'Training',
    'header.sessions': 'Sessions',
    'header.contact': 'Contact',
    'header.login': 'Login',
    'header.search': 'Search...',
    'header.language': 'Language',
    'lang.french': '🇫🇷 Français',
    'lang.english': '🇬🇧 English',
  },
};

export function t(key: string, lang: Language): string {
  return translations[lang][key] || key;
}
