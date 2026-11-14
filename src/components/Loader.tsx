import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { KINO_LOGO_SRC } from '../utils/theme';

interface LoaderProps {
  onComplete?: () => void;
}

export const Loader: React.FC<LoaderProps> = ({ onComplete }) => {
  const prefersReducedMotion = useReducedMotion();
  const [visible, setVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    return params.get('autostart') !== '1';
  });
  const [isDismissing, setIsDismissing] = useState(false);

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const dismissLoader = useCallback(() => {
    setIsDismissing(true);
    setVisible(false);
    onCompleteRef.current?.();
  }, []);

  useEffect(() => {
    if (!visible) {
      onCompleteRef.current?.();
      return;
    }

    const durationMs = prefersReducedMotion ? 260 : 1250;
    const timer = window.setTimeout(dismissLoader, durationMs);
    const safetyTimer = window.setTimeout(dismissLoader, 2100);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dismissLoader();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(safetyTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible, prefersReducedMotion, dismissLoader]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="kino-loader"
          role="status"
          aria-live="polite"
          aria-label="جاري تحضير لوحة كينو"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, pointerEvents: 'none' }}
          transition={{ duration: prefersReducedMotion ? 0.15 : 0.4, ease: [0.16, 1, 0.3, 1] }}
          onClick={dismissLoader}
          style={{ pointerEvents: isDismissing ? 'none' : 'auto' }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#384c31] text-[#faf9f5] kino-seigaiha-dark px-6 cursor-pointer"
        >
          <motion.div
            initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center gap-6 max-w-xs w-full"
          >
            {/* Attached Kino Logo seamlessly matched to #384c31 */}
            <div className="w-44 sm:w-52 aspect-[4/5] overflow-hidden flex items-center justify-center">
              <img
                src={KINO_LOGO_SRC}
                alt="شعار ورشات كينو Kino"
                referrerPolicy="no-referrer"
                decoding="sync"
                className="w-full h-full object-contain select-none pointer-events-none"
              />
            </div>

            {/* Animated dashed Kinusaiga stitch line */}
            <div className="w-full max-w-[240px]" aria-hidden="true">
              <svg viewBox="0 0 240 24" className="w-full h-6 overflow-visible">
                {/* Subtle carved wood groove */}
                <path
                  d="M 8 12 Q 60 4, 120 12 T 232 12"
                  fill="none"
                  stroke="#2d3f27"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                {/* Animated dashed thread */}
                <motion.path
                  d="M 8 12 Q 60 4, 120 12 T 232 12"
                  fill="none"
                  stroke="#faf9f5"
                  strokeWidth="2.2"
                  strokeDasharray="8 6"
                  strokeLinecap="round"
                  initial={
                    prefersReducedMotion
                      ? { pathLength: 1, opacity: 1 }
                      : { pathLength: 0, opacity: 0.4 }
                  }
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    duration: prefersReducedMotion ? 0.1 : 1.05,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                />
              </svg>
            </div>

            <span className="font-jp text-xs tracking-[0.28em] text-[#a9bf9c]">
              キノサイガ
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
