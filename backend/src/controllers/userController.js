/**
 * @fileoverview Controller for user-related routes.
 * 
 * This file defines the routes for user management, including adding, retrieving, and deleting users.
 * It uses the userService to perform the actual operations and handles the HTTP responses.
 * 
 * @requires express
 * @requires ../services/userService
 * @requires ../utils/asyncHandler
 */
const express = require('express');
const userService = require('../services/userService');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

router.post('/', asyncHandler(async (req, res) => {
  /**
   * Adds a new user using the data provided in the request body.
   *
   * @param {Object} req - The request object.
   * @param {Object} req.body - The body of the request containing user data.
   * @returns {Promise<Object>} The newly added user.
   * @throws {Error} If there is an issue adding the user.
   */
  const user = await userService.addUser(req.body);
  res.status(201).json(user);
}));

router.get('/', asyncHandler(async (req, res) => {
  /**
   * Retrieves all users from the user service.
   * 
   * @type {Array<Object>} users - An array of user objects.
   * @async
   */
  const users = await userService.getAllUsers();
  res.json(users);
}));

router.get('/:role', asyncHandler(async (req, res) => {
  /**
   * Retrieves all users based on the specified role.
   *
   * @param {Object} req - The request object.
   * @param {Object} req.params - The params object containing the role information from the URL.
   * @returns {Promise<Array>} A promise that resolves to an array of users.
   */
  const { role } = req.params; // Get role from URL parameter
  const users = await userService.getAllUsersByRole(role); // Pass the role directly to the service
  res.json(users);
}));


router.delete('/:id', asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id);
  res.status(204).send();
}));



module.exports = router;