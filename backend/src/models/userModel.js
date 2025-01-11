const Joi = require('joi');

const userRoles = ['Admin', 'Editor', 'Viewer'];

/**
 * Schema for validating user objects.
 * 
 * @typedef {Object} UserSchema
 * @property {string} name - The name of the user. This field is required.
 * @property {string} email - The email of the user. Must be a valid email address. This field is required.
 * @property {string} role - The role of the user. Must be one of the predefined user roles. This field is required.
 */
const userSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid(...userRoles).required()
});

module.exports = { userSchema, userRoles };