import {
  busLinesIntegration,
  busModelsIntegration,
  nodesIntegration,
} from '@/inventory/integration';
import type {
  BusLineIntegration,
  BusModelIntegration,
  NodeIntegration,
} from '@/inventory/integration';

/**
 * Planning domain types
 *
 * These types represent inventory entities adapted to the planning domain.
 * They may have different structures or additional computed fields.
 */

export interface PlanningServiceType {
  id: number;
  name: string;
  code: string;
  description: string | null;
  active: boolean;
}

export interface PlanningBusLine {
  id: number;
  name: string;
  code: string;
  serviceTypeId: number;
  pricePerKilometer: number;
  description: string | null;
  fleetSize: number | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
  serviceType: PlanningServiceType;
}

export interface PlanningNode {
  id: number;
  code: string;
  name: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  permissions: {
    canBoard: boolean;
    canAlight: boolean;
  };
  active: boolean;
}

export interface PlanningBusModel {
  id: number;
  manufacturer: string;
  model: string;
  year: number;
  seatingCapacity: number;
  trunkCapacity: number | null;
  fuelEfficiency: number | null;
  maxCapacity: number | null;
  numFloors: number;
  engineType: string;
  active: boolean;
}

/**
 * Inventory Adapter - Anti-Corruption Layer
 *
 * Adapts inventory data to the planning domain:
 * - Translates types between domains
 * - Can add planning-specific business logic
 * - Can implement caching strategies
 * - Protects planning from changes in inventory
 *
 * This is the ONLY way planning service should access inventory data.
 */
function createInventoryAdapter() {
  // ==================== TRANSLATION FUNCTIONS ====================

  /**
   * Translates ServiceType from inventory to planning domain
   */
  function translateServiceType(
    st: BusLineIntegration['serviceType'],
  ): PlanningServiceType {
    return {
      id: st.id,
      name: st.name,
      code: st.code,
      description: st.description,
      active: st.active,
    };
  }

  /**
   * Translates BusLine from inventory to planning domain
   * Includes serviceType from the bus line relation
   */
  function translateBusLine(busLine: BusLineIntegration): PlanningBusLine {
    return {
      id: busLine.id,
      name: busLine.name,
      code: busLine.code,
      serviceTypeId: busLine.serviceTypeId,
      pricePerKilometer: busLine.pricePerKilometer,
      description: busLine.description,
      fleetSize: busLine.fleetSize,
      website: busLine.website,
      email: busLine.email,
      phone: busLine.phone,
      active: busLine.active,
      serviceType: translateServiceType(busLine.serviceType),
    };
  }

  /**
   * Translates Node from inventory to planning domain
   * Reorganizes the data structure for planning needs
   */
  function translateNode(node: NodeIntegration): PlanningNode {
    return {
      id: node.id,
      code: node.code,
      name: node.name,
      coordinates: {
        latitude: node.latitude,
        longitude: node.longitude,
      },
      permissions: {
        canBoard: node.allowsBoarding,
        canAlight: node.allowsAlighting,
      },
      active: node.active,
    };
  }

  /**
   * Translates BusModel from inventory to planning domain
   */
  function translateBusModel(model: BusModelIntegration): PlanningBusModel {
    return {
      id: model.id,
      manufacturer: model.manufacturer,
      model: model.model,
      year: model.year,
      seatingCapacity: model.seatingCapacity,
      trunkCapacity: model.trunkCapacity,
      fuelEfficiency: model.fuelEfficiency,
      maxCapacity: model.maxCapacity,
      numFloors: model.numFloors,
      engineType: model.engineType,
      active: model.active,
    };
  }

  // ==================== PUBLIC ADAPTER METHODS ====================

  /**
   * Retrieves a bus line adapted to planning domain with service type included
   */
  async function getBusLine(id: number): Promise<PlanningBusLine> {
    const busLine = await busLinesIntegration.getBusLineWithServiceType(id);
    return translateBusLine(busLine);
  }

  /**
   * Retrieves multiple bus lines by IDs
   */
  async function getBusLinesByIds(ids: number[]): Promise<PlanningBusLine[]> {
    const busLines = await busLinesIntegration.getBusLinesByIds(ids);
    return busLines.map(translateBusLine);
  }

  /**
   * Retrieves a node adapted to planning domain
   */
  async function getNode(id: number): Promise<PlanningNode> {
    const node = await nodesIntegration.getNode(id);
    return translateNode(node);
  }

  /**
   * Retrieves multiple nodes by IDs
   */
  async function getNodesByIds(ids: number[]): Promise<PlanningNode[]> {
    const nodes = await nodesIntegration.getNodesByIds(ids);
    return nodes.map(translateNode);
  }

  /**
   * Retrieves a bus model adapted to planning domain
   */
  async function getBusModel(id: number): Promise<PlanningBusModel> {
    const model = await busModelsIntegration.getBusModel(id);
    return translateBusModel(model);
  }

  /**
   * Retrieves multiple bus models by IDs
   */
  async function getBusModelsByIds(ids: number[]): Promise<PlanningBusModel[]> {
    const models = await busModelsIntegration.getBusModelsByIds(ids);
    return models.map(translateBusModel);
  }

  return {
    // Single entity operations
    getBusLine,
    getBusModel,
    getNode,

    // Batch operations
    getBusLinesByIds,
    getBusModelsByIds,
    getNodesByIds,
  };
}

/**
 * Singleton instance of the inventory adapter
 *
 * This is the only instance that should be used throughout the planning service.
 */
export const inventoryAdapter = createInventoryAdapter();
