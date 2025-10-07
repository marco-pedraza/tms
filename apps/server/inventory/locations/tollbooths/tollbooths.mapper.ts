import type { Tollbooth } from './tollbooths.types';

// ============================================================================
// Internal types (only used in this mapper)
// ============================================================================

interface RawInstallationProperty {
  value: string;
  installationSchema: {
    name: string;
  };
}

interface RawInstallation {
  id: number;
  installationProperties: RawInstallationProperty[];
}

export interface NodeWithInstallationRaw {
  id: number;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  active: boolean;
  cityId: number;
  populationId: number | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
  installation: RawInstallation;
}

// ============================================================================
// Helper functions
// ============================================================================

function extractTollboothProperties(properties: RawInstallationProperty[]): {
  tollPrice: number | null;
  iaveEnabled: boolean | null;
  iaveProvider: string | null;
} {
  const propsMap = new Map(
    properties.map((p) => [p.installationSchema.name, p.value]),
  );

  const tollPriceValue = propsMap.get('toll_price');
  const iaveEnabledValue = propsMap.get('iave_enabled');

  // Parse toll price, return null if missing or invalid
  let tollPrice: number | null = null;
  if (tollPriceValue !== undefined) {
    const parsed = parseFloat(tollPriceValue);
    tollPrice = isNaN(parsed) ? null : parsed;
  }

  // Parse iave enabled, return null if missing
  let iaveEnabled: boolean | null = null;
  if (iaveEnabledValue !== undefined) {
    iaveEnabled = iaveEnabledValue === 'true' || iaveEnabledValue === '1';
  }

  return {
    tollPrice,
    iaveEnabled,
    iaveProvider: propsMap.get('iave_provider') ?? null,
  };
}

// ============================================================================
// Public mapper functions
// ============================================================================

/**
 * Maps a raw node with installation to Tollbooth entity
 */
export function mapToTollbooth(raw: NodeWithInstallationRaw): Tollbooth {
  const { tollPrice, iaveEnabled, iaveProvider } = extractTollboothProperties(
    raw.installation.installationProperties,
  );

  return {
    id: raw.id,
    code: raw.code,
    name: raw.name,
    latitude: raw.latitude,
    longitude: raw.longitude,
    radius: raw.radius,
    tollPrice,
    iaveEnabled,
    iaveProvider,
    active: raw.active,
    cityId: raw.cityId,
    populationId: raw.populationId,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
