import type { AppProps } from 'next/app';
import { ThemeProvider } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import '../styles/globals.css';
import '../styles/header.css';
import '../styles/floating-logo.css';
import '../styles/carousel.css';
import '../styles/footer-enhanced.css';
import FloatingLogo from '@/components/FloatingLogo';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <Component {...pageProps} />
        <FloatingLogo />
      </ThemeProvider>
    </LanguageProvider>
  );
}