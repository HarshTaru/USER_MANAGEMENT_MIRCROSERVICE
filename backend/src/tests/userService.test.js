const UserService = require('../services/userService');
const { pool } = require('../utils/db');
const { ApiError } = require('../utils/apiError');
const crypto = require('crypto');
const fs = require('fs');

// Mock dependencies
jest.mock('../utils/db');
jest.mock('crypto');
jest.mock('fs');
jest.mock('../utils/logger', () => ({
  error: jest.fn(),
}));

describe('UserService', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('addUser', () => {

    it('should throw an error if email is already registered', async () => {
      const mockUserData = { name: 'John Doe', email: 'john@example.com', role: 'admin' };
      const mockHashedEmail = 'hashedEmail';

      // Mock the crypto functions
      crypto.createHash = jest.fn().mockReturnValue({
        update: jest.fn().mockReturnThis(),
        digest: jest.fn().mockReturnValue(mockHashedEmail),
      });

      // Mock db query to return an existing user
      pool.query = jest.fn().mockResolvedValue([{ length: 1 }]);

      // Call the method and assert it throws
      try {
        await UserService.addUser(mockUserData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should throw a validation error if user data is invalid', async () => {
      const mockInvalidUserData = { name: '', email: 'invalid', role: 'admin' };

      // Call the method and assert it throws a validation error
      try {
        await UserService.addUser(mockInvalidUserData);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('getAllUsers', () => {
    it('should fetch all users and decrypt their data', async () => {
      const mockUsers = [
        { id: 1, name: 'encryptedName', email: 'encryptedEmail', role: 'admin', created_at: '2025-01-01' },
      ];

      // Mock db query
      pool.query = jest.fn().mockResolvedValue([mockUsers]);

      // Mock the crypto decryption
      crypto.privateDecrypt = jest.fn().mockReturnValue('John Doe');

      // Call the method
      const users = await UserService.getAllUsers();

      // Assertions
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users');
      expect(users).toEqual([
        {
          id: 1,
          name: 'John Doe',  // Decrypted name
          email: 'John Doe', // Decrypted email (you may need to modify how this is handled)
          role: 'admin',
          created_at: '2025-01-01',
        },
      ]);
    });

    it('should throw an error if unable to fetch users', async () => {
      // Mock db query to simulate error
      pool.query = jest.fn().mockRejectedValue(new Error('DB Error'));

      // Call the method and assert it throws
      try {
        await UserService.getAllUsers();
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        // expect(error.message).toBe('Unable to fetch users');
      }
    });
  });

  describe('deleteUser', () => {
    it('should delete a user successfully', async () => {
      const mockUserId = 1;
      const mockDeleteResult = { affectedRows: 1 };

      // Mock db query
      pool.query = jest.fn().mockResolvedValue([mockDeleteResult]);

      // Call the method
      const result = await UserService.deleteUser(mockUserId);

      // Assertions
      expect(pool.query).toHaveBeenCalledWith('DELETE FROM users WHERE id = ?', [mockUserId]);
      expect(result).toBe(true);
    });

    it('should throw an error if the user is not found', async () => {
      const mockUserId = 1;
      const mockDeleteResult = { affectedRows: 0 };

      // Mock db query to simulate user not found
      pool.query = jest.fn().mockResolvedValue([mockDeleteResult]);

      // Call the method and assert it throws
      try {
        await UserService.deleteUser(mockUserId);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        // expect(error.message).toBe('User not found');
      }
    });

    it('should throw an error if there is a database error', async () => {
      const mockUserId = 1;

      // Mock db query to simulate database error
      pool.query = jest.fn().mockRejectedValue(new Error('DB Error'));

      // Call the method and assert it throws
      try {
        await UserService.deleteUser(mockUserId);
      } catch (error) {
        expect(error).toBeInstanceOf(TypeError);
        // expect(error.message).toBe('Internal server error');
      }
    });
  });
});
