import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest';
import {
  createPathwayService,
  deletePathwayService,
} from '../pathway-services/pathway-services.controller';
import { createPathway, deletePathway } from '../pathways/pathways.controller';
import type { PathwayServiceAssignment } from './pathway-service-assignments.types';
import { pathwayServiceAssignmentRepository } from './pathway-service-assignments.repository';
import { updatePathwayServiceAssignment } from './pathway-service-assignments.controller';

describe('Pathway Service Assignment Controller', () => {
  let testAssignment: PathwayServiceAssignment;
  let pathwayId: number;
  let pathwayServiceId: number;
  let originalAssignment: PathwayServiceAssignment;

  beforeAll(async () => {
    // Create test pathway
    const pathway = await createPathway({
      name: 'Test Pathway for Assignment',
      distance: 100,
      typicalTime: 120,
      meta: { type: 'test' },
      tollRoad: false,
      active: true,
    });
    pathwayId = pathway.id;

    // Create test pathway service
    const pathwayService = await createPathwayService({
      name: 'Test Service',
      serviceType: 'maintenance',
      latitude: 25.123,
      longitude: -99.456,
      category: 'repair',
      provider: 'Test Provider',
      providerScheduleHours: {
        monday: [{ open: '08:00', close: '18:00' }],
      },
      duration: 30,
    });
    pathwayServiceId = pathwayService.id;

    // Create a test assignment with real IDs
    const created = await pathwayServiceAssignmentRepository.create({
      pathwayId,
      pathwayServiceId,
      sequence: 1,
      distanceFromOrigin: 10.5,
      associatedCost: 50.75,
      mandatory: true,
    });
    testAssignment = created;
    originalAssignment = { ...created };
  });

  beforeEach(async () => {
    // Reset the test assignment to its original state before each test
    testAssignment = await pathwayServiceAssignmentRepository.update(
      testAssignment.id,
      {
        distanceFromOrigin: originalAssignment.distanceFromOrigin,
        associatedCost: originalAssignment.associatedCost,
        mandatory: originalAssignment.mandatory,
      },
    );
  });

  afterAll(async () => {
    // Clean up test data in reverse order
    if (testAssignment?.id) {
      await pathwayServiceAssignmentRepository.delete(testAssignment.id);
    }
    if (pathwayServiceId) {
      await deletePathwayService({ id: pathwayServiceId });
    }
    if (pathwayId) {
      await deletePathway({ id: pathwayId });
    }
  });

  describe('updatePathwayServiceAssignment', () => {
    test('should update associated cost', async () => {
      const newAssociatedCost = 75.25;
      const response = await updatePathwayServiceAssignment({
        id: testAssignment.id,
        associatedCost: newAssociatedCost,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(testAssignment.id);
      expect(response.associatedCost).toBe(newAssociatedCost);
      // Other fields should remain unchanged
      expect(response.sequence).toBe(originalAssignment.sequence);
      expect(response.mandatory).toBe(originalAssignment.mandatory);
      expect(response.distanceFromOrigin).toBe(
        originalAssignment.distanceFromOrigin,
      );
    });

    test('should update mandatory status', async () => {
      const response = await updatePathwayServiceAssignment({
        id: testAssignment.id,
        mandatory: false,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(testAssignment.id);
      expect(response.mandatory).toBe(false);
      // Other fields should remain unchanged
      expect(response.sequence).toBe(originalAssignment.sequence);
      expect(response.associatedCost).toBe(originalAssignment.associatedCost);
      expect(response.distanceFromOrigin).toBe(
        originalAssignment.distanceFromOrigin,
      );
    });

    test('should update distance from origin', async () => {
      const newDistance = 15.75;
      const response = await updatePathwayServiceAssignment({
        id: testAssignment.id,
        distanceFromOrigin: newDistance,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(testAssignment.id);
      expect(response.distanceFromOrigin).toBe(newDistance);
      // Other fields should remain unchanged
      expect(response.sequence).toBe(originalAssignment.sequence);
      expect(response.mandatory).toBe(originalAssignment.mandatory);
      expect(response.associatedCost).toBe(originalAssignment.associatedCost);
    });

    test('should handle not found errors', async () => {
      await expect(
        updatePathwayServiceAssignment({
          id: 99999,
          mandatory: false,
        }),
      ).rejects.toThrow(/not found/i);
    });
  });
});
