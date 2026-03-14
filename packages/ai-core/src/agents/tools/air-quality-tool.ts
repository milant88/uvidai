import type { AgentTool } from '../chat-agent.js';

export function createAirQualityTool(): AgentTool {
  return {
    name: 'get_air_quality',
    description:
      'Get current air quality data from the nearest SEPA monitoring station. ' +
      'Returns AQI, PM2.5, PM10, and other pollutant levels with station distance.',
    parameters: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Latitude of the location' },
        lng: { type: 'number', description: 'Longitude of the location' },
        maxDistanceMeters: {
          type: 'number',
          description: 'Maximum distance to search for a station (default 50000)',
        },
      },
      required: ['lat', 'lng'],
    },
    execute: async (args) => {
      const { SepaHttpClient } = await import('@uvidai/data-connectors');
      const client = new SepaHttpClient();

      const result = await client.getNearestReading(
        { lat: args['lat'] as number, lng: args['lng'] as number },
        (args['maxDistanceMeters'] as number) || 50_000,
      );

      if (!result) {
        return { error: 'No air quality station found within the specified radius' };
      }

      return {
        station: {
          id: result.station.id,
          name: result.station.name,
          coordinates: result.station.coordinates,
          city: result.station.city,
        },
        reading: result.reading,
        distanceMeters: Math.round(result.distanceMeters),
      };
    },
  };
}
