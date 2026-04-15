/**
 * Quick Action Chips
 *
 * Horizontal scrollable row of contextual action buttons.
 * Shows agent-relevant chips when a specialist is pre-selected,
 * plus universal chips (briefing) that work for all agents.
 */

'use client';

import React from 'react';
import { Sun, Users, Calendar, Car, Train, ClipboardList, TrendingUp, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useConcierge } from './ConciergeContext';

interface QuickActionChipsProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

interface Chip {
  icon: React.ElementType;
  labelKey: string;
  labelFallback: string;
  query: { en: string; fi: string; sv: string };
}

const BRIEFING_CHIP: Chip = {
  icon: ClipboardList,
  labelKey: 'concierge.quickAction.briefing',
  labelFallback: 'Päiväkatsaus',
  query: {
    fi: 'Anna päiväkatsaus: sää, kävijämäärät, tapahtumat ja liikenne.',
    en: 'Give me today\'s briefing: weather, footfall, events, and transport.',
    sv: 'Ge mig dagens briefing: väder, besökare, evenemang och transport.',
  },
};

const GENERAL_CHIPS: Chip[] = [
  BRIEFING_CHIP,
  {
    icon: Sun,
    labelKey: 'concierge.quickAction.weather',
    labelFallback: 'Säätilanne',
    query: {
      fi: 'Mikä on tämänhetkinen säätilanne ja ennuste?',
      en: 'What is the current weather and forecast?',
      sv: 'Vad är det aktuella vädret och prognosen?',
    },
  },
  {
    icon: Users,
    labelKey: 'concierge.quickAction.footfall',
    labelFallback: 'Kävijämäärät',
    query: {
      fi: 'Millaisia kävijämääriä tänään odotetaan vrt. samana päivänä viime vuonna?',
      en: 'What footfall is expected today compared to the same day last year?',
      sv: 'Vilka besöksantal förväntas idag jämfört med samma dag förra året?',
    },
  },
  {
    icon: Calendar,
    labelKey: 'concierge.quickAction.events',
    labelFallback: 'Tapahtumat',
    query: {
      fi: 'Mitä tapahtumia on tulossa lähialueella ensi viikolla?',
      en: 'What events are coming up in the area next week?',
      sv: 'Vilka evenemang är på gång i området nästa vecka?',
    },
  },
  {
    icon: Car,
    labelKey: 'concierge.quickAction.parking',
    labelFallback: 'Pysäköinti',
    query: {
      fi: 'Mikä on pysäköintialueiden tilanne?',
      en: 'What is the current status of the parking areas?',
      sv: 'Vad är aktuell status för parkeringsområdena?',
    },
  },
  {
    icon: Train,
    labelKey: 'concierge.quickAction.transport',
    labelFallback: 'Liikenne',
    query: {
      fi: 'Milloin seuraavat bussit ja junat lähtevät?',
      en: 'When are the next bus and train departures?',
      sv: 'När avgår nästa bussar och tåg?',
    },
  },
];

const AGENT_CHIPS: Record<string, Chip[]> = {
  'trend-analyst': [
    BRIEFING_CHIP,
    {
      icon: TrendingUp,
      labelKey: 'concierge.quickAction.trends',
      labelFallback: 'Trendit',
      query: {
        fi: 'Mitkä ovat tärkeimmät nousevat trendit ja ilmiöt juuri nyt?',
        en: 'What are the most important emerging trends and phenomena right now?',
        sv: 'Vilka är de viktigaste framväxande trenderna just nu?',
      },
    },
    {
      icon: BarChart3,
      labelKey: 'concierge.quickAction.signalOfDay',
      labelFallback: 'Päivän signaali',
      query: {
        fi: 'Mikä on päivän signaali? Kerro tärkeimmät ShopperMind-havainnot.',
        en: 'What is the signal of the day? Tell me the key ShopperMind insights.',
        sv: 'Vad är dagens signal? Berätta om de viktigaste ShopperMind-insikterna.',
      },
    },
    {
      icon: Users,
      labelKey: 'concierge.quickAction.footfall',
      labelFallback: 'Kävijämäärät',
      query: {
        fi: 'Millaisia kävijämääriä tänään odotetaan vrt. samana päivänä viime vuonna?',
        en: 'What footfall is expected today compared to the same day last year?',
        sv: 'Vilka besöksantal förväntas idag jämfört med samma dag förra året?',
      },
    },
  ],
  'footfall-analyst': [
    BRIEFING_CHIP,
    {
      icon: Users,
      labelKey: 'concierge.quickAction.footfall',
      labelFallback: 'Kävijämäärät',
      query: {
        fi: 'Millaisia kävijämääriä tänään odotetaan vrt. samana päivänä viime vuonna?',
        en: 'What footfall is expected today compared to the same day last year?',
        sv: 'Vilka besöksantal förväntas idag jämfört med samma dag förra året?',
      },
    },
    {
      icon: BarChart3,
      labelKey: 'concierge.quickAction.zoneFlow',
      labelFallback: 'Kävijävirrat',
      query: {
        fi: 'Näytä kävijävirrat eri vyöhykkeiden välillä ja ruuhkahuiput.',
        en: 'Show visitor flows between zones and peak congestion times.',
        sv: 'Visa besöksflöden mellan zoner och rusningstopper.',
      },
    },
    {
      icon: Sun,
      labelKey: 'concierge.quickAction.weather',
      labelFallback: 'Säätilanne',
      query: {
        fi: 'Mikä on tämänhetkinen säätilanne ja ennuste?',
        en: 'What is the current weather and forecast?',
        sv: 'Vad är det aktuella vädret och prognosen?',
      },
    },
  ],
  'event-coordinator': [
    BRIEFING_CHIP,
    {
      icon: Calendar,
      labelKey: 'concierge.quickAction.events',
      labelFallback: 'Tapahtumat',
      query: {
        fi: 'Mitä tapahtumia on tulossa lähialueella ensi viikolla?',
        en: 'What events are coming up in the area next week?',
        sv: 'Vilka evenemang är på gång i området nästa vecka?',
      },
    },
    {
      icon: Users,
      labelKey: 'concierge.quickAction.footfall',
      labelFallback: 'Kävijämäärät',
      query: {
        fi: 'Millaisia kävijämääriä tänään odotetaan vrt. samana päivänä viime vuonna?',
        en: 'What footfall is expected today compared to the same day last year?',
        sv: 'Vilka besöksantal förväntas idag jämfört med samma dag förra året?',
      },
    },
    {
      icon: Sun,
      labelKey: 'concierge.quickAction.weather',
      labelFallback: 'Säätilanne',
      query: {
        fi: 'Mikä on tämänhetkinen säätilanne ja ennuste?',
        en: 'What is the current weather and forecast?',
        sv: 'Vad är det aktuella vädret och prognosen?',
      },
    },
  ],
  'parking-manager': [
    BRIEFING_CHIP,
    {
      icon: Car,
      labelKey: 'concierge.quickAction.parking',
      labelFallback: 'Pysäköinti',
      query: {
        fi: 'Mikä on pysäköintialueiden tilanne?',
        en: 'What is the current status of the parking areas?',
        sv: 'Vad är aktuell status för parkeringsområdena?',
      },
    },
    {
      icon: Users,
      labelKey: 'concierge.quickAction.footfall',
      labelFallback: 'Kävijämäärät',
      query: {
        fi: 'Millaisia kävijämääriä tänään odotetaan vrt. samana päivänä viime vuonna?',
        en: 'What footfall is expected today compared to the same day last year?',
        sv: 'Vilka besöksantal förväntas idag jämfört med samma dag förra året?',
      },
    },
    {
      icon: Sun,
      labelKey: 'concierge.quickAction.weather',
      labelFallback: 'Säätilanne',
      query: {
        fi: 'Mikä on tämänhetkinen säätilanne ja ennuste?',
        en: 'What is the current weather and forecast?',
        sv: 'Vad är det aktuella vädret och prognosen?',
      },
    },
  ],
  'sales-optimizer': [
    BRIEFING_CHIP,
    {
      icon: BarChart3,
      labelKey: 'concierge.quickAction.mallStats',
      labelFallback: 'Tunnusluvut',
      query: {
        fi: 'Näytä kauppakeskuksen tunnusluvut: kävijät, myynti, viipymä.',
        en: 'Show mall KPIs: visitors, sales, dwell time.',
        sv: 'Visa köpcentrumets nyckeltal: besökare, försäljning, vistelsetid.',
      },
    },
    {
      icon: Users,
      labelKey: 'concierge.quickAction.footfall',
      labelFallback: 'Kävijämäärät',
      query: {
        fi: 'Millaisia kävijämääriä tänään odotetaan vrt. samana päivänä viime vuonna?',
        en: 'What footfall is expected today compared to the same day last year?',
        sv: 'Vilka besöksantal förväntas idag jämfört med samma dag förra året?',
      },
    },
    {
      icon: TrendingUp,
      labelKey: 'concierge.quickAction.trends',
      labelFallback: 'Trendit',
      query: {
        fi: 'Mitkä ovat tärkeimmät nousevat trendit ja ilmiöt juuri nyt?',
        en: 'What are the most important emerging trends and phenomena right now?',
        sv: 'Vilka är de viktigaste framväxande trenderna just nu?',
      },
    },
  ],
};

export function QuickActionChips({ onSend, disabled = false }: QuickActionChipsProps) {
  const { t, i18n } = useTranslation('mall');
  const { activeConversation } = useConcierge();
  const lang = (i18n.language || 'en') as 'en' | 'fi' | 'sv';

  const agentRole = activeConversation?.agentRole;
  const chips = (agentRole && AGENT_CHIPS[agentRole]) || GENERAL_CHIPS;

  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 scrollbar-hide">
      {chips.map((chip) => {
        const Icon = chip.icon;
        const label = t(chip.labelKey, chip.labelFallback);
        const query = chip.query[lang] || chip.query.en;

        return (
          <button
            key={chip.labelKey}
            onClick={() => onSend(query)}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm whitespace-nowrap
              bg-bo-neutral-100 border border-bo-neutral-200 text-bo-neutral-700
              hover:bg-bo-primary-50 hover:border-bo-primary-300 hover:text-bo-primary-700
              disabled:opacity-40 disabled:cursor-not-allowed
              transition-all duration-200 ease-bo-out-expo
              flex-shrink-0"
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
