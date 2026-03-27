'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const closeMenu = () => setMenuOpen(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    closeMenu();
  };

  return (
    <header className="fixed w-full bg-white dark:bg-neutral-950 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6 flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-700 to-primary-800 rounded-lg flex items-center justify-center group-hover:shadow-lg transition">
            <span className="text-white font-light text-base">F</span>
          </div>
          <span className="text-lg font-light tracking-widest text-primary-800 dark:text-white hidden sm:inline">FISAFI</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-10 lg:gap-12 items-center">
          <button onClick={() => scrollTo("services")} className="text-xs tracking-widest uppercase text-neutral-700 dark:text-neutral-300 hover:text-primary-700 dark:hover:text-accent-400 transition font-light cursor-pointer bg-none border-none p-0">
            Services
          </button>
          <button onClick={() => scrollTo("news")} className="text-xs tracking-widest uppercase text-neutral-700 dark:text-neutral-300 hover:text-primary-700 dark:hover:text-accent-400 transition font-light cursor-pointer bg-none border-none p-0">
            Actualités
          </button>
          <Link href="/training" className="text-xs tracking-widest uppercase text-neutral-700 dark:text-neutral-300 hover:text-primary-700 dark:hover:text-accent-400 transition font-light">
            Formation
          </Link>
          <button onClick={() => scrollTo("contact")} className="px-6 py-2.5 bg-primary-700 dark:bg-accent-500 text-white text-xs tracking-widest uppercase hover:bg-primary-800 dark:hover:bg-accent-600 transition rounded-lg font-light cursor-pointer">
            Contact
          </button>
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="ml-6 p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors duration-300"
            aria-label="Basculer le mode sombre"
          >
            <span className="text-lg leading-none">
              {theme === 'light' ? '🌙' : '☀️'}
            </span>
          </button>
        </nav>

        {/* Mobile Menu Button and Theme Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          {/* Theme Toggle Mobile */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors duration-300"
            aria-label="Basculer le mode sombre"
          >
            <span className="text-lg leading-none">
              {theme === 'light' ? '🌙' : '☀️'}
            </span>
          </button>

          {/* Hamburger Menu */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex flex-col gap-1.5 focus:outline-none p-2 ml-2"
            aria-label="Menu"
            aria-expanded={menuOpen}
          >
            <span className={`w-5 h-0.5 bg-primary-700 dark:bg-neutral-300 transition transform origin-center ${
              menuOpen ? 'rotate-45 translate-y-1.5' : ''
            }`}></span>
            <span className={`w-5 h-0.5 bg-primary-700 dark:bg-neutral-300 transition ${
              menuOpen ? 'opacity-0' : 'opacity-100'
            }`}></span>
            <span className={`w-5 h-0.5 bg-primary-700 dark:bg-neutral-300 transition transform origin-center ${
              menuOpen ? '-rotate-45 -translate-y-1.5' : ''
            }`}></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-neutral-100 dark:border-neutral-800 py-6 px-4 sm:px-6 flex flex-col gap-4 bg-white dark:bg-neutral-950 animate-in transition-colors duration-300">
          <button onClick={() => scrollTo("services")} className="text-sm tracking-widest uppercase text-primary-700 dark:text-neutral-300 py-3 hover:text-primary-800 dark:hover:text-accent-400 transition font-light text-left cursor-pointer bg-none border-none p-0">
            Services
          </button>
          <button onClick={() => scrollTo("news")} className="text-sm tracking-widest uppercase text-primary-700 dark:text-neutral-300 py-3 hover:text-primary-800 dark:hover:text-accent-400 transition font-light text-left cursor-pointer bg-none border-none p-0">
            Actualités
          </button>
          <button onClick={() => scrollTo("training")} className="text-sm tracking-widest uppercase text-primary-700 dark:text-neutral-300 py-3 hover:text-primary-800 dark:hover:text-accent-400 transition font-light text-left cursor-pointer bg-none border-none p-0">
            Formation
          </button>
          <button onClick={() => scrollTo("contact")} className="text-sm tracking-widest uppercase text-primary-700 dark:text-neutral-300 py-3 hover:text-primary-800 dark:hover:text-accent-400 transition font-light text-left cursor-pointer bg-none border-none p-0">
            Contact
          </button>
        </nav>
      )}
    </header>
  );
}
