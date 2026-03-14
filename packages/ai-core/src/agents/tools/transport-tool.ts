import type { AgentTool } from '../chat-agent.js';

const API_BASE = 'http://localhost:3000/api/v1';

export function createTransportTool(): AgentTool {
  return {
    name: 'get_transport_info',
    description:
      'Get transport and commute information for a location. ' +
      'Returns nearby bus/tram stops and commute time estimates (walking, bus, car) between two points. ' +
      'Use when the user asks about public transport, transit stops, or commute times.',
    parameters: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Latitude of the location' },
        lng: { type: 'number', description: 'Longitude of the location' },
        radius: {
          type: 'number',
          description: 'Search radius for stops in metres (default 1000)',
        },
        toLat: {
          type: 'number',
          description: 'Destination latitude for commute estimate',
        },
        toLng: {
          type: 'number',
          description: 'Destination longitude for commute estimate',
        },
      },
      required: ['lat', 'lng'],
    },
    execute: async (args) => {
      const lat = args['lat'] as number;
      const lng = args['lng'] as number;
      const radius = (args['radius'] as number) || 1000;
      const toLat = args['toLat'] as number | undefined;
      const toLng = args['toLng'] as number | undefined;

      try {
        const stopsUrl = new URL(`${API_BASE}/transport/stops`);
        stopsUrl.searchParams.set('lat', String(lat));
        stopsUrl.searchParams.set('lng', String(lng));
        stopsUrl.searchParams.set('radius', String(radius));

        const stopsRes = await fetch(stopsUrl.toString());
        if (!stopsRes.ok) {
          return {
            error: `API error: ${stopsRes.status} ${stopsRes.statusText}`,
          };
        }
        const stopsJson = (await stopsRes.json()) as {
          success: boolean;
          data?: unknown;
        };
        const stops = stopsJson.data ?? stopsJson;

        let commute: unknown = null;
        if (toLat != null && toLng != null) {
          const commuteUrl = new URL(`${API_BASE}/transport/commute`);
          commuteUrl.searchParams.set('fromLat', String(lat));
          commuteUrl.searchParams.set('fromLng', String(lng));
          commuteUrl.searchParams.set('toLat', String(toLat));
          commuteUrl.searchParams.set('toLng', String(toLng));

          const commuteRes = await fetch(commuteUrl.toString());
          if (commuteRes.ok) {
            const commuteJson = (await commuteRes.json()) as {
              success: boolean;
              data?: unknown;
            };
            commute = commuteJson.data ?? commuteJson;
          }
        }

        return {
          stops,
          commuteEstimate: commute,
        };
      } catch (err) {
        return {
          error: err instanceof Error ? err.message : 'Failed to fetch transport info',
        };
      }
    },
  };
}
