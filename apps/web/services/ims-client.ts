import Client from '@repo/ims-client';
import environment from '@/services/environment';

const client = new Client(environment.NEXT_PUBLIC_IMS_API_URL);

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

enum TimeOffType {
  VACATION = 'VACATION',
  LEAVE = 'LEAVE',
  SICK_LEAVE = 'SICK_LEAVE',
  PERSONAL_DAY = 'PERSONAL_DAY',
  OTHER = 'OTHER',
}

const busStatuses = Object.values(BusStatus);
const busLicensePlateTypes = Object.values(BusLicensePlateType);
const driverStatuses = Object.values(DriverStatus);
const driverInitialStatuses = Object.values(DriverInitialStatus);
const engineTypes = Object.values(EngineType);
const timeOffTypes = Object.values(TimeOffType);

export {
  BusStatus,
  BusLicensePlateType,
  DriverStatus,
  TimeOffType,
  busStatuses,
  busLicensePlateTypes,
  driverStatuses,
  driverInitialStatuses,
  EngineType,
  engineTypes,
  timeOffTypes,
};
export default client;
