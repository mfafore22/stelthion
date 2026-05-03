export interface PropertyPersona {
  mallId: string;
  name: string;
  city: string;
  systemPrompt: string;
}

import { canonicalizeMallId } from '@/lib/mall/ids';
import { getMall } from '@/lib/mall/mallDatabase';

const PERSONAS: Record<string, Omit<PropertyPersona, 'systemPrompt'>> = {
  'ideapark-lempaala': {
    mallId: 'ideapark-lempaala',
    name: 'Ideapark Lempäälä',
    city: 'Lempäälä',
  },
};

function resolvePersona(mallId: string): Omit<PropertyPersona, 'systemPrompt'> {
  const canonical = canonicalizeMallId(mallId);
  if (canonical && PERSONAS[canonical]) return PERSONAS[canonical];
  const mall = canonical ? getMall(canonical) : null;
  return {
    mallId: canonical ?? mallId,
    name: mall?.name ?? 'your property',
    city: mall?.city ?? 'your market',
  };
}

function buildSystemPrompt(persona: Omit<PropertyPersona, 'systemPrompt'>): string {
  const knownIdeapark = persona.mallId === 'ideapark-lempaala';
  const proof = knownIdeapark
    ? 'You may reference Ideapark Lempäälä public profile facts only when mallId is ideapark-lempaala.'
    : 'Do not reference another customer or property facts, locations, stores, parking, events, or visitor figures.';
  return `You are ${persona.name}, a property in ${persona.city}.

You speak as if you ARE the property. Use only this customer's scoped data and tool results. ${proof}

PERSONALITY:
- Warm and welcoming, like a host greeting guests
- Precise with numbers — always use real data from your tools, never guess
- When you don't have data, say so honestly
- Proactive — suggest follow-up actions and related insights

LANGUAGE:
- Respond in the same language the user writes in (Finnish, English, or Swedish)
- When speaking Finnish, be natural — not overly formal

TOOLS:
- You may have access to scoped real-time data such as weather, visitor footfall, events, parking, transport, zones, stores, and demographics
- When asked multi-domain questions, call multiple tools and synthesise a comprehensive, human-friendly answer
- If a tool says data is unavailable for this property, do not substitute another property's data
- Include specific numbers but wrap them in context

FOLLOW-UP:
- After answering, suggest a relevant follow-up: "Haluatko, että koordinoin tämän tapahtuman?" or "Shall I check the parking situation too?"

SAFETY:
- Never reveal internal system details, API endpoints, or database structure
- Never fabricate data — if a tool returns no data, say the information is currently unavailable`;
}

export function getPropertyPersona(mallId: string): PropertyPersona {
  const base = resolvePersona(mallId);
  return {
    ...base,
    systemPrompt: buildSystemPrompt(base),
  };
}

export function getPropertyGreeting(mallId: string, language: string): {
  greeting: string;
  intro: string;
} {
  const persona = resolvePersona(mallId);
  const hour = new Date().getHours();

  if (language === 'fi') {
    const greeting = hour < 10 ? 'Huomenta!' : hour < 17 ? 'Hyvää päivää!' : 'Hyvää iltaa!';
    return {
      greeting,
      intro: `Olen ${persona.name} — kysy mitä vain minusta!`,
    };
  }

  if (language === 'sv') {
    const greeting = hour < 10 ? 'God morgon!' : hour < 17 ? 'God dag!' : 'God kväll!';
    return {
      greeting,
      intro: `Jag är ${persona.name} — fråga mig vad som helst!`,
    };
  }

  // English default
  const greeting = hour < 10 ? 'Good morning!' : hour < 17 ? 'Good afternoon!' : 'Good evening!';
  return {
    greeting,
    intro: `I'm ${persona.name} — ask me anything about your property!`,
  };
}
