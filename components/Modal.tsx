'use client';

import { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
  // Fermer avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const lockBody = () => {
      const cur = Number(document.body.getAttribute('data-scroll-lock') || '0');
      const next = cur + 1;
      document.body.setAttribute('data-scroll-lock', String(next));
      document.body.style.overflow = 'hidden';
    };

    const unlockBody = () => {
      const cur = Number(document.body.getAttribute('data-scroll-lock') || '0');
      const next = Math.max(0, cur - 1);
      if (next === 0) {
        document.body.removeAttribute('data-scroll-lock');
        document.body.style.overflow = '';
      } else {
        document.body.setAttribute('data-scroll-lock', String(next));
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      lockBody();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (isOpen) unlockBody();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/70 z-40 animate-fadeIn transition-colors duration-300"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div
          className="bg-white dark:bg-neutral-900 rounded-lg max-h-[90vh] overflow-y-auto max-w-2xl w-full animate-fadeIn shadow-lg transition-colors duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 flex items-center justify-between p-4 sm:p-6 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-colors duration-300">
            <h2 className="text-2xl sm:text-3xl font-light text-primary-800 dark:text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 text-2xl transition p-1"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 text-neutral-700 dark:text-neutral-300">{children}</div>

          {/* Footer with close button */}
          <div className="sticky bottom-0 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 p-4 sm:p-6 flex justify-end transition-colors duration-300">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-primary-700 dark:bg-accent-500 text-white hover:bg-primary-800 dark:hover:bg-accent-600 transition font-medium rounded"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
