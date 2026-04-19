/**
 * Property Greeting
 *
 * Welcome card showing the property's persona.
 * Uses the property's official logo, time-aware greeting,
 * and an intro message in the user's language.
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface PropertyGreetingProps {
  propertyName?: string;
  logoUrl?: string;
}

export function PropertyGreeting({
  propertyName = 'Ideapark Lempäälä',
  logoUrl = '/ideapark-logo.png',
}: PropertyGreetingProps) {
  const { i18n } = useTranslation();
  const hour = new Date().getHours();

  const greeting = getGreeting(hour, i18n.language);
  const intro = getIntro(propertyName, i18n.language);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center text-center px-6 py-8"
    >
      {/* Property logo */}
      <div className="w-16 h-16 rounded-full bg-bo-primary-50 border border-bo-primary-200/50 flex items-center justify-center overflow-hidden mb-4 shadow-bo-sm">
        <Image
          src={logoUrl}
          alt={propertyName}
          width={48}
          height={48}
          className="object-contain"
        />
      </div>

      {/* Time-aware greeting */}
      <h3 className="text-xl font-semibold text-bo-neutral-950 mb-1">
        {greeting}
      </h3>

      {/* Intro line */}
      <p className="text-sm text-bo-neutral-500 max-w-[280px]">
        {intro}
      </p>
    </motion.div>
  );
}

function getGreeting(hour: number, language: string): string {
  const greetings = {
    fi: hour < 10 ? 'Huomenta!' : hour < 17 ? 'Hyvää päivää!' : 'Hyvää iltaa!',
    sv: hour < 10 ? 'God morgon!' : hour < 17 ? 'God dag!' : 'God kväll!',
    en: hour < 10 ? 'Good morning!' : hour < 17 ? 'Good afternoon!' : 'Good evening!',
  };
  return greetings[language as keyof typeof greetings] || greetings.en;
  
}

function getIntro(propertyName: string, language: string): string {
  if (language === 'fi') return `Olen ${propertyName} — kysy mitä vain minusta!`;
  if (language === 'sv') return `Jag är ${propertyName} — fråga mig vad som helst!`;
  return `I'm ${propertyName} — ask me anything about your property!`;
}
