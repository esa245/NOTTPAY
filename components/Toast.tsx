'use client';

import { AnimatePresence, motion } from 'motion/react';

interface ToastProps {
  message: string | null;
}

export default function Toast({ message }: ToastProps) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-20 left-1/2 z-50 -translate-x-1/2 lg:bottom-6 lg:left-auto lg:right-6 lg:translate-x-0"
    >
      <AnimatePresence>
        {message && (
          <motion.div
            key={message}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="whitespace-nowrap rounded-xl bg-[#241638] px-4 py-2.5 text-xs font-semibold text-white shadow-[0_12px_30px_rgba(36,22,56,0.28)]"
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
