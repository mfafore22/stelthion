/**
 * Property Speech Bubble
 *
 * Animated speech bubble trigger for the top bar.
 * Replaces the old Sparkles button.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from 'react-i18next';

interface PropertySpeechBubbleProps {
  isOpen: boolean;
  unreadCount?: number;
  onClick: () => void;
  propertyName?: string;
}

export function PropertySpeechBubble({
  isOpen,
  unreadCount = 0,
  onClick,
  propertyName = 'Ideapark',
}: PropertySpeechBubbleProps) {
  const { t } = useTranslation('mall');
  const [hasAnimatedWave, setHasAnimatedWave] = useState(false);
  const [showWave, setShowWave] = useState(false);

  // First-visit wave animation (plays once per session)
  useEffect(() => {
    const key = 'concierge_wave_shown';
    if (!sessionStorage.getItem(key)) {
      const timer = setTimeout(() => {
        setShowWave(true);
        sessionStorage.setItem(key, '1');
        setTimeout(() => {
          setShowWave(false);
          setHasAnimatedWave(true);
        }, 1200);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setHasAnimatedWave(true);
    }
  }, []);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <motion.button
            onClick={onClick}
            className={cn(
              'relative flex items-center justify-center w-11 h-11 rounded-full',
              'border transition-colors duration-300',
              isOpen
                ? 'bg-bo-primary-500 border-bo-primary-600 shadow-lg shadow-bo-primary-500/25'
                : 'bg-white/60 backdrop-blur-md border-bo-neutral-200/40 hover:bg-bo-primary-50 hover:border-bo-primary-300',
            )}
            // Breathing animation when idle (not open, wave done)
            animate={
              showWave
                ? { rotate: [-3, 3, -2, 1, 0] }
                : !isOpen && hasAnimatedWave
                  ? { scale: [1, 1.04, 1] }
                  : {}
            }
            transition={
              showWave
                ? { duration: 1.2, ease: 'easeOut' }
                : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
            }
            aria-label={t('concierge.talkTo', { propertyName })}
          >
            <MessageCircle
              className={cn(
                'h-5 w-5 transition-colors duration-300',
                isOpen ? 'text-white' : 'text-bo-neutral-700'
              )}
            />

            {/* Speech bubble tail */}
            <div
              className={cn(
                'absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0',
                'border-l-[5px] border-l-transparent',
                'border-r-[5px] border-r-transparent',
                'border-t-[5px] transition-colors duration-300',
                isOpen ? 'border-t-bo-primary-500' : 'border-t-white/60'
              )}
            />

            {/* Unread indicator */}
            <AnimatePresence>
              {unreadCount > 0 && !isOpen && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-bo-primary-500"
                >
                  <motion.div
                    className="absolute inset-0 rounded-full bg-bo-primary-500"
                    animate={{ scale: [1, 1.6, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="nav-tooltip">
          {t('concierge.talkTo', { propertyName })}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
