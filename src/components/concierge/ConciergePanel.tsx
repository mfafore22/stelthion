/**
 * Concierge Panel Component
 *
 * Main left panel UI with sparkle animation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useConcierge } from './ConciergeContext';
import { ConversationPanel } from './ConversationPanel';
import { ConversationList } from './ConversationList';
import { MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConciergePanelProps {
  className?: string;
}

export function ConciergePanel({ className = '' }: ConciergePanelProps) {
  const { state, preferences, createConversation, updatePreferences } = useConcierge();
  const [showSparkle, setShowSparkle] = useState(false);

  // Show sparkle animation on first access
  useEffect(() => {
    if (!preferences.sessionSparkleShown) {
      // Show sparkle after a short delay
      const timer = setTimeout(() => {
        setShowSparkle(true);

        // Hide after animation completes
        setTimeout(() => {
          setShowSparkle(false);
          updatePreferences({ sessionSparkleShown: true });
        }, 2000);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [preferences.sessionSparkleShown, updatePreferences]);

  if (state.panelMinimized) {
    return <MinimizedPanel />;
  }

  if (!state.panelOpen) {
    return null;
  }

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      exit={{ x: -300 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className={`fixed left-0 top-0 bottom-0 bg-bo-neutral-50 border-r border-bo-neutral-200 shadow-bo-xl z-50 ${className}`}
      style={{ width: `${preferences.panelWidth}px` }}
    >
      {/* Sparkle overlay */}
      <AnimatePresence>
        {showSparkle && <SparkleOverlay />}
      </AnimatePresence>

      {state.activeConversationId ? <ConversationPanel /> : <ConversationList />}
    </motion.div>
  );
}

/**
 * Minimized Panel (icon only)
 */
function MinimizedPanel() {
  const { state, openPanel } = useConcierge();

  return (
    <motion.div
      initial={{ x: -60 }}
      animate={{ x: 0 }}
      className="fixed left-0 top-20 bg-bo-neutral-50 border border-bo-neutral-200 rounded-r-lg shadow-bo-md p-3 z-50 cursor-pointer hover:bg-bo-neutral-100 transition-colors"
      onClick={openPanel}
    >
      <MessageSquare className="w-6 h-6 text-bo-neutral-600" />
      {state.conversations.length > 0 && (
        <div className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
          {state.conversations.length}
        </div>
      )}
    </motion.div>
  );
}

/**
 * Sparkle Animation Overlay
 */
function SparkleOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 pointer-events-none z-50"
    >
      {/* Multiple sparkles */}
      {[...Array(12)].map((_, i) => (
        <Sparkle key={i} delay={i * 0.1} />
      ))}
    </motion.div>
  );
}

/**
 * Individual Sparkle
 */
function Sparkle({ delay }: { delay: number }) {
  const randomX = Math.random() * 100;
  const randomY = Math.random() * 100;
  const randomSize = 8 + Math.random() * 16;
  const randomDuration = 0.6 + Math.random() * 0.6;

  return (
    <motion.div
      initial={{ scale: 0, rotate: 0 }}
      animate={{
        scale: [0, 1, 0],
        rotate: [0, 180, 360],
        opacity: [0, 1, 0],
      }}
      transition={{
        duration: randomDuration,
        delay,
        ease: 'easeOut',
      }}
      className="absolute"
      style={{
        left: `${randomX}%`,
        top: `${randomY}%`,
        width: `${randomSize}px`,
        height: `${randomSize}px`,
      }}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="w-full h-full"
      >
        <path
          d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
          fill="currentColor"
          className="text-yellow-400"
        />
        <path
          d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-white"
        />
      </svg>
    </motion.div>
  );
}
