import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PiInfo, PiSpinner } from 'react-icons/pi';
import {
  AgentCoreRuntime,
  useAgentCoreRuntimes,
} from '../../hooks/useAgentCoreRuntimes';

export interface SubAgent {
  name: string;
  description: string;
  arn: string;
}

interface SubAgentManagerProps {
  subAgents: SubAgent[];
  onChange: (subAgents: SubAgent[]) => void;
}

const SubAgentManager: React.FC<SubAgentManagerProps> = ({
  subAgents,
  onChange,
}) => {
  const { t } = useTranslation();
  const { runtimes, loading, error } = useAgentCoreRuntimes();
  const [selectedArns, setSelectedArns] = useState<Set<string>>(new Set());

  // Initialize selected ARNs from props
  useEffect(() => {
    setSelectedArns(new Set(subAgents.map((agent) => agent.arn)));
  }, [subAgents]);

  // Handle sub-agent selection toggle
  const handleSubAgentToggle = (runtime: AgentCoreRuntime) => {
    const newSelected = new Set(selectedArns);
    const newSubAgents = [...subAgents];

    if (newSelected.has(runtime.arn)) {
      // Remove from selection
      newSelected.delete(runtime.arn);
      const filteredSubAgents = newSubAgents.filter(
        (agent) => agent.arn !== runtime.arn
      );
      setSelectedArns(newSelected);
      onChange(filteredSubAgents);
    } else {
      // Add to selection
      newSelected.add(runtime.arn);
      newSubAgents.push({
        name: runtime.name,
        description: runtime.description,
        arn: runtime.arn,
      });
      setSelectedArns(newSelected);
      onChange(newSubAgents);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {t('agent_builder.multi_agent_configuration')}
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <PiInfo className="h-4 w-4" />
          {/* eslint-disable-next-line @shopify/jsx-no-hardcoded-content */}
          <span>{selectedArns.size} selected</span>
        </div>
      </div>

      <div className="rounded-lg border bg-gray-50 p-4">
        <p className="mb-4 text-sm text-gray-600">
          {t(
            'agent_builder.sub_agent_description',
            'Select AgentCore Runtime agents to enable multi-agent collaboration. Sub-agents can be delegated specialized tasks.'
          )}
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <PiSpinner className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-600">
              {t('common.loading', 'Loading...')}
            </span>
          </div>
        ) : error ? (
          <div className="rounded-md bg-red-50 p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        ) : runtimes.length === 0 ? (
          <div className="rounded-md bg-yellow-50 p-3">
            <p className="text-sm text-yellow-700">
              {t(
                'agent_builder.no_sub_agents_available',
                'No AgentCore Runtime agents are currently available.'
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {runtimes.map((runtime) => (
              <label
                key={runtime.arn}
                className="flex cursor-pointer items-start gap-3 rounded-md border border-gray-200 bg-white p-4 transition-colors hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedArns.has(runtime.arn)}
                  onChange={() => handleSubAgentToggle(runtime)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {runtime.name}
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    {runtime.description}
                  </div>
                  <div className="mt-2 rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700">
                    {runtime.arn}
                  </div>
                </div>
              </label>
            ))}

            {selectedArns.size === 0 && (
              <div className="mt-4 rounded-md bg-blue-50 p-3">
                <p className="text-sm text-blue-700">
                  {t(
                    'agent_builder.no_sub_agents_selected',
                    'No sub-agents selected. Your agent will operate independently without delegation capabilities.'
                  )}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubAgentManager;
