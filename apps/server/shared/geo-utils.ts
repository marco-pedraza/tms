/**
 * Geo-utils: Utilidades para manejar coordenadas geográficas en PostgreSQL
 *
 * Este archivo contiene funciones para convertir entre el formato point de PostgreSQL
 * (representado como un array [longitude, latitude]) y un objeto de coordenadas
 * utilizado en la API.
 *
 * Para usar estas utilidades en un handler:
 *
 * 1. Importar las funciones necesarias:
 *    ```
 *    import { pointToCoordinates, coordinatesToPoint, formatEntityWithCoordinates } from '../../shared/geo-utils';
 *    ```
 *
 * 2. Usar en métodos de conversión entre BD y API:
 *    ```typescript
 *    // Convertir de BD a API
 *    const coordinates = pointToCoordinates(dbEntity.coordinates);
 *
 *    // Convertir de API a BD
 *    const dbCoordinates = coordinatesToPoint(payload.coordinates);
 *
 *    // Formatear entidad completa
 *    const formattedCity = formatEntityWithCoordinates<City>(dbCity);
 *    ```
 */

/**
 * Common interface for geographic coordinates
 */
export interface Coordinates {
  longitude: number;
  latitude: number;
}

/**
 * Type for PostgreSQL point format as stored in database
 */
export type DbPoint = [number, number];

/**
 * Converts PostgreSQL point coordinates to Coordinates object
 * @param point - Array [longitude, latitude] from database
 * @returns Coordinates object with longitude and latitude properties
 *
 * @example
 * // Convert coordinates from database
 * const dbCity = await db.select().from(cities).where(eq(cities.id, id)).limit(1);
 * const coordinates = pointToCoordinates(dbCity.coordinates);
 */
export function pointToCoordinates(point: DbPoint): Coordinates {
  return {
    longitude: point[0],
    latitude: point[1],
  };
}

/**
 * Converts Coordinates object to PostgreSQL point format
 * @param coordinates - Coordinates object with longitude and latitude
 * @returns Array [longitude, latitude] for database storage
 *
 * @example
 * // Convertir coordenadas para almacenar en la BD
 * const dbPayload = {
 *   ...payload,
 *   coordinates: coordinatesToPoint(payload.coordinates)
 * };
 * await db.insert(cities).values(dbPayload);
 */
export function coordinatesToPoint(coordinates: Coordinates): DbPoint {
  return [coordinates.longitude, coordinates.latitude];
}

/**
 * Formatea las coordenadas desde cualquier formato (array DB point o ya formateado)
 * al formato de Coordinates usado en la API
 *
 * @param dbCoordinates - Coordenadas en el formato de la BD o ya convertidas
 * @returns Coordenadas en el formato de la API
 */
export function formatCoordinates(dbCoordinates: unknown): Coordinates {
  return Array.isArray(dbCoordinates)
    ? pointToCoordinates(dbCoordinates as DbPoint)
    : (dbCoordinates as Coordinates);
}

/**
 * Formatea una entidad que contiene coordenadas desde el formato DB al formato API.
 * Convierte automáticamente el campo 'coordinates' del formato point ([lng, lat])
 * al formato de objeto ({longitude, latitude}).
 *
 * @param dbEntity - Entidad desde la base de datos con campo coordinates
 * @returns La entidad con las coordenadas formateadas correctamente
 *
 * @example
 * // En un handler de ciudades
 * const city = formatEntityWithCoordinates<City>(dbCity);
 */
export function formatEntityWithCoordinates<T>(
  dbEntity: Record<string, unknown>,
): T {
  if (!dbEntity.coordinates) {
    return { ...dbEntity } as T;
  }

  return {
    ...dbEntity,
    coordinates: formatCoordinates(dbEntity.coordinates),
  } as T;
}
