import type { AgentTool } from '../chat-agent.js';

export function createCompanySearchTool(): AgentTool {
  return {
    name: 'search_apr',
    description:
      'Search the Serbian Business Registry (APR) for company information. ' +
      'Returns legal form, status, founding date, activity, representatives, and account block history.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Company name to search for (partial match supported)',
        },
        registrationNumber: {
          type: 'string',
          description: 'Matični broj (registration number) for exact lookup',
        },
        taxId: {
          type: 'string',
          description: 'PIB (tax identification number) for exact lookup',
        },
      },
      required: [],
    },
    execute: async (args) => {
      const name = args['name'] as string | undefined;
      const registrationNumber = args['registrationNumber'] as string | undefined;
      const taxId = args['taxId'] as string | undefined;

      if (!name && !registrationNumber && !taxId) {
        return { error: 'Provide at least one of: name, registrationNumber, or taxId' };
      }

      try {
        const dataConnectors = await import('@uvidai/data-connectors');

        if (!('AprHttpClient' in dataConnectors)) {
          return {
            error: 'APR client not yet implemented. Company search will be available in a future release.',
            query: { name, registrationNumber, taxId },
          };
        }

        const AprHttpClient = (dataConnectors as Record<string, unknown>)['AprHttpClient'] as new () => {
          search(opts: Record<string, unknown>): Promise<unknown[]>;
        };
        const client = new AprHttpClient();

        const results = await client.search({
          name,
          registrationNumber,
          taxId,
          limit: 10,
        });

        return results;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return { error: `APR search failed: ${message}` };
      }
    },
  };
}
