import type { AgentTool } from '../chat-agent.js';

const API_BASE = 'http://localhost:3000/api/v1';

export function createPriceEstimateTool(): AgentTool {
  return {
    name: 'get_price_estimate',
    description:
      'Get real estate price estimate for a location. ' +
      'Returns estimated price per m², confidence level, and sample statistics. ' +
      'Use when the user asks about property prices, cost per square metre, or market value.',
    parameters: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Latitude of the location' },
        lng: { type: 'number', description: 'Longitude of the location' },
        type: {
          type: 'string',
          description:
            'Property type: apartment, house, land, commercial (default apartment)',
        },
        area: {
          type: 'number',
          description: 'Area in m² for total price estimate',
        },
      },
      required: ['lat', 'lng'],
    },
    execute: async (args) => {
      const lat = args['lat'] as number;
      const lng = args['lng'] as number;
      const type = (args['type'] as string) || 'apartment';
      const area = args['area'] as number | undefined;

      const url = new URL(`${API_BASE}/price/estimate`);
      url.searchParams.set('lat', String(lat));
      url.searchParams.set('lng', String(lng));
      url.searchParams.set('type', type);
      if (area != null) {
        url.searchParams.set('area', String(area));
      }

      try {
        const res = await fetch(url.toString());
        if (!res.ok) {
          return {
            error: `API error: ${res.status} ${res.statusText}`,
          };
        }
        const json = (await res.json()) as { success: boolean; data?: unknown };
        return json.data ?? json;
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : 'Failed to fetch price estimate',
        };
      }
    },
  };
}
