/**
 * useAgentCoreRuntimes Hook
 *
 * Provides available AgentCore Runtime agents for multi-agent configuration.
 */

import { useState, useEffect } from 'react';

export interface AgentCoreRuntime {
  name: string;
  description: string;
  arn: string;
}

/**
 * Custom hook that fetches available AgentCore Runtime agents.
 * In a real implementation, this would call an API endpoint.
 *
 * @returns Object containing runtimes array, loading state, and error
 */
export const useAgentCoreRuntimes = () => {
  const [runtimes, setRuntimes] = useState<AgentCoreRuntime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRuntimes = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        // const response = await fetch('/api/agent-core-runtimes');
        // const data = await response.json();
        // setRuntimes(data);

        // Mock data for now
        const mockRuntimes: AgentCoreRuntime[] = [
          {
            name: 'Worker',
            description:
              'Delegate specialized work to the Worker AgentCore Runtime agent',
            arn: 'arn:aws:bedrock-agentcore:us-east-1:512617221979:runtime/dedicated_hosted_agent-ZK2Jbj4fcY',
          },
          {
            name: 'Analyzer',
            description:
              'Analyze data and provide insights using the Analyzer agent',
            arn: 'arn:aws:bedrock-agentcore:us-east-1:512617221979:runtime/dedicated_hosted_agent-ABC123xyz',
          },
          {
            name: 'Researcher',
            description: 'Research and gather information from various sources',
            arn: 'arn:aws:bedrock-agentcore:us-east-1:512617221979:runtime/dedicated_hosted_agent-DEF456uvw',
          },
        ];

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        setRuntimes(mockRuntimes);
        setError(null);
      } catch (err) {
        console.error('Error fetching AgentCore Runtimes:', err);
        setError('Failed to load AgentCore Runtime agents');
        setRuntimes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRuntimes();
  }, []);

  return { runtimes, loading, error };
};

export default useAgentCoreRuntimes;
