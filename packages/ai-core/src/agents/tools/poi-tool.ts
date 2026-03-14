import type { AgentTool } from '../chat-agent.js';
import type { POICategory } from '@uvidai/shared';

const VALID_CATEGORIES: ReadonlySet<string> = new Set<POICategory>([
  'school', 'kindergarten', 'hospital', 'doctors', 'pharmacy',
  'bank', 'post_office', 'supermarket', 'park', 'restaurant',
  'cafe', 'bus_station', 'tram_stop', 'parking', 'fuel',
  'gym', 'library', 'place_of_worship',
]);

export function createPoiSearchTool(): AgentTool {
  return {
    name: 'search_pois',
    description:
      'Search for Points of Interest (schools, hospitals, restaurants, etc.) near a location. ' +
      'Use this when the user asks about amenities, services, or facilities near an address.',
    parameters: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Latitude of the center point' },
        lng: { type: 'number', description: 'Longitude of the center point' },
        categories: {
          type: 'array',
          items: { type: 'string' },
          description:
            'POI categories to search for: school, kindergarten, hospital, doctors, pharmacy, ' +
            'bank, post_office, supermarket, park, restaurant, cafe, bus_station, tram_stop, ' +
            'parking, fuel, gym, library, place_of_worship',
        },
        radiusMeters: {
          type: 'number',
          description: 'Search radius in meters (default 1000)',
        },
      },
      required: ['lat', 'lng', 'categories'],
    },
    execute: async (args) => {
      const { OverpassHttpClient } = await import('@uvidai/data-connectors');
      const client = new OverpassHttpClient();

      const rawCategories = args['categories'] as string[];
      const categories = rawCategories.filter((c) =>
        VALID_CATEGORIES.has(c),
      ) as POICategory[];

      if (categories.length === 0) {
        return { error: 'No valid categories provided', validCategories: [...VALID_CATEGORIES] };
      }

      const results = await client.queryPOIs({
        center: { lat: args['lat'] as number, lng: args['lng'] as number },
        radiusMeters: (args['radiusMeters'] as number) || 1000,
        categories,
      });

      return results.slice(0, 20);
    },
  };
}
