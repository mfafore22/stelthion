/**
 * Agent Selection Modal Component
 *
 * Modal for selecting an agent or creating a custom one
 */

'use client';

import React, { useState } from 'react';
import { AgentRole } from '@/lib/gcm-types';
import { useConcierge } from './ConciergeContext';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentSelectionModalProps {
  onClose: () => void;
}

const AGENT_CONFIGS = [
  {
    role: AgentRole.SALES_OPTIMIZER,
    name: 'Sales Optimizer',
    icon: '📊',
    description: 'Expert in revenue analysis, sales trends, forecasting, and optimization strategies.',
    capabilities: [
      'Revenue analysis and reporting',
      'Sales forecasting',
      'Category performance',
      'Tenant sales optimization',
    ],
  },
  {
    role: AgentRole.FOOTFALL_ANALYST,
    name: 'Footfall Analyst',
    icon: '🚶',
    description: 'Specializes in visitor traffic patterns, flow optimization, and capacity planning.',
    capabilities: [
      'Visitor traffic analysis',
      'Peak hours identification',
      'Flow optimization',
      'Capacity planning',
    ],
  },
  {
    role: AgentRole.EVENT_COORDINATOR,
    name: 'Event Coordinator',
    icon: '🎉',
    description: 'Plans and optimizes events, campaigns, and seasonal promotions for maximum impact.',
    capabilities: [
      'Event planning and scheduling',
      'Campaign optimization',
      'Seasonal promotions',
      'ROI analysis',
    ],
  },
  {
    role: AgentRole.PARKING_MANAGER,
    name: 'Parking Manager',
    icon: '🅿️',
    description: 'Manages parking operations, occupancy tracking, and optimization.',
    capabilities: [
      'Parking occupancy monitoring',
      'Space optimization',
      'Peak usage analysis',
      'Resource allocation',
    ],
  },
  {
    role: AgentRole.TREND_ANALYST,
    name: 'Trend Analyst',
    icon: '📈',
    description: 'Identifies patterns, predicts trends, and provides strategic insights.',
    capabilities: [
      'Trend identification',
      'Predictive analytics',
      'Correlation analysis',
      'Strategic insights',
    ],
  },
  {
    role: AgentRole.GENERAL_ASSISTANT,
    name: 'General Assistant',
    icon: '🤖',
    description: 'Versatile assistant for general questions and multi-domain tasks.',
    capabilities: [
      'General inquiries',
      'Cross-domain analysis',
      'Data retrieval',
      'Flexible assistance',
    ],
  },
];

export function AgentSelectionModal({ onClose }: AgentSelectionModalProps) {
  const { createConversation } = useConcierge();
  const [selectedAgent, setSelectedAgent] = useState<AgentRole | null>(null);

  const handleSelect = (role: AgentRole) => {
    setSelectedAgent(role);
    createConversation(role);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
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
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative bg-gray-900 border border-gray-700 rounded-lg shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <h2 className="text-xl font-semibold text-gray-100">Select Agent</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-800 rounded transition-colors"
            >
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
            <p className="text-gray-400 mb-6">Choose the best agent for your task:</p>

            <div className="space-y-3">
              {AGENT_CONFIGS.map((agent) => (
                <AgentCard
                  key={agent.role}
                  agent={agent}
                  isSelected={selectedAgent === agent.role}
                  onSelect={() => handleSelect(agent.role)}
                />
              ))}
            </div>

            {/* General Assistant Suggestion */}
            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700/50 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-2xl">💡</span>
                <div>
                  <div className="font-medium text-blue-300 mb-1">Not sure?</div>
                  <p className="text-sm text-gray-400 mb-3">
                    Start with General Assistant - it can help with any question and automatically route to specialized agents if needed.
                  </p>
                  <button
                    onClick={() => handleSelect(AgentRole.GENERAL_ASSISTANT)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    Select General Assistant
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
    name: string;
    icon: string;
    description: string;
    capabilities: string[];
  };
  isSelected: boolean;
  onSelect: () => void;
}

function AgentCard({ agent, isSelected, onSelect }: AgentCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left p-4 border rounded-lg transition-all ${
        isSelected
          ? 'bg-blue-900/30 border-blue-600'
          : 'bg-gray-800 border-gray-700 hover:border-gray-600 hover:bg-gray-800/70'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{agent.icon}</span>
          <h3 className="text-lg font-semibold text-gray-100">{agent.name}</h3>
        </div>
        <button
          onClick={onSelect}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
        >
          Select
        </button>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-300 mb-3">{agent.description}</p>

      {/* Capabilities */}
      <div className="text-sm">
        <div className="text-gray-400 mb-2">Best for:</div>
        <ul className="space-y-1">
          {agent.capabilities.map((capability, index) => (
            <li key={index} className="text-gray-500 flex items-start gap-2">
              <span className="text-blue-400 flex-shrink-0">•</span>
              <span>{capability}</span>
            </li>
          ))}
        </ul>
      </div>
    </button>
  );
}
