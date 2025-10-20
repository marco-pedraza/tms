import Client from '@repo/ims-client';
import environment from '@/services/environment';

/**
 * Gets the current session's access token
 * Works in both client and server components
 */
async function getAccessToken(): Promise<string | null> {
  // Check if running on server-side
  if (typeof window === 'undefined') {
    // Server-side: dynamically import auth to avoid bundling server-only code
    try {
      const { auth } = await import('@/auth');
      const session = await auth();
      return session?.user?.accessToken ?? null;
    } catch (error) {
      // Log the error for debugging but return null instead of throwing
      console.error('Error fetching access token on server:', error);
      return null;
    }
  } else {
    // Client-side: use fetch to get session from API
    try {
      const response = await fetch('/api/auth/session');
      if (!response.ok) {
        console.error('Failed to fetch session, status:', response.status);
        return null;
      }
      const session = await response.json();
      return session?.user?.accessToken ?? null;
    } catch (error) {
      // Log the error for debugging but return null instead of throwing
      console.error('Error fetching access token on client:', error);
      return null;
    }
  }
}

/**
 * Authenticated IMS client - includes Bearer token in all requests
 * This is the default client for protected endpoints
 */
const client = new Client(environment.NEXT_PUBLIC_IMS_API_URL, {
  auth: async () => {
    try {
      const accessToken = await getAccessToken();

      if (accessToken) {
        return {
          authorization: `Bearer ${accessToken}`,
        };
      }

      return undefined;
    } catch (error) {
      // Log the error for debugging but don't throw to avoid breaking the client
      console.error('Failed to get access token for IMS client:', error);
      return undefined;
    }
  },
});

// @todo: restructure ims-client service, configure import from server
enum BusStatus {
  ACTIVE = 'ACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  REPAIR = 'REPAIR',
  OUT_OF_SERVICE = 'OUT_OF_SERVICE',
  RESERVED = 'RESERVED',
  IN_TRANSIT = 'IN_TRANSIT',
  RETIRED = 'RETIRED',
}

enum BusLicensePlateType {
  NATIONAL = 'NATIONAL',
  INTERNATIONAL = 'INTERNATIONAL',
  TOURISM = 'TOURISM',
}

enum DriverStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  ON_LEAVE = 'on_leave',
  TERMINATED = 'terminated',
  IN_TRAINING = 'in_training',
  PROBATION = 'probation',
}

enum DriverInitialStatus {
  ACTIVE = 'active',
  IN_TRAINING = 'in_training',
  PROBATION = 'probation',
}

enum EngineType {
  DIESEL = 'DIESEL',
  ELECTRIC = 'ELECTRIC',
  HYBRID = 'HYBRID',
  GASOLINE = 'GASOLINE',
  NATURAL_GAS = 'NATURAL_GAS',
  LPG = 'LPG',
  OTHER = 'OTHER',
}

export enum SeatType {
  REGULAR = 'regular',
  PREMIUM = 'premium',
  VIP = 'vip',
  BUSINESS = 'business',
  EXECUTIVE = 'executive',
}

export enum SpaceType {
  SEAT = 'seat',
  HALLWAY = 'hallway',
  BATHROOM = 'bathroom',
  EMPTY = 'empty',
  STAIRS = 'stairs',
}

enum TimeOffType {
  VACATION = 'VACATION',
  LEAVE = 'LEAVE',
  SICK_LEAVE = 'SICK_LEAVE',
  PERSONAL_DAY = 'PERSONAL_DAY',
  OTHER = 'OTHER',
}

enum MedicalCheckResult {
  FIT = 'fit',
  LIMITED = 'limited',
  UNFIT = 'unfit',
}

enum MedicalCheckSource {
  MANUAL = 'manual',
  API = 'api',
}

enum AmenityCategory {
  BASIC = 'basic',
  COMFORT = 'comfort',
  TECHNOLOGY = 'technology',
  SECURITY = 'security',
  ACCESSIBILITY = 'accessibility',
  SERVICES = 'services',
}

enum AmenityType {
  BUS = 'bus',
  INSTALLATION = 'installation',
  SERVICE_TYPE = 'service_type',
}

const busStatuses = Object.values(BusStatus);
const busLicensePlateTypes = Object.values(BusLicensePlateType);
const driverStatuses = Object.values(DriverStatus);
const driverInitialStatuses = Object.values(DriverInitialStatus);
const engineTypes = Object.values(EngineType);
const seatTypes = Object.values(SeatType);
const spaceTypes = Object.values(SpaceType);
const spaceTypesWithoutSeat = spaceTypes.filter(
  (type) => type !== SpaceType.SEAT,
);
const timeOffTypes = Object.values(TimeOffType);
const medicalCheckResults = Object.values(MedicalCheckResult);
const medicalCheckSources = Object.values(MedicalCheckSource);
const amenityCategories = Object.values(AmenityCategory);
const amenityTypes = Object.values(AmenityType);

export {
  BusStatus,
  BusLicensePlateType,
  DriverStatus,
  TimeOffType,
  MedicalCheckResult,
  MedicalCheckSource,
  AmenityCategory,
  AmenityType,
  busStatuses,
  busLicensePlateTypes,
  driverStatuses,
  driverInitialStatuses,
  EngineType,
  engineTypes,
  seatTypes,
  spaceTypes,
  spaceTypesWithoutSeat,
  timeOffTypes,
  medicalCheckResults,
  medicalCheckSources,
  amenityCategories,
  amenityTypes,
};
export default client;

/**
 * Export the authenticated IMS client
 */
export { client as imsClient };

/**
 * Public IMS client - no authentication headers
 * Use this for public endpoints like login, refresh token, etc.
 */
export const publicClient = new Client(environment.NEXT_PUBLIC_IMS_API_URL);
