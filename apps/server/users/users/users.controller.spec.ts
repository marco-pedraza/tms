import { expect, describe, test, afterAll } from 'vitest';
import {
  createUser,
  getUser,
  listUsers,
  updateUser,
  deleteUser,
  changePassword,
} from './users.controller';

describe('Users Controller', () => {
  // Test data and setup
  const testUser = {
    tenantId: 'test-tenant-id',
    departmentId: 'test-department-id',
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
    firstName: 'Test',
    lastName: 'User',
    phone: '555-1234',
    position: 'Tester',
    employeeId: 'EMP123',
    isActive: true,
    isSystemAdmin: false,
  };

  // Variable to store created IDs for cleanup
  let createdUserId: string;

  afterAll(async () => {
    if (createdUserId) {
      try {
        await deleteUser({ id: createdUserId });
      } catch (error) {
        console.log('Error cleaning up test user:', error);
      }
    }
  });

  describe('success scenarios', () => {
    test('should create a new user', async () => {
      // Create a new user
      const response = await createUser(testUser);

      // Store the ID for later cleanup
      createdUserId = response.id;

      // Assertions
      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.username).toBe(testUser.username);
      expect(response.email).toBe(testUser.email);
      expect(response.firstName).toBe(testUser.firstName);
      expect(response.lastName).toBe(testUser.lastName);
      expect(response.tenantId).toBe(testUser.tenantId);
      expect(response.departmentId).toBe(testUser.departmentId);
      expect(response.phone).toBe(testUser.phone);
      expect(response.position).toBe(testUser.position);
      expect(response.employeeId).toBe(testUser.employeeId);
      expect(response.isActive).toBe(testUser.isActive);
      expect(response.isSystemAdmin).toBe(testUser.isSystemAdmin);
      expect(response.createdAt).toBeDefined();
      // Ensure passwordHash is not returned
      expect(response).not.toHaveProperty('passwordHash');
    });

    test('should retrieve a user by ID', async () => {
      const response = await getUser({ id: createdUserId });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdUserId);
      expect(response.username).toBe(testUser.username);
      expect(response.email).toBe(testUser.email);
      // Ensure passwordHash is not returned
      expect(response).not.toHaveProperty('passwordHash');
    });

    test('should list all users', async () => {
      const response = await listUsers();

      expect(response.users).toBeDefined();
      expect(Array.isArray(response.users)).toBe(true);
      expect(response.users.length).toBeGreaterThan(0);
      
      // Verify our test user is in the list
      expect(
        response.users.some((user) => user.id === createdUserId),
      ).toBe(true);
      
      // Ensure no user has passwordHash
      expect(
        response.users.every((user) => !Object.hasOwnProperty.call(user, 'passwordHash')),
      ).toBe(true);
    });

    test('should update a user', async () => {
      const updatedFirstName = 'Updated';
      const updatedLastName = 'Name';
      
      const response = await updateUser({
        id: createdUserId,
        firstName: updatedFirstName,
        lastName: updatedLastName,
      });

      expect(response).toBeDefined();
      expect(response.id).toBe(createdUserId);
      expect(response.firstName).toBe(updatedFirstName);
      expect(response.lastName).toBe(updatedLastName);
      // Check that other fields remain unchanged
      expect(response.email).toBe(testUser.email);
      // Ensure passwordHash is not returned
      expect(response).not.toHaveProperty('passwordHash');
    });

    test('should change a user password', async () => {
      // Create a specific user for password change test
      const passwordTestUser = await createUser({
        ...testUser,
        username: 'passwordtestuser',
        email: 'passwordtest@example.com',
      });

      try {
        const response = await changePassword({
          id: passwordTestUser.id,
          currentPassword: testUser.password,
          newPassword: 'newpassword123',
        });

        expect(response).toBeDefined();
        expect(response.id).toBe(passwordTestUser.id);
        // Ensure passwordHash is not returned
        expect(response).not.toHaveProperty('passwordHash');

        // Clean up
        await deleteUser({ id: passwordTestUser.id });
      } catch (error) {
        // Make sure to clean up even if test fails
        await deleteUser({ id: passwordTestUser.id });
        throw error;
      }
    });

    test('should delete a user', async () => {
      // Create a user specifically for deletion test
      const userToDelete = await createUser({
        ...testUser,
        username: 'userToDelete',
        email: 'delete@example.com',
      });

      // Delete should not throw an error
      await expect(
        deleteUser({ id: userToDelete.id }),
      ).resolves.not.toThrow();

      // Attempt to get should throw a not found error
      await expect(getUser({ id: userToDelete.id })).rejects.toThrow();
    });
  });

  describe('error scenarios', () => {
    // NOTE: We are not testing the validation errors because it's handled by Encore rust runtime and they are not thrown in the controller

    test('should handle not found errors', async () => {
      await expect(getUser({ id: 'nonexistent-id' })).rejects.toThrow();
    });

    test('should handle duplicate errors', async () => {
      // Try to create user with same username/email as existing one
      await expect(
        createUser({
          ...testUser,
          username: 'uniqueusername',
          email: testUser.email, // Same email as existing test user
        }),
      ).rejects.toThrow();

      await expect(
        createUser({
          ...testUser,
          username: testUser.username, // Same username as existing test user
          email: 'unique@example.com',
        }),
      ).rejects.toThrow();
    });

    test('should handle incorrect password during password change', async () => {
      await expect(
        changePassword({
          id: createdUserId,
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123',
        }),
      ).rejects.toThrow();
    });
  });
}); 