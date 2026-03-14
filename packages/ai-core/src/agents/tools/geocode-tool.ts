import type { AgentTool } from '../chat-agent.js';

export function createGeocodeTool(): AgentTool {
  return {
    name: 'geocode_address',
    description:
      'Convert an address or place name to geographic coordinates. ' +
      'Use this when the user mentions a location by name and you need lat/lng for other tools.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Address or place name to geocode (e.g. "Knez Mihailova, Beograd")',
        },
        countryCodes: {
          type: 'array',
          items: { type: 'string' },
          description: 'ISO 3166-1 alpha-2 country codes to restrict results (default ["rs"])',
        },
      },
      required: ['query'],
    },
    execute: async (args) => {
      const { NominatimClient } = await import('@uvidai/data-connectors');
      const client = new NominatimClient();

      const results = await client.geocode(args['query'] as string, {
        countryCodes: (args['countryCodes'] as string[]) || ['rs'],
        limit: 3,
      });

      if (results.length === 0) {
        return { error: `No results found for "${args['query']}"` };
      }

      return results.map((r) => ({
        displayName: r.displayName,
        lat: r.coordinates.lat,
        lng: r.coordinates.lng,
        address: r.address,
      }));
    },
  };
}
