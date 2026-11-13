const mongoose = require('mongoose');
const ApiError = require('../utils/ApiError');

// Rejects malformed MongoDB ids before they hit the database
const validateObjectId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new ApiError(400, `Invalid product id: ${req.params.id}`));
  }
  next();
};

// POST/PUT must send a non-empty JSON object
const requireBody = (req, res, next) => {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) || Object.keys(req.body).length === 0) {
    return next(new ApiError(400, 'Request body must be a non-empty JSON object'));
  }
  next();
};

// PATCH /:id/stock expects { "change": <non-zero whole number> }
// positive = restock, negative = sale
const validateStockChange = (req, res, next) => {
  const { change } = req.body || {};
  if (typeof change !== 'number' || !Number.isInteger(change) || change === 0) {
    return next(
      new ApiError(400, '"change" must be a non-zero whole number (positive to restock, negative for a sale)')
    );
  }
  next();
};

module.exports = { validateObjectId, requireBody, validateStockChange };
