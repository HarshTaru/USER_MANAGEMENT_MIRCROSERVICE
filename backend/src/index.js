const express = require('express');
const cors = require('cors');  // You need to require cors
const { logger } = require('./utils/logger');
const userRoutes = require('./controllers/userController');
const errorHandler = require('./middleware/errorHandler');
const { pool } = require('./utils/db');

const app = express();
const PORT = process.env.PORT || 3301;

(async () => {
  try {
    await pool.getConnection();
    logger.info('Connected to the database successfully.');

    // Enable CORS for all routes
    app.use(cors());  // Enabling CORS

    app.use(express.json());  // Parse incoming JSON bodies
    app.use('/api/users', userRoutes);  // Add the user-related routes
    app.use(errorHandler);  // Error handling middleware

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start the server:', error.message);
    process.exit(1);
  }
})();

module.exports = app;
