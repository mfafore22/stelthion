/**
 * Agent Selection Modal Component
 *
 * Modal for selecting an agent before starting a new conversation.
 * Triggered by "New Conversation" in ConversationList.
 */

'use client';

import { useState } from 'react';
import { type LucideIcon, X, BarChart3, Users, CalendarDays, Car, TrendingUp, Bot, Lightbulb } from 'lucide-react';
import { AgentRole } from '@/lib/gcm-types';
import { useConcierge } from './ConciergeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

interface AgentSelectionModalProps {
  onClose: () => void;
}

const AGENT_CONFIGS: {
  role: AgentRole;
  nameKey: string;
  icon: LucideIcon;
  descKey: string;
  capabilities: string[];
}[] = [
  {
    role: AgentRole.SALES_OPTIMIZER,
    nameKey: 'concierge.agents.salesOptimizer',
    icon: BarChart3,
    descKey: 'concierge.agents.salesOptimizerDesc',
    capabilities: [
      'concierge.agents.cap.revenueAnalysis',
      'concierge.agents.cap.salesForecasting',
      'concierge.agents.cap.categoryPerformance',
      'concierge.agents.cap.tenantOptimization',
    ],
  },
  {
    role: AgentRole.FOOTFALL_ANALYST,
    nameKey: 'concierge.agents.footfallAnalyst',
    icon: Users,
    descKey: 'concierge.agents.footfallAnalystDesc',
    capabilities: [
      'concierge.agents.cap.trafficAnalysis',
      'concierge.agents.cap.peakHours',
      'concierge.agents.cap.flowOptimization',
      'concierge.agents.cap.capacityPlanning',
    ],
  },
  {
    role: AgentRole.EVENT_COORDINATOR,
    nameKey: 'concierge.agents.eventCoordinator',
    icon: CalendarDays,
    descKey: 'concierge.agents.eventCoordinatorDesc',
    capabilities: [
      'concierge.agents.cap.eventPlanning',
      'concierge.agents.cap.campaignOptimization',
      'concierge.agents.cap.seasonalPromotions',
      'concierge.agents.cap.roiAnalysis',
    ],
  },
  {
    role: AgentRole.PARKING_MANAGER,
    nameKey: 'concierge.agents.parkingManager',
    icon: Car,
    descKey: 'concierge.agents.parkingManagerDesc',
    capabilities: [
      'concierge.agents.cap.parkingOccupancy',
      'concierge.agents.cap.spaceOptimization',
      'concierge.agents.cap.peakUsage',
      'concierge.agents.cap.resourceAllocation',
    ],
  },
  {
    role: AgentRole.TREND_ANALYST,
    nameKey: 'concierge.agents.trendAnalyst',
    icon: TrendingUp,
    descKey: 'concierge.agents.trendAnalystDesc',
    capabilities: [
      'concierge.agents.cap.trendIdentification',
      'concierge.agents.cap.predictiveAnalytics',
      'concierge.agents.cap.correlationAnalysis',
      'concierge.agents.cap.strategicInsights',
    ],
  },
  {
    role: AgentRole.GENERAL_ASSISTANT,
    nameKey: 'concierge.agents.generalAssistant',
    icon: Bot,
    descKey: 'concierge.agents.generalAssistantDesc',
    capabilities: [
      'concierge.agents.cap.generalInquiries',
      'concierge.agents.cap.crossDomain',
      'concierge.agents.cap.dataRetrieval',
      'concierge.agents.cap.flexibleAssistance',
    ],
  },
];

export function AgentSelectionModal({ onClose }: AgentSelectionModalProps) {
  const { createConversation } = useConcierge();
  const { t } = useTranslation('mall');
  const [selectedAgent, setSelectedAgent] = useState<AgentRole | null>(null);

  const handleSelect = (role: AgentRole) => {
    setSelectedAgent(role);
    createConversation(role);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="bo-surface relative max-h-[80vh] w-full max-w-3xl overflow-hidden rounded-2xl border-2 border-bo-primary-200/60 shadow-bo-xl"
        >
          <div className="h-2 bg-gradient-to-r from-bo-primary-700 via-bo-success-dark to-bo-warning-dark" />
          <div className="flex items-center justify-between px-6 py-4 border-b border-bo-neutral-200/60">
            <h2 className="text-lg font-semibold text-bo-neutral-950 tracking-tight">
              {t('concierge.selectAgent')}
            </h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/55 rounded-md transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-bo-neutral-500" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
            <p className="text-sm text-bo-neutral-600 mb-5">{t('concierge.chooseAgent')}</p>

            <div className="space-y-2">
              {AGENT_CONFIGS.map((agent) => (
                <AgentCard
                  key={agent.role}
                  agent={agent}
                  isSelected={selectedAgent === agent.role}
                  onSelect={() => handleSelect(agent.role)}
                  t={t}
                />
              ))}
            </div>

            <div className="bo-surface-subtle mt-5 rounded-xl border border-bo-primary-200/50 p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-bo-neutral-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-bo-neutral-950 mb-1 text-sm">{t('concierge.notSure')}</div>
                  <p className="text-sm text-bo-neutral-600 mb-3">
                    {t('concierge.generalAssistantSuggestion')}
                  </p>
                  <button
                    onClick={() => handleSelect(AgentRole.GENERAL_ASSISTANT)}
                    className="rounded-full bg-bo-neutral-950 px-4 py-2 text-sm font-medium text-bo-neutral-50 transition-colors hover:bg-bo-neutral-900"
                  >
                    {t('concierge.startWithGeneral')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

/**
 * Agent Card Component
 */
interface AgentCardProps {
  agent: {
    role: AgentRole;
    nameKey: string;
    icon: LucideIcon;
    descKey: string;
    capabilities: string[];
  };
  isSelected: boolean;
  onSelect: () => void;
  t: (key: string) => string;
}

function AgentCard({ agent, isSelected, onSelect, t }: AgentCardProps) {
  const Icon = agent.icon;

  return (
    <button
      onClick={onSelect}
      className={`bo-surface-subtle bo-surface-hover w-full overflow-hidden rounded-xl border text-left transition-all ${
        isSelected
          ? 'border-bo-neutral-950 ring-2 ring-bo-primary-200'
          : 'border-bo-neutral-200 hover:border-bo-primary-300'
      }`}
    >
      <div className="h-1.5 bg-gradient-to-r from-bo-primary-700 via-bo-success-dark to-bo-warning-dark" />
      <div className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-bo-primary-100 flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-bo-neutral-700" />
          </div>
          <h3 className="text-sm font-semibold text-bo-neutral-950">{t(agent.nameKey)}</h3>
        </div>
        <span className="px-3 py-1 bg-bo-neutral-950 text-bo-neutral-50 text-xs rounded-full font-medium">
          {t('concierge.select')}
        </span>
      </div>

      <p className="text-xs text-bo-neutral-600 mb-2">{t(agent.descKey)}</p>

      <div className="text-xs text-bo-neutral-500 mb-1">{t('concierge.bestFor')}</div>
      <ul className="space-y-0.5">
        {agent.capabilities.map((cap, i) => (
          <li key={i} className="text-xs text-bo-neutral-500 flex items-start gap-1.5">
            <span className="text-bo-neutral-400 flex-shrink-0">·</span>
            <span>{t(cap)}</span>
          </li>
        ))}
      </ul>
      </div>
    </button>
  );
}
