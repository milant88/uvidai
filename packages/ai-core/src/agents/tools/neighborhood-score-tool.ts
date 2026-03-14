import type { AgentTool } from '../chat-agent.js';

const API_BASE = 'http://localhost:3000/api/v1';

export function createNeighborhoodScoreTool(): AgentTool {
  return {
    name: 'get_neighborhood_score',
    description:
      'Get the neighborhood livability score for a location. ' +
      'Returns overall score (0-100) and breakdown by education, healthcare, shopping, transport, greenery, and safety. ' +
      'Use when the user asks about neighborhood quality, livability, or area amenities.',
    parameters: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Latitude of the location' },
        lng: { type: 'number', description: 'Longitude of the location' },
        radius: {
          type: 'number',
          description: 'Search radius in metres (default 1000)',
        },
      },
      required: ['lat', 'lng'],
    },
    execute: async (args) => {
      const lat = args['lat'] as number;
      const lng = args['lng'] as number;
      const radius = (args['radius'] as number) || 1000;

      const url = new URL(`${API_BASE}/neighborhood/score`);
      url.searchParams.set('lat', String(lat));
      url.searchParams.set('lng', String(lng));
      url.searchParams.set('radius', String(radius));

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
          error: err instanceof Error ? err.message : 'Failed to fetch neighborhood score',
        };
      }
    },
  };
}
