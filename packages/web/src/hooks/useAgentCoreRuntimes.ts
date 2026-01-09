/**
 * useAgentCoreRuntimes Hook
 *
 * Provides available AgentCore Runtime agents for multi-agent configuration.
 */

import { useState, useEffect } from 'react';
import { fetchAuthSession } from 'aws-amplify/auth';

export interface AgentCoreRuntime {
  name: string;
  description: string;
  arn: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Custom hook that fetches available AgentCore Runtime agents from AWS.
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

        // Get the API endpoint from environment
        const apiEndpoint = import.meta.env.VITE_APP_API_ENDPOINT;
        if (!apiEndpoint) {
          throw new Error('API endpoint not configured');
        }

        // Get authentication token
        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();
        if (!token) {
          throw new Error('User is not authenticated');
        }

        // Call the API to list AgentCore runtimes
        const response = await fetch(
          `${apiEndpoint}/agent-core-runtimes/list`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: token,
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch runtimes: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        setRuntimes(data.runtimes || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching AgentCore Runtimes:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load AgentCore Runtime agents'
        );
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
