import { useLanguage } from '@/context/LanguageContext';
import { t as translate } from '@/i18n/translations';

export function useTranslation() {
  const { lang } = useLanguage();
  
  return {
    t: (key: string) => translate(key, lang),
    lang,
  };
}
